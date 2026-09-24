import { describe, expect, it } from "vitest";
import {
  countPracticeResults,
  createPracticeSession,
  finishPracticeRound,
  getPracticeRoundItems,
  hasPracticeProgress,
  isPracticeRoundComplete,
  practiceKey,
  practiceSelectionsEqual,
  ratePracticeCard,
  setPracticeIndex,
  startPracticeReview,
  PRACTICE_SESSION_LIMIT,
  type PracticeItemRef,
  type PracticeSelection,
} from "./practice-session";

function ref(id: string, fingerprint = `fp-${id}`): PracticeItemRef {
  return { kind: "vocabulary", id, fingerprint };
}

function deck(size: number): PracticeItemRef[] {
  return Array.from({ length: size }, (_, index) => ref(`card-${index}`));
}

const selection: PracticeSelection = { order: "shuffled" };

describe("practice-session", () => {
  it("limita la ronda inicial a 10 con orden fijo", () => {
    const refs = deck(12);
    const session = createPracticeSession("/collocations", refs, selection, 1000);

    expect(PRACTICE_SESSION_LIMIT).toBe(10);
    expect(session.items).toHaveLength(10);
    expect(session.items.map((item) => item.id)).toEqual(
      refs.slice(0, 10).map((item) => item.id),
    );
    expect(session.phase).toBe("initial");
    expect(session.index).toBe(0);
    expect(session.reviewItems).toEqual([]);
    // No comparte referencias con la entrada.
    expect(session.items[0]).not.toBe(refs[0]);
  });

  it("conserva mazos cortos y representa el mazo vacío", () => {
    const short = createPracticeSession("/idioms", deck(3), selection);

    expect(short.items).toHaveLength(3);
    expect(getPracticeRoundItems(short)).toHaveLength(3);
    expect(isPracticeRoundComplete(short)).toBe(false);

    const empty = createPracticeSession("/idioms", [], selection);

    expect(empty.items).toEqual([]);
    expect(getPracticeRoundItems(empty)).toEqual([]);
    expect(isPracticeRoundComplete(empty)).toBe(false);
    expect(() => setPracticeIndex(empty, 0)).toThrow(RangeError);
  });

  it("califica sin mover el índice y conserva el último resultado", () => {
    const session = createPracticeSession("/prepositions", deck(3), selection);
    const key = practiceKey(session.items[0]!);

    const rated = ratePracticeCard(session, key, "almost", 2000);

    expect(rated.index).toBe(0);
    expect(rated.ratings[key]).toBe("almost");
    expect(rated.roundRatings[key]).toBe("almost");
    expect(rated.updatedAt).toBe(2000);

    const reRated = ratePracticeCard(rated, key, "known", 3000);

    expect(reRated.ratings[key]).toBe("known");
    expect(reRated.roundRatings[key]).toBe("known");
    expect(session.ratings[key]).toBeUndefined();
  });

  it("rechaza calificaciones desconocidas", () => {
    const session = createPracticeSession("/prepositions", deck(2), selection);

    expect(() =>
      ratePracticeCard(session, "vocabulary:card-0", "mastered" as never),
    ).toThrow("Calificación desconocida");
  });

  it("navega dentro de la ronda y rechaza índices fuera de rango", () => {
    const session = createPracticeSession("/collocations", deck(2), selection);

    expect(setPracticeIndex(session, 1).index).toBe(1);
    expect(() => setPracticeIndex(session, -1)).toThrow(RangeError);
    expect(() => setPracticeIndex(session, 2)).toThrow(RangeError);
  });

  it("completa la ronda solo cuando todo está evaluado u omitido", () => {
    let session = createPracticeSession("/collocations", deck(3), selection);

    session = ratePracticeCard(
      session,
      practiceKey(session.items[0]!),
      "known",
    );
    session = ratePracticeCard(
      session,
      practiceKey(session.items[1]!),
      "skipped",
    );

    expect(isPracticeRoundComplete(session)).toBe(false);

    session = ratePracticeCard(
      session,
      practiceKey(session.items[2]!),
      "unknown",
    );

    expect(isPracticeRoundComplete(session)).toBe(true);
  });

  it("resume con almost, unknown, omitidas y sin evaluar; known no vuelve", () => {
    let session = createPracticeSession("/collocations", deck(4), selection);
    const keys = session.items.map(practiceKey);

    session = ratePracticeCard(session, keys[0]!, "known");
    session = ratePracticeCard(session, keys[1]!, "almost");
    session = ratePracticeCard(session, keys[2]!, "unknown");
    session = ratePracticeCard(session, keys[3]!, "skipped");

    const summary = finishPracticeRound(session);

    expect(summary.phase).toBe("summary");
    expect(summary.index).toBe(0);
    expect(summary.reviewItems.map((item) => item.id)).toEqual([
      "card-1",
      "card-2",
      "card-3",
    ]);
    // ratings conserva el último resultado para el resumen.
    expect(summary.ratings).toEqual(session.ratings);
  });

  it("encadena rondas sucesivas y permite repetir el repaso", () => {
    let session = createPracticeSession("/collocations", deck(3), selection);
    const keys = session.items.map(practiceKey);

    session = ratePracticeCard(session, keys[0]!, "known");
    session = ratePracticeCard(session, keys[1]!, "almost");
    session = ratePracticeCard(session, keys[2]!, "unknown");
    session = finishPracticeRound(session);

    expect(getPracticeRoundItems(session)).toEqual([]);

    session = startPracticeReview(session);

    expect(session.phase).toBe("review");
    expect(session.index).toBe(0);
    expect(session.roundRatings).toEqual({});
    expect(getPracticeRoundItems(session).map((item) => item.id)).toEqual([
      "card-1",
      "card-2",
    ]);

    // Previous oculta la respuesta en UI; aquí el índice vuelve sin tocar ratings.
    session = setPracticeIndex(session, 1);
    session = setPracticeIndex(session, 0);
    const reviewKeys = getPracticeRoundItems(session).map(practiceKey);
    session = ratePracticeCard(session, reviewKeys[0]!, "known");
    session = ratePracticeCard(session, reviewKeys[1]!, "known");
    session = finishPracticeRound(session);

    expect(session.phase).toBe("summary");
    expect(session.reviewItems).toEqual([]);
    expect(countPracticeResults(session)).toMatchObject({
      known: 3,
      almost: 0,
      unknown: 0,
      skipped: 0,
      total: 3,
    });

    expect(() => startPracticeReview(session)).toThrow(
      "No hay pendientes para repasar",
    );
  });

  it("el repaso conserva pendientes parciales con el último resultado", () => {
    let session = createPracticeSession("/collocations", deck(2), selection);
    const keys = session.items.map(practiceKey);

    session = ratePracticeCard(session, keys[0]!, "almost");
    session = ratePracticeCard(session, keys[1]!, "unknown");
    session = finishPracticeRound(session);
    session = startPracticeReview(session);

    const reviewKeys = getPracticeRoundItems(session).map(practiceKey);
    session = ratePracticeCard(session, reviewKeys[0]!, "known");
    session = ratePracticeCard(session, reviewKeys[1]!, "almost");
    session = finishPracticeRound(session);

    expect(session.reviewItems.map((item) => item.id)).toEqual(["card-1"]);
    expect(countPracticeResults(session)).toMatchObject({
      known: 1,
      almost: 1,
      total: 2,
    });
    // Otra ronda de pendientes, sin bucle automático.
    expect(session.phase).toBe("summary");
    session = startPracticeReview(session);
    expect(session.phase).toBe("review");
  });

  it("no muta la sesión de entrada", () => {
    const session = createPracticeSession("/collocations", deck(2), selection);
    const frozen = { ...session, items: [...session.items] };
    Object.freeze(frozen);
    Object.freeze(frozen.items);
    const before = JSON.stringify(frozen);

    ratePracticeCard(frozen, practiceKey(frozen.items[0]!), "known");
    finishPracticeRound(frozen);

    expect(JSON.stringify(frozen)).toBe(before);
  });

  it("detecta progreso para la confirmación de filtros u orden", () => {
    const fresh = createPracticeSession("/collocations", deck(3), selection);

    expect(hasPracticeProgress(fresh)).toBe(false);

    const rated = ratePracticeCard(
      fresh,
      practiceKey(fresh.items[0]!),
      "known",
    );
    expect(hasPracticeProgress(rated)).toBe(true);

    const moved = setPracticeIndex(fresh, 1);
    expect(hasPracticeProgress(moved)).toBe(true);

    const summary = finishPracticeRound(rated);
    expect(hasPracticeProgress(summary)).toBe(false);
  });

  it("compara selecciones de nivel, categoría y orden", () => {
    expect(
      practiceSelectionsEqual(
        { order: "shuffled", level: "B1-B2" },
        { order: "shuffled", level: "B1-B2" },
      ),
    ).toBe(true);
    expect(
      practiceSelectionsEqual(
        { order: "shuffled" },
        { order: "ordered" },
      ),
    ).toBe(false);
    expect(
      practiceSelectionsEqual(
        { order: "ordered", category: "MAKE" },
        { order: "ordered", category: "TAKE" },
      ),
    ).toBe(false);
  });
});
