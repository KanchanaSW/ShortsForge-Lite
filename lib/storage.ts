import { normalizeScene } from "@/lib/normalizeScene";
import { generateId } from "@/lib/id";
import { ensureChapterIds, fromLegacyScript, normalizeProject } from "@/lib/projectUtils";
import type { Project, RenderMeta, Scene, ShortScript, VideoMode } from "@/lib/types";

const TOPIC_KEY = "shortsforge:lastTopic";
const SCRIPT_KEY = "shortsforge:lastScript";
const PROJECT_KEY = "shortsforge:lastProject";
const MODE_KEY = "shortsforge:lastMode";
const VIDEO_KEY = "shortsforge:lastVideo";
const VIDEO_FILENAME_KEY = "shortsforge:lastVideoFilename";
const RENDER_META_KEY = "shortsforge:lastRenderMeta";

function projectForStorage(project: Project): Project {
  return {
    title: project.title,
    mode: project.mode,
    chapters: project.chapters.map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      scenes: chapter.scenes.map(
        ({ id, heading, text, duration, mood, visualQuery, accentColor }) => ({
          id,
          ...(heading ? { heading } : {}),
          text,
          duration,
          mood,
          visualQuery,
          accentColor,
        })
      ),
    })),
    ...(project.targetDuration !== undefined
      ? { targetDuration: project.targetDuration }
      : {}),
    ...(project.contentStyle !== undefined
      ? { contentStyle: project.contentStyle }
      : {}),
    ...(project.showTableOfContents !== undefined
      ? { showTableOfContents: project.showTableOfContents }
      : {}),
  };
}

export function saveTopic(topic: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOPIC_KEY, topic);
}

export function loadTopic(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOPIC_KEY);
}

export function saveMode(mode: VideoMode): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(MODE_KEY, mode);
}

export function loadMode(): VideoMode {
  if (typeof window === "undefined") return "short";
  const mode = localStorage.getItem(MODE_KEY);
  return mode === "long" ? "long" : "short";
}

export function saveProject(project: Project): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROJECT_KEY, JSON.stringify(projectForStorage(project)));
  saveMode(project.mode);
}

export function loadProject(): Project | null {
  if (typeof window === "undefined") return null;

  const projectRaw = localStorage.getItem(PROJECT_KEY);
  if (projectRaw) {
    try {
      const parsed = JSON.parse(projectRaw) as Partial<Project> & {
        title: string;
        mode: VideoMode;
        chapters: Array<{
          id?: string;
          title: string;
          scenes: Array<Partial<Scene> & { text: string; duration: number }>;
        }>;
      };
      if (!parsed.title || !parsed.mode || !Array.isArray(parsed.chapters)) {
        return null;
      }
      return normalizeProject({
        title: parsed.title,
        mode: parsed.mode,
        chapters: ensureChapterIds(
          parsed.chapters.map((chapter) => ({
            id: chapter.id ?? generateId(),
            title: chapter.title,
            scenes: chapter.scenes.map((scene) =>
              normalizeScene({
                ...scene,
                id: scene.id ?? generateId(),
              })
            ),
          }))
        ),
        targetDuration: parsed.targetDuration,
        contentStyle: parsed.contentStyle,
        showTableOfContents: parsed.showTableOfContents,
      });
    } catch {
      return null;
    }
  }

  const legacyRaw = localStorage.getItem(SCRIPT_KEY);
  if (!legacyRaw) return null;

  try {
    const parsed = JSON.parse(legacyRaw) as {
      title: string;
      scenes: Array<Partial<Scene> & { text: string; duration: number }>;
    };
    if (!parsed.title || !Array.isArray(parsed.scenes)) return null;
    const legacy: ShortScript = {
      title: parsed.title,
      scenes: parsed.scenes.map((scene) =>
        normalizeScene({
          ...scene,
          id: scene.id ?? generateId(),
        })
      ),
    };
    const migrated = fromLegacyScript(legacy);
    saveProject(migrated);
    localStorage.removeItem(SCRIPT_KEY);
    return migrated;
  } catch {
    return null;
  }
}

/** @deprecated Use saveProject */
export function saveScript(script: ShortScript): void {
  saveProject(fromLegacyScript(script));
}

/** @deprecated Use loadProject */
export function loadScript(): ShortScript | null {
  const project = loadProject();
  if (!project) return null;
  return {
    title: project.title,
    scenes: project.chapters.flatMap((c) => c.scenes),
  };
}

export function saveVideoBlobUrl(blobUrl: string, filename: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(VIDEO_KEY, blobUrl);
  sessionStorage.setItem(VIDEO_FILENAME_KEY, filename);
}

export function loadVideoBlobUrl(): { url: string; filename: string } | null {
  if (typeof window === "undefined") return null;
  const url = sessionStorage.getItem(VIDEO_KEY);
  const filename = sessionStorage.getItem(VIDEO_FILENAME_KEY);
  if (!url || !filename) return null;
  return { url, filename };
}

export function saveRenderMeta(meta: RenderMeta): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(RENDER_META_KEY, JSON.stringify(meta));
}

export function loadRenderMeta(): RenderMeta | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(RENDER_META_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RenderMeta;
  } catch {
    return null;
  }
}

export function clearVideoBlobUrl(): void {
  if (typeof window === "undefined") return;
  const existing = sessionStorage.getItem(VIDEO_KEY);
  if (existing) {
    URL.revokeObjectURL(existing);
  }
  sessionStorage.removeItem(VIDEO_KEY);
  sessionStorage.removeItem(VIDEO_FILENAME_KEY);
  sessionStorage.removeItem(RENDER_META_KEY);
}

export function clearProject(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOPIC_KEY);
  localStorage.removeItem(SCRIPT_KEY);
  localStorage.removeItem(PROJECT_KEY);
  localStorage.removeItem(MODE_KEY);
  clearVideoBlobUrl();
}
