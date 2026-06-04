import { flattenScenes, getRawTotalDurationSeconds } from "@/lib/projectUtils";
import { buildTimeline, getSceneSegments } from "@/lib/timelineEngine";
import {
  MAX_DURATION_SECONDS,
  VIDEO_FPS,
  type Project,
  type Scene,
  type ShortScript,
} from "@/lib/types";

export { getRawTotalDurationSeconds };

export function getTotalDurationSeconds(scenes: Scene[]): number {
  return Math.min(getRawTotalDurationSeconds(scenes), MAX_DURATION_SECONDS);
}

/** Scale scene durations proportionally when total exceeds MAX_DURATION_SECONDS. */
export function getScaledSceneDurations(scenes: Scene[]): number[] {
  if (scenes.length === 0) return [];

  const rawTotal = getRawTotalDurationSeconds(scenes);
  const cappedTotal = getTotalDurationSeconds(scenes);
  const scale = rawTotal > 0 ? cappedTotal / rawTotal : 1;

  return scenes.map((scene) =>
    Math.max(1 / VIDEO_FPS, scene.duration * scale)
  );
}

export function getDurationInFrames(scenes: Scene[]): number {
  const ranges = getSceneFrameRanges(scenes);
  return ranges.at(-1)?.endFrame ?? VIDEO_FPS;
}

export function getProjectDurationInFrames(project: Project): number {
  return buildTimeline(project).totalFrames;
}

export function getSceneFrameRanges(scenes: Scene[]): Array<{
  startFrame: number;
  endFrame: number;
  scene: Scene;
}> {
  if (scenes.length === 0) return [];

  const scaledDurations = getScaledSceneDurations(scenes);
  const maxFrames = Math.round(getTotalDurationSeconds(scenes) * VIDEO_FPS);

  let currentFrame = 0;
  const ranges: Array<{
    startFrame: number;
    endFrame: number;
    scene: Scene;
  }> = [];

  for (let index = 0; index < scenes.length; index++) {
    const scene = scenes[index];
    const isLast = index === scenes.length - 1;
    const startFrame = currentFrame;

    let endFrame = isLast
      ? maxFrames
      : startFrame + Math.max(1, Math.round(scaledDurations[index] * VIDEO_FPS));

    if (endFrame > maxFrames) {
      endFrame = maxFrames;
    }

    if (startFrame >= endFrame) {
      break;
    }

    ranges.push({ startFrame, endFrame, scene });
    currentFrame = endFrame;

    if (currentFrame >= maxFrames) {
      break;
    }
  }

  return ranges;
}

export function getProjectSceneFrameRanges(project: Project): Array<{
  startFrame: number;
  endFrame: number;
  scene: Scene;
}> {
  const timeline = buildTimeline(project);
  return getSceneSegments(timeline).map((segment) => ({
    startFrame: segment.startFrame,
    endFrame: segment.endFrame,
    scene: segment.scene!,
  }));
}

export function sanitizeFilename(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50) || "short";
}

export function getVideoFilename(project: Project | ShortScript): string {
  const mode = "mode" in project ? project.mode : "short";
  const prefix = mode === "long" ? "longform" : "shortsforge";
  return `${prefix}-${sanitizeFilename(project.title)}.mp4`;
}

export function toAbsoluteAudioUrl(audioPath: string): string {
  if (audioPath.startsWith("http://") || audioPath.startsWith("https://")) {
    return audioPath;
  }
  if (typeof window !== "undefined") {
    return new URL(audioPath, window.location.origin).href;
  }
  return audioPath;
}

export function hasSceneAudio(scenes: Scene[]): boolean {
  return scenes.some((s) => Boolean(s.audioPath));
}

export function stripProjectAudio(project: Project): Project {
  return {
    ...project,
    chapters: project.chapters.map((chapter) => ({
      ...chapter,
      scenes: chapter.scenes.map((scene) => ({
        ...scene,
        audioPath: undefined,
        audioUrl: undefined,
        audioStatus: undefined,
      })),
    })),
  };
}

/** @deprecated Use stripProjectAudio */
export function stripSceneAudio(script: ShortScript): ShortScript {
  return {
    ...script,
    scenes: script.scenes.map((scene) => ({
      ...scene,
      audioPath: undefined,
      audioUrl: undefined,
      audioStatus: undefined,
    })),
  };
}

export function prepareProjectForRender(project: Project): Project {
  return {
    ...project,
    chapters: project.chapters.map((chapter) => ({
      ...chapter,
      scenes: chapter.scenes.map((scene) => ({
        ...scene,
        audioPath: scene.audioPath
          ? toAbsoluteAudioUrl(scene.audioPath)
          : undefined,
        audioUrl: scene.audioUrl
          ? scene.audioUrl.startsWith("http")
            ? scene.audioUrl
            : toAbsoluteAudioUrl(scene.audioUrl)
          : undefined,
      })),
    })),
  };
}

/** @deprecated Use prepareProjectForRender */
export function prepareScriptForRender(script: ShortScript): ShortScript {
  return {
    ...script,
    scenes: script.scenes.map((scene) => ({
      ...scene,
      audioPath: scene.audioPath
        ? toAbsoluteAudioUrl(scene.audioPath)
        : undefined,
      audioUrl: scene.audioUrl
        ? scene.audioUrl.startsWith("http")
          ? scene.audioUrl
          : toAbsoluteAudioUrl(scene.audioUrl)
        : undefined,
    })),
  };
}

export async function embedProjectAudioBlobUrls(
  project: Project,
  signal?: AbortSignal
): Promise<{ project: Project; blobUrls: string[] }> {
  const blobUrls: string[] = [];
  const chapters = await Promise.all(
    project.chapters.map(async (chapter) => {
      const scenes = await Promise.all(
        chapter.scenes.map(async (scene) => {
          if (!scene.audioPath) return scene;

          const response = await fetch(scene.audioPath, { signal });
          if (!response.ok) {
            throw new Error(`Failed to load audio: ${scene.audioPath}`);
          }

          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          blobUrls.push(blobUrl);

          return {
            ...scene,
            audioPath: blobUrl,
            audioUrl: blobUrl,
          };
        })
      );
      return { ...chapter, scenes };
    })
  );

  return { project: { ...project, chapters }, blobUrls };
}

/** @deprecated Use embedProjectAudioBlobUrls */
export async function embedSceneAudioBlobUrls(
  script: ShortScript,
  signal?: AbortSignal
): Promise<{ script: ShortScript; blobUrls: string[] }> {
  const blobUrls: string[] = [];
  const scenes = await Promise.all(
    script.scenes.map(async (scene) => {
      if (!scene.audioPath) return scene;

      const response = await fetch(scene.audioPath, { signal });
      if (!response.ok) {
        throw new Error(`Failed to load audio: ${scene.audioPath}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      blobUrls.push(blobUrl);

      return {
        ...scene,
        audioPath: blobUrl,
        audioUrl: blobUrl,
      };
    })
  );

  return { script: { ...script, scenes }, blobUrls };
}

export function getProjectFlatScenes(project: Project): Scene[] {
  return flattenScenes(project);
}
