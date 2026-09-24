import { describe, expect, it } from "vitest";
import {
  createPracticeSession,
  type PracticeItemRef,
} from "../../application/practice-session";
import {
  createMemoryPracticeBackend,
  emptyPracticeState,
  isValidPracticeSessionShape,
  loadPracticeState,
  PRACTICE_STORAGE_KEY,
  savePracticeState,
  type PracticeStorageBackend,
  type StoredPracticeState,
} from "./practice-storage";

function ref(id: string, fingerprint = `fp-${id}`): PracticeItemRef {
  return { kind: "vocabulary", id, fingerprint };
}

function sessionFor(route: string) {
  return createPracticeSession(
    route,
    [ref("a"), ref("b")],
    { order: "shuffled" },
    1000,
  );
}

function throwingBackend(): PracticeStorageBackend {
  return {
    getItem: () => {
      throw new Error("denied");
    },
    setItem: () => {
      throw new Error("denied");
    },
  };
}

describe("practice-storage", () => {
  it("devuelve estado vacío sin storage", () => {
    expect(loadPracticeState(null)).toEqual(emptyPracticeState());
    expect(loadPracticeState(undefined)).toEqual(emptyPracticeState());
    expect(() => savePracticeState(null, emptyPracticeState())).not.toThrow();
    expect(() =>
      savePracticeState(throwingBackend(), emptyPracticeState()),
    ).not.toThrow();
    expect(loadPracticeState(throwingBackend())).toEqual(
      emptyPracticeState(),
    );
  });

  it("tolera contenido corrupto o con versión distinta", () => {
    const backend = createMemoryPracticeBackend();
    backend.setItem(PRACTICE_STORAGE_KEY, "not-json{{{");
    expect(loadPracticeState(backend)).toEqual(emptyPracticeState());

    backend.setItem(
      PRACTICE_STORAGE_KEY,
      JSON.stringify({ version: 2, sessions: {}, evaluations: {} }),
    );
    expect(loadPracticeState(backend)).toEqual(emptyPracticeState());
  });

  it("conserva sesiones válidas y descarta solo las inválidas", () => {
    const backend = createMemoryPracticeBackend();
    const state: StoredPracticeState = {
      version: 1,
      lastRoute: "/collocations",
      sessions: {
        "/collocations": sessionFor("/collocations"),
        "/broken": { route: "/broken" } as never,
      },
      evaluations: {},
    };
    savePracticeState(backend, state);

    const loaded = loadPracticeState(backend);

    expect(loaded.lastRoute).toBe("/collocations");
    expect(Object.keys(loaded.sessions)).toEqual(["/collocations"]);
  });

  it("descarta la sesión afectada por contenido cambiado y mantiene el resto", () => {
    const backend = createMemoryPracticeBackend();
    const state: StoredPracticeState = {
      version: 1,
      lastRoute: null,
      sessions: {
        "/collocations": sessionFor("/collocations"),
        "/idioms": sessionFor("/idioms"),
      },
      evaluations: {
        "vocabulary:a": {
          rating: "known",
          fingerprint: "fp-a",
          updatedAt: 1000,
        },
        "vocabulary:stale": {
          rating: "almost",
          fingerprint: "fp-old",
          updatedAt: 1000,
        },
      },
    };
    savePracticeState(backend, state);

    const loaded = loadPracticeState(backend, {
      isSessionValid: (session) => session.route !== "/collocations",
      isEvaluationValid: (key) => key !== "vocabulary:stale",
    });

    expect(Object.keys(loaded.sessions)).toEqual(["/idioms"]);
    expect(Object.keys(loaded.evaluations)).toEqual(["vocabulary:a"]);
  });

  it("limita el índice a la ronda activa sin descartar la sesión", () => {
    const backend = createMemoryPracticeBackend();
    const session = { ...sessionFor("/collocations"), index: 99 };
    savePracticeState(backend, {
      version: 1,
      lastRoute: null,
      sessions: { "/collocations": session },
      evaluations: {},
    });

    const loaded = loadPracticeState(backend);

    expect(loaded.sessions["/collocations"]?.index).toBe(1);
  });

  it("valida la forma de la sesión", () => {
    expect(isValidPracticeSessionShape(sessionFor("/x"))).toBe(true);
    expect(isValidPracticeSessionShape({})).toBe(false);
    expect(
      isValidPracticeSessionShape({ ...sessionFor("/x"), items: [] }),
    ).toBe(false);
    expect(
      isValidPracticeSessionShape({
        ...sessionFor("/x"),
        selection: { order: "random" },
      }),
    ).toBe(false);
  });
});
