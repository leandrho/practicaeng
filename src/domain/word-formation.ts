import { z } from "zod";

export const WordFamilySchema = z
  .object({
    base: z.string().min(1),
    noun: z.string().min(1).optional(),
    adjective: z.string().min(1).optional(),
    adverb: z.string().min(1).optional(),
    meaningHint: z.string().min(1).optional(),
    examples: z.array(z.string()).default([]),
  })
  .refine((v) => v.noun !== undefined || v.adjective !== undefined || v.adverb !== undefined, {
    message: "WordFamily debe tener al menos 1 forma (noun/adjective/adverb)",
  });

export type WordFamily = z.infer<typeof WordFamilySchema>;

export const GapFillSchema = z.object({
  prompt: z.string().min(1),
  base: z.string().min(1),
  answer: z.string().min(1),
});

export type GapFill = z.infer<typeof GapFillSchema>;
