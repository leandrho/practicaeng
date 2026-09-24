import { useEffect, useMemo, useRef, useState } from "react";
import type { GrammarExercise } from "../../src/domain/grammar";
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
  type PracticeRating,
  type PracticeResultCounts,
  type PracticeSelection,
  type PracticeSession,
} from "../../src/application/practice-session";
import {
  assignGrammarRefs,
  fingerprintGrammarExercise,
  indexGrammarExercises,
  normalizeGrammarSlug,
} from "../../src/application/grammar-id";
import {
  getPracticeStorageBackend,
  loadPracticeState,
  savePracticeState,
  type PracticeStorageBackend,
} from "../../src/infrastructure/ui/practice-storage";

export type GrammarPracticeArgs = {
  route: string;
  part: number;
  slug: string;
  /** Ejercicios del tema en orden pedagógico (sin limitar; el hook acota a 10). */
  exercises: GrammarExercise[];
  backend?: PracticeStorageBackend;
  /** `false` = práctica efímera en memoria, sin leer ni escribir storage. */
  persist?: boolean;
  onProgressChange?: (hasProgress: boolean) => void;
};

export type GrammarPractice = {
  hydrated: boolean;
  session: PracticeSession | null;
  roundExercises: GrammarExercise[];
  roundKeys: string[];
  index: number;
  revealed: boolean;
  counts: PracticeResultCounts;
  pendingCount: number;
  hasProgress: boolean;
  atStart: boolean;
  atEnd: boolean;
  reveal: () => void;
  rate: (rating: PracticeRating) => void;
  skip: () => void;
  goPrev: () => void;
  goNext: () => void;
  startReview: () => void;
  startNewSession: () => void;
};

const EMPTY_COUNTS: PracticeResultCounts = {
  known: 0,
  almost: 0,
  unknown: 0,
  skipped: 0,
  unrated: 0,
  total: 0,
};

const GRAMMAR_SELECTION: PracticeSelection = { order: "ordered" };

function deckSignature(exercises: readonly GrammarExercise[]): string {
  return exercises
    .map((exercise) => fingerprintGrammarExercise(exercise))
    .join("\n");
}

/**
 * Orquesta la sesión corta de Grammar (SPEC 32):
 * selección inicial de hasta 10 ejercicios del tema en orden pedagógico,
 * reanudación oculta por ruta, autoevaluación con Reveal previo, omisión
 * explícita y repaso a pedido solo del tema actual.
 */
export function useGrammarPractice(args: GrammarPracticeArgs): GrammarPractice {
  const {
    route,
    part,
    slug,
    exercises,
    backend: backendProp,
    persist = true,
    onProgressChange,
  } = args;

  const normalizedSlug = normalizeGrammarSlug(slug);

  const [revealed, setRevealed] = useState(false);
  const [sessionNonce, setSessionNonce] = useState(0);
  const appliedRef = useRef<{ nonceKey: string; deckKey: string } | null>(null);

  const backend = useMemo(
    () => backendProp ?? getPracticeStorageBackend(),
    [backendProp],
  );

  const exerciseIndex = useMemo(
    () => indexGrammarExercises(part, normalizedSlug, exercises),
    [part, normalizedSlug, exercises],
  );

  const allRefs = useMemo(
    () => assignGrammarRefs(part, normalizedSlug, exercises),
    [part, normalizedSlug, exercises],
  );

  const signature = useMemo(() => deckSignature(exercises), [exercises]);

  const nonceKey = `${sessionNonce}`;
  const deckKey = `${part}|${normalizedSlug}|${exercises.length}|${signature}`;
  if (appliedRef.current === null) {
    appliedRef.current = { nonceKey, deckKey };
  }

  function sessionRefsValid(candidate: PracticeSession): boolean {
    const refs = [...candidate.items, ...candidate.reviewItems];
    return refs.every((ref) => {
      if (ref.kind !== "grammar") {
        return false;
      }
      const entry = exerciseIndex.get(ref.id);
      return (
        entry !== undefined && entry.ref.fingerprint === ref.fingerprint
      );
    });
  }

  function buildSessionDeck(): { deck: GrammarExercise[]; refs: { kind: "grammar"; id: string; fingerprint: string }[] } {
    const deck = exercises.slice(0, 10);
    const refs = allRefs.slice(0, deck.length).map((ref) => ({
      kind: "grammar" as const,
      id: ref.id,
      fingerprint: ref.fingerprint,
    }));
    return { deck, refs };
  }

  function createSession(): PracticeSession | null {
    if (exercises.length === 0) {
      return null;
    }
    const { refs } = buildSessionDeck();
    return createPracticeSession(route, refs, GRAMMAR_SELECTION);
  }

  function persistSession(next: PracticeSession | null) {
    if (!persist) {
      return;
    }
    const stored = loadPracticeState(backend);
    if (next === null) {
      delete stored.sessions[route];
    } else {
      stored.sessions[route] = next;
      stored.lastRoute = route;
      const byId = new Map<string, string>();
      for (const ref of [...next.items, ...next.reviewItems]) {
        byId.set(`${ref.kind}:${ref.id}`, ref.fingerprint);
      }
      for (const [key, rating] of Object.entries(next.ratings)) {
        const fingerprint = byId.get(key);
        if (fingerprint !== undefined) {
          stored.evaluations[key] = {
            rating,
            fingerprint,
            updatedAt: next.updatedAt,
          };
        }
      }
      // Invalida solo las evaluaciones de ejercicios afectados por el
      // contenido vigente; las demás evaluaciones permanecen.
      for (const [key, evaluation] of Object.entries(stored.evaluations)) {
        const separator = key.indexOf(":");
        if (separator < 0) {
          delete stored.evaluations[key];
          continue;
        }
        if (key.slice(0, separator) !== "grammar") {
          continue;
        }
        const entry = exerciseIndex.get(key.slice(separator + 1));
        if (
          entry === undefined ||
          entry.ref.fingerprint !== evaluation.fingerprint
        ) {
          delete stored.evaluations[key];
        }
      }
    }
    savePracticeState(backend, stored);
  }

  // Sesión inicial: reanuda la válida o crea una nueva. Solo se usa en
  // cliente (`"use client"`), así que leer el storage aquí no desincroniza.
  function readStoredSession(): PracticeSession | null {
    let next: PracticeSession | null = null;
    if (persist) {
      const stored = loadPracticeState(backend, {
        isSessionValid: (candidate) =>
          candidate.route === route && sessionRefsValid(candidate),
        isEvaluationValid: (key, evaluation) => {
          const separator = key.indexOf(":");
          if (separator < 0) {
            return false;
          }
          const kind = key.slice(0, separator);
          const id = key.slice(separator + 1);
          if (kind !== "grammar") {
            return true;
          }
          const entry = exerciseIndex.get(id);
          return (
            entry !== undefined &&
            entry.ref.fingerprint === evaluation.fingerprint
          );
        },
      });
      const candidate = stored.sessions[route];
      if (
        candidate !== undefined &&
        practiceSelectionsEqual(candidate.selection, GRAMMAR_SELECTION)
      ) {
        next = candidate;
      }
    }
    if (next === null) {
      next = createSession();
    }
    return next;
  }

  const [session, setSession] = useState<PracticeSession | null>(readStoredSession);

  // Sesión nueva solo por nonce o contenido inválido. Sin filtros ni orden:
  // si solo cambió el contenido pero las referencias siguen válidas, se
  // conserva la sesión.
  useEffect(() => {
    const applied = appliedRef.current;
    if (
      applied !== null &&
      applied.nonceKey === nonceKey &&
      applied.deckKey === deckKey
    ) {
      return;
    }
    const nonceChanged = applied === null || applied.nonceKey !== nonceKey;
    appliedRef.current = { nonceKey, deckKey };
    if (!nonceChanged) {
      setSession((current) => {
        if (current !== null && sessionRefsValid(current)) {
          return current;
        }
        const next = createSession();
        persistSession(next);
        return next;
      });
    } else {
      const next = createSession();
      persistSession(next);
      setSession(next);
    }
    setRevealed(false);
    // Intencionalmente atado a las llaves, no a cada objeto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonceKey, deckKey]);

  // Persiste índice, fase y resultados en cada cambio (incluida la
  // sesión inicial recién creada).
  useEffect(() => {
    if (!persist) {
      return;
    }
    persistSession(session);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    onProgressChange?.(session === null ? false : hasPracticeProgress(session));
  }, [session, onProgressChange]);

  const roundRefs = session === null ? [] : getPracticeRoundItems(session);
  const roundExercises = useMemo(
    () =>
      roundRefs
        .map((ref) => exerciseIndex.get(ref.id)?.exercise)
        .filter((exercise): exercise is GrammarExercise => exercise !== undefined),
    // roundRefs es un array nuevo por render; la identidad útil es la sesión.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session, exerciseIndex],
  );
  const roundKeys = useMemo(
    () => roundRefs.map((ref) => practiceKey(ref)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session],
  );

  const total = roundExercises.length;
  const index = session?.index ?? 0;
  const counts = session === null ? EMPTY_COUNTS : countPracticeResults(session);
  const pendingCount = session?.reviewItems.length ?? 0;
  const hasProgress =
    session === null ? false : hasPracticeProgress(session);

  function reveal() {
    setRevealed(true);
  }

  function rateInRound(rating: PracticeRating) {
    setSession((current) => {
      if (current === null || current.phase === "summary") {
        return current;
      }
      const round = getPracticeRoundItems(current);
      const currentRef = round[current.index];
      if (currentRef === undefined) {
        return current;
      }
      let next = ratePracticeCard(
        current,
        practiceKey(currentRef),
        rating,
      );
      if (isPracticeRoundComplete(next)) {
        return finishPracticeRound(next);
      }
      const active = getPracticeRoundItems(next);
      for (let offset = 1; offset <= active.length; offset += 1) {
        const candidate = (next.index + offset) % active.length;
        const candidateRef = active[candidate];
        if (
          candidateRef !== undefined &&
          !Object.prototype.hasOwnProperty.call(
            next.roundRatings,
            practiceKey(candidateRef),
          )
        ) {
          next = setPracticeIndex(next, candidate);
          break;
        }
      }
      return next;
    });
    setRevealed(false);
  }

  function rate(rating: PracticeRating) {
    if (rating === "skipped") {
      return;
    }
    rateInRound(rating);
  }

  function skip() {
    rateInRound("skipped");
  }

  function goPrev() {
    setSession((current) => {
      if (current === null || current.phase === "summary") {
        return current;
      }
      if (current.index <= 0) {
        return current;
      }
      return setPracticeIndex(current, current.index - 1);
    });
    setRevealed(false);
  }

  function goNext() {
    setSession((current) => {
      if (current === null || current.phase === "summary") {
        return current;
      }
      const round = getPracticeRoundItems(current);
      if (current.index >= round.length - 1) {
        return current;
      }
      return setPracticeIndex(current, current.index + 1);
    });
    setRevealed(false);
  }

  function startReview() {
    setSession((current) => {
      if (current === null) {
        return current;
      }
      try {
        return startPracticeReview(current);
      } catch {
        return current;
      }
    });
    setRevealed(false);
  }

  function startNewSession() {
    // Sin confirmación destructiva desde el resumen: nueva sesión del tema.
    setSessionNonce((nonce) => nonce + 1);
    setRevealed(false);
  }

  return {
    hydrated: true,
    session,
    roundExercises,
    roundKeys,
    index,
    revealed,
    counts,
    pendingCount,
    hasProgress,
    atStart: total === 0 || index === 0,
    atEnd: total === 0 || index === total - 1,
    reveal,
    rate,
    skip,
    goPrev,
    goNext,
    startReview,
    startNewSession,
  };
}
