import {
  MAX_DURATION_SECONDS,
  VIDEO_FPS,
  type Scene,
  type ShortScript,
} from "@/lib/types";

export function getTotalDurationSeconds(scenes: Scene[]): number {
  const total = scenes.reduce((sum, scene) => sum + scene.duration, 0);
  return Math.min(total, MAX_DURATION_SECONDS);
}

export function getDurationInFrames(scenes: Scene[]): number {
  return getTotalDurationSeconds(scenes) * VIDEO_FPS;
}

export function getSceneFrameRanges(scenes: Scene[]): Array<{
  startFrame: number;
  endFrame: number;
  scene: Scene;
}> {
  let currentFrame = 0;
  return scenes.map((scene) => {
    const durationFrames = scene.duration * VIDEO_FPS;
    const startFrame = currentFrame;
    const endFrame = currentFrame + durationFrames;
    currentFrame = endFrame;
    return { startFrame, endFrame, scene };
  });
}

export function sanitizeFilename(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50) || "short";
}

export function getVideoFilename(script: ShortScript): string {
  return `shortsforge-${sanitizeFilename(script.title)}.mp4`;
}
