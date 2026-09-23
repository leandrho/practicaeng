import { z } from "zod";

const nonemptyText = z.string().trim().min(1);

export const GrammarExerciseSchema = z.object({
  promptEn: nonemptyText,
  modelEn: nonemptyText,
  explanationEs: nonemptyText,
  translationEs: nonemptyText,
});

export const GrammarTopicSchema = z.object({
  part: z.literal([1, 2, 3, 4, 5, 6, 7, 8]),
  slug: nonemptyText,
  title: nonemptyText,
  ruleEs: nonemptyText,
  usesEs: nonemptyText,
  contrastsEs: nonemptyText,
  examples: z.array(z.object({
    exampleEn: nonemptyText,
    translationEs: nonemptyText,
  })).min(2),
  exercises: z.array(GrammarExerciseSchema).min(5),
});

export type GrammarExercise = z.infer<typeof GrammarExerciseSchema>;
export type GrammarTopic = z.infer<typeof GrammarTopicSchema>;
