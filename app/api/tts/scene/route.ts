import { NextResponse } from "next/server";
import {
  TtsError,
  checkEdgeTtsAvailable,
  generateSceneAudio,
} from "@/lib/tts/edgeTTS";
import { generateSceneTtsSchema } from "@/lib/tts/ttsSchema";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = generateSceneTtsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request.", code: "INVALID_TEXT" },
        { status: 422 }
      );
    }

    const { available } = await checkEdgeTtsAvailable();
    if (!available) {
      return NextResponse.json(
        {
          error: "edge-tts is not installed or not on PATH.",
          code: "CLI_NOT_FOUND",
        },
        { status: 503 }
      );
    }

    const { index, text } = parsed.data;
    const result = await generateSceneAudio(text, index);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof TtsError) {
      const status =
        error.code === "CLI_NOT_FOUND"
          ? 503
          : error.code === "INVALID_TEXT"
            ? 422
            : 502;
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status }
      );
    }

    const message =
      error instanceof Error ? error.message : "Voice generation failed.";
    return NextResponse.json(
      { error: message, code: "GENERATION_FAILED" },
      { status: 502 }
    );
  }
}
