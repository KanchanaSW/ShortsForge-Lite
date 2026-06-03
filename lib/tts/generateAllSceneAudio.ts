import {
  durationFromAudioSec,
  probeAudioDurationSec,
} from "@/lib/tts/probeAudioDuration";
import type { Scene } from "@/lib/types";

type SceneTtsResponse =
  | { audioPath: string; cached: boolean }
  | { error: string; code: string };

export type VoiceoverProgress = {
  done: number;
  total: number;
  index: number;
};

export async function generateAllSceneAudio(
  scenes: Scene[],
  onProgress: (progress: VoiceoverProgress) => void,
  signal?: AbortSignal
): Promise<Scene[]> {
  const total = scenes.length;
  const updated = scenes.map((scene) => ({ ...scene }));

  for (let index = 0; index < total; index++) {
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    onProgress({ done: index, total, index });

    updated[index] = {
      ...updated[index],
      audioStatus: "generating",
      audioPath: undefined,
      audioUrl: undefined,
    };

    const scene = updated[index];
    const text = scene.text.trim();

    if (!text) {
      updated[index] = {
        ...scene,
        audioStatus: "missing",
      };
      onProgress({ done: index + 1, total, index });
      continue;
    }

    try {
      const response = await fetch("/api/tts/scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          index,
          text,
        }),
        signal,
      });

      const data = (await response.json()) as SceneTtsResponse;

      if (!response.ok || !("audioPath" in data)) {
        const errMsg =
          "error" in data && typeof data.error === "string"
            ? data.error
            : "Voice generation failed";
        console.warn(`Scene ${index + 1} TTS failed:`, errMsg);
        updated[index] = {
          ...scene,
          audioStatus: "error",
        };
        onProgress({ done: index + 1, total, index });
        continue;
      }

      const audioUrl = data.audioPath;
      let duration = scene.duration;

      try {
        const seconds = await probeAudioDurationSec(audioUrl);
        duration = durationFromAudioSec(seconds);
      } catch {
        // keep manual duration if probe fails
      }

      updated[index] = {
        ...scene,
        audioPath: data.audioPath,
        audioUrl,
        audioStatus: "ready",
        duration,
      };
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        throw err;
      }
      updated[index] = {
        ...scene,
        audioStatus: "error",
      };
    }

    onProgress({ done: index + 1, total, index });
  }

  onProgress({ done: total, total, index: Math.max(0, total - 1) });
  return updated;
}

export async function generateSceneAudioAt(
  scenes: Scene[],
  index: number,
  signal?: AbortSignal
): Promise<Scene[]> {
  const copy = scenes.map((s) => ({ ...s }));
  const scene = copy[index];
  const text = scene.text.trim();

  copy[index] = { ...scene, audioStatus: "generating" };

  if (!text) {
    copy[index] = { ...scene, audioStatus: "missing" };
    return copy;
  }

  try {
    const response = await fetch("/api/tts/scene", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index, text }),
      signal,
    });

    const data = (await response.json()) as SceneTtsResponse;

    if (!response.ok || !("audioPath" in data)) {
      copy[index] = { ...scene, audioStatus: "error" };
      return copy;
    }

    let duration = scene.duration;
    try {
      const seconds = await probeAudioDurationSec(data.audioPath);
      duration = durationFromAudioSec(seconds);
    } catch {
      // keep duration
    }

    copy[index] = {
      ...scene,
      audioPath: data.audioPath,
      audioUrl: data.audioPath,
      audioStatus: "ready",
      duration,
    };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw err;
    }
    copy[index] = { ...scene, audioStatus: "error" };
  }

  return copy;
}
