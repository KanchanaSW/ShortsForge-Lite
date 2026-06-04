import {
  durationFromAudioSec,
  probeAudioDurationSec,
} from "@/lib/tts/probeAudioDuration";
import { getTextHash8 } from "@/lib/tts/textHashClient";
import type { Project, Scene, VideoMode } from "@/lib/types";

type SceneTtsResponse =
  | { audioPath: string; cached: boolean }
  | { error: string; code: string };

export type VoiceoverProgress = {
  done: number;
  total: number;
  index: number;
  chapterIndex?: number;
  chapterTotal?: number;
  sceneIndex?: number;
  sceneTotal?: number;
};

async function shouldSkipScene(scene: Scene): Promise<boolean> {
  if (scene.audioStatus !== "ready" || !scene.audioPath) return false;
  const hash = await getTextHash8(scene.text);
  return scene.audioPath.includes(hash);
}

async function generateSceneTts(
  scene: Scene,
  globalIndex: number,
  mode: VideoMode,
  signal?: AbortSignal
): Promise<Scene> {
  const text = scene.text.trim();

  if (!text) {
    return { ...scene, audioStatus: "missing" };
  }

  if (await shouldSkipScene(scene)) {
    return scene;
  }

  try {
    const response = await fetch("/api/tts/scene", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        index: globalIndex,
        text,
        sceneId: scene.id,
      }),
      signal,
    });

    const data = (await response.json()) as SceneTtsResponse;

    if (!response.ok || !("audioPath" in data)) {
      return { ...scene, audioStatus: "error" };
    }

    const audioUrl = data.audioPath;
    let duration = scene.duration;

    try {
      const seconds = await probeAudioDurationSec(audioUrl);
      duration = durationFromAudioSec(seconds, mode);
    } catch {
      // keep manual duration if probe fails
    }

    return {
      ...scene,
      audioPath: data.audioPath,
      audioUrl,
      audioStatus: "ready",
      duration,
    };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw err;
    }
    return { ...scene, audioStatus: "error" };
  }
}

export async function generateAllProjectAudio(
  project: Project,
  onProgress: (progress: VoiceoverProgress) => void,
  signal?: AbortSignal
): Promise<Project> {
  const chapterTotal = project.chapters.length;
  const totalScenes = project.chapters.reduce(
    (sum, c) => sum + c.scenes.length,
    0
  );
  let done = 0;
  let globalIndex = 0;

  const updatedChapters = [];

  for (let chapterIndex = 0; chapterIndex < chapterTotal; chapterIndex++) {
    const chapter = project.chapters[chapterIndex];
    const sceneTotal = chapter.scenes.length;
    const updatedScenes: Scene[] = [];

    for (let sceneIndex = 0; sceneIndex < sceneTotal; sceneIndex++) {
      if (signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }

      onProgress({
        done,
        total: totalScenes,
        index: globalIndex,
        chapterIndex: chapterIndex + 1,
        chapterTotal,
        sceneIndex: sceneIndex + 1,
        sceneTotal,
      });

      let scene = chapter.scenes[sceneIndex];

      if (!(await shouldSkipScene(scene))) {
        scene = {
          ...scene,
          audioStatus: "generating",
          audioPath: undefined,
          audioUrl: undefined,
        };
      }

      scene = await generateSceneTts(scene, globalIndex, project.mode, signal);
      updatedScenes.push(scene);

      done += 1;
      globalIndex += 1;
    }

    updatedChapters.push({ ...chapter, scenes: updatedScenes });
  }

  return { ...project, chapters: updatedChapters };
}

/** @deprecated Use generateAllProjectAudio */
export async function generateAllSceneAudio(
  scenes: Scene[],
  onProgress: (progress: VoiceoverProgress) => void,
  signal?: AbortSignal,
  mode: VideoMode = "short"
): Promise<Scene[]> {
  const project: Project = {
    title: "",
    mode,
    chapters: [{ id: "main", title: "Main", scenes }],
  };
  const result = await generateAllProjectAudio(project, onProgress, signal);
  return result.chapters[0]?.scenes ?? scenes;
}
