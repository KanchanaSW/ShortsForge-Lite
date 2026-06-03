import type { ComponentType } from "react";
import type { ShortScript } from "@/lib/types";
import {
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "@/lib/types";
import { getDurationInFrames } from "@/lib/videoUtils";

export class RenderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RenderError";
  }
}

export async function renderShortVideo(
  script: ShortScript,
  onProgress: (pct: number) => void,
  signal?: AbortSignal
): Promise<Blob> {
  const { canRenderMediaOnWeb, renderMediaOnWeb } = await import(
    "@remotion/web-renderer"
  );
  const { ShortVideo } = await import("@/remotion/ShortVideo");

  const durationInFrames = getDurationInFrames(script.scenes);

  const canRender = await canRenderMediaOnWeb({
    width: VIDEO_WIDTH,
    height: VIDEO_HEIGHT,
    container: "mp4",
  });

  if (!canRender.canRender) {
    const message =
      canRender.issues.find((i) => i.severity === "error")?.message ??
      "Video rendering requires Chrome or Edge. Please switch browsers.";
    throw new RenderError(message);
  }

  const inputProps = script as unknown as Record<string, unknown>;

  try {
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
      muted: true,
    });

    return await getBlob();
  } catch (error) {
    if (signal?.aborted) {
      throw new RenderError("Render cancelled.");
    }
    if (error instanceof RenderError) {
      throw error;
    }
    throw new RenderError(
      "Video rendering failed. Try reducing scene count or text length."
    );
  }
}
