import { createGroqClient } from "@/lib/groqClient";
import { shortScriptSchema } from "@/lib/scriptSchema";
import type { ScriptStyle, ShortScript } from "@/lib/types";

const STYLE_HINTS: Record<ScriptStyle, string> = {
  motivational: "Use an inspiring, high-energy tone with bold calls to action.",
  facts: "Use a curious, mind-blowing facts tone with surprising revelations.",
  storytelling: "Use a narrative arc with tension, conflict, and a satisfying payoff.",
};

function buildPrompt(topic: string, style?: ScriptStyle): string {
  const styleHint = style ? STYLE_HINTS[style] : "Use an engaging viral YouTube Shorts tone.";

  return `You are a viral YouTube Shorts script writer.
Return JSON ONLY.

Requirements:
- Hook in first 2–3 seconds (first scene must grab attention immediately)
- Short viral sentences (max ~15 words per scene)
- High retention pacing
- Engaging tone
- No explanations outside the JSON
- 5 to 12 scenes
- Each scene duration between 2 and 5 seconds
- Total video under 60 seconds
- ${styleHint}

Topic: ${topic}

Output format:
{
  "title": "string",
  "scenes": [
    { "text": "string", "duration": number }
  ]
}`;
}

function parseJsonResponse(raw: string): unknown {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON object found in response");
  }
  return JSON.parse(jsonMatch[0]);
}

export async function generateScript(
  topic: string,
  style?: ScriptStyle
): Promise<ShortScript> {
  const client = createGroqClient();

  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "user",
        content: buildPrompt(topic, style),
      },
    ],
    temperature: 0.8,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from Groq");
  }

  let parsed: unknown;
  try {
    parsed = parseJsonResponse(content);
  } catch {
    throw new Error("AI returned an invalid script. Please retry.");
  }

  const result = shortScriptSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error("AI returned an invalid script. Please retry.");
  }

  return result.data;
}
