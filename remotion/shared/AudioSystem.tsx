"use client";

import { Audio } from "@remotion/media";
import type { Scene } from "@/lib/types";

interface AudioSystemProps {
  frameRanges: Array<{
    startFrame: number;
    endFrame: number;
    scene: Scene;
  }>;
}

export function AudioSystem({ frameRanges }: AudioSystemProps) {
  return (
    <>
      {frameRanges.map(({ startFrame, endFrame, scene }, index) => {
        if (!scene.audioPath) return null;
        const durationInFrames = endFrame - startFrame;
        if (durationInFrames <= 0) return null;

        return (
          <Audio
            key={`audio-${scene.id}-${index}`}
            src={scene.audioPath}
            from={startFrame}
            durationInFrames={durationInFrames}
            volume={1}
          />
        );
      })}
    </>
  );
}
