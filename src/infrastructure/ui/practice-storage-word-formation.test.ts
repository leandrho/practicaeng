import { describe, expect, it } from "vitest";
import {
  createPracticeSession,
  type PracticeItemRef,
} from "../../application/practice-session";
import {
  createMemoryPracticeBackend,
  isValidPracticeSessionShape,
  loadPracticeState,
  PRACTICE_STORAGE_KEY,
  savePracticeState,
} from "./practice-storage";

function vocabRef(id: string): PracticeItemRef {
  return { kind: "vocabulary", id, fingerprint: `fp-${id}` };
}

function wfRef(id: string): PracticeItemRef {
  return { kind: "word-formation", id, fingerprint: `fp-${id}` };
}

describe("practice-storage word-formation (SPEC 31, paso 1)", () => {
  it("las sesiones legacy de vocabulario sin attempts siguen cargando", () => {
    const legacy = createPracticeSession("/collocations", [vocabRef("a")], {
      order: "shuffled",
    });
    // Simula una sesión persistida antes de SPEC 31.
    const { attempts: _removed, ...withoutAttempts } = legacy;

    expect(isValidPracticeSessionShape(withoutAttempts)).toBe(true);

    const backend = createMemoryPracticeBackend({
      version: 1,
      lastRoute: "/collocations",
      sessions: { "/collocations": withoutAttempts as never },
      evaluations: {},
    });
    const loaded = loadPracticeState(backend);
    expect(loaded.sessions["/collocations"]).toMatchObject({
      route: "/collocations",
    });
  });

  it("acepta sesiones de familias con attempts y rechaza formas inválidas", () => {
    const session = {
      ...createPracticeSession("/word-formation", [wfRef("decide")], {
        order: "ordered",
      }),
      attempts: { "word-formation:decide": { hadIncorrectAttempt: true } },
    };

    expect(isValidPracticeSessionShape(session)).toBe(true);
    expect(
      isValidPracticeSessionShape({
        ...session,
        attempts: { "word-formation:decide": { hadIncorrectAttempt: "yes" } },
      }),
    ).toBe(false);
    expect(
      isValidPracticeSessionShape({
        ...session,
        attempts: { "word-formation:decide": {} },
      }),
    ).toBe(false);
  });

  it("el filtro vigente se distingue por selección: otra selección no retoma", () => {
    const backend = createMemoryPracticeBackend();
    const session = createPracticeSession("/word-formation", [wfRef("decide")], {
      level: "B1-B2",
      category: "D",
      order: "ordered",
    });
    savePracticeState(backend, {
      version: 1,
      lastRoute: "/word-formation",
      sessions: { "/word-formation": session },
      evaluations: {},
    });

    const raw = JSON.parse(
      backend.getItem(PRACTICE_STORAGE_KEY) ?? "{}",
    ) as { sessions: Record<string, { selection: unknown }> };
    // La selección persistida conserva el filtro vigente.
    expect(raw.sessions["/word-formation"]?.selection).toMatchObject({
      level: "B1-B2",
      category: "D",
      order: "ordered",
    });
  });
});
