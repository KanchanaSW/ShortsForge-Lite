"use client";

import { Audio } from "@remotion/media";
import type { Scene } from "@/lib/types";

interface SceneAudioProps {
  frameRanges: Array<{
    startFrame: number;
    endFrame: number;
    scene: Scene;
  }>;
}

export function SceneAudio({ frameRanges }: SceneAudioProps) {
  return (
    <>
      {frameRanges.map(({ startFrame, endFrame, scene }, index) => {
        if (!scene.audioPath) return null;
        const durationInFrames = endFrame - startFrame;
        if (durationInFrames <= 0) return null;

        return (
          <Audio
            key={`audio-${index}-${scene.audioPath}`}
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
