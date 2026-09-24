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

export const CardTagSchema = z.enum([
  "Formal",
  "Neutral",
  "Informal",
  "Spoken",
  "Written",
  "Spoken & written",
  "Transitive",
  "Intransitive",
  "Separable",
  "Inseparable",
  "+ noun phrase",
  "+ -ing",
  "+ clause",
  "Polite",
  "Work",
  "Academic",
  "Daily life",
]);

export type CardTag = z.infer<typeof CardTagSchema>;

export const CARD_TAGS_BY_TYPE: Readonly<Record<CardType, readonly CardTag[]>> = {
  "phrasal-verb": ["Transitive", "Intransitive", "Separable", "Inseparable"],
  collocation: [
    "Formal",
    "Neutral",
    "Informal",
    "Spoken",
    "Written",
    "Spoken & written",
    "Work",
    "Academic",
    "Daily life",
  ],
  preposition: ["+ noun phrase", "+ -ing", "+ clause"],
  idiom: ["Formal", "Neutral", "Informal", "Spoken", "Written", "Spoken & written"],
  "irregular-verb": [],
  "everyday-phrase": [
    "Formal",
    "Neutral",
    "Informal",
    "Spoken",
    "Written",
    "Spoken & written",
    "Polite",
  ],
  connector: [
    "Formal",
    "Neutral",
    "Informal",
    "Spoken",
    "Written",
    "Spoken & written",
  ],
};

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  "phrasal-verb": "Phrasal verbs",
  collocation: "Collocations",
  preposition: "Prepositions",
  idiom: "Idioms & Expressions",
  "irregular-verb": "Irregular Verbs",
  "everyday-phrase": "Everyday Phrases",
  connector: "Connectors",
};

const CONNECTOR_REGISTER_TAGS = ["Formal", "Neutral", "Informal"] as const;
const CONNECTOR_USAGE_TAGS = ["Spoken", "Written", "Spoken & written"] as const;

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
    tags: z.array(CardTagSchema).default([]),
    pastSimple: z.string().min(1).optional(),
    pastParticiple: z.string().min(1).optional(),
  })
  .superRefine((card, ctx) => {
    const allowedTags = new Set(CARD_TAGS_BY_TYPE[card.type]);
    for (const [index, tag] of card.tags.entries()) {
      if (!allowedTags.has(tag)) {
        ctx.addIssue({
          code: "custom",
          path: ["tags", index],
          message: `tag ${tag} no permitido para ${card.type}`,
        });
      }
    }

    if (card.tags.length !== new Set(card.tags).size) {
      ctx.addIssue({
        code: "custom",
        path: ["tags"],
        message: "tags duplicados",
      });
    }

    if (card.type === "connector") {
      const registerCount = card.tags.filter((tag) =>
        (CONNECTOR_REGISTER_TAGS as readonly string[]).includes(tag),
      ).length;
      const usageCount = card.tags.filter((tag) =>
        (CONNECTOR_USAGE_TAGS as readonly string[]).includes(tag),
      ).length;

      if (registerCount !== 1 || usageCount !== 1 || card.tags.length !== 2) {
        ctx.addIssue({
          code: "custom",
          path: ["tags"],
          message: "connector debe tener exactamente un tag de registro y uno de uso",
        });
      }
    }

    if (card.type === "phrasal-verb") {
      const hasTransitive = card.tags.includes("Transitive");
      const hasIntransitive = card.tags.includes("Intransitive");
      const hasSeparable = card.tags.includes("Separable");
      const hasInseparable = card.tags.includes("Inseparable");

      if (hasTransitive && hasIntransitive) {
        ctx.addIssue({
          code: "custom",
          path: ["tags"],
          message: "phrasal-verb no puede ser Transitive e Intransitive a la vez",
        });
      }

      if (hasSeparable && hasInseparable) {
        ctx.addIssue({
          code: "custom",
          path: ["tags"],
          message: "phrasal-verb no puede ser Separable e Inseparable a la vez",
        });
      }

      if ((hasSeparable || hasInseparable) && !hasTransitive) {
        ctx.addIssue({
          code: "custom",
          path: ["tags"],
          message: "la separabilidad solo se etiqueta para sentidos Transitive",
        });
      }
    }

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
