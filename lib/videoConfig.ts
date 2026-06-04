import {
  LONG_VIDEO_HEIGHT,
  LONG_VIDEO_WIDTH,
  MAX_DURATION_SECONDS,
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
  type PexelsOrientation,
  type Project,
  type TargetDuration,
  type VideoMode,
} from "@/lib/types";

export interface VideoModeConfig {
  width: number;
  height: number;
  fps: number;
  maxDurationSeconds: number;
  minSceneDuration: number;
  maxSceneDuration: number;
  minScenesPerChapter: number;
  maxScenesPerChapter: number;
  pexelsOrientation: PexelsOrientation;
}

const SHORT_CONFIG: VideoModeConfig = {
  width: VIDEO_WIDTH,
  height: VIDEO_HEIGHT,
  fps: VIDEO_FPS,
  maxDurationSeconds: MAX_DURATION_SECONDS,
  minSceneDuration: 1,
  maxSceneDuration: 15,
  minScenesPerChapter: 5,
  maxScenesPerChapter: 12,
  pexelsOrientation: "portrait",
};

function getLongMaxDuration(targetDuration?: TargetDuration): number {
  return (targetDuration ?? 5) * 60;
}

export function getVideoConfig(
  mode: VideoMode,
  targetDuration?: TargetDuration
): VideoModeConfig {
  if (mode === "short") {
    return SHORT_CONFIG;
  }
  return {
    width: LONG_VIDEO_WIDTH,
    height: LONG_VIDEO_HEIGHT,
    fps: VIDEO_FPS,
    maxDurationSeconds: getLongMaxDuration(targetDuration),
    minSceneDuration: 3,
    maxSceneDuration: 120,
    minScenesPerChapter: 2,
    maxScenesPerChapter: 15,
    pexelsOrientation: "landscape",
  };
}

export function getProjectVideoConfig(project: Project): VideoModeConfig {
  return getVideoConfig(project.mode, project.targetDuration);
}

export function getResolutionLabel(mode: VideoMode): string {
  if (mode === "short") {
    return `${VIDEO_WIDTH}×${VIDEO_HEIGHT}`;
  }
  return `${LONG_VIDEO_WIDTH}×${LONG_VIDEO_HEIGHT}`;
}

export function getModeLabel(mode: VideoMode): string {
  return mode === "short" ? "YouTube Short" : "Long-form Video";
}
