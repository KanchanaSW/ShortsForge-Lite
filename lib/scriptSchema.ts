import { z } from "zod";
import { MAX_DURATION_SECONDS } from "@/lib/types";

const sceneMoodSchema = z.enum([
  "energetic",
  "calm",
  "dramatic",
  "mysterious",
  "uplifting",
  "intense",
]);

export const aiSceneSchema = z.object({
  text: z.string().min(1).max(320),
  duration: z.number().min(1).max(120),
  mood: sceneMoodSchema,
  visualQuery: z.string().min(2).max(80),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  heading: z.string().max(100).optional(),
});

export const shortSceneSchema = aiSceneSchema.extend({
  duration: z.number().min(1).max(15),
});

export const longSceneSchema = aiSceneSchema.extend({
  duration: z.number().min(3).max(120),
});

export const aiChapterSchema = z.object({
  title: z.string().min(1).max(100),
  scenes: z.array(aiSceneSchema).min(1),
});

export const shortChapterSchema = z.object({
  title: z.string().min(1).max(100),
  scenes: z.array(shortSceneSchema).min(5).max(12),
});

export const longChapterSchema = z.object({
  title: z.string().min(1).max(100),
  scenes: z.array(longSceneSchema).min(2).max(15),
});

export const shortProjectSchema = z
  .object({
    title: z.string().min(1).max(100),
    mode: z.literal("short"),
    chapters: z.array(shortChapterSchema).length(1),
  })
  .refine(
    (data) => {
      const total = data.chapters[0].scenes.reduce((sum, s) => sum + s.duration, 0);
      return total <= MAX_DURATION_SECONDS;
    },
    { message: `Total duration must not exceed ${MAX_DURATION_SECONDS} seconds` }
  );

export const longProjectSchema = z.object({
  title: z.string().min(1).max(100),
  mode: z.literal("long"),
  chapters: z.array(longChapterSchema).length(7),
});

/** @deprecated Use shortProjectSchema */
export const sceneSchema = shortSceneSchema;

/** @deprecated Use shortProjectSchema */
export const shortScriptSchema = z
  .object({
    title: z.string().min(1).max(100),
    scenes: z.array(shortSceneSchema).min(5).max(12),
  })
  .refine(
    (data) => {
      const total = data.scenes.reduce((sum, s) => sum + s.duration, 0);
      return total <= MAX_DURATION_SECONDS;
    },
    { message: `Total duration must not exceed ${MAX_DURATION_SECONDS} seconds` }
  );

export const stockVideoRequestSchema = z.object({
  query: z.string().min(2).max(80),
  pickIndex: z.number().int().min(0).max(99).optional(),
  orientation: z.enum(["portrait", "landscape"]).optional(),
});

export const generateScriptRequestSchema = z.discriminatedUnion("mode", [
  z.object({
    topic: z.string().min(1).max(500),
    mode: z.literal("short"),
    style: z.enum(["motivational", "facts", "storytelling"]).optional(),
  }),
  z.object({
    topic: z.string().min(1).max(500),
    mode: z.literal("long"),
    targetDuration: z.union([
      z.literal(3),
      z.literal(5),
      z.literal(10),
      z.literal(15),
      z.literal(20),
    ]),
    contentStyle: z.enum([
      "educational",
      "documentary",
      "storytelling",
      "motivational",
      "explainer",
    ]),
    showTableOfContents: z.boolean().optional(),
  }),
]);

export type GenerateScriptRequest = z.infer<typeof generateScriptRequestSchema>;
