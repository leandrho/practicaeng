import { describe, expect, it } from "vitest";
import {
  assertVerbTenseMinimums,
  getVerbTenseFormCounts,
  getVerbTenseFormsForSlug,
  VERB_TENSE_SECTIONS,
  VerbTenseExerciseSchema,
  VerbTenseSectionSchema,
  type VerbTenseExercise,
} from "./verb-tenses";

const validExercise: VerbTenseExercise = {
  form: "Present Simple",
  promptEn: "Complete the routine: she / walk to school every day.",
  sentenceEn: "She ____ to school every day.",
  acceptedAnswers: ["walks"],
  modelEn: "She walks to school every day.",
  explanationEs: "El *present simple* expresa hábitos y la tercera persona lleva -s.",
  translationEs: "Ella camina a la escuela todos los días.",
  contextEn: '"Do you walk to school?" "Yes, I walk there every day with my brother."',
  contextSource: "Everyday conversation",
};

function exerciseFor(form: VerbTenseExercise["form"], index: number): VerbTenseExercise {
  return {
    ...validExercise,
    form,
    promptEn: `Complete the routine case ${form} ${index}.`,
    sentenceEn: `She ____ to school every day (${form} ${index}).`,
    modelEn: `She walks to school every day (${form} ${index}).`,
    translationEs: `Ella camina a la escuela todos los días (${form} ${index}).`,
  };
}

describe("VerbTenseExerciseSchema", () => {
  it("un ejercicio completo pasa", () => {
    expect(VerbTenseExerciseSchema.parse(validExercise)).toEqual(validExercise);
  });

  it("contextSource es opcional", () => {
    const { contextSource: _omitted, ...withoutSource } = validExercise;
    expect(VerbTenseExerciseSchema.parse(withoutSource).contextSource).toBeUndefined();
  });

  it("sin hueco único falla", () => {
    for (const sentenceEn of ["She walks to school.", "She ____ and ____ today."]) {
      expect(() =>
        VerbTenseExerciseSchema.parse({ ...validExercise, sentenceEn }),
      ).toThrow();
    }
  });

  it("sin respuestas falla", () => {
    expect(() =>
      VerbTenseExerciseSchema.parse({ ...validExercise, acceptedAnswers: [] }),
    ).toThrow();
  });

  it("respuestas duplicadas tras normalizar fallan", () => {
    expect(() =>
      VerbTenseExerciseSchema.parse({
        ...validExercise,
        acceptedAnswers: ["walks", "  WALKS "],
      }),
    ).toThrow();
  });

  it("forma inválida falla", () => {
    expect(() =>
      VerbTenseExerciseSchema.parse({ ...validExercise, form: "Future Simple" }),
    ).toThrow();
  });

  it("acepta las formas del pasado en el esquema global", () => {
    expect(
      VerbTenseExerciseSchema.parse({ ...validExercise, form: "Past Simple" }).form,
    ).toBe("Past Simple");
  });

  it("sin contexto falla", () => {
    const { contextEn: _omitted, ...withoutContext } = validExercise;
    expect(() => VerbTenseExerciseSchema.parse(withoutContext)).toThrow();
    expect(() =>
      VerbTenseExerciseSchema.parse({ ...validExercise, contextEn: "" }),
    ).toThrow();
  });

  it("contexto con --- falla", () => {
    expect(() =>
      VerbTenseExerciseSchema.parse({
        ...validExercise,
        contextEn: "One sentence --- another one here.",
      }),
    ).toThrow();
  });
});

describe("verb-tenses catalog", () => {
  it("las secciones present, past, future y conditionals son únicas en slug, título y archivo", () => {
    const slugs = VERB_TENSE_SECTIONS.map((section) => section.slug);
    const titles = VERB_TENSE_SECTIONS.map((section) => section.title);
    const files = VERB_TENSE_SECTIONS.map((section) => section.file);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(files).size).toBe(files.length);
    expect(VERB_TENSE_SECTIONS[0]).toMatchObject({
      slug: "present",
      title: "Present",
      file: "data/verb-tenses-present.md",
    });
    expect(VERB_TENSE_SECTIONS[1]).toMatchObject({
      slug: "past",
      title: "Past",
      file: "data/verb-tenses-past.md",
    });
    expect(VERB_TENSE_SECTIONS[2]).toMatchObject({
      slug: "future",
      title: "Future",
      file: "data/verb-tenses-future.md",
    });
    expect(VERB_TENSE_SECTIONS[3]).toMatchObject({
      slug: "conditionals",
      title: "Conditionals",
      file: "data/verb-tenses-conditionals.md",
    });
  });

  it("expone las formas por sección y el fallback global", () => {
    expect(getVerbTenseFormsForSlug("present")).toEqual([
      "Present Simple",
      "Present Progressive",
      "Present Perfect Simple",
      "Present Perfect Progressive",
      "Mixed",
    ]);
    expect(getVerbTenseFormsForSlug("past")).toEqual([
      "Past Simple",
      "Past Progressive",
      "Past Perfect Simple",
      "Past Perfect Progressive",
      "Mixed",
    ]);
    expect(getVerbTenseFormsForSlug("future")).toEqual([
      "Will",
      "Be going to",
      "Present Progressive (future arrangement)",
      "Present Simple (timetable)",
      "Future Progressive",
      "Future Perfect Simple",
      "Be about to / Be due to",
      "Mixed",
    ]);
    expect(getVerbTenseFormsForSlug("conditionals")).toEqual([
      "Conditional Zero",
      "Conditional Type 1",
      "Conditional Type 2",
      "Conditional Type 3",
      "Mixed",
    ]);
  });

  it("cuenta ejercicios por forma y exige los mínimos", () => {
    const forms: VerbTenseExercise["form"][] = [
      "Present Simple",
      "Present Progressive",
      "Present Perfect Simple",
      "Present Perfect Progressive",
      "Mixed",
    ];
    const exercises = forms.flatMap((form) =>
      Array.from({ length: 10 }, (_, index) => exerciseFor(form, index)),
    );
    expect(exercises).toHaveLength(50);
    expect(getVerbTenseFormCounts(exercises)).toEqual({
      "Present Simple": 10,
      "Present Progressive": 10,
      "Present Perfect Simple": 10,
      "Present Perfect Progressive": 10,
      "Past Simple": 0,
      "Past Progressive": 0,
      "Past Perfect Simple": 0,
      "Past Perfect Progressive": 0,
      Will: 0,
      "Be going to": 0,
      "Present Progressive (future arrangement)": 0,
      "Present Simple (timetable)": 0,
      "Future Progressive": 0,
      "Future Perfect Simple": 0,
      "Be about to / Be due to": 0,
      "Conditional Zero": 0,
      "Conditional Type 1": 0,
      "Conditional Type 2": 0,
      "Conditional Type 3": 0,
      Mixed: 10,
    });

    const section = VerbTenseSectionSchema.parse({
      slug: "present",
      title: "Present",
      exercises,
    });
    expect(() => assertVerbTenseMinimums(section)).not.toThrow();

    const short = VerbTenseSectionSchema.parse({
      slug: "present",
      title: "Present",
      exercises: exercises.slice(0, 49),
    });
    expect(() => assertVerbTenseMinimums(short)).toThrow(/50 o más/);

    const unbalanced = VerbTenseSectionSchema.parse({
      slug: "present",
      title: "Present",
      exercises: [
        ...Array.from({ length: 14 }, (_, index) =>
          exerciseFor("Present Simple", index),
        ),
        ...Array.from({ length: 9 }, (_, index) =>
          exerciseFor("Present Progressive", 100 + index),
        ),
        ...Array.from({ length: 10 }, (_, index) =>
          exerciseFor("Present Perfect Simple", 200 + index),
        ),
        ...Array.from({ length: 10 }, (_, index) =>
          exerciseFor("Present Perfect Progressive", 300 + index),
        ),
        ...Array.from({ length: 10 }, (_, index) => exerciseFor("Mixed", 400 + index)),
      ],
    });
    expect(() => assertVerbTenseMinimums(unbalanced)).toThrow(/Present Progressive/);
  });

  it("exige los mínimos de la sección past por forma", () => {
    const forms: VerbTenseExercise["form"][] = [
      "Past Simple",
      "Past Progressive",
      "Past Perfect Simple",
      "Past Perfect Progressive",
      "Mixed",
    ];
    const exercises = forms.flatMap((form) =>
      Array.from({ length: 10 }, (_, index) => exerciseFor(form, 1000 + index)),
    );
    const section = VerbTenseSectionSchema.parse({
      slug: "past",
      title: "Past",
      exercises,
    });
    expect(() => assertVerbTenseMinimums(section)).not.toThrow();

    const unbalancedPast = VerbTenseSectionSchema.parse({
      slug: "past",
      title: "Past",
      exercises: [
        ...Array.from({ length: 14 }, (_, index) =>
          exerciseFor("Past Simple", 2000 + index),
        ),
        ...Array.from({ length: 9 }, (_, index) =>
          exerciseFor("Past Progressive", 2100 + index),
        ),
        ...Array.from({ length: 10 }, (_, index) =>
          exerciseFor("Past Perfect Simple", 2200 + index),
        ),
        ...Array.from({ length: 10 }, (_, index) =>
          exerciseFor("Past Perfect Progressive", 2300 + index),
        ),
        ...Array.from({ length: 10 }, (_, index) => exerciseFor("Mixed", 2400 + index)),
      ],
    });
    expect(() => assertVerbTenseMinimums(unbalancedPast)).toThrow(/Past Progressive/);
  });

  it("exige los mínimos de la sección future por forma", () => {
    const forms: VerbTenseExercise["form"][] = [
      "Will",
      "Be going to",
      "Present Progressive (future arrangement)",
      "Present Simple (timetable)",
      "Future Progressive",
      "Future Perfect Simple",
      "Be about to / Be due to",
    ];
    const exercises = [
      ...forms.flatMap((form) =>
        Array.from({ length: 6 }, (_, index) => exerciseFor(form, 3000 + index * 100)),
      ),
      ...Array.from({ length: 8 }, (_, index) => exerciseFor("Mixed", 4000 + index)),
    ];
    expect(exercises).toHaveLength(50);
    const section = VerbTenseSectionSchema.parse({
      slug: "future",
      title: "Future",
      exercises,
    });
    expect(() => assertVerbTenseMinimums(section)).not.toThrow();

    const shortMixed = VerbTenseSectionSchema.parse({
      slug: "future",
      title: "Future",
      exercises: [
        ...Array.from({ length: 7 }, (_, index) => exerciseFor("Will", 5000 + index)),
        ...Array.from({ length: 6 }, (_, index) =>
          exerciseFor("Be going to", 5100 + index),
        ),
        ...Array.from({ length: 6 }, (_, index) =>
          exerciseFor("Present Progressive (future arrangement)", 5200 + index),
        ),
        ...Array.from({ length: 6 }, (_, index) =>
          exerciseFor("Present Simple (timetable)", 5300 + index),
        ),
        ...Array.from({ length: 6 }, (_, index) =>
          exerciseFor("Future Progressive", 5400 + index),
        ),
        ...Array.from({ length: 6 }, (_, index) =>
          exerciseFor("Future Perfect Simple", 5500 + index),
        ),
        ...Array.from({ length: 6 }, (_, index) =>
          exerciseFor("Be about to / Be due to", 5600 + index),
        ),
        ...Array.from({ length: 7 }, (_, index) => exerciseFor("Mixed", 5700 + index)),
      ],
    });
    expect(() => assertVerbTenseMinimums(shortMixed)).toThrow(/Mixed/);

    const unbalancedFuture = VerbTenseSectionSchema.parse({
      slug: "future",
      title: "Future",
      exercises: [
        ...Array.from({ length: 10 }, (_, index) => exerciseFor("Will", 7000 + index)),
        ...Array.from({ length: 5 }, (_, index) =>
          exerciseFor("Be going to", 7100 + index),
        ),
        ...Array.from({ length: 6 }, (_, index) =>
          exerciseFor("Present Progressive (future arrangement)", 7200 + index),
        ),
        ...Array.from({ length: 6 }, (_, index) =>
          exerciseFor("Present Simple (timetable)", 7300 + index),
        ),
        ...Array.from({ length: 6 }, (_, index) =>
          exerciseFor("Future Progressive", 7400 + index),
        ),
        ...Array.from({ length: 6 }, (_, index) =>
          exerciseFor("Future Perfect Simple", 7500 + index),
        ),
        ...Array.from({ length: 6 }, (_, index) =>
          exerciseFor("Be about to / Be due to", 7600 + index),
        ),
        ...Array.from({ length: 8 }, (_, index) => exerciseFor("Mixed", 7700 + index)),
      ],
    });
    expect(() => assertVerbTenseMinimums(unbalancedFuture)).toThrow(/Be going to/);
  });

  it("exige los mínimos de la sección conditionals por forma", () => {
    const forms: VerbTenseExercise["form"][] = [
      "Conditional Zero",
      "Conditional Type 1",
      "Conditional Type 2",
      "Conditional Type 3",
      "Mixed",
    ];
    const exercises = forms.flatMap((form) =>
      Array.from({ length: 10 }, (_, index) => exerciseFor(form, 8000 + index)),
    );
    const section = VerbTenseSectionSchema.parse({
      slug: "conditionals",
      title: "Conditionals",
      exercises,
    });
    expect(() => assertVerbTenseMinimums(section)).not.toThrow();

    const unbalancedConditionals = VerbTenseSectionSchema.parse({
      slug: "conditionals",
      title: "Conditionals",
      exercises: [
        ...Array.from({ length: 14 }, (_, index) =>
          exerciseFor("Conditional Zero", 9000 + index),
        ),
        ...Array.from({ length: 9 }, (_, index) =>
          exerciseFor("Conditional Type 1", 9100 + index),
        ),
        ...Array.from({ length: 10 }, (_, index) =>
          exerciseFor("Conditional Type 2", 9200 + index),
        ),
        ...Array.from({ length: 10 }, (_, index) =>
          exerciseFor("Conditional Type 3", 9300 + index),
        ),
        ...Array.from({ length: 10 }, (_, index) => exerciseFor("Mixed", 9400 + index)),
      ],
    });
    expect(() => assertVerbTenseMinimums(unbalancedConditionals)).toThrow(
      /Conditional Type 1/,
    );
  });
});
