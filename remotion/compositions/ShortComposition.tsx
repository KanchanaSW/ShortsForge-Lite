"use client";

import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { AudioSystem } from "@/remotion/shared/AudioSystem";
import { BackgroundSystem } from "@/remotion/shared/BackgroundSystem";
import { SceneRenderer } from "@/remotion/shared/SceneRenderer";
import type { TimelineSegment } from "@/lib/timelineEngine";
import { getSceneSegments } from "@/lib/timelineEngine";

export interface ShortCompositionProps {
  title: string;
  segments: TimelineSegment[];
  totalFrames: number;
}

export function ShortComposition({
  segments,
  totalFrames,
}: ShortCompositionProps) {
  const frame = useCurrentFrame();
  const sceneSegments = segments.filter((s) => s.type === "scene" && s.scene);
  const audioRanges = getSceneSegments({ segments, totalFrames, flatScenes: [] }).map(
    (s) => ({
      startFrame: s.startFrame,
      endFrame: s.endFrame,
      scene: s.scene!,
    })
  );

  const progressWidth = interpolate(
    frame,
    [0, totalFrames],
    [0, 100],
    { extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill>
      {sceneSegments.map((segment) => (
        <BackgroundSystem
          key={`bg-${segment.scene!.id}-${segment.startFrame}`}
          mood={segment.scene!.mood}
          accentColor={segment.scene!.accentColor}
          videoUrl={segment.scene!.videoUrl}
          startFrame={segment.startFrame}
          endFrame={segment.endFrame}
        />
      ))}
      {sceneSegments.map((segment) => (
        <SceneRenderer
          key={`scene-${segment.scene!.id}-${segment.startFrame}`}
          scene={segment.scene!}
          startFrame={segment.startFrame}
          endFrame={segment.endFrame}
          variant="short"
        />
      ))}
      <AudioSystem frameRanges={audioRanges} />
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
    </AbsoluteFill>
  );
}
