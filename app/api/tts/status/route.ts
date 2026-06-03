import { NextResponse } from "next/server";
import {
  INSTALL_HINT,
  checkEdgeTtsAvailable,
} from "@/lib/tts/edgeTTS";

export const runtime = "nodejs";

export async function GET() {
  const { available } = await checkEdgeTtsAvailable();
  return NextResponse.json({
    available,
    installHint: INSTALL_HINT,
  });
}
