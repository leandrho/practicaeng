import { z } from "zod";

export const WordFormationTargetSchema = z.enum(["noun", "adjective", "adverb"]);

export type WordFormationTarget = z.infer<typeof WordFormationTargetSchema>;

function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function countGaps(sentence: string): { runs: string[] } {
  return { runs: sentence.match(/_+/g) ?? [] };
}

export const WordFormationExerciseSchema = z
  .object({
    target: WordFormationTargetSchema,
    sentenceEn: z.string().min(1),
    acceptedAnswers: z.array(z.string().min(1)).min(1),
  })
  .superRefine((exercise, ctx) => {
    const { runs } = countGaps(exercise.sentenceEn);
    if (runs.length !== 1 || runs[0] !== "____") {
      ctx.addIssue({
        code: "custom",
        message: "sentenceEn debe contener exactamente una aparición de ____",
      });
    }

    const seen = new Set<string>();
    for (const answer of exercise.acceptedAnswers) {
      if (answer.trim() === "") {
        ctx.addIssue({ code: "custom", message: "respuesta aceptada vacía" });
        continue;
      }
      const normalized = normalizeAnswer(answer);
      if (seen.has(normalized)) {
        ctx.addIssue({
          code: "custom",
          message: `respuesta duplicada: ${answer}`,
        });
      }
      seen.add(normalized);
    }
  });

export type WordFormationExercise = z.infer<typeof WordFormationExerciseSchema>;

function splitVariants(value: string | undefined): string[] {
  if (value === undefined) {
    return [];
  }
  return value
    .split("/")
    .map((part) => part.trim())
    .filter((part) => part !== "");
}

export const WordFamilySchema = z
  .object({
    base: z.string().min(1),
    level: z.string().default("B1-B2"),
    category: z.string().min(1),
    noun: z.string().min(1).optional(),
    adjective: z.string().min(1).optional(),
    adverb: z.string().min(1).optional(),
    meaningHintEn: z.string().min(1),
    meaningHint: z.string().min(1),
    contextEn: z.string().min(1),
    contextSource: z.string().min(1).optional(),
    examples: z.array(z.string()).default([]),
    exercise: WordFormationExerciseSchema,
  })
  .refine((v) => v.noun !== undefined || v.adjective !== undefined || v.adverb !== undefined, {
    message: "WordFamily debe tener al menos 1 forma (noun/adjective/adverb)",
  })
  .superRefine((family, ctx) => {
    const targetField = family.exercise.target;
    const targetValue = family[targetField];
    if (targetValue === undefined) {
      ctx.addIssue({
        code: "custom",
        message: `objetivo inexistente en la familia: ${targetField}`,
      });
      return;
    }

    const variants = new Set(splitVariants(targetValue).map(normalizeAnswer));
    for (const answer of family.exercise.acceptedAnswers) {
      if (!variants.has(normalizeAnswer(answer))) {
        ctx.addIssue({
          code: "custom",
          message: `respuesta no presente en la categoría ${targetField}: ${answer}`,
        });
      }
    }
  });

export type WordFamily = z.infer<typeof WordFamilySchema>;

export const GapFillSchema = z.object({
  prompt: z.string().min(1),
  base: z.string().min(1),
  answer: z.string().min(1),
});

export type GapFill = z.infer<typeof GapFillSchema>;
