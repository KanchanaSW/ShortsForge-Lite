"use client";

import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { VIDEO_FPS } from "@/lib/types";

interface TableOfContentsProps {
  chapters: Array<{ title: string; number: number }>;
  startFrame: number;
  endFrame: number;
}

export function TableOfContents({
  chapters,
  startFrame,
  endFrame,
}: TableOfContentsProps) {
  const frame = useCurrentFrame();

  if (frame < startFrame || frame >= endFrame) {
    return null;
  }

  const localFrame = frame - startFrame;
  const duration = endFrame - startFrame;
  const fadeIn = Math.round(VIDEO_FPS * 0.5);
  const fadeOut = Math.round(VIDEO_FPS * 0.5);

  const opacity = interpolate(
    localFrame,
    [0, fadeIn, duration - fadeOut, duration],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        justifyContent: "center",
        alignItems: "center",
        opacity,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 900, width: "100%", padding: "0 64px" }}>
        <div
          style={{
            color: "#E30B5C",
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: 32,
          }}
        >
          In This Video
        </div>
        {chapters.map((chapter, index) => {
          const stagger = Math.round(VIDEO_FPS * 0.15) * index;
          const itemOpacity = interpolate(
            localFrame,
            [fadeIn + stagger, fadeIn + stagger + VIDEO_FPS * 0.3],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          return (
            <div
              key={chapter.number}
              style={{
                opacity: itemOpacity,
                display: "flex",
                alignItems: "center",
                gap: 24,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  color: "#E30B5C",
                  fontSize: 32,
                  fontWeight: 800,
                  minWidth: 48,
                }}
              >
                {chapter.number}
              </div>
              <div
                style={{
                  color: "#FFFFFF",
                  fontSize: 36,
                  fontWeight: 600,
                }}
              >
                {chapter.title}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}
