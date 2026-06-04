"use client";

import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { VIDEO_FPS } from "@/lib/types";

interface ChapterTransitionProps {
  chapterNumber: number;
  chapterTitle: string;
  startFrame: number;
  endFrame: number;
}

export function ChapterTransition({
  chapterNumber,
  chapterTitle,
  startFrame,
  endFrame,
}: ChapterTransitionProps) {
  const frame = useCurrentFrame();

  if (frame < startFrame || frame >= endFrame) {
    return null;
  }

  const localFrame = frame - startFrame;
  const duration = endFrame - startFrame;
  const fadeIn = Math.round(VIDEO_FPS * 0.4);
  const fadeOut = Math.round(VIDEO_FPS * 0.4);

  const opacity = interpolate(
    localFrame,
    [0, fadeIn, duration - fadeOut, duration],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const scale = interpolate(
    localFrame,
    [0, fadeIn],
    [0.85, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        justifyContent: "center",
        alignItems: "center",
        opacity,
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            color: "#E30B5C",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          Chapter {chapterNumber}
        </div>
        <div
          style={{
            color: "#FFFFFF",
            fontSize: 56,
            fontWeight: 800,
            lineHeight: 1.2,
            maxWidth: 1200,
            padding: "0 48px",
          }}
        >
          {chapterTitle}
        </div>
      </div>
    </AbsoluteFill>
  );
}
