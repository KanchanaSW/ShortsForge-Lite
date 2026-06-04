export type VideoMode = "short" | "long";

export type ScriptStyle = "motivational" | "facts" | "storytelling";

export type LongContentStyle =
  | "educational"
  | "documentary"
  | "storytelling"
  | "motivational"
  | "explainer";

export type TargetDuration = 3 | 5 | 10 | 15 | 20;

export type SceneMood =
  | "energetic"
  | "calm"
  | "dramatic"
  | "mysterious"
  | "uplifting"
  | "intense";

export const SCENE_MOODS: SceneMood[] = [
  "energetic",
  "calm",
  "dramatic",
  "mysterious",
  "uplifting",
  "intense",
];

export const MOOD_LABELS: Record<SceneMood, string> = {
  energetic: "Energetic",
  calm: "Calm",
  dramatic: "Dramatic",
  mysterious: "Mysterious",
  uplifting: "Uplifting",
  intense: "Intense",
};

export type SceneAudioStatus =
  | "idle"
  | "generating"
  | "ready"
  | "missing"
  | "error";

export interface Scene {
  id: string;
  heading?: string;
  text: string;
  duration: number;
  mood: SceneMood;
  visualQuery: string;
  accentColor: string;
  /** Render-only; not persisted to localStorage */
  videoUrl?: string;
  /** Public URL path e.g. /audio/scene-0-a1b2c3d4.mp3 */
  audioPath?: string;
  /** Preview URL; often same as audioPath */
  audioUrl?: string;
  /** UI-only; not persisted to localStorage */
  audioStatus?: SceneAudioStatus;
}

export interface Chapter {
  id: string;
  title: string;
  scenes: Scene[];
}

export interface Project {
  title: string;
  mode: VideoMode;
  chapters: Chapter[];
  targetDuration?: TargetDuration;
  contentStyle?: LongContentStyle;
  showTableOfContents?: boolean;
}

/** @deprecated Use Project — kept for backward compatibility */
export interface ShortScript {
  title: string;
  scenes: Scene[];
}

export const DEFAULT_SCENE_VISUALS: Pick<
  Scene,
  "mood" | "visualQuery" | "accentColor"
> = {
  mood: "uplifting",
  visualQuery: "sunrise sky",
  accentColor: "#E30B5C",
};

export const SCRIPT_STYLES: { value: ScriptStyle; label: string }[] = [
  { value: "motivational", label: "Motivational" },
  { value: "facts", label: "Facts" },
  { value: "storytelling", label: "Storytelling" },
];

export const LONG_CONTENT_STYLES: {
  value: LongContentStyle;
  label: string;
}[] = [
  { value: "educational", label: "Educational" },
  { value: "documentary", label: "Documentary" },
  { value: "storytelling", label: "Storytelling" },
  { value: "motivational", label: "Motivational" },
  { value: "explainer", label: "Explainer" },
];

export const TARGET_DURATIONS: { value: TargetDuration; label: string }[] = [
  { value: 3, label: "3 Minutes" },
  { value: 5, label: "5 Minutes" },
  { value: 10, label: "10 Minutes" },
  { value: 15, label: "15 Minutes" },
  { value: 20, label: "20 Minutes" },
];

export const VIDEO_FPS = 30;
export const VIDEO_WIDTH = 1080;
export const VIDEO_HEIGHT = 1920;
export const LONG_VIDEO_WIDTH = 1920;
export const LONG_VIDEO_HEIGHT = 1080;
export const MAX_DURATION_SECONDS = 60;

export type PexelsOrientation = "portrait" | "landscape";

export interface RenderMeta {
  mode: VideoMode;
  resolution: string;
  durationSeconds: number;
  chapterCount: number;
  sceneCount: number;
}
