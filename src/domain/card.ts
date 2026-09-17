import { z } from "zod";

export const CardTypeSchema = z.enum([
  "phrasal-verb",
  "collocation",
  "preposition",
  "idiom",
]);

export type CardType = z.infer<typeof CardTypeSchema>;

export const CardSchema = z.object({
  expression: z.string().min(1),
  type: CardTypeSchema,
  level: z.string().default("B1-B2"),
  meaningEs: z.string().min(1),
  exampleEn: z.string().min(1),
  translationEs: z.string().min(1).optional(),
  category: z.string().min(1),
  sourceFile: z.string().min(1),
});

export type Card = z.infer<typeof CardSchema>;
