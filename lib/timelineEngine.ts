import { flattenScenes, getRawTotalDurationSeconds } from "@/lib/projectUtils";
import { getProjectVideoConfig } from "@/lib/videoConfig";
import { MAX_DURATION_SECONDS, VIDEO_FPS, type Project, type Scene } from "@/lib/types";

export type TimelineSegmentType = "scene";

export interface TimelineSegment {
  type: TimelineSegmentType;
  startFrame: number;
  endFrame: number;
  chapterId?: string;
  scene?: Scene;
}

export interface Timeline {
  segments: TimelineSegment[];
  totalFrames: number;
  flatScenes: Scene[];
}

function secondsToFrames(seconds: number): number {
  return Math.max(1, Math.round(seconds * VIDEO_FPS));
}

function getShortScaledDurations(scenes: Scene[]): number[] {
  if (scenes.length === 0) return [];

  const rawTotal = getRawTotalDurationSeconds(scenes);
  const cappedTotal = Math.min(rawTotal, MAX_DURATION_SECONDS);
  const scale = rawTotal > 0 ? cappedTotal / rawTotal : 1;

  return scenes.map((scene) => Math.max(1 / VIDEO_FPS, scene.duration * scale));
}

export function buildTimeline(project: Project): Timeline {
  const flatScenes = flattenScenes(project);
  const config = getProjectVideoConfig(project);
  const segments: TimelineSegment[] = [];
  let currentFrame = 0;

  if (project.mode === "short") {
    const scaledDurations = getShortScaledDurations(flatScenes);
    const maxFrames = secondsToFrames(
      Math.min(getRawTotalDurationSeconds(flatScenes), MAX_DURATION_SECONDS)
    );

    for (let index = 0; index < flatScenes.length; index++) {
      const scene = flatScenes[index];
      const isLast = index === flatScenes.length - 1;
      const startFrame = currentFrame;
      let endFrame = isLast
        ? maxFrames
        : startFrame + secondsToFrames(scaledDurations[index]);

      if (endFrame > maxFrames) endFrame = maxFrames;
      if (startFrame >= endFrame) break;

      segments.push({
        type: "scene",
        startFrame,
        endFrame,
        scene,
        chapterId: project.chapters[0]?.id,
      });
      currentFrame = endFrame;
      if (currentFrame >= maxFrames) break;
    }

    return {
      segments,
      totalFrames: segments.at(-1)?.endFrame ?? VIDEO_FPS,
      flatScenes,
    };
  }

  // Long-form: continuous burned captions only — no chapter cards or TOC breaks
  const maxFrames = secondsToFrames(config.maxDurationSeconds);

  for (const chapter of project.chapters) {
    for (const scene of chapter.scenes) {
      const startFrame = currentFrame;
      const endFrame = startFrame + secondsToFrames(scene.duration);

      if (startFrame >= maxFrames) break;
      const clampedEnd = Math.min(endFrame, maxFrames);
      if (startFrame >= clampedEnd) break;

      segments.push({
        type: "scene",
        startFrame,
        endFrame: clampedEnd,
        scene,
        chapterId: chapter.id,
      });
      currentFrame = clampedEnd;
    }
  }

  return {
    segments,
    totalFrames: Math.max(currentFrame, VIDEO_FPS),
    flatScenes,
  };
}

export function getSceneSegments(timeline: Timeline): TimelineSegment[] {
  return timeline.segments.filter((s) => s.type === "scene" && s.scene);
}

export function getTimelineDurationSeconds(timeline: Timeline): number {
  return timeline.totalFrames / VIDEO_FPS;
}
