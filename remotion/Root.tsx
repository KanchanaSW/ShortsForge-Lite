import { Composition } from "remotion";
import type { ComponentType } from "react";
import { ShortVideo } from "@/remotion/ShortVideo";
import {
  DEFAULT_SCENE_VISUALS,
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
  type ShortScript,
} from "@/lib/types";
import { getDurationInFrames } from "@/lib/videoUtils";

const defaultScene = {
  text: "Your hook goes here.",
  duration: 3,
  ...DEFAULT_SCENE_VISUALS,
};

const defaultScript: ShortScript = {
  title: "ShortsForge Lite",
  scenes: [
    { ...defaultScene, text: "Your hook goes here.", visualQuery: "city lights night" },
    { ...defaultScene, text: "Scene two.", visualQuery: "ocean waves sunset" },
    { ...defaultScene, text: "Scene three.", visualQuery: "forest path morning" },
    { ...defaultScene, text: "Scene four.", visualQuery: "coffee steam close" },
    { ...defaultScene, text: "Scene five.", visualQuery: "stars sky timelapse" },
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
