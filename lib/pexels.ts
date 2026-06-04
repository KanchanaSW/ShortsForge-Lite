import type { PexelsOrientation } from "@/lib/types";

const PEXELS_SEARCH_URL = "https://api.pexels.com/videos/search";
const MAX_RANKED_URLS = 10;
const MIN_SHORT_EDGE = 720;

const cache = new Map<string, string[] | null>();

interface PexelsVideoFile {
  id: number;
  quality?: string;
  file_type: string;
  width: number;
  height: number;
  link: string;
}

interface PexelsVideo {
  video_files: PexelsVideoFile[];
}

interface PexelsSearchResponse {
  videos?: PexelsVideo[];
}

function normalizeQuery(query: string, orientation: PexelsOrientation): string {
  return `v2:${orientation}:${query.trim().toLowerCase()}`;
}

/** Reject tiny SD clips that often fail WebCodecs decode during Remotion render. */
export function isBrowserSafePexelsUrl(url: string): boolean {
  if (!url.startsWith("https://")) return false;
  if (/-sd_\d+_\d+/.test(url)) return false;
  if (/426_240|640_360|480_/.test(url)) return false;
  return true;
}

function isBrowserSafeVideoFile(
  file: PexelsVideoFile,
  orientation: PexelsOrientation
): boolean {
  if (file.file_type !== "video/mp4") return false;
  if (!isBrowserSafePexelsUrl(file.link)) return false;

  const shortEdge = Math.min(file.width, file.height);
  const longEdge = Math.max(file.width, file.height);
  if (shortEdge < MIN_SHORT_EDGE) return false;
  if (longEdge < 960) return false;

  const isPortrait = file.height >= file.width;
  if (orientation === "portrait" && !isPortrait && file.height < file.width * 0.9) {
    return false;
  }
  if (orientation === "landscape" && isPortrait && file.width < file.height * 0.9) {
    return false;
  }

  return true;
}

function scoreVideoFile(
  file: PexelsVideoFile,
  orientation: PexelsOrientation
): number {
  if (!isBrowserSafeVideoFile(file, orientation)) return -1;

  const isPortrait = file.height >= file.width;
  const orientationBonus =
    orientation === "portrait"
      ? isPortrait
        ? 2000
        : 0
      : !isPortrait
        ? 2000
        : 0;

  const aspect = file.height / Math.max(file.width, 1);
  const targetAspect = orientation === "portrait" ? 16 / 9 : 9 / 16;
  const aspectScore = 500 - Math.abs(aspect - targetAspect) * 100;

  // Prefer higher resolution — critical for browser decode stability
  const resolutionBonus = Math.min(file.width, file.height) * 2;

  const hdBonus =
    file.link.includes("hd") || file.width >= 1920 || file.height >= 1920
      ? 500
      : 0;

  return orientationBonus + aspectScore + resolutionBonus + hdBonus;
}

export function rankVideoUrls(
  videos: PexelsVideo[],
  orientation: PexelsOrientation = "portrait"
): string[] {
  const ranked: { url: string; score: number }[] = [];

  for (const video of videos) {
    for (const file of video.video_files) {
      const score = scoreVideoFile(file, orientation);
      if (score < 0) continue;
      ranked.push({ url: file.link, score });
    }
  }

  ranked.sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const urls: string[] = [];
  for (const { url } of ranked) {
    if (seen.has(url)) continue;
    seen.add(url);
    urls.push(url);
    if (urls.length >= MAX_RANKED_URLS) break;
  }

  return urls;
}

async function fetchRankedVideoUrls(
  query: string,
  orientation: PexelsOrientation = "portrait"
): Promise<string[] | null> {
  const apiKey = process.env.PEXELS_API_KEY?.trim();
  if (!apiKey) return null;

  const key = normalizeQuery(query, orientation);
  if (cache.has(key)) return cache.get(key) ?? null;

  try {
    const params = new URLSearchParams({
      query: query.trim(),
      per_page: "15",
      orientation,
    });

    const response = await fetch(`${PEXELS_SEARCH_URL}?${params}`, {
      headers: { Authorization: apiKey },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      console.warn(`Pexels API error: ${response.status} for query "${query}"`);
      cache.set(key, null);
      return null;
    }

    const data = (await response.json()) as PexelsSearchResponse;
    const urls = rankVideoUrls(data.videos ?? [], orientation);
    const result = urls.length > 0 ? urls : null;
    cache.set(key, result);
    return result;
  } catch (error) {
    console.warn("Pexels fetch failed:", error);
    cache.set(key, null);
    return null;
  }
}

export async function getStockVideoUrl(
  query: string,
  pickIndex = 0,
  orientation: PexelsOrientation = "portrait"
): Promise<string | null> {
  const urls = await fetchRankedVideoUrls(query, orientation);
  if (!urls || urls.length === 0) return null;
  return urls[pickIndex % urls.length] ?? null;
}

export async function getStockVideoUrlCandidates(
  query: string,
  orientation: PexelsOrientation = "portrait"
): Promise<string[]> {
  const urls = await fetchRankedVideoUrls(query, orientation);
  return urls ?? [];
}
