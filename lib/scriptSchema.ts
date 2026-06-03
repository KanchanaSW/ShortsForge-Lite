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

export const sceneSchema = z.object({
  text: z.string().min(1).max(320),
  duration: z.number().min(1).max(15),
  mood: sceneMoodSchema,
  visualQuery: z.string().min(2).max(80),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export const shortScriptSchema = z
  .object({
    title: z.string().min(1).max(100),
    scenes: z.array(sceneSchema).min(5).max(12),
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
});

export const generateScriptRequestSchema = z.object({
  topic: z.string().min(1).max(500),
  style: z.enum(["motivational", "facts", "storytelling"]).optional(),
});

export type GenerateScriptRequest = z.infer<typeof generateScriptRequestSchema>;
