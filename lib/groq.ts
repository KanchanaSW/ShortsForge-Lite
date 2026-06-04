import { createGroqClient } from "@/lib/groqClient";
import { generateId } from "@/lib/id";
import { longProjectSchema, shortProjectSchema, type GenerateScriptRequest } from "@/lib/scriptSchema";
import type {
  LongContentStyle,
  Project,
  ScriptStyle,
  TargetDuration,
} from "@/lib/types";

const STYLE_HINTS: Record<ScriptStyle, string> = {
  motivational: "Use an inspiring, high-energy tone with bold calls to action.",
  facts: "Use a curious, mind-blowing facts tone with surprising revelations.",
  storytelling: "Use a narrative arc with tension, conflict, and a satisfying payoff.",
};

const LONG_STYLE_HINTS: Record<LongContentStyle, string> = {
  educational: "Use a clear, structured educational tone with teachable moments.",
  documentary: "Use a cinematic documentary tone with factual depth and narrative gravitas.",
  storytelling: "Use a compelling narrative arc with characters, tension, and resolution.",
  motivational: "Use an inspiring, uplifting tone with powerful calls to action.",
  explainer: "Use a friendly explainer tone that breaks down complex ideas simply.",
};

const LONG_CHAPTER_TITLES = [
  "Introduction",
  "Main Topic Part 1",
  "Main Topic Part 2",
  "Main Topic Part 3",
  "Main Topic Part 4",
  "Conclusion",
  "Call To Action",
];

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
- 6 to 12 scenes
- Each scene duration between 2 and 5 seconds
- Total video under 60 seconds
- Second scene must escalate tension from the hook`;
}

function buildShortPrompt(topic: string, style?: ScriptStyle): string {
  const styleHint = style ? STYLE_HINTS[style] : "Use an engaging viral YouTube Shorts tone.";
  const isStorytelling = style === "storytelling";
  const pacingRules = isStorytelling
    ? buildStorytellingRequirements()
    : buildDefaultRequirements();

  return `You are a viral YouTube Shorts script writer.
Return JSON ONLY.

Requirements:
- Open scene 1 naturally — engaging but not clickbait; avoid "Wait for it", "You won't believe", or meta hook phrases
- High retention pacing
- Engaging tone
- No explanations outside the JSON
${pacingRules}
- ${styleHint}
- Scene text is spoken narration only — never titles, labels, or chapter names

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
  "mode": "short",
  "chapters": [
    {
      "title": "Main",
      "scenes": [
        {
          "text": "string",
          "duration": number,
          "mood": "energetic|calm|dramatic|mysterious|uplifting|intense",
          "visualQuery": "string",
          "accentColor": "#RRGGBB"
        }
      ]
    }
  ]
}`;
}

function buildLongPrompt(
  topic: string,
  targetDuration: TargetDuration,
  contentStyle: LongContentStyle
): string {
  const totalSeconds = targetDuration * 60;
  const styleHint = LONG_STYLE_HINTS[contentStyle];
  const scenesPerChapter = Math.max(3, Math.round(totalSeconds / 7 / 6));

  return `You are a professional YouTube long-form video script writer.
Return JSON ONLY.

Requirements:
- Target total duration: approximately ${targetDuration} minutes (${totalSeconds} seconds)
- Exactly 7 chapters with these titles in order:
  1. Introduction
  2. Main Topic Part 1
  3. Main Topic Part 2
  4. Main Topic Part 3
  5. Main Topic Part 4
  6. Conclusion
  7. Call To Action
- Each chapter: ${scenesPerChapter} to ${scenesPerChapter + 3} scenes
- Scene duration: 5 to 12 seconds each
- Sum of all scene durations should be close to ${totalSeconds} seconds
- ${styleHint}
- Natural documentary pacing — conversational, not salesy or clickbait
- Introduction opens gently into the topic; no separate hook, no "In this video", no rhetorical questions to the viewer
- Scene text is spoken narration only — never chapter titles, labels, or meta phrases like "Hook" or "Introduction"
- Do NOT include heading fields on scenes
- CTA chapter must have clear call to action

Per-scene visuals (required for every scene):
- mood: energetic | calm | dramatic | mysterious | uplifting | intense
- visualQuery: 2–5 word concrete stock-video search phrase (landscape-friendly visuals)
- accentColor: hex #RRGGBB harmonizing with mood

Topic: ${topic}

Output format:
{
  "title": "string",
  "mode": "long",
  "chapters": [
    {
      "title": "Introduction",
      "scenes": [
        {
          "text": "string",
          "duration": number,
          "mood": "energetic|calm|dramatic|mysterious|uplifting|intense",
          "visualQuery": "string",
          "accentColor": "#RRGGBB"
        }
      ]
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

function assignIdsToProject(
  data: {
    title: string;
    mode: "short" | "long";
    chapters: Array<{
      title: string;
      scenes: Array<{
        text: string;
        duration: number;
        mood: string;
        visualQuery: string;
        accentColor: string;
        heading?: string;
      }>;
    }>;
  }
): Project {
  return {
    title: data.title,
    mode: data.mode,
    chapters: data.chapters.map((chapter) => ({
      id: generateId(),
      title: chapter.title,
      scenes: chapter.scenes.map((scene) => ({
        id: generateId(),
        text: scene.text,
        duration: scene.duration,
        mood: scene.mood as Project["chapters"][0]["scenes"][0]["mood"],
        visualQuery: scene.visualQuery,
        accentColor: scene.accentColor,
      })),
    })),
  };
}

async function callGroq(prompt: string): Promise<string> {
  const client = createGroqClient();
  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from Groq");
  }
  return content;
}

export async function generateProject(
  request: GenerateScriptRequest
): Promise<Project> {
  const prompt =
    request.mode === "short"
      ? buildShortPrompt(request.topic, request.style)
      : buildLongPrompt(
          request.topic,
          request.targetDuration,
          request.contentStyle
        );

  let content = await callGroq(prompt);
  let parsed: unknown;

  try {
    parsed = parseJsonResponse(content);
  } catch {
    throw new Error("AI returned an invalid script. Please retry.");
  }

  const schema =
    request.mode === "short" ? shortProjectSchema : longProjectSchema;
  let result = schema.safeParse(parsed);

  if (!result.success) {
    const retryPrompt = `${prompt}\n\nIMPORTANT: Your previous response failed validation. Return ONLY valid JSON matching the exact schema. Chapter titles for long-form MUST be exactly: ${LONG_CHAPTER_TITLES.join(", ")}.`;
    content = await callGroq(retryPrompt);
    try {
      parsed = parseJsonResponse(content);
    } catch {
      throw new Error("AI returned an invalid script. Please retry.");
    }
    result = schema.safeParse(parsed);
    if (!result.success) {
      throw new Error("AI returned an invalid script. Please retry.");
    }
  }

  const project = assignIdsToProject(result.data);

  if (request.mode === "long") {
    return {
      ...project,
      targetDuration: request.targetDuration,
      contentStyle: request.contentStyle,
      showTableOfContents: request.showTableOfContents ?? false,
    };
  }

  return project;
}

/** @deprecated Use generateProject */
export async function generateScript(
  topic: string,
  style?: ScriptStyle
): Promise<Project> {
  return generateProject({ topic, mode: "short", style });
}
