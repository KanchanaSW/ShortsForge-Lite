import { Composition } from "remotion";
import type { ComponentType } from "react";
import { generateId } from "@/lib/id";
import { buildTimeline } from "@/lib/timelineEngine";
import {
  DEFAULT_SCENE_VISUALS,
  LONG_VIDEO_HEIGHT,
  LONG_VIDEO_WIDTH,
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
  type Project,
} from "@/lib/types";
import { LongComposition } from "@/remotion/compositions/LongComposition";
import { ShortComposition } from "@/remotion/compositions/ShortComposition";

const defaultScene = {
  id: generateId(),
  text: "Your hook goes here.",
  duration: 3,
  ...DEFAULT_SCENE_VISUALS,
};

const defaultShortProject: Project = {
  title: "ShortsForge Lite",
  mode: "short",
  chapters: [
    {
      id: generateId(),
      title: "Main",
      scenes: [
        { ...defaultScene, text: "Your hook goes here.", visualQuery: "city lights night" },
        { ...defaultScene, id: generateId(), text: "Scene two.", visualQuery: "ocean waves sunset" },
        { ...defaultScene, id: generateId(), text: "Scene three.", visualQuery: "forest path morning" },
        { ...defaultScene, id: generateId(), text: "Scene four.", visualQuery: "coffee steam close" },
        { ...defaultScene, id: generateId(), text: "Scene five.", visualQuery: "stars sky timelapse" },
      ],
    },
  ],
};

function buildShortProps(project: Project) {
  const timeline = buildTimeline(project);
  return {
    title: project.title,
    segments: timeline.segments,
    totalFrames: timeline.totalFrames,
  };
}

function buildLongProps(project: Project) {
  const timeline = buildTimeline(project);
  return {
    title: project.title,
    segments: timeline.segments,
    totalFrames: timeline.totalFrames,
  };
}

export function RemotionRoot() {
  const shortTimeline = buildTimeline(defaultShortProject);
  const shortProps = buildShortProps(defaultShortProject);

  return (
    <>
      <Composition
        id="ShortVideo"
        component={ShortComposition as unknown as ComponentType<Record<string, unknown>>}
        durationInFrames={shortTimeline.totalFrames}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        defaultProps={shortProps as unknown as Record<string, unknown>}
        calculateMetadata={({ props }) => {
          const p = props as unknown as ReturnType<typeof buildShortProps>;
          return { durationInFrames: p.totalFrames };
        }}
      />
      <Composition
        id="LongVideo"
        component={LongComposition as unknown as ComponentType<Record<string, unknown>>}
        durationInFrames={shortTimeline.totalFrames}
        fps={VIDEO_FPS}
        width={LONG_VIDEO_WIDTH}
        height={LONG_VIDEO_HEIGHT}
        defaultProps={
          {
            title: "Long-form Video",
            segments: [],
            totalFrames: VIDEO_FPS * 30,
          } as unknown as Record<string, unknown>
        }
        calculateMetadata={({ props }) => {
          const p = props as unknown as ReturnType<typeof buildLongProps>;
          return { durationInFrames: p.totalFrames };
        }}
      />
    </>
  );
}

export { buildShortProps, buildLongProps };
