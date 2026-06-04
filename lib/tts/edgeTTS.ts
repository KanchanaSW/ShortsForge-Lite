import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import { getTextHash8, normalizeTtsText } from "@/lib/tts/textHash";
import { DEFAULT_VOICE, getVoiceForScene } from "@/lib/tts/voices";

export type TtsErrorCode =
  | "CLI_NOT_FOUND"
  | "TIMEOUT"
  | "GENERATION_FAILED"
  | "INVALID_TEXT";

export class TtsError extends Error {
  code: TtsErrorCode;

  constructor(code: TtsErrorCode, message: string) {
    super(message);
    this.name = "TtsError";
    this.code = code;
  }
}

const MAX_TEXT_LENGTH = 500;
const TTS_TIMEOUT_MS = 60_000;
const AUDIO_DIR = path.join(process.cwd(), "public", "audio");

export const INSTALL_HINT =
  "On macOS: brew install pipx && pipx install edge-tts && pipx ensurepath (then restart the terminal). Or use a project venv — see README.";

export function getSceneAudioFilename(
  index: number,
  text: string,
  voice: string = DEFAULT_VOICE
): string {
  const voiceKey = voice.replace(/[^a-z0-9]/gi, "").slice(-12).toLowerCase();
  return `scene-${index}-${getTextHash8(text)}-${voiceKey}.mp3`;
}

export function getSceneAudioFilenameById(
  sceneId: string,
  text: string,
  voice: string = DEFAULT_VOICE
): string {
  const voiceKey = voice.replace(/[^a-z0-9]/gi, "").slice(-12).toLowerCase();
  const idKey = sceneId.replace(/[^a-z0-9]/gi, "").slice(0, 12).toLowerCase();
  return `scene-${idKey}-${getTextHash8(text)}-${voiceKey}.mp3`;
}

export function getPublicAudioPath(filename: string): string {
  return `/audio/${filename}`;
}

function getAbsoluteAudioPath(filename: string): string {
  return path.join(AUDIO_DIR, filename);
}

export async function ensureAudioDir(): Promise<void> {
  await fs.mkdir(AUDIO_DIR, { recursive: true });
}

let resolvedEdgeTtsCommand: string | null | undefined;

function getEdgeTtsCandidates(): string[] {
  const candidates: string[] = [];

  const fromEnv = process.env.EDGE_TTS_PATH?.trim();
  if (fromEnv) candidates.push(fromEnv);

  candidates.push("edge-tts");

  const home = process.env.HOME;
  if (home) {
    candidates.push(path.join(home, ".local", "bin", "edge-tts"));
  }

  if (process.platform === "darwin") {
    candidates.push("/opt/homebrew/bin/edge-tts");
    candidates.push("/usr/local/bin/edge-tts");
  }

  candidates.push(path.join(process.cwd(), ".venv", "bin", "edge-tts"));

  return [...new Set(candidates)];
}

function spawnVersionCheck(command: string): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn(command, ["--version"], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      resolve(ok);
    };

    const timer = setTimeout(() => {
      child.kill();
      finish(false);
    }, 10_000);

    child.on("error", () => {
      clearTimeout(timer);
      finish(false);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      finish(code === 0);
    });
  });
}

export async function resolveEdgeTtsCommand(): Promise<string | null> {
  if (resolvedEdgeTtsCommand !== undefined) {
    return resolvedEdgeTtsCommand;
  }

  for (const command of getEdgeTtsCandidates()) {
    if (await spawnVersionCheck(command)) {
      resolvedEdgeTtsCommand = command;
      return command;
    }
  }

  resolvedEdgeTtsCommand = null;
  return null;
}

export async function checkEdgeTtsAvailable(): Promise<{
  available: boolean;
  error?: string;
}> {
  const command = await resolveEdgeTtsCommand();
  if (command) {
    return { available: true };
  }
  return {
    available: false,
    error: "edge-tts not found on PATH or common install locations",
  };
}

function runEdgeTts(
  command: string,
  text: string,
  outputPath: string,
  voice: string,
  rate?: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      "--text",
      text,
      "--write-media",
      outputPath,
      "--voice",
      voice,
    ];
    if (rate) {
      args.push("--rate", rate);
    }

    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stderr = "";
    let stdout = "";
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    const timer = setTimeout(() => {
      child.kill();
      reject(new TtsError("TIMEOUT", "Voice generation timed out"));
    }, TTS_TIMEOUT_MS);

    child.on("error", (err) => {
      clearTimeout(timer);
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        reject(new TtsError("CLI_NOT_FOUND", INSTALL_HINT));
      } else {
        reject(
          new TtsError("GENERATION_FAILED", err.message || "Failed to run edge-tts")
        );
      }
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve();
      } else {
        const detail =
          stderr.trim() ||
          stdout.trim() ||
          `edge-tts exited with code ${code}`;
        reject(new TtsError("GENERATION_FAILED", detail));
      }
    });
  });
}

export type GenerateSceneAudioOptions = {
  voice?: string;
  sceneId?: string;
};

export type GenerateSceneAudioResult = {
  audioPath: string;
  cached: boolean;
};

export async function generateSceneAudio(
  text: string,
  index: number,
  options?: GenerateSceneAudioOptions
): Promise<GenerateSceneAudioResult> {
  const normalized = normalizeTtsText(text);
  if (!normalized) {
    throw new TtsError("INVALID_TEXT", "Scene text is empty.");
  }

  const truncated =
    normalized.length > MAX_TEXT_LENGTH
      ? normalized.slice(0, MAX_TEXT_LENGTH)
      : normalized;

  const voice = options?.voice ?? getVoiceForScene();

  await ensureAudioDir();

  const filename = options?.sceneId
    ? getSceneAudioFilenameById(options.sceneId, truncated, voice)
    : getSceneAudioFilename(index, truncated, voice);
  const absolutePath = getAbsoluteAudioPath(filename);
  const publicPath = getPublicAudioPath(filename);

  try {
    const stat = await fs.stat(absolutePath);
    if (stat.size > 0) {
      return { audioPath: publicPath, cached: true };
    }
  } catch {
    // file missing — generate
  }

  const command = await resolveEdgeTtsCommand();
  if (!command) {
    throw new TtsError("CLI_NOT_FOUND", INSTALL_HINT);
  }

  try {
    await runEdgeTts(command, truncated, absolutePath, voice);
  } catch (firstError) {
    if (!(firstError instanceof TtsError) || firstError.code !== "GENERATION_FAILED") {
      throw firstError;
    }
    await runEdgeTts(command, truncated, absolutePath, DEFAULT_VOICE);
  }

  try {
    const stat = await fs.stat(absolutePath);
    if (stat.size === 0) {
      await fs.unlink(absolutePath).catch(() => {});
      throw new TtsError("GENERATION_FAILED", "Generated audio file is empty.");
    }
  } catch (err) {
    if (err instanceof TtsError) throw err;
    throw new TtsError("GENERATION_FAILED", "Audio file was not created.");
  }

  return { audioPath: publicPath, cached: false };
}
