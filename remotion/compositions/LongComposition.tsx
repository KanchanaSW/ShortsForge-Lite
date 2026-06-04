"use client";

import { AbsoluteFill } from "remotion";
import { AudioSystem } from "@/remotion/shared/AudioSystem";
import { BackgroundSystem } from "@/remotion/shared/BackgroundSystem";
import { SceneRenderer } from "@/remotion/shared/SceneRenderer";
import type { TimelineSegment } from "@/lib/timelineEngine";
import { getSceneSegments } from "@/lib/timelineEngine";

export interface LongCompositionProps {
  title: string;
  segments: TimelineSegment[];
  totalFrames: number;
}

export function LongComposition({
  segments,
  totalFrames,
}: LongCompositionProps) {
  const sceneSegments = segments.filter((s) => s.type === "scene" && s.scene);
  const audioRanges = getSceneSegments({ segments, totalFrames, flatScenes: [] }).map(
    (s) => ({
      startFrame: s.startFrame,
      endFrame: s.endFrame,
      scene: s.scene!,
    })
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {sceneSegments.map((segment) => (
        <BackgroundSystem
          key={`bg-${segment.scene!.id}-${segment.startFrame}`}
          mood={segment.scene!.mood}
          accentColor={segment.scene!.accentColor}
          videoUrl={segment.scene!.videoUrl}
          startFrame={segment.startFrame}
          endFrame={segment.endFrame}
          cinematic
        />
      ))}

      {sceneSegments.map((segment) => (
        <SceneRenderer
          key={`scene-${segment.scene!.id}-${segment.startFrame}`}
          scene={segment.scene!}
          startFrame={segment.startFrame}
          endFrame={segment.endFrame}
          variant="long"
        />
      ))}

      <AudioSystem frameRanges={audioRanges} />
    </AbsoluteFill>
  );
}
