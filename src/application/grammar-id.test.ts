import { describe, expect, it } from "vitest";
import type { GrammarExercise } from "../domain/grammar";
import {
  assignGrammarRefs,
  fingerprintGrammarExercise,
  grammarExerciseId,
  indexGrammarExercises,
  isGrammarRefValid,
  resolveGrammarRefs,
} from "./grammar-id";

function makeExercise(
  promptEn: string,
  overrides: Partial<GrammarExercise> = {},
): GrammarExercise {
  return {
    promptEn,
    modelEn: `Model for ${promptEn}.`,
    explanationEs: `Explicación de ${promptEn}.`,
    translationEs: `Traducción de ${promptEn}.`,
    ...overrides,
  };
}

function topic(size: number, start = 0): GrammarExercise[] {
  return Array.from({ length: size }, (_, offset) =>
    makeExercise(`prompt-${String(start + offset).padStart(2, "0")}`),
  );
}

describe("grammar-id (SPEC 32, paso 1)", () => {
  it("combina número de parte, slug y posición en el identificador", () => {
    expect(grammarExerciseId(1, "present-simple-present-progressive", 0)).toBe(
      "1::present-simple-present-progressive::0",
    );
    expect(grammarExerciseId(4, "Future-Tenses ", 3)).toBe(
      "4::future-tenses::3",
    );
  });

  it("genera referencias alineadas en el orden existente del tema", () => {
    const exercises = topic(3);
    const refs = assignGrammarRefs(2, "past-simple-past-progressive", exercises);

    expect(refs).toHaveLength(3);
    expect(refs[0]).toMatchObject({
      kind: "grammar",
      id: "2::past-simple-past-progressive::0",
    });
    expect(refs[1]).toMatchObject({
      kind: "grammar",
      id: "2::past-simple-past-progressive::1",
    });
    expect(assignGrammarRefs(2, "past-simple-past-progressive", exercises).map((ref) => ref.id)).toEqual(
      refs.map((ref) => ref.id),
    );
  });

  it("conserva temas con menos de 10 ejercicios completos", () => {
    const exercises = topic(5);
    const refs = assignGrammarRefs(1, "comparisons", exercises);

    expect(refs).toHaveLength(5);
    expect(resolveGrammarRefs(refs, 1, "comparisons", exercises)).toHaveLength(5);
  });

  it("la huella incluye prompt, modelo, explicación y traducción", () => {
    const exercise = makeExercise("prompt-00");

    expect(fingerprintGrammarExercise(exercise)).toBe(
      fingerprintGrammarExercise({ ...exercise }),
    );
    expect(fingerprintGrammarExercise(exercise)).not.toBe(
      fingerprintGrammarExercise({ ...exercise, promptEn: "Otro prompt." }),
    );
    expect(fingerprintGrammarExercise(exercise)).not.toBe(
      fingerprintGrammarExercise({ ...exercise, modelEn: "Other model." }),
    );
    expect(fingerprintGrammarExercise(exercise)).not.toBe(
      fingerprintGrammarExercise({ ...exercise, explanationEs: "Otra explicación." }),
    );
    expect(fingerprintGrammarExercise(exercise)).not.toBe(
      fingerprintGrammarExercise({ ...exercise, translationEs: "Otra traducción." }),
    );
  });

  it("un ejercicio modificado invalida la sesión afectada", () => {
    const exercises = topic(2);
    const refs = assignGrammarRefs(1, "comparisons", exercises);

    const edited = [
      { ...exercises[0]!, modelEn: "Edited model." },
      exercises[1]!,
    ];
    expect(resolveGrammarRefs(refs, 1, "comparisons", edited)).toBeNull();
    // La referencia no afectada sigue resolviendo sola.
    expect(resolveGrammarRefs([refs[1]!], 1, "comparisons", edited)).not.toBeNull();
  });

  it("un ejercicio retirado descarta la resolución", () => {
    const exercises = topic(2);
    const refs = assignGrammarRefs(1, "comparisons", exercises);

    expect(resolveGrammarRefs(refs, 1, "comparisons", [exercises[0]!])).toBeNull();
    expect(resolveGrammarRefs(refs, 1, "comparisons", [])).toBeNull();
    expect(resolveGrammarRefs([refs[0]!], 1, "comparisons", [exercises[0]!])).not.toBeNull();
  });

  it("no mezcla ejercicios de temas distintos", () => {
    const exercises = topic(2);
    const refs = assignGrammarRefs(1, "comparisons", exercises);

    expect(resolveGrammarRefs(refs, 1, "stative-verbs", exercises)).toBeNull();
    expect(resolveGrammarRefs(refs, 2, "comparisons", exercises)).toBeNull();
    expect(
      resolveGrammarRefs(
        [{ ...refs[0]!, kind: "vocabulary" as never }],
        1,
        "comparisons",
        exercises,
      ),
    ).toBeNull();
    expect(isGrammarRefValid(refs[0]!, 1, "comparisons", exercises)).toBe(true);
    expect(isGrammarRefValid(refs[0]!, 1, "comparisons", [])).toBe(false);
  });

  it("el índice resuelve por id estable", () => {
    const exercises = topic(2);
    const index = indexGrammarExercises(1, "comparisons", exercises);

    expect(index.get("1::comparisons::0")?.exercise.promptEn).toBe("prompt-00");
    expect(index.get("1::comparisons::9")).toBeUndefined();
  });
});
