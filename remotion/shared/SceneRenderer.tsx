"use client";

import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { CaptionOverlay } from "@/remotion/shared/CaptionOverlay";
import type { Scene } from "@/lib/types";
import { VIDEO_FPS } from "@/lib/types";

interface SceneRendererProps {
  scene: Scene;
  startFrame: number;
  endFrame: number;
  variant?: "short" | "long";
}

export function SceneRenderer({
  scene,
  startFrame,
  endFrame,
  variant = "short",
}: SceneRendererProps) {
  const frame = useCurrentFrame();
  const fadeFrames = Math.round(VIDEO_FPS * (variant === "long" ? 0.5 : 0.3));
  const slideFrames = Math.round(VIDEO_FPS * (variant === "long" ? 0.25 : 0.5));

  if (frame < startFrame || frame >= endFrame) {
    return null;
  }

  const localFrame = frame - startFrame;
  const sceneLength = endFrame - startFrame;

  const opacity = interpolate(
    localFrame,
    [0, fadeFrames, sceneLength - fadeFrames, sceneLength],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const translateY = interpolate(
    localFrame,
    [0, slideFrames],
    [variant === "long" ? 8 : 40, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill>
      <CaptionOverlay
        text={scene.text}
        opacity={opacity}
        translateY={translateY}
        variant={variant}
      />
    </AbsoluteFill>
  );
}
