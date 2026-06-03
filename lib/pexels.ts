const PEXELS_SEARCH_URL = "https://api.pexels.com/videos/search";
const MAX_RANKED_URLS = 10;

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

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

function scoreVideoFile(file: PexelsVideoFile): number {
  if (file.file_type !== "video/mp4") return -1;
  if (!file.link.startsWith("https://")) return -1;

  const portraitBonus = file.height >= file.width ? 1000 : 0;
  const aspect = file.height / Math.max(file.width, 1);
  const targetAspect = 16 / 9;
  const aspectScore = 500 - Math.abs(aspect - targetAspect) * 100;
  const sizePenalty = file.width * 0.1;

  return portraitBonus + aspectScore - sizePenalty;
}

export function rankVideoUrls(videos: PexelsVideo[]): string[] {
  const ranked: { url: string; score: number }[] = [];

  for (const video of videos) {
    for (const file of video.video_files) {
      const score = scoreVideoFile(file);
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

async function fetchRankedVideoUrls(query: string): Promise<string[] | null> {
  const apiKey = process.env.PEXELS_API_KEY?.trim();
  if (!apiKey) return null;

  const key = normalizeQuery(query);
  if (cache.has(key)) return cache.get(key) ?? null;

  try {
    const params = new URLSearchParams({
      query: query.trim(),
      per_page: "15",
      orientation: "portrait",
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
    const urls = rankVideoUrls(data.videos ?? []);
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
  pickIndex = 0
): Promise<string | null> {
  const urls = await fetchRankedVideoUrls(query);
  if (!urls || urls.length === 0) return null;
  return urls[pickIndex % urls.length] ?? null;
}
