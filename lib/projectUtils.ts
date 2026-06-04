import { generateId } from "@/lib/id";
import { normalizeScene } from "@/lib/normalizeScene";
import { DEFAULT_SCENE_VISUALS, type Chapter, type Project, type Scene, type ShortScript, type VideoMode } from "@/lib/types";

export { generateId } from "@/lib/id";

export function createEmptyScene(overrides?: Partial<Scene>): Scene {
  return {
    id: generateId(),
    text: "New scene",
    duration: 3,
    ...DEFAULT_SCENE_VISUALS,
    ...overrides,
  };
}

export function createEmptyChapter(title = "New Chapter"): Chapter {
  return {
    id: generateId(),
    title,
    scenes: [createEmptyScene()],
  };
}

export function createEmptyProject(mode: VideoMode = "short"): Project {
  return {
    title: "",
    mode,
    chapters: [
      {
        id: generateId(),
        title: mode === "short" ? "Main" : "Introduction",
        scenes: [],
      },
    ],
    ...(mode === "long"
      ? {
          targetDuration: 5 as const,
          contentStyle: "educational" as const,
          showTableOfContents: false,
        }
      : {}),
  };
}

export function flattenScenes(project: Project): Scene[] {
  return project.chapters.flatMap((chapter) => chapter.scenes);
}

export function getSceneCount(project: Project): number {
  return flattenScenes(project).length;
}

export function getChapterCount(project: Project): number {
  return project.chapters.length;
}

export function getRawTotalDurationSeconds(scenes: Scene[]): number {
  return scenes.reduce((sum, scene) => sum + scene.duration, 0);
}

export function fromLegacyScript(legacy: ShortScript): Project {
  return {
    title: legacy.title,
    mode: "short",
    chapters: [
      {
        id: generateId(),
        title: "Main",
        scenes: legacy.scenes.map((scene) =>
          normalizeScene({
            ...scene,
            id: scene.id ?? generateId(),
          })
        ),
      },
    ],
  };
}

export function toLegacyScript(project: Project): ShortScript {
  return {
    title: project.title,
    scenes: flattenScenes(project),
  };
}

export function ensureSceneIds(scenes: Scene[]): Scene[] {
  return scenes.map((scene) => ({
    ...scene,
    id: scene.id || generateId(),
  }));
}

export function ensureChapterIds(chapters: Chapter[]): Chapter[] {
  return chapters.map((chapter) => ({
    ...chapter,
    id: chapter.id || generateId(),
    scenes: ensureSceneIds(chapter.scenes),
  }));
}

export function normalizeProject(partial: Partial<Project> & { title: string; mode: VideoMode; chapters: Chapter[] }): Project {
  return {
    title: partial.title,
    mode: partial.mode,
    chapters: ensureChapterIds(
      partial.chapters.map((chapter) => ({
        ...chapter,
        scenes: chapter.scenes.map((scene) =>
          normalizeScene({
            ...scene,
            id: scene.id || generateId(),
          })
        ),
      }))
    ),
    targetDuration: partial.targetDuration,
    contentStyle: partial.contentStyle,
    showTableOfContents: partial.showTableOfContents,
  };
}

export function updateProjectScenes(
  project: Project,
  updater: (scenes: Scene[]) => Scene[]
): Project {
  const flat = flattenScenes(project);
  const updated = updater(flat);
  let index = 0;
  return {
    ...project,
    chapters: project.chapters.map((chapter) => ({
      ...chapter,
      scenes: chapter.scenes.map(() => {
        const scene = updated[index];
        index += 1;
        return scene;
      }),
    })),
  };
}

export function allScenesHaveAudio(project: Project): boolean {
  const scenes = flattenScenes(project);
  if (scenes.length === 0) return false;
  return scenes.every((s) => s.audioStatus === "ready" && Boolean(s.audioPath));
}
