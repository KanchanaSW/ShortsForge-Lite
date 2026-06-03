import type { ComponentType } from "react";
import type { ShortScript } from "@/lib/types";
import {
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "@/lib/types";
import {
  embedSceneAudioBlobUrls,
  getDurationInFrames,
  hasSceneAudio,
  prepareScriptForRender,
  stripSceneAudio,
} from "@/lib/videoUtils";

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

async function encodeShortVideo(
  script: ShortScript,
  durationInFrames: number,
  muted: boolean,
  onProgress: (pct: number) => void,
  signal?: AbortSignal
): Promise<Blob> {
  const { renderMediaOnWeb } = await import("@remotion/web-renderer");
  const { ShortVideo } = await import("@/remotion/ShortVideo");

  const inputProps = script as unknown as Record<string, unknown>;

  const { getBlob } = await renderMediaOnWeb({
    composition: {
      component: ShortVideo as unknown as ComponentType<Record<string, unknown>>,
      id: "ShortVideo",
      width: VIDEO_WIDTH,
      height: VIDEO_HEIGHT,
      fps: VIDEO_FPS,
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

export async function renderShortVideo(
  script: ShortScript,
  onProgress: (pct: number) => void,
  signal?: AbortSignal
): Promise<RenderResult> {
  const { canRenderMediaOnWeb } = await import("@remotion/web-renderer");

  const withAbsoluteUrls = prepareScriptForRender(script);
  const wantsAudio = hasSceneAudio(withAbsoluteUrls.scenes);
  let muted = !wantsAudio;
  let usedSilentFallback = false;
  let audioBlobUrls: string[] = [];

  let canRender = await canRenderMediaOnWeb({
    width: VIDEO_WIDTH,
    height: VIDEO_HEIGHT,
    container: "mp4",
    muted,
  });

  if (!canRender.canRender && wantsAudio) {
    canRender = await canRenderMediaOnWeb({
      width: VIDEO_WIDTH,
      height: VIDEO_HEIGHT,
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

  let finalScript = muted ? stripSceneAudio(withAbsoluteUrls) : withAbsoluteUrls;

  if (!muted) {
    try {
      const embedded = await embedSceneAudioBlobUrls(finalScript, signal);
      finalScript = embedded.script;
      audioBlobUrls = embedded.blobUrls;
    } catch (error) {
      if (signal?.aborted) {
        throw new RenderError("Render cancelled.");
      }
      console.warn("Audio embed failed, falling back to silent render:", error);
      muted = true;
      usedSilentFallback = true;
      finalScript = stripSceneAudio(withAbsoluteUrls);
    }
  }

  const finalDuration = getDurationInFrames(finalScript.scenes);

  try {
    const blob = await encodeShortVideo(
      finalScript,
      finalDuration,
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
        const silentScript = stripSceneAudio(withAbsoluteUrls);
        const blob = await encodeShortVideo(
          silentScript,
          getDurationInFrames(silentScript.scenes),
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
