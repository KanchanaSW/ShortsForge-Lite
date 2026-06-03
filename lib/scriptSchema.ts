import { z } from "zod";
import { MAX_DURATION_SECONDS } from "@/lib/types";

export const sceneSchema = z.object({
  text: z.string().min(1).max(200),
  duration: z.number().min(1).max(15),
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

export const generateScriptRequestSchema = z.object({
  topic: z.string().min(1).max(500),
  style: z.enum(["motivational", "facts", "storytelling"]).optional(),
});

export type GenerateScriptRequest = z.infer<typeof generateScriptRequestSchema>;
