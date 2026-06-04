import type { VideoMode } from "@/lib/types";

export function probeAudioDurationSec(src: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.preload = "metadata";

    const cleanup = () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("error", onError);
      audio.src = "";
    };

    const onLoaded = () => {
      const duration = audio.duration;
      cleanup();
      if (!Number.isFinite(duration) || duration <= 0) {
        reject(new Error("Could not read audio duration."));
        return;
      }
      resolve(duration);
    };

    const onError = () => {
      cleanup();
      reject(new Error("Failed to load audio for duration probe."));
    };

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("error", onError);
    audio.src = src;
  });
}

export function durationFromAudioSec(
  seconds: number,
  mode: VideoMode = "short"
): number {
  if (mode === "long") {
    return Math.min(120, Math.max(3, Math.ceil(seconds)));
  }
  return Math.min(15, Math.max(1, Math.ceil(seconds)));
}
