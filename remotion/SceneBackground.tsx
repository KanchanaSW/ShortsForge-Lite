"use client";

import { useState } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Video } from "@remotion/media";
import type { SceneMood } from "@/lib/types";
import { buildMoodGradient, MOOD_PRESETS } from "@/remotion/moodPresets";

interface SceneBackgroundProps {
  mood: SceneMood;
  accentColor: string;
  videoUrl?: string;
  startFrame: number;
  endFrame: number;
}

export function SceneBackground({
  mood,
  accentColor,
  videoUrl,
  startFrame,
  endFrame,
}: SceneBackgroundProps) {
  const frame = useCurrentFrame();
  const [videoFailed, setVideoFailed] = useState(false);

  if (frame < startFrame || frame >= endFrame) {
    return null;
  }

  const preset = MOOD_PRESETS[mood];
  const localFrame = frame - startFrame;
  const hueShift = interpolate(
    localFrame % preset.cycleFrames,
    [0, preset.cycleFrames / 2, preset.cycleFrames],
    [0, preset.hueShiftRange, 0]
  );

  const showVideo = Boolean(videoUrl) && !videoFailed;

  if (showVideo && videoUrl) {
    return (
      <AbsoluteFill>
        <Video
          src={videoUrl}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
          muted
          loop
          onError={() => {
            setVideoFailed(true);
            return "fail";
          }}
        />
        <AbsoluteFill
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.45)",
          }}
        />
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill
      style={{
        background: buildMoodGradient(accentColor, mood, hueShift),
      }}
    />
  );
}
