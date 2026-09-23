import { z } from "zod";

const nonemptyText = z.string().trim().min(1);

export const GrammarExerciseSchema = z.object({
  promptEn: nonemptyText,
  modelEn: nonemptyText,
  explanationEs: nonemptyText,
  translationEs: nonemptyText,
});

export const FORMATION_LABELS = [
  "Affirmative", "Negative", "Question", "Pattern",
  "Result", "Condition", "Main clause", "Time clause",
] as const;

export const GrammarFormationPatternSchema = z.object({
  label: z.enum(FORMATION_LABELS).optional(),
  pattern: nonemptyText,
});

export const GrammarFormationSchema = z.object({
  name: nonemptyText,
  patterns: z.array(GrammarFormationPatternSchema).min(1),
});

export const GrammarTopicSchema = z.object({
  part: z.literal([1, 2, 3, 4, 5, 6, 7, 8]),
  slug: nonemptyText,
  title: nonemptyText,
  ruleEn: nonemptyText,
  ruleEs: nonemptyText,
  formations: z.array(GrammarFormationSchema).min(1),
  usesEn: nonemptyText,
  usesEs: nonemptyText,
  contrastsEn: nonemptyText,
  contrastsEs: nonemptyText,
  examples: z.array(z.object({
    exampleEn: nonemptyText,
    translationEs: nonemptyText,
  })).min(2),
  exercises: z.array(GrammarExerciseSchema).min(5),
});

export type GrammarExercise = z.infer<typeof GrammarExerciseSchema>;
export type FormationLabel = (typeof FORMATION_LABELS)[number];
export type GrammarFormationPattern = z.infer<typeof GrammarFormationPatternSchema>;
export type GrammarFormation = z.infer<typeof GrammarFormationSchema>;
export type GrammarTopic = z.infer<typeof GrammarTopicSchema>;
