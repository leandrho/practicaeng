import { useEffect, useMemo, useRef, useState } from "react";
import type { WordFamily } from "../../src/domain/word-formation";
import {
  countPracticeResults,
  createPracticeSession,
  finishPracticeRound,
  getPracticeAttempt,
  getPracticeRoundItems,
  hasPracticeProgress,
  isPracticeRoundComplete,
  practiceKey,
  practiceSelectionsEqual,
  ratePracticeCard,
  setPracticeAttempt,
  setPracticeIndex,
  startPracticeReview,
  type PracticeResultCounts,
  type PracticeSelection,
  type PracticeSession,
} from "../../src/application/practice-session";
import {
  assignWordFormationRefs,
  fingerprintWordFamily,
  indexWordFormationFamilies,
  normalizeWordFormationBase,
} from "../../src/application/word-formation-id";
import { checkGapFill } from "../../src/application/checkGapFill";
import { shuffle } from "../../src/application/shuffle";
import {
  getPracticeStorageBackend,
  loadPracticeState,
  savePracticeState,
  type PracticeStorageBackend,
} from "../../src/infrastructure/ui/practice-storage";

export type WordFormationPracticeArgs = {
  route: string;
  /** Mazo canónico completo de la ruta (orden de archivo) para IDs/validación. */
  allFamilies: WordFamily[];
  /** Mazo filtrado en orden canónico (sin limitar ni barajar). */
  filteredFamilies: WordFamily[];
  selection: PracticeSelection;
  /** Cambia para forzar una sesión nueva con la misma selección (reshuffle). */
  reshuffleCount?: number;
  backend?: PracticeStorageBackend;
  /** `false` = práctica efímera en memoria, sin leer ni escribir storage. */
  persist?: boolean;
  onProgressChange?: (hasProgress: boolean) => void;
};

export type WordFormationPractice = {
  hydrated: boolean;
  session: PracticeSession | null;
  roundFamilies: WordFamily[];
  roundKeys: string[];
  index: number;
  revealed: boolean;
  counts: PracticeResultCounts;
  pendingCount: number;
  hasProgress: boolean;
  isRoundComplete: boolean;
  atStart: boolean;
  atEnd: boolean;
  checkAnswer: (guess: string) => { correct: boolean };
  reveal: () => void;
  skip: () => void;
  goPrev: () => void;
  goNext: () => void;
  finishRound: () => void;
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

function deckSignature(families: readonly WordFamily[]): string {
  return families
    .map(
      (family) =>
        `${normalizeWordFormationBase(family.base)}::${family.category}`,
    )
    .join("\n");
}

/**
 * Orquesta la sesión corta de Word Formation (SPEC 31):
 * selección inicial de hasta 10 familias, reanudación oculta, intentos
 * persistidos, evaluación automática (acierto limpio → known, fallo previo
 * o Reveal → unknown, Skip → skipped) y repaso a pedido.
 */
export function useWordFormationPractice(
  args: WordFormationPracticeArgs,
): WordFormationPractice {
  const {
    route,
    allFamilies,
    filteredFamilies,
    selection,
    reshuffleCount = 0,
    backend: backendProp,
    persist = true,
    onProgressChange,
  } = args;

  const [revealed, setRevealed] = useState(false);
  const [sessionNonce, setSessionNonce] = useState(0);
  const appliedRef = useRef<{
    selectionKey: string;
    nonceKey: string;
    deckKey: string;
  } | null>(null);

  const backend = useMemo(
    () => backendProp ?? getPracticeStorageBackend(),
    [backendProp],
  );

  const familyIndex = useMemo(
    () => indexWordFormationFamilies(allFamilies),
    [allFamilies],
  );

  const allRefs = useMemo(
    () => assignWordFormationRefs(allFamilies),
    [allFamilies],
  );

  const familyToRef = useMemo(() => {
    const map = new Map<WordFamily, { id: string; fingerprint: string }>();
    allFamilies.forEach((family, position) => {
      const ref = allRefs[position];
      if (ref !== undefined) {
        map.set(family, ref);
      }
    });
    return map;
  }, [allFamilies, allRefs]);

  const signature = useMemo(
    () => deckSignature(filteredFamilies),
    [filteredFamilies],
  );

  const selectionKey = [
    route,
    selection.level ?? "",
    selection.category ?? "",
    selection.order,
  ].join("|");
  const nonceKey = `${reshuffleCount}|${sessionNonce}`;
  const deckKey = `${filteredFamilies.length}|${signature}`;
  if (appliedRef.current === null) {
    appliedRef.current = { selectionKey, nonceKey, deckKey };
  }

  function sessionRefsValid(candidate: PracticeSession): boolean {
    const refs = [...candidate.items, ...candidate.reviewItems];
    return refs.every((ref) => {
      if (ref.kind !== "word-formation") {
        return false;
      }
      const entry = familyIndex.get(ref.id);
      return (
        entry !== undefined && entry.ref.fingerprint === ref.fingerprint
      );
    });
  }

  function buildSessionDeck(): WordFamily[] {
    const ordered =
      selection.order === "ordered"
        ? [...filteredFamilies]
        : shuffle(filteredFamilies);
    return ordered.slice(0, 10);
  }

  function buildRefsForDeck(deck: WordFamily[]) {
    return deck.map((family) => {
      const known = familyToRef.get(family);
      if (known !== undefined) {
        return { kind: "word-formation" as const, ...known };
      }
      // Fuera del mazo canónico (no debería pasar): referencia ad hoc.
      return {
        kind: "word-formation" as const,
        id: normalizeWordFormationBase(family.base),
        fingerprint: fingerprintWordFamily(family),
      };
    });
  }

  function createSession(): PracticeSession | null {
    if (filteredFamilies.length === 0) {
      return null;
    }
    return createPracticeSession(
      route,
      buildRefsForDeck(buildSessionDeck()),
      selection,
    );
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
      // Invalida solo las evaluaciones de familias afectadas por el contenido
      // vigente; las demás evaluaciones (vocabulario, grammar) permanecen.
      for (const [key, evaluation] of Object.entries(stored.evaluations)) {
        const separator = key.indexOf(":");
        if (separator < 0) {
          delete stored.evaluations[key];
          continue;
        }
        if (key.slice(0, separator) !== "word-formation") {
          continue;
        }
        const entry = familyIndex.get(key.slice(separator + 1));
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

  // Sesión inicial: reanuda la válida o crea una nueva. Solo se usa tras
  // Suspense con `useSearchParams`, es decir, siempre en cliente.
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
          if (kind !== "word-formation") {
            return true;
          }
          const entry = familyIndex.get(id);
          return (
            entry !== undefined &&
            entry.ref.fingerprint === evaluation.fingerprint
          );
        },
      });
      const candidate = stored.sessions[route];
      if (
        candidate !== undefined &&
        practiceSelectionsEqual(candidate.selection, selection)
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

  // Cambios autorizados de selección o nonce: sesión nueva. Si solo cambió
  // el contenido pero las referencias siguen válidas, se conserva la sesión.
  useEffect(() => {
    const applied = appliedRef.current;
    if (
      applied !== null &&
      applied.selectionKey === selectionKey &&
      applied.nonceKey === nonceKey &&
      applied.deckKey === deckKey
    ) {
      return;
    }
    const selectionChanged =
      applied === null || applied.selectionKey !== selectionKey;
    const nonceChanged = applied === null || applied.nonceKey !== nonceKey;
    appliedRef.current = { selectionKey, nonceKey, deckKey };
    if (!selectionChanged && !nonceChanged) {
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
  }, [selectionKey, nonceKey, deckKey]);

  // Persiste índice, fase, intentos y resultados en cada cambio (incluida la
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
  const roundFamilies = useMemo(
    () =>
      roundRefs
        .map((ref) => familyIndex.get(ref.id)?.family)
        .filter((family): family is WordFamily => family !== undefined),
    // roundRefs es un array nuevo por render; la identidad útil es la sesión.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session, familyIndex],
  );
  const roundKeys = useMemo(
    () => roundRefs.map((ref) => practiceKey(ref)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session],
  );

  const total = roundFamilies.length;
  const index = session?.index ?? 0;
  const counts = session === null ? EMPTY_COUNTS : countPracticeResults(session);
  const pendingCount = session?.reviewItems.length ?? 0;
  const hasProgress =
    session === null ? false : hasPracticeProgress(session);
  const isRoundComplete =
    session !== null && isPracticeRoundComplete(session);

  function currentRefKey(): string | null {
    if (session === null || session.phase === "summary") {
      return null;
    }
    const round = getPracticeRoundItems(session);
    const currentRef = round[session.index];
    if (currentRef === undefined) {
      return null;
    }
    return practiceKey(currentRef);
  }

  function checkAnswer(guess: string): { correct: boolean } {
    const family = roundFamilies[index] ?? null;
    if (session === null || family === undefined || family === null) {
      return { correct: false };
    }
    if (session.phase === "summary") {
      return { correct: false };
    }
    const key = currentRefKey();
    if (key === null) {
      return { correct: false };
    }
    const { correct } = checkGapFill(guess, family.exercise.acceptedAnswers);
    if (!correct) {
      setSession((current) => {
        if (current === null || current.phase === "summary") {
          return current;
        }
        const round = getPracticeRoundItems(current);
        const ref = round[current.index];
        if (ref === undefined) {
          return current;
        }
        const refKey = practiceKey(ref);
        const attempted = setPracticeAttempt(current, refKey, {
          hadIncorrectAttempt: true,
        });
        // El primer fallo se guarda hasta que se concluya el ejercicio; si
        // ya había una evaluación (p. ej. acertó y volvió a intentar), se
        // actualiza inmediatamente para que no quede como known.
        if (attempted.roundRatings[refKey] === undefined) {
          return attempted;
        }
        return ratePracticeCard(attempted, refKey, "unknown");
      });
      return { correct: false };
    }
    setSession((current) => {
      if (current === null || current.phase === "summary") {
        return current;
      }
      const round = getPracticeRoundItems(current);
      const ref = round[current.index];
      if (ref === undefined) {
        return current;
      }
      const refKey = practiceKey(ref);
      const hadIncorrect =
        getPracticeAttempt(current, refKey)?.hadIncorrectAttempt === true;
      // Un error inicial cuenta como dificultad aunque después se corrija.
      const alreadyRevealedWithoutSuccess =
        current.roundRatings[refKey] === "unknown" && !hadIncorrect;
      return ratePracticeCard(
        current,
        refKey,
        hadIncorrect || alreadyRevealedWithoutSuccess ? "unknown" : "known",
      );
    });
    return { correct: true };
  }

  function reveal() {
    setSession((current) => {
      if (current === null || current.phase === "summary") {
        return current;
      }
      const round = getPracticeRoundItems(current);
      const ref = round[current.index];
      if (ref === undefined) {
        return current;
      }
      const refKey = practiceKey(ref);
      // Reveal sin acierto previo marca `unknown`; si ya se acertó, conserva
      // la evaluación y solo muestra la familia.
      if (Object.prototype.hasOwnProperty.call(current.roundRatings, refKey)) {
        return current;
      }
      return ratePracticeCard(current, refKey, "unknown");
    });
    setRevealed(true);
  }

  function skip() {
    setSession((current) => {
      if (current === null || current.phase === "summary") {
        return current;
      }
      const round = getPracticeRoundItems(current);
      const ref = round[current.index];
      if (ref === undefined) {
        return current;
      }
      const refKey = practiceKey(ref);
      if (Object.prototype.hasOwnProperty.call(current.roundRatings, refKey)) {
        return current;
      }
      const hadIncorrect =
        getPracticeAttempt(current, refKey)?.hadIncorrectAttempt === true;
      let next = ratePracticeCard(
        current,
        refKey,
        hadIncorrect ? "unknown" : "skipped",
      );
      if (isPracticeRoundComplete(next)) {
        return next;
      }
      // Avanza al próximo pendiente para no trabar el repaso; el frente del
      // próximo ejercicio reaparece oculto.
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
          try {
            next = setPracticeIndex(next, candidate);
          } catch {
            // Índice inválido: conserva la posición actual.
          }
          break;
        }
      }
      return next;
    });
    setRevealed(false);
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

  function finishRound() {
    setSession((current) => {
      if (current === null) {
        return current;
      }
      if (!isPracticeRoundComplete(current)) {
        return current;
      }
      return finishPracticeRound(current);
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
    // Sin confirmación destructiva desde el resumen: nueva selección del mazo.
    setSessionNonce((nonce) => nonce + 1);
    setRevealed(false);
  }

  return {
    hydrated: true,
    session,
    roundFamilies,
    roundKeys,
    index,
    revealed,
    counts,
    pendingCount,
    hasProgress,
    isRoundComplete,
    atStart: total === 0 || index === 0,
    atEnd: total === 0 || index === total - 1,
    checkAnswer,
    reveal,
    skip,
    goPrev,
    goNext,
    finishRound,
    startReview,
    startNewSession,
  };
}
