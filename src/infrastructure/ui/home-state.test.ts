import { describe, expect, it } from "vitest";
import { createPracticeSession } from "../../application/practice-session";
import type { PracticeItemRef } from "../../application/practice-session";
import {
  countDifficultEvaluations,
  countSessionPending,
  homeRouteLabel,
  isContinuableSession,
  selectHomeState,
} from "./home-state";
import {
  emptyPracticeState,
  type StoredPracticeState,
} from "./practice-storage";

function ref(id: string, kind: PracticeItemRef["kind"] = "vocabulary"): PracticeItemRef {
  return { kind, id, fingerprint: `fp-${id}` };
}

function sessionFor(route: string, now = 1000) {
  return createPracticeSession(route, [ref("a"), ref("b")], { order: "shuffled" }, now);
}

describe("home-state", () => {
  it("primer uso sin datos no ofrece Continue ni resumen", () => {
    const summary = selectHomeState(emptyPracticeState());

    expect(summary.continueRoute).toBeNull();
    expect(summary.lastSessionRoute).toBeNull();
    expect(summary.lastSessionPending).toBe(0);
    expect(summary.difficultCount).toBe(0);
    expect(summary.hasLocalData).toBe(false);
  });

  it("retoma la última ruta activa con ronda en curso", () => {
    const session = sessionFor("/mixed", 2000);
    const state: StoredPracticeState = {
      version: 1,
      lastRoute: "/mixed",
      sessions: { "/mixed": session },
      evaluations: {},
    };

    const summary = selectHomeState(state);

    expect(summary.continueRoute).toBe("/mixed");
    expect(summary.lastSessionRoute).toBe("/mixed");
    expect(summary.lastSessionPending).toBe(2);
    expect(isContinuableSession("/mixed", session)).toBe(true);
  });

  it("una sesión completa sin pendientes no ofrece Continue pero conserva última", () => {
    const session = {
      ...sessionFor("/collocations", 1000),
      phase: "summary" as const,
      reviewItems: [],
      ratings: { "vocabulary:a": "known" as const, "vocabulary:b": "known" as const },
      roundRatings: { "vocabulary:a": "known" as const, "vocabulary:b": "known" as const },
    };
    const state: StoredPracticeState = {
      version: 1,
      lastRoute: "/collocations",
      sessions: { "/collocations": session },
      evaluations: {
        "vocabulary:a": { rating: "known", fingerprint: "fp-a", updatedAt: 1000 },
      },
    };

    const summary = selectHomeState(state);

    expect(summary.continueRoute).toBeNull();
    expect(summary.lastSessionRoute).toBe("/collocations");
    expect(summary.lastSessionPending).toBe(0);
    expect(isContinuableSession("/collocations", session)).toBe(false);
  });

  it("un resumen con pendientes de repaso sí ofrece Continue", () => {
    const session = {
      ...sessionFor("/idioms", 1500),
      phase: "summary" as const,
      reviewItems: [ref("b")],
      ratings: { "vocabulary:a": "known" as const, "vocabulary:b": "unknown" as const },
      roundRatings: { "vocabulary:a": "known" as const, "vocabulary:b": "unknown" as const },
    };
    const state: StoredPracticeState = {
      version: 1,
      lastRoute: "/idioms",
      sessions: { "/idioms": session },
      evaluations: {
        "vocabulary:b": { rating: "unknown", fingerprint: "fp-b", updatedAt: 1500 },
      },
    };

    const summary = selectHomeState(state);

    expect(summary.continueRoute).toBe("/idioms");
    expect(summary.lastSessionPending).toBe(1);
    expect(countSessionPending(session)).toBe(1);
  });

  it("una sesión inválida o cerrada no genera enlace roto", () => {
    const broken = { route: "/broken" } as never;
    const mismatched = { ...sessionFor("/mixed", 1000), route: "/other" };
    const valid = sessionFor("/prepositions", 2000);
    const state: StoredPracticeState = {
      version: 1,
      lastRoute: "/broken",
      sessions: {
        "/broken": broken,
        "/mixed": mismatched,
        "/prepositions": valid,
      },
      evaluations: {},
    };

    const summary = selectHomeState(state);

    // lastRoute inválido: cae a la retomable más reciente, nunca a la rota.
    expect(summary.continueRoute).toBe("/prepositions");
    expect(summary.lastSessionRoute).toBe("/prepositions");
    expect(isContinuableSession("/broken", broken as never)).toBe(false);
    expect(isContinuableSession("/mixed", mismatched)).toBe(false);
  });

  it("cuenta dificultades una vez por ítem, sin sumar intentos repetidos", () => {
    const state: StoredPracticeState = {
      ...emptyPracticeState(),
      evaluations: {
        "vocabulary:a": { rating: "almost", fingerprint: "fp-a", updatedAt: 1000 },
        "vocabulary:b": { rating: "unknown", fingerprint: "fp-b", updatedAt: 1000 },
        "vocabulary:c": { rating: "skipped", fingerprint: "fp-c", updatedAt: 1000 },
        "vocabulary:d": { rating: "known", fingerprint: "fp-d", updatedAt: 1000 },
        "word-formation:run": { rating: "unknown", fingerprint: "fp-run", updatedAt: 1000 },
      },
    };

    // Cinco claves, una conocida: cuatro dificultades, aunque un ítem se haya
    // intentado varias veces solo ocupa una clave.
    expect(countDifficultEvaluations(state)).toBe(4);
    expect(selectHomeState(state).difficultCount).toBe(4);
  });

  it("tolera almacenamiento deshabilitado o corrupto parcial", () => {
    expect(selectHomeState(emptyPracticeState()).continueRoute).toBeNull();
    expect(homeRouteLabel("/mixed")).toBe("Mixed Practice");
    expect(homeRouteLabel("/grammar/parte-1/present-simple-present-progressive")).toContain(
      "Grammar",
    );
    expect(homeRouteLabel("/word-formation")).toBe("Word Formation");
  });
});
