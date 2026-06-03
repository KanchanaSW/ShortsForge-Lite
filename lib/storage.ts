import { normalizeScene } from "@/lib/normalizeScene";
import type { Scene, ShortScript } from "@/lib/types";

const TOPIC_KEY = "shortsforge:lastTopic";
const SCRIPT_KEY = "shortsforge:lastScript";
const VIDEO_KEY = "shortsforge:lastVideo";
const VIDEO_FILENAME_KEY = "shortsforge:lastVideoFilename";

export function saveTopic(topic: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOPIC_KEY, topic);
}

export function loadTopic(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOPIC_KEY);
}

function scriptForStorage(script: ShortScript): ShortScript {
  return {
    title: script.title,
    scenes: script.scenes.map(
      ({ text, duration, mood, visualQuery, accentColor }) => ({
        text,
        duration,
        mood,
        visualQuery,
        accentColor,
      })
    ),
  };
}

export function saveScript(script: ShortScript): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SCRIPT_KEY, JSON.stringify(scriptForStorage(script)));
}

export function loadScript(): ShortScript | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SCRIPT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as {
      title: string;
      scenes: Array<Partial<Scene> & { text: string; duration: number }>;
    };
    if (!parsed.title || !Array.isArray(parsed.scenes)) return null;
    return {
      title: parsed.title,
      scenes: parsed.scenes.map(normalizeScene),
    };
  } catch {
    return null;
  }
}

export function saveVideoBlobUrl(blobUrl: string, filename: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(VIDEO_KEY, blobUrl);
  sessionStorage.setItem(VIDEO_FILENAME_KEY, filename);
}

export function loadVideoBlobUrl(): { url: string; filename: string } | null {
  if (typeof window === "undefined") return null;
  const url = sessionStorage.getItem(VIDEO_KEY);
  const filename = sessionStorage.getItem(VIDEO_FILENAME_KEY);
  if (!url || !filename) return null;
  return { url, filename };
}

export function clearVideoBlobUrl(): void {
  if (typeof window === "undefined") return;
  const existing = sessionStorage.getItem(VIDEO_KEY);
  if (existing) {
    URL.revokeObjectURL(existing);
  }
  sessionStorage.removeItem(VIDEO_KEY);
  sessionStorage.removeItem(VIDEO_FILENAME_KEY);
}

export function clearProject(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOPIC_KEY);
  localStorage.removeItem(SCRIPT_KEY);
  clearVideoBlobUrl();
}
