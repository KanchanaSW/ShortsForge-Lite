import { NextResponse } from "next/server";
import { getStockVideoUrl } from "@/lib/pexels";
import { stockVideoRequestSchema } from "@/lib/scriptSchema";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = stockVideoRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  if (!process.env.PEXELS_API_KEY?.trim()) {
    return NextResponse.json(
      { error: "Stock video not configured" },
      { status: 503 }
    );
  }

  const videoUrl = await getStockVideoUrl(
    parsed.data.query,
    parsed.data.pickIndex ?? 0,
    parsed.data.orientation ?? "portrait"
  );
  if (!videoUrl) {
    return NextResponse.json(
      { error: "No video found for this query" },
      { status: 404 }
    );
  }

  return NextResponse.json({ videoUrl });
}
