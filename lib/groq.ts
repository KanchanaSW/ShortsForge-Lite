import { createGroqClient } from "@/lib/groqClient";
import { shortScriptSchema } from "@/lib/scriptSchema";
import type { ScriptStyle, ShortScript } from "@/lib/types";

const STYLE_HINTS: Record<ScriptStyle, string> = {
  motivational: "Use an inspiring, high-energy tone with bold calls to action.",
  facts: "Use a curious, mind-blowing facts tone with surprising revelations.",
  storytelling: "Use a narrative arc with tension, conflict, and a satisfying payoff.",
};

function buildStorytellingRequirements(): string {
  return `- Prefer 8 to 12 scenes for a full narrative arc
- Each scene: richer narration (~20–28 words per scene), still readable on mobile
- Each scene duration between 3 and 5 seconds
- Sum of all scene durations MUST be 60 seconds or less
- Three-act structure across scenes: setup (early scenes) → conflict (middle) → payoff (final scenes)
- Every visualQuery MUST be unique across all scenes (no duplicates)
- Each visualQuery must match that scene's story beat (concrete nouns tied to the moment)`;
}

function buildDefaultRequirements(): string {
  return `- Short viral sentences (max ~15 words per scene)
- 5 to 12 scenes
- Each scene duration between 2 and 5 seconds
- Total video under 60 seconds
- Second scene must escalate tension from the hook`;
}

function buildPrompt(topic: string, style?: ScriptStyle): string {
  const styleHint = style ? STYLE_HINTS[style] : "Use an engaging viral YouTube Shorts tone.";
  const isStorytelling = style === "storytelling";
  const pacingRules = isStorytelling
    ? buildStorytellingRequirements()
    : buildDefaultRequirements();

  return `You are a viral YouTube Shorts script writer.
Return JSON ONLY.

Requirements:
- Hook in first 2–3 seconds (first scene must grab attention immediately)
- High retention pacing
- Engaging tone
- No explanations outside the JSON
${pacingRules}
- ${styleHint}

Per-scene visuals (required for every scene):
- mood must match the sentence emotion: energetic | calm | dramatic | mysterious | uplifting | intense
- visualQuery: 2–5 word concrete stock-video search phrase (nouns, visual, no abstract words like "success" or "hope")
- accentColor: hex #RRGGBB that harmonizes with mood; vary colors across scenes for story arc
- Scene 1 = strongest hook visual (most eye-catching visualQuery)
- All scenes must feel like one coherent story tied to the topic, not random unrelated clips

Topic: ${topic}

Output format:
{
  "title": "string",
  "scenes": [
    {
      "text": "string",
      "duration": number,
      "mood": "energetic|calm|dramatic|mysterious|uplifting|intense",
      "visualQuery": "string",
      "accentColor": "#RRGGBB"
    }
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
