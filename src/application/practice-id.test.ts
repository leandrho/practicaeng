import { describe, expect, it } from "vitest";
import type { Card } from "../domain/card";
import { shuffle } from "./shuffle";
import {
  assignVocabularyRefs,
  fingerprintCard,
  indexVocabularyCards,
  normalizeVocabularyExpression,
  resolveVocabularyRefs,
} from "./practice-id";

function makeCard(expression: string, overrides: Partial<Card> = {}): Card {
  return {
    expression,
    type: "collocation",
    level: "B1-B2",
    meaningEn: `meaning of ${expression}`,
    meaningEs: `significado de ${expression}`,
    exampleEn: `Example with ${expression}.`,
    translationEs: `Ejemplo con ${expression}.`,
    category: "MAKE",
    sourceFile: "data/collocations-b1-b2.md",
    contextEn: `"Context for ${expression}," she said.`,
    contextSource: "Everyday conversation",
    tags: [],
    ...overrides,
  };
}

describe("practice-id", () => {
  it("normaliza la expresión para el identificador", () => {
    expect(normalizeVocabularyExpression("  Make   A  Decision ")).toBe(
      "make a decision",
    );
  });

  it("genera IDs estables sin ordinal para tarjetas únicas", () => {
    const cards = [makeCard("make a decision"), makeCard("take a break")];
    const refs = assignVocabularyRefs(cards);

    expect(refs[0]?.id).toBe(
      "data/collocations-b1-b2.md::MAKE::make a decision",
    );
    expect(assignVocabularyRefs(cards).map((ref) => ref.id)).toEqual(
      refs.map((ref) => ref.id),
    );
  });

  it("numera homónimos solo entre la misma combinación", () => {
    const first = makeCard("give up", { meaningEs: "rendirse" });
    const second = makeCard("give up", { meaningEs: "abandonar" });
    const otherCategory = makeCard("give up", { category: "TAKE" });
    const refs = assignVocabularyRefs([first, second, otherCategory]);

    expect(refs[0]?.id).not.toBe(refs[1]?.id);
    expect(refs[0]?.id).toContain("#1");
    expect(refs[1]?.id).toContain("#2");
    // Otra categoría: combinación distinta, sin ordinal.
    expect(refs[2]?.id).not.toContain("#");
  });

  it("insertar una tarjeta diferente no modifica los IDs previos", () => {
    const before = [makeCard("alpha"), makeCard("bravo")];
    const beforeIds = assignVocabularyRefs(before).map((ref) => ref.id);

    const after = [makeCard("alpha"), makeCard("zzz-new"), makeCard("bravo")];
    const afterRefs = assignVocabularyRefs(after);

    expect(afterRefs[0]?.id).toBe(beforeIds[0]);
    expect(afterRefs[2]?.id).toBe(beforeIds[1]);
  });

  it("el orden barajado resuelve el mismo contenido", () => {
    const cards = [
      makeCard("alpha"),
      makeCard("bravo"),
      makeCard("charlie"),
      makeCard("delta"),
    ];
    const refs = assignVocabularyRefs(cards);
    const shuffled = shuffle(cards, 7);

    // Las referencias no usan la posición: el índice barajado resuelve igual.
    const index = indexVocabularyCards(shuffled);
    for (const ref of refs) {
      expect(index.has(ref.id)).toBe(true);
    }

    expect(resolveVocabularyRefs(refs, shuffled)).toHaveLength(4);
    expect(resolveVocabularyRefs(refs, shuffled)?.map((card) => card.expression)).toEqual(
      ["alpha", "bravo", "charlie", "delta"],
    );
  });

  it("una edición del contenido invalida solo la referencia afectada", () => {
    const cards = [makeCard("alpha"), makeCard("bravo")];
    const refs = assignVocabularyRefs(cards);

    const edited = [
      { ...cards[0]!, meaningEs: "significado editado" },
      cards[1]!,
    ];

    expect(resolveVocabularyRefs(refs, edited)).toBeNull();
    expect(resolveVocabularyRefs([refs[1]!], edited)).not.toBeNull();
  });

  it("una referencia ausente descarta la resolución", () => {
    const cards = [makeCard("alpha")];
    const refs = assignVocabularyRefs(cards);

    expect(resolveVocabularyRefs(refs, [])).toBeNull();
    expect(
      resolveVocabularyRefs(
        [{ kind: "word-formation" as never, id: refs[0]!.id, fingerprint: refs[0]!.fingerprint }],
        cards,
      ),
    ).toBeNull();
  });

  it("la huella es determinista y sensible al contenido", () => {
    const card = makeCard("alpha");

    expect(fingerprintCard(card)).toBe(fingerprintCard({ ...card }));
    expect(fingerprintCard(card)).not.toBe(
      fingerprintCard({ ...card, exampleEn: "Another example." }),
    );
    expect(fingerprintCard(card)).not.toBe(
      fingerprintCard({ ...card, translationEs: "Otra traducción." }),
    );
  });
});
