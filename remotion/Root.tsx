import { Composition } from "remotion";
import type { ComponentType } from "react";
import { ShortVideo } from "@/remotion/ShortVideo";
import {
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
  type ShortScript,
} from "@/lib/types";
import { getDurationInFrames } from "@/lib/videoUtils";

const defaultScript: ShortScript = {
  title: "ShortsForge Lite",
  scenes: [
    { text: "Your hook goes here.", duration: 3 },
    { text: "Scene two.", duration: 3 },
    { text: "Scene three.", duration: 3 },
    { text: "Scene four.", duration: 3 },
    { text: "Scene five.", duration: 3 },
  ],
};

export function RemotionRoot() {
  return (
    <>
      <Composition
        id="ShortVideo"
        component={ShortVideo as unknown as ComponentType<Record<string, unknown>>}
        durationInFrames={getDurationInFrames(defaultScript.scenes)}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        defaultProps={defaultScript as unknown as Record<string, unknown>}
        calculateMetadata={({ props }) => ({
          durationInFrames: getDurationInFrames(
            (props as unknown as ShortScript).scenes
          ),
        })}
      />
    </>
  );
}
