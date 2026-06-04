"use client";

import { useState } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Video } from "@remotion/media";
import { stripUnsafeVideoUrl } from "@/lib/stockVideoValidate";
import type { SceneMood } from "@/lib/types";
import { buildMoodGradient, MOOD_PRESETS } from "@/remotion/moodPresets";

interface BackgroundSystemProps {
  mood: SceneMood;
  accentColor: string;
  videoUrl?: string;
  startFrame: number;
  endFrame: number;
  cinematic?: boolean;
}

export function BackgroundSystem({
  mood,
  accentColor,
  videoUrl,
  startFrame,
  endFrame,
  cinematic = false,
}: BackgroundSystemProps) {
  const frame = useCurrentFrame();
  const [videoFailed, setVideoFailed] = useState(false);

  if (frame < startFrame || frame >= endFrame) {
    return null;
  }

  const safeUrl = stripUnsafeVideoUrl(videoUrl);
  const preset = MOOD_PRESETS[mood];
  const localFrame = frame - startFrame;
  const sceneLength = endFrame - startFrame;
  const hueShift = interpolate(
    localFrame % preset.cycleFrames,
    [0, preset.cycleFrames / 2, preset.cycleFrames],
    [0, preset.hueShiftRange, 0]
  );

  const showVideo = Boolean(safeUrl) && !videoFailed;
  const zoomScale = cinematic
    ? interpolate(localFrame, [0, sceneLength], [1, 1.08], {
        extrapolateRight: "clamp",
      })
    : 1;

  const gradientStyle = {
    background: buildMoodGradient(accentColor, mood, hueShift),
    transform: cinematic ? `scale(${zoomScale})` : undefined,
  };

  return (
    <AbsoluteFill>
      {/* Gradient always present — safe fallback if stock video fails to decode */}
      <AbsoluteFill style={gradientStyle} />

      {showVideo && safeUrl && (
        <>
          <Video
            src={safeUrl}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${zoomScale})`,
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
              backgroundColor: cinematic
                ? "rgba(0, 0, 0, 0.35)"
                : "rgba(0, 0, 0, 0.45)",
            }}
          />
        </>
      )}
    </AbsoluteFill>
  );
}
