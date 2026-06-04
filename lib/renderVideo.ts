import type { ComponentType } from "react";
import { sanitizeProjectVideoUrls } from "@/lib/prefetchStockVideos";
import { flattenScenes } from "@/lib/projectUtils";
import type { Project } from "@/lib/types";
import { getProjectVideoConfig } from "@/lib/videoConfig";
import {
  embedProjectAudioBlobUrls,
  getProjectDurationInFrames,
  hasSceneAudio,
  prepareProjectForRender,
  stripProjectAudio,
} from "@/lib/videoUtils";
import { buildLongProps, buildShortProps } from "@/remotion/Root";

export class RenderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RenderError";
  }
}

export type RenderResult = {
  blob: Blob;
  /** True when audio was requested but render fell back to silent MP4 */
  usedSilentFallback?: boolean;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return "Video rendering failed. Try reducing scene count or text length.";
}

async function encodeVideo(
  compositionId: string,
  component: ComponentType<Record<string, unknown>>,
  inputProps: Record<string, unknown>,
  width: number,
  height: number,
  durationInFrames: number,
  muted: boolean,
  onProgress: (pct: number) => void,
  signal?: AbortSignal
): Promise<Blob> {
  const { renderMediaOnWeb } = await import("@remotion/web-renderer");

  const { getBlob } = await renderMediaOnWeb({
    composition: {
      component,
      id: compositionId,
      width,
      height,
      fps: 30,
      durationInFrames,
      defaultProps: inputProps,
    },
    inputProps,
    signal: signal ?? null,
    onProgress: (progress) => {
      onProgress(Math.round(progress.progress * 100));
    },
    muted,
  });

  return await getBlob();
}

export async function renderProject(
  project: Project,
  onProgress: (pct: number) => void,
  signal?: AbortSignal
): Promise<RenderResult> {
  const { canRenderMediaOnWeb } = await import("@remotion/web-renderer");
  const config = getProjectVideoConfig(project);

  const withAbsoluteUrls = prepareProjectForRender(sanitizeProjectVideoUrls(project));
  const flatScenes = flattenScenes(withAbsoluteUrls);
  const wantsAudio = hasSceneAudio(flatScenes);
  let muted = !wantsAudio;
  let usedSilentFallback = false;
  let audioBlobUrls: string[] = [];

  let canRender = await canRenderMediaOnWeb({
    width: config.width,
    height: config.height,
    container: "mp4",
    muted,
  });

  if (!canRender.canRender && wantsAudio) {
    canRender = await canRenderMediaOnWeb({
      width: config.width,
      height: config.height,
      container: "mp4",
      muted: true,
    });
    muted = true;
    usedSilentFallback = true;
  }

  if (!canRender.canRender) {
    const message =
      canRender.issues.find((i) => i.severity === "error")?.message ??
      "Video rendering requires Chrome or Edge. Please switch browsers.";
    throw new RenderError(message);
  }

  let finalProject = muted
    ? stripProjectAudio(withAbsoluteUrls)
    : withAbsoluteUrls;

  if (!muted) {
    try {
      const embedded = await embedProjectAudioBlobUrls(finalProject, signal);
      finalProject = embedded.project;
      audioBlobUrls = embedded.blobUrls;
    } catch (error) {
      if (signal?.aborted) {
        throw new RenderError("Render cancelled.");
      }
      console.warn("Audio embed failed, falling back to silent render:", error);
      muted = true;
      usedSilentFallback = true;
      finalProject = stripProjectAudio(withAbsoluteUrls);
    }
  }

  const durationInFrames = getProjectDurationInFrames(finalProject);
  const isLong = project.mode === "long";

  try {
    if (isLong) {
      const { LongComposition } = await import(
        "@/remotion/compositions/LongComposition"
      );
      const inputProps = buildLongProps(finalProject) as unknown as Record<
        string,
        unknown
      >;
      const blob = await encodeVideo(
        "LongVideo",
        LongComposition as unknown as ComponentType<Record<string, unknown>>,
        inputProps,
        config.width,
        config.height,
        durationInFrames,
        muted,
        onProgress,
        signal
      );
      return { blob, usedSilentFallback: usedSilentFallback || undefined };
    }

    const { ShortComposition } = await import(
      "@/remotion/compositions/ShortComposition"
    );
    const inputProps = buildShortProps(finalProject) as unknown as Record<
      string,
      unknown
    >;
    const blob = await encodeVideo(
      "ShortVideo",
      ShortComposition as unknown as ComponentType<Record<string, unknown>>,
      inputProps,
      config.width,
      config.height,
      durationInFrames,
      muted,
      onProgress,
      signal
    );
    return { blob, usedSilentFallback: usedSilentFallback || undefined };
  } catch (error) {
    if (signal?.aborted) {
      throw new RenderError("Render cancelled.");
    }
    if (error instanceof RenderError) {
      throw error;
    }

    if (wantsAudio && !muted) {
      try {
        const silentProject = stripProjectAudio(withAbsoluteUrls);
        const silentDuration = getProjectDurationInFrames(silentProject);

        if (isLong) {
          const { LongComposition } = await import(
            "@/remotion/compositions/LongComposition"
          );
          const inputProps = buildLongProps(silentProject) as unknown as Record<
            string,
            unknown
          >;
          const blob = await encodeVideo(
            "LongVideo",
            LongComposition as unknown as ComponentType<Record<string, unknown>>,
            inputProps,
            config.width,
            config.height,
            silentDuration,
            true,
            onProgress,
            signal
          );
          return { blob, usedSilentFallback: true };
        }

        const { ShortComposition } = await import(
          "@/remotion/compositions/ShortComposition"
        );
        const inputProps = buildShortProps(silentProject) as unknown as Record<
          string,
          unknown
        >;
        const blob = await encodeVideo(
          "ShortVideo",
          ShortComposition as unknown as ComponentType<Record<string, unknown>>,
          inputProps,
          config.width,
          config.height,
          silentDuration,
          true,
          onProgress,
          signal
        );
        return { blob, usedSilentFallback: true };
      } catch (retryError) {
        if (signal?.aborted) {
          throw new RenderError("Render cancelled.");
        }
        throw new RenderError(getErrorMessage(retryError));
      }
    }

    throw new RenderError(getErrorMessage(error));
  } finally {
    for (const url of audioBlobUrls) {
      URL.revokeObjectURL(url);
    }
  }
}

/** @deprecated Use renderProject */
export async function renderShortVideo(
  script: { title: string; scenes: Project["chapters"][0]["scenes"] },
  onProgress: (pct: number) => void,
  signal?: AbortSignal
): Promise<RenderResult> {
  const project: Project = {
    title: script.title,
    mode: "short",
    chapters: [{ id: "main", title: "Main", scenes: script.scenes }],
  };
  return renderProject(project, onProgress, signal);
}
