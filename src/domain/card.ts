import { z } from "zod";

export const CardTypeSchema = z.enum([
  "phrasal-verb",
  "collocation",
  "preposition",
  "idiom",
  "irregular-verb",
  "everyday-phrase",
  "connector",
]);

export type CardType = z.infer<typeof CardTypeSchema>;

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  "phrasal-verb": "Phrasal verbs",
  collocation: "Collocations",
  preposition: "Prepositions",
  idiom: "Idioms & Expressions",
  "irregular-verb": "Irregular Verbs",
  "everyday-phrase": "Everyday Phrases",
  connector: "Connectors",
};

export const CardSchema = z
  .object({
    expression: z.string().min(1),
    type: CardTypeSchema,
    level: z.string().default("B1-B2"),
    meaningEn: z.string().min(1),
    meaningEs: z.string().min(1),
    exampleEn: z.string().min(1),
    translationEs: z.string().min(1),
    category: z.string().min(1),
    sourceFile: z.string().min(1),
    contextEn: z.string().min(1),
    contextSource: z.string().min(1).optional(),
    pastSimple: z.string().min(1).optional(),
    pastParticiple: z.string().min(1).optional(),
  })
  .superRefine((card, ctx) => {
    if (card.type === "irregular-verb") {
      if (card.pastSimple === undefined) {
        ctx.addIssue({ code: "custom", message: "irregular-verb sin pastSimple" });
      }
      if (card.pastParticiple === undefined) {
        ctx.addIssue({ code: "custom", message: "irregular-verb sin pastParticiple" });
      }
    }
  });

export type Card = z.infer<typeof CardSchema>;
