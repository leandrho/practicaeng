import { describe, expect, it } from "vitest";
import type { WordFamily } from "../domain/word-formation";
import {
  assignWordFormationRefs,
  fingerprintWordFamily,
  indexWordFormationFamilies,
  isWordFormationRefValid,
  normalizeWordFormationBase,
  resolveWordFormationRefs,
} from "./word-formation-id";

function makeFamily(
  base: string,
  overrides: Partial<WordFamily> = {},
): WordFamily {
  return {
    base,
    level: "B1-B2",
    category: base.charAt(0).toUpperCase(),
    noun: `${base}ness`,
    meaningHintEn: `to ${base}`,
    meaningHint: base,
    contextEn: `"We must ${base} now," she said. There was no time to wait.`,
    contextSource: "Everyday conversation",
    examples: [],
    exercise: {
      target: "noun",
      sentenceEn: `It was a clear ____. (${base})`,
      acceptedAnswers: [`${base}ness`],
    },
    ...overrides,
  };
}

describe("word-formation-id", () => {
  it("normaliza la base para el identificador", () => {
    expect(normalizeWordFormationBase("  DeCide ")).toBe("decide");
    expect(normalizeWordFormationBase("Take   Off")).toBe("take off");
  });

  it("genera IDs estables con la base normalizada", () => {
    const families = [makeFamily("decide"), makeFamily("act")];
    const refs = assignWordFormationRefs(families);

    expect(refs[0]).toMatchObject({ kind: "word-formation", id: "decide" });
    expect(refs[1]).toMatchObject({ kind: "word-formation", id: "act" });
    expect(assignWordFormationRefs(families).map((ref) => ref.id)).toEqual(
      refs.map((ref) => ref.id),
    );
  });

  it("insertar una familia diferente no modifica los IDs previos", () => {
    const before = [makeFamily("alpha"), makeFamily("bravo")];
    const beforeIds = assignWordFormationRefs(before).map((ref) => ref.id);

    const after = [makeFamily("alpha"), makeFamily("zzz-new"), makeFamily("bravo")];
    const afterRefs = assignWordFormationRefs(after);

    expect(afterRefs[0]?.id).toBe(beforeIds[0]);
    expect(afterRefs[2]?.id).toBe(beforeIds[1]);
  });

  it("la huella incluye oración, objetivo y respuestas aceptadas", () => {
    const family = makeFamily("decide", {
      noun: "decision",
      exercise: {
        target: "noun",
        sentenceEn: "She made an important ____ yesterday.",
        acceptedAnswers: ["decision"],
      },
    });

    expect(fingerprintWordFamily(family)).toBe(
      fingerprintWordFamily({ ...family }),
    );
    // Ejercicio modificado: cambia la huella.
    expect(fingerprintWordFamily(family)).not.toBe(
      fingerprintWordFamily({
        ...family,
        exercise: { ...family.exercise, sentenceEn: "She made a ____ today." },
      }),
    );
    expect(fingerprintWordFamily(family)).not.toBe(
      fingerprintWordFamily({
        ...family,
        exercise: { ...family.exercise, target: "adjective" },
      }),
    );
    expect(fingerprintWordFamily(family)).not.toBe(
      fingerprintWordFamily({
        ...family,
        exercise: { ...family.exercise, acceptedAnswers: ["decisions"] },
      }),
    );
  });

  it("un ejercicio modificado invalida solo la referencia afectada", () => {
    const families = [makeFamily("alpha"), makeFamily("bravo")];
    const refs = assignWordFormationRefs(families);

    const edited = [
      {
        ...families[0]!,
        exercise: { ...families[0]!.exercise, sentenceEn: "Edited ____ here." },
      },
      families[1]!,
    ];

    expect(resolveWordFormationRefs(refs, edited)).toBeNull();
    expect(resolveWordFormationRefs([refs[1]!], edited)).not.toBeNull();
  });

  it("una familia retirada descarta la resolución", () => {
    const families = [makeFamily("alpha"), makeFamily("bravo")];
    const refs = assignWordFormationRefs(families);

    expect(resolveWordFormationRefs(refs, [families[0]!])).toBeNull();
    expect(resolveWordFormationRefs(refs, [])).toBeNull();
    expect(resolveWordFormationRefs([refs[0]!], [families[0]!])).not.toBeNull();
  });

  it("rechaza referencias de otra clase", () => {
    const families = [makeFamily("alpha")];
    const refs = assignWordFormationRefs(families);

    expect(
      resolveWordFormationRefs(
        [{ ...refs[0]!, kind: "vocabulary" as never }],
        families,
      ),
    ).toBeNull();
    expect(isWordFormationRefValid(refs[0]!, families)).toBe(true);
    expect(isWordFormationRefValid(refs[0]!, [])).toBe(false);
  });

  it("el índice resuelve por id estable", () => {
    const families = [makeFamily("alpha"), makeFamily("bravo")];
    const index = indexWordFormationFamilies(families);

    expect(index.get("alpha")?.family.base).toBe("alpha");
    expect(index.get("missing")).toBeUndefined();
  });
});
