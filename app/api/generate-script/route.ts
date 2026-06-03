import { NextResponse } from "next/server";
import { generateScript } from "@/lib/groq";
import { generateScriptRequestSchema } from "@/lib/scriptSchema";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = generateScriptRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Topic is required." },
        { status: 400 }
      );
    }

    const script = await generateScript(parsed.data.topic, parsed.data.style);
    return NextResponse.json(script);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Script generation failed.";

    if (message.includes("GROQ_API_KEY")) {
      return NextResponse.json(
        { error: "Server not configured. Add GROQ_API_KEY to .env.local." },
        { status: 500 }
      );
    }

    if (message.includes("invalid script")) {
      return NextResponse.json({ error: message }, { status: 422 });
    }

    return NextResponse.json(
      { error: "Script generation failed. Check your API key and try again." },
      { status: 502 }
    );
  }
}
