import type { Scene } from "@/lib/types";

async function fetchStockVideoUrl(
  query: string,
  pickIndex: number,
  signal?: AbortSignal
): Promise<string | undefined> {
  try {
    const response = await fetch("/api/stock-video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, pickIndex }),
      signal,
    });

    if (!response.ok) return undefined;

    const data = (await response.json()) as { videoUrl?: string };
    return typeof data.videoUrl === "string" ? data.videoUrl : undefined;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    return undefined;
  }
}

export async function prefetchStockVideos(
  scenes: Scene[],
  onProgress?: (done: number, total: number) => void,
  signal?: AbortSignal
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

      const videoUrl = await fetchStockVideoUrl(query, sceneIndex, signal);
      done += 1;
      onProgress?.(done, total);

      if (!videoUrl) return { sceneIndex, scene };
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
