import { isBrowserSafePexelsUrl } from "@/lib/pexels";
import {
  probeVideoDecodable,
  stripUnsafeVideoUrl,
} from "@/lib/stockVideoValidate";
import type { PexelsOrientation, Project, Scene } from "@/lib/types";

const MAX_PICK_ATTEMPTS = 8;

async function fetchStockVideoUrl(
  query: string,
  pickIndex: number,
  orientation: PexelsOrientation,
  signal?: AbortSignal
): Promise<string | undefined> {
  try {
    const response = await fetch("/api/stock-video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, pickIndex, orientation }),
      signal,
    });

    if (!response.ok) return undefined;

    const data = (await response.json()) as { videoUrl?: string };
    const url = typeof data.videoUrl === "string" ? data.videoUrl : undefined;
    return stripUnsafeVideoUrl(url);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    return undefined;
  }
}

async function resolveDecodableStockUrl(
  query: string,
  sceneIndex: number,
  orientation: PexelsOrientation,
  signal?: AbortSignal
): Promise<string | undefined> {
  for (let attempt = 0; attempt < MAX_PICK_ATTEMPTS; attempt++) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

    const pickIndex = sceneIndex + attempt;
    const videoUrl = await fetchStockVideoUrl(
      query,
      pickIndex,
      orientation,
      signal
    );

    if (!videoUrl || !isBrowserSafePexelsUrl(videoUrl)) continue;

    const decodable = await probeVideoDecodable(videoUrl);
    if (decodable) return videoUrl;
  }

  return undefined;
}

export async function prefetchStockVideos(
  scenes: Scene[],
  onProgress?: (done: number, total: number) => void,
  signal?: AbortSignal,
  orientation: PexelsOrientation = "portrait"
): Promise<Scene[]> {
  const total = scenes.length;
  let done = 0;
  onProgress?.(done, total);

  const results = await Promise.all(
    scenes.map(async (scene, sceneIndex) => {
      if (signal?.aborted) return { sceneIndex, scene };

      const query = scene.visualQuery.trim();
      if (!query) {
        done += 1;
        onProgress?.(done, total);
        return { sceneIndex, scene };
      }

      const videoUrl = await resolveDecodableStockUrl(
        query,
        sceneIndex,
        orientation,
        signal
      );
      done += 1;
      onProgress?.(done, total);

      if (!videoUrl) return { sceneIndex, scene: { ...scene, videoUrl: undefined } };
      return { sceneIndex, scene: { ...scene, videoUrl } };
    })
  );

  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  const enriched = [...scenes];
  for (const { sceneIndex, scene } of results) {
    enriched[sceneIndex] = scene;
  }
  return enriched;
}

export async function prefetchProjectStockVideos(
  project: Project,
  onProgress?: (done: number, total: number) => void,
  signal?: AbortSignal,
  orientation?: PexelsOrientation
): Promise<Project> {
  const flatScenes = project.chapters.flatMap((c) => c.scenes);
  const enriched = await prefetchStockVideos(
    flatScenes,
    onProgress,
    signal,
    orientation ?? (project.mode === "long" ? "landscape" : "portrait")
  );

  let index = 0;
  return {
    ...project,
    chapters: project.chapters.map((chapter) => ({
      ...chapter,
      scenes: chapter.scenes.map(() => {
        const scene = enriched[index];
        index += 1;
        return scene;
      }),
    })),
  };
}

export function sanitizeProjectVideoUrls(project: Project): Project {
  return {
    ...project,
    chapters: project.chapters.map((chapter) => ({
      ...chapter,
      scenes: chapter.scenes.map((scene) => ({
        ...scene,
        videoUrl: stripUnsafeVideoUrl(scene.videoUrl),
      })),
    })),
  };
}
