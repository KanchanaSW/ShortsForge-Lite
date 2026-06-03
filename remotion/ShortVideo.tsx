"use client";

import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { SceneAudio } from "@/remotion/SceneAudio";
import { SceneBackground } from "@/remotion/SceneBackground";
import { SceneRenderer } from "@/remotion/SceneRenderer";
import type { ShortScript } from "@/lib/types";
import { getSceneFrameRanges } from "@/lib/videoUtils";

export type ShortVideoProps = ShortScript;

export function ShortVideo({ title, scenes }: ShortVideoProps) {
  const frame = useCurrentFrame();
  const frameRanges = getSceneFrameRanges(scenes);
  const totalFrames = frameRanges.at(-1)?.endFrame ?? 1;

  const progressWidth = interpolate(
    frame,
    [0, totalFrames],
    [0, 100],
    { extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill>
      {frameRanges.map(({ startFrame, endFrame, scene }, index) => (
        <SceneBackground
          key={`bg-${index}-${scene.visualQuery}`}
          mood={scene.mood}
          accentColor={scene.accentColor}
          videoUrl={scene.videoUrl}
          startFrame={startFrame}
          endFrame={endFrame}
        />
      ))}
      {frameRanges.map(({ startFrame, endFrame, scene }, index) => (
        <SceneRenderer
          key={`scene-${index}-${scene.text.slice(0, 20)}`}
          scene={scene}
          startFrame={startFrame}
          endFrame={endFrame}
        />
      ))}
      <SceneAudio frameRanges={frameRanges} />
      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          alignItems: "stretch",
          padding: "0 48px 64px",
        }}
      >
        <div
          style={{
            height: 6,
            borderRadius: 999,
            backgroundColor: "rgba(255,255,255,0.15)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progressWidth}%`,
              backgroundColor: "#E30B5C",
              borderRadius: 999,
            }}
          />
        </div>
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          justifyContent: "flex-start",
          alignItems: "center",
          paddingTop: 48,
          opacity: 0.35,
        }}
      >
        <div
          style={{
            color: "#FFFFFF",
            fontSize: 28,
            fontWeight: 600,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {title}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
