import { z } from "zod";

export const PRESENT_VERB_TENSE_FORMS = [
  "Present Simple",
  "Present Progressive",
  "Present Perfect Simple",
  "Present Perfect Progressive",
  "Mixed",
] as const;

export const PAST_VERB_TENSE_FORMS = [
  "Past Simple",
  "Past Progressive",
  "Past Perfect Simple",
  "Past Perfect Progressive",
  "Mixed",
] as const;

export const VERB_TENSE_FORMS = [
  "Present Simple",
  "Present Progressive",
  "Present Perfect Simple",
  "Present Perfect Progressive",
  "Past Simple",
  "Past Progressive",
  "Past Perfect Simple",
  "Past Perfect Progressive",
  "Mixed",
] as const;

export type VerbTenseForm = (typeof VERB_TENSE_FORMS)[number];

export const VERB_TENSE_SLUGS = ["present", "past", "future", "conditionals"] as const;

export type VerbTenseSlug = (typeof VERB_TENSE_SLUGS)[number];

export const VERB_TENSE_MIN_TOTAL = 50;
export const VERB_TENSE_MIN_PER_FORM = 10;

const nonemptyText = z.string().trim().min(1);

function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function normalizeVerbTenseAnswer(value: string): string {
  return normalizeAnswer(value);
}

function gapRuns(sentence: string): string[] {
  return sentence.match(/_+/g) ?? [];
}

export const VerbTenseFormSchema = z.enum(VERB_TENSE_FORMS);

export const VerbTenseExerciseSchema = z
  .object({
    form: VerbTenseFormSchema,
    promptEn: nonemptyText,
    sentenceEn: z.string().min(1),
    acceptedAnswers: z.array(z.string().min(1)).min(1),
    modelEn: nonemptyText,
    explanationEs: nonemptyText,
    translationEs: nonemptyText,
    contextEn: z.string().min(1),
    contextSource: z.string().trim().min(1).optional(),
  })
  .superRefine((exercise, ctx) => {
    const runs = gapRuns(exercise.sentenceEn);
    if (runs.length !== 1 || runs[0] !== "____") {
      ctx.addIssue({
        code: "custom",
        path: ["sentenceEn"],
        message: "sentenceEn debe contener exactamente una aparición de ____",
      });
    }

    if (exercise.sentenceEn.includes(" --- ")) {
      ctx.addIssue({
        code: "custom",
        path: ["sentenceEn"],
        message: "sentenceEn no puede contener el separador ---",
      });
    }

    const seen = new Set<string>();
    for (const answer of exercise.acceptedAnswers) {
      if (answer.trim() === "") {
        ctx.addIssue({
          code: "custom",
          path: ["acceptedAnswers"],
          message: "respuesta aceptada vacía",
        });
        continue;
      }
      const normalized = normalizeAnswer(answer);
      if (seen.has(normalized)) {
        ctx.addIssue({
          code: "custom",
          path: ["acceptedAnswers"],
          message: `respuesta duplicada: ${answer}`,
        });
      }
      seen.add(normalized);
    }

    if (exercise.contextEn.includes("---")) {
      ctx.addIssue({
        code: "custom",
        path: ["contextEn"],
        message: "contextEn no puede contener ---",
      });
    }
  });

export type VerbTenseExercise = z.infer<typeof VerbTenseExerciseSchema>;

export const VerbTenseSectionSchema = z.object({
  slug: z.enum(VERB_TENSE_SLUGS),
  title: nonemptyText,
  exercises: z.array(VerbTenseExerciseSchema).min(1),
});

export type VerbTenseSection = z.infer<typeof VerbTenseSectionSchema>;

export const VERB_TENSE_FORMS_BY_SLUG = {
  present: PRESENT_VERB_TENSE_FORMS,
  past: PAST_VERB_TENSE_FORMS,
} as const satisfies Partial<
  Record<VerbTenseSlug, readonly VerbTenseForm[]>
>;

export function getVerbTenseFormsForSlug(
  slug: VerbTenseSlug,
): readonly VerbTenseForm[] {
  return VERB_TENSE_FORMS_BY_SLUG[slug as keyof typeof VERB_TENSE_FORMS_BY_SLUG] ?? VERB_TENSE_FORMS;
}

export const VERB_TENSE_SECTIONS = [
  {
    slug: "present",
    title: "Presente",
    file: "data/verb-tenses-present.md",
  },
  {
    slug: "past",
    title: "Pasado",
    file: "data/verb-tenses-past.md",
  },
] as const satisfies ReadonlyArray<{
  slug: VerbTenseSlug;
  title: string;
  file: string;
}>;

export type VerbTenseSectionMeta = (typeof VERB_TENSE_SECTIONS)[number];

export function getVerbTenseFormCounts(
  exercises: readonly VerbTenseExercise[],
): Record<VerbTenseForm, number> {
  const counts: Record<VerbTenseForm, number> = {
    "Present Simple": 0,
    "Present Progressive": 0,
    "Present Perfect Simple": 0,
    "Present Perfect Progressive": 0,
    "Past Simple": 0,
    "Past Progressive": 0,
    "Past Perfect Simple": 0,
    "Past Perfect Progressive": 0,
    Mixed: 0,
  };
  for (const exercise of exercises) {
    counts[exercise.form] += 1;
  }
  return counts;
}

export function assertVerbTenseMinimums(section: VerbTenseSection): void {
  if (section.exercises.length < VERB_TENSE_MIN_TOTAL) {
    throw new Error(
      `sección ${section.slug}: se esperan ${VERB_TENSE_MIN_TOTAL} o más ejercicios, hay ${section.exercises.length}`,
    );
  }
  const counts = getVerbTenseFormCounts(section.exercises);
  for (const form of getVerbTenseFormsForSlug(section.slug)) {
    if (counts[form] < VERB_TENSE_MIN_PER_FORM) {
      throw new Error(
        `sección ${section.slug}: la forma ${form} necesita ${VERB_TENSE_MIN_PER_FORM} o más ejercicios, hay ${counts[form]}`,
      );
    }
  }
}
