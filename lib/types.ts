export type ScriptStyle = "motivational" | "facts" | "storytelling";

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

export const VIDEO_FPS = 30;
export const VIDEO_WIDTH = 1080;
export const VIDEO_HEIGHT = 1920;
export const MAX_DURATION_SECONDS = 60;
