import { DEFAULT_SCENE_VISUALS, SCENE_MOODS, type Scene } from "@/lib/types";
import { generateId } from "@/lib/id";

function isValidMood(value: unknown): value is Scene["mood"] {
  return (
    typeof value === "string" &&
    (SCENE_MOODS as readonly string[]).includes(value)
  );
}

function isValidHexColor(value: unknown): boolean {
  return typeof value === "string" && /^#[0-9A-Fa-f]{6}$/.test(value);
}

export function normalizeScene(
  partial: Partial<Scene> & { text: string; duration: number }
): Scene {
  const {
    videoUrl: _v,
    audioPath: _a,
    audioUrl: _u,
    audioStatus: _s,
    ...rest
  } = partial;
  void _v;
  void _a;
  void _u;
  void _s;

  const accentColor =
    typeof rest.accentColor === "string" && isValidHexColor(rest.accentColor)
      ? rest.accentColor
      : DEFAULT_SCENE_VISUALS.accentColor;

  return {
    id: typeof rest.id === "string" && rest.id.length > 0 ? rest.id : generateId(),
    heading: typeof rest.heading === "string" ? rest.heading : undefined,
    text: rest.text,
    duration: rest.duration,
    mood: isValidMood(rest.mood) ? rest.mood : DEFAULT_SCENE_VISUALS.mood,
    visualQuery:
      typeof rest.visualQuery === "string" && rest.visualQuery.length >= 2
        ? rest.visualQuery.slice(0, 80)
        : DEFAULT_SCENE_VISUALS.visualQuery,
    accentColor,
  };
}

export function normalizeScript(
  scenes: Array<Partial<Scene> & { text: string; duration: number }>
): Scene[] {
  return scenes.map(normalizeScene);
}
