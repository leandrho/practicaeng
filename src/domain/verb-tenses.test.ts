import { describe, expect, it } from "vitest";
import {
  assertVerbTenseMinimums,
  getVerbTenseFormCounts,
  getVerbTenseFormsForSlug,
  VERB_TENSE_SECTIONS,
  VerbTenseExerciseSchema,
  VerbTenseSectionSchema,
  type VerbTenseExercise,
  type VerbTenseForm,
} from "./verb-tenses";

const validExercise: VerbTenseExercise = {
  forms: ["Present Simple"],
  promptEn: "Complete the routine: she / walk to school every day.",
  sentenceEn: "She ____ to school every day.",
  acceptedAnswers: ["walks"],
  modelEn: "She walks to school every day.",
  explanationEs:
    "El *present simple* expresa hábitos y la tercera persona lleva -s.",
  translationEs: "Ella camina a la escuela todos los días.",
  contextEn:
    '"Do you walk to school?" "Yes, I walk there every day with my brother."',
  contextSource: "Everyday conversation",
};

function exerciseFor(forms: VerbTenseForm[], index: number): VerbTenseExercise {
  const label = forms.join(" + ");
  return {
    ...validExercise,
    forms,
    promptEn: `Complete the routine case ${label} ${index}.`,
    sentenceEn: `She ____ to school every day (${label} ${index}).`,
    modelEn: `She walks to school every day (${label} ${index}).`,
    translationEs: `Ella camina a la escuela todos los días (${label} ${index}).`,
  };
}

describe("VerbTenseExerciseSchema", () => {
  it("acepta un ejercicio con una o más formas concretas", () => {
    expect(VerbTenseExerciseSchema.parse(validExercise)).toEqual(validExercise);
    expect(
      VerbTenseExerciseSchema.parse({
        ...validExercise,
        forms: ["Present Simple", "Present Progressive"],
      }).forms
    ).toEqual(["Present Simple", "Present Progressive"]);
  });

  it("rechaza formas vacías, genéricas o duplicadas", () => {
    for (const forms of [[], ["Mixed"], ["Present Simple", "Present Simple"]]) {
      expect(() =>
        VerbTenseExerciseSchema.parse({ ...validExercise, forms })
      ).toThrow();
    }
  });

  it("contextSource es opcional y valida la respuesta y el hueco", () => {
    const { contextSource: _omitted, ...withoutSource } = validExercise;
    expect(
      VerbTenseExerciseSchema.parse(withoutSource).contextSource
    ).toBeUndefined();
    expect(() =>
      VerbTenseExerciseSchema.parse({ ...validExercise, sentenceEn: "No gap" })
    ).toThrow();
    expect(() =>
      VerbTenseExerciseSchema.parse({ ...validExercise, acceptedAnswers: [] })
    ).toThrow();
    expect(() =>
      VerbTenseExerciseSchema.parse({
        ...validExercise,
        acceptedAnswers: ["walks", " WALKS "],
      })
    ).toThrow();
  });

  it("requiere contexto y rechaza el separador del formato", () => {
    const { contextEn: _omitted, ...withoutContext } = validExercise;
    expect(() => VerbTenseExerciseSchema.parse(withoutContext)).toThrow();
    expect(() =>
      VerbTenseExerciseSchema.parse({ ...validExercise, contextEn: "" }),
    ).toThrow();
    expect(() =>
      VerbTenseExerciseSchema.parse({
        ...validExercise,
        contextEn: "One sentence --- another sentence.",
      }),
    ).toThrow();
  });
});

describe("verb-tenses catalog and minimums", () => {
  it("keeps unique section metadata and lists only specific forms", () => {
    expect(new Set(VERB_TENSE_SECTIONS.map(({ slug }) => slug)).size).toBe(4);
    expect(new Set(VERB_TENSE_SECTIONS.map(({ title }) => title)).size).toBe(4);
    expect(new Set(VERB_TENSE_SECTIONS.map(({ file }) => file)).size).toBe(4);
    expect(getVerbTenseFormsForSlug("present")).toEqual([
      "Present Simple",
      "Present Progressive",
      "Present Perfect Simple",
      "Present Perfect Progressive",
    ]);
    expect(getVerbTenseFormsForSlug("future")).toContain("Be due to");
    expect(getVerbTenseFormsForSlug("conditionals")).toContain(
      "Past Perfect → would + base (present result)"
    );
    expect(getVerbTenseFormsForSlug("conditionals")).toContain(
      "Past Simple → would have + past participle (past result)"
    );
    expect(getVerbTenseFormsForSlug("conditionals")).not.toContain("Mixed");
  });

  it("counts every form on a multi-form exercise", () => {
    const counts = getVerbTenseFormCounts([
      exerciseFor(["Present Simple", "Present Progressive"], 1),
    ]);
    expect(counts["Present Simple"]).toBe(1);
    expect(counts["Present Progressive"]).toBe(1);
    expect(counts["Present Perfect Simple"]).toBe(0);
  });

  it("checks section-specific form minimums and the total card count", () => {
    const presentForms = getVerbTenseFormsForSlug("present");
    const presentExercises = [
      ...presentForms.flatMap((form) =>
        Array.from({ length: 13 }, (_, index) => exerciseFor([form], index))
      ),
    ];
    const present = VerbTenseSectionSchema.parse({
      slug: "present",
      title: "Present",
      exercises: presentExercises,
    });
    expect(() => assertVerbTenseMinimums(present)).not.toThrow();

    const shortPresent = VerbTenseSectionSchema.parse({
      ...present,
      exercises: present.exercises.slice(0, 49),
    });
    expect(() => assertVerbTenseMinimums(shortPresent)).toThrow(/50 o más/);

    const futureForms = getVerbTenseFormsForSlug("future");
    const futureExercises = futureForms.flatMap((form) =>
      Array.from({ length: 6 }, (_, index) => exerciseFor([form], 100 + index))
    );
    futureExercises.push(
      exerciseFor(["Will"], 200),
      exerciseFor(["Will"], 201)
    );
    const future = VerbTenseSectionSchema.parse({
      slug: "future",
      title: "Future",
      exercises: futureExercises,
    });
    expect(() => assertVerbTenseMinimums(future)).not.toThrow();

    const conditionalForms = getVerbTenseFormsForSlug("conditionals");
    const conditionalExercises = conditionalForms.flatMap((form) =>
      Array.from({ length: form.includes("→") ? 5 : 10 }, (_, index) =>
        exerciseFor([form], 300 + index)
      )
    );
    const conditionals = VerbTenseSectionSchema.parse({
      slug: "conditionals",
      title: "Conditionals",
      exercises: conditionalExercises,
    });
    expect(() => assertVerbTenseMinimums(conditionals)).not.toThrow();
  });

  it("rejects underrepresented forms even when the section has 50 exercises", () => {
    const underrepresentedPresent = [
      ...Array.from({ length: 21 }, (_, index) =>
        exerciseFor(["Present Simple"], 1000 + index),
      ),
      ...Array.from({ length: 9 }, (_, index) =>
        exerciseFor(["Present Progressive"], 1100 + index),
      ),
      ...Array.from({ length: 10 }, (_, index) =>
        exerciseFor(["Present Perfect Simple"], 1200 + index),
      ),
      ...Array.from({ length: 10 }, (_, index) =>
        exerciseFor(["Present Perfect Progressive"], 1300 + index),
      ),
    ];
    const present = VerbTenseSectionSchema.parse({
      slug: "present",
      title: "Present",
      exercises: underrepresentedPresent,
    });
    expect(() => assertVerbTenseMinimums(present)).toThrow(/Present Progressive/);

    const underrepresentedPast = [
      ...Array.from({ length: 21 }, (_, index) =>
        exerciseFor(["Past Simple"], 2000 + index),
      ),
      ...Array.from({ length: 9 }, (_, index) =>
        exerciseFor(["Past Progressive"], 2100 + index),
      ),
      ...Array.from({ length: 10 }, (_, index) =>
        exerciseFor(["Past Perfect Simple"], 2200 + index),
      ),
      ...Array.from({ length: 10 }, (_, index) =>
        exerciseFor(["Past Perfect Progressive"], 2300 + index),
      ),
    ];
    const past = VerbTenseSectionSchema.parse({
      slug: "past",
      title: "Past",
      exercises: underrepresentedPast,
    });
    expect(() => assertVerbTenseMinimums(past)).toThrow(/Past Progressive/);

    const underrepresentedFuture = [
      ...getVerbTenseFormsForSlug("future").flatMap((form) =>
        Array.from(
          { length: form === "Be due to" ? 3 : form === "Will" ? 11 : 6 },
          (_, index) => exerciseFor([form], 3000 + index),
        ),
      ),
    ];
    const future = VerbTenseSectionSchema.parse({
      slug: "future",
      title: "Future",
      exercises: underrepresentedFuture,
    });
    expect(() => assertVerbTenseMinimums(future)).toThrow(/Be due to.*4 o más/);

    const underrepresentedConditionals = [
      ...getVerbTenseFormsForSlug("conditionals").flatMap((form) =>
        Array.from(
          {
            length:
              form === "Past Perfect → would + base (present result)"
                ? 4
                : form === "Conditional Type 1"
                  ? 11
                  : form.includes("→")
                    ? 5
                    : 10,
          },
          (_, index) => exerciseFor([form], 4000 + index),
        ),
      ),
    ];
    const conditionals = VerbTenseSectionSchema.parse({
      slug: "conditionals",
      title: "Conditionals",
      exercises: underrepresentedConditionals,
    });
    expect(() => assertVerbTenseMinimums(conditionals)).toThrow(
      /Past Perfect → would \+ base.*5 o más/,
    );
  });

  it("rechaza una forma que no corresponde a la sección", () => {
    expect(() =>
      VerbTenseSectionSchema.parse({
        slug: "past",
        title: "Past",
        exercises: [exerciseFor(["Present Simple"], 1)],
      })
    ).toThrow(/ajena a la sección/);
  });
});
