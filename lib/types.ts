export type ScriptStyle = "motivational" | "facts" | "storytelling";

export interface Scene {
  text: string;
  duration: number;
}

export interface ShortScript {
  title: string;
  scenes: Scene[];
}

export const SCRIPT_STYLES: { value: ScriptStyle; label: string }[] = [
  { value: "motivational", label: "Motivational" },
  { value: "facts", label: "Facts" },
  { value: "storytelling", label: "Storytelling" },
];

export const VIDEO_FPS = 30;
export const VIDEO_WIDTH = 1080;
export const VIDEO_HEIGHT = 1920;
export const MAX_DURATION_SECONDS = 60;
