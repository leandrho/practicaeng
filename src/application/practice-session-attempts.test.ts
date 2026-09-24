import { describe, expect, it } from "vitest";
import {
  createPracticeSession,
  getPracticeAttempt,
  hasPracticeProgress,
  ratePracticeCard,
  setPracticeAttempt,
  startPracticeReview,
  finishPracticeRound,
  practiceKey,
  type PracticeItemRef,
} from "./practice-session";

function ref(id: string, kind: PracticeItemRef["kind"] = "word-formation"): PracticeItemRef {
  return { kind, id, fingerprint: `fp-${id}` };
}

describe("practice-session attempts (SPEC 31)", () => {
  it("crea sesiones con attempts vacío y lo conserva al calificar", () => {
    const session = createPracticeSession("/word-formation", [ref("decide")], {
      order: "ordered",
    });

    expect(session.attempts).toEqual({});

    const rated = ratePracticeCard(session, "word-formation:decide", "known");
    expect(rated.attempts).toEqual({});
    expect(session.attempts).toEqual({});
  });

  it("persiste el fallo previo aunque se recargue antes de avanzar", () => {
    const session = createPracticeSession("/word-formation", [ref("decide")], {
      order: "ordered",
    });
    const key = practiceKey(session.items[0]!);

    const withAttempt = setPracticeAttempt(session, key, {
      hadIncorrectAttempt: true,
    });

    expect(getPracticeAttempt(withAttempt, key)).toEqual({
      hadIncorrectAttempt: true,
    });
    // Serializable: sobrevive a JSON (recarga).
    const reloaded = JSON.parse(JSON.stringify(withAttempt)) as typeof withAttempt;
    expect(getPracticeAttempt(reloaded, key)).toEqual({
      hadIncorrectAttempt: true,
    });
  });

  it("un intento fallido cuenta como progreso para confirmar filtros", () => {
    const fresh = createPracticeSession("/word-formation", [ref("a"), ref("b")], {
      order: "ordered",
    });
    expect(hasPracticeProgress(fresh)).toBe(false);

    const attempted = setPracticeAttempt(fresh, "word-formation:a", {
      hadIncorrectAttempt: true,
    });
    expect(hasPracticeProgress(attempted)).toBe(true);

    const summary = finishPracticeRound(
      ratePracticeCard(attempted, "word-formation:a", "unknown"),
    );
    expect(hasPracticeProgress(summary)).toBe(false);
  });

  it("el repaso vacía attempts para reevaluar la dificultad", () => {
    let session = createPracticeSession("/word-formation", [ref("a"), ref("b")], {
      order: "ordered",
    });
    session = setPracticeAttempt(session, "word-formation:a", {
      hadIncorrectAttempt: true,
    });
    session = ratePracticeCard(session, "word-formation:a", "unknown");
    session = ratePracticeCard(session, "word-formation:b", "known");
    session = finishPracticeRound(session);
    session = startPracticeReview(session);

    expect(session.attempts).toEqual({});
    expect(session.roundRatings).toEqual({});
  });
});
