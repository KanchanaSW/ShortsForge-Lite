import { z } from "zod";

export const generateSceneTtsSchema = z.object({
  index: z.number().int().min(0).max(999),
  text: z.string().min(1).max(2000),
  sceneId: z.string().min(1).max(100).optional(),
});
