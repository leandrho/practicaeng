import { useEffect, useMemo, useRef, useState } from "react";
import type { Card } from "../../src/domain/card";
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
  assignVocabularyRefs,
  fingerprintCard,
  indexVocabularyCards,
} from "../../src/application/practice-id";
import { shuffle } from "../../src/application/shuffle";
import {
  getPracticeStorageBackend,
  loadPracticeState,
  savePracticeState,
  type PracticeStorageBackend,
} from "../../src/infrastructure/ui/practice-storage";

export type VocabularyPracticeArgs = {
  route: string;
  /** Mazo canónico completo de la ruta (orden de archivo) para IDs/validación. */
  allCards: Card[];
  /** Mazo filtrado en orden canónico (sin limitar ni barajar). */
  filteredCards: Card[];
  selection: PracticeSelection;
  /** Cambia para forzar una sesión nueva con la misma selección (reshuffle). */
  reshuffleCount?: number;
  backend?: PracticeStorageBackend;
  /** `false` = práctica efímera en memoria, sin leer ni escribir storage. */
  persist?: boolean;
  onProgressChange?: (hasProgress: boolean) => void;
};

export type VocabularyPractice = {
  hydrated: boolean;
  session: PracticeSession | null;
  roundCards: Card[];
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

function deckSignature(cards: readonly Card[]): string {
  return cards
    .map((card) => `${card.sourceFile}::${card.category}::${card.expression}`)
    .join("\n");
}

/**
 * Orquesta la sesión corta de vocabulario (SPEC 30, pasos 4–6):
 * selección inicial de hasta 10, reanudación oculta, progreso persistido,
 * autoevaluación con Reveal previo, omisión explícita y repaso a pedido.
 */
export function useVocabularyPractice(
  args: VocabularyPracticeArgs,
): VocabularyPractice {
  const {
    route,
    allCards,
    filteredCards,
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

  const vocabularyIndex = useMemo(
    () => indexVocabularyCards(allCards),
    [allCards],
  );

  const allRefs = useMemo(() => assignVocabularyRefs(allCards), [allCards]);

  const cardToRef = useMemo(() => {
    const map = new Map<Card, { id: string; fingerprint: string }>();
    allCards.forEach((card, position) => {
      const ref = allRefs[position];
      if (ref !== undefined) {
        map.set(card, ref);
      }
    });
    return map;
  }, [allCards, allRefs]);

  const signature = useMemo(
    () => deckSignature(filteredCards),
    [filteredCards],
  );

  const selectionKey = [
    route,
    selection.level ?? "",
    selection.category ?? "",
    selection.order,
  ].join("|");
  const nonceKey = `${reshuffleCount}|${sessionNonce}`;
  const deckKey = `${filteredCards.length}|${signature}`;
  if (appliedRef.current === null) {
    appliedRef.current = { selectionKey, nonceKey, deckKey };
  }

  function sessionRefsValid(candidate: PracticeSession): boolean {
    const refs = [...candidate.items, ...candidate.reviewItems];
    return refs.every((ref) => {
      if (ref.kind !== "vocabulary") {
        return false;
      }
      const entry = vocabularyIndex.get(ref.id);
      return (
        entry !== undefined && entry.ref.fingerprint === ref.fingerprint
      );
    });
  }

  function buildSessionDeck(): Card[] {
    const ordered =
      selection.order === "ordered"
        ? [...filteredCards]
        : shuffle(filteredCards);
    return ordered.slice(0, 10);
  }

  function buildRefsForDeck(deck: Card[]) {
    return deck.map((card) => {
      const known = cardToRef.get(card);
      if (known !== undefined) {
        return { kind: "vocabulary" as const, ...known };
      }
      // Fuera del mazo canónico (no debería pasar): referencia ad hoc.
      return {
        kind: "vocabulary" as const,
        id: `${card.sourceFile}::${card.category.trim()}::${card.expression.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase()}`,
        fingerprint: fingerprintCard(card),
      };
    });
  }

  function createSession(): PracticeSession | null {
    if (filteredCards.length === 0) {
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
      // Invalida solo las evaluaciones de ítems afectados por el contenido
      // vigente; las demás evaluaciones permanecen.
      for (const [key, evaluation] of Object.entries(stored.evaluations)) {
        const separator = key.indexOf(":");
        if (separator < 0) {
          delete stored.evaluations[key];
          continue;
        }
        if (key.slice(0, separator) !== "vocabulary") {
          continue;
        }
        const entry = vocabularyIndex.get(key.slice(separator + 1));
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
          if (kind !== "vocabulary") {
            return true;
          }
          const entry = vocabularyIndex.get(id);
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
  const roundCards = useMemo(
    () =>
      roundRefs
        .map((ref) => vocabularyIndex.get(ref.id)?.card)
        .filter((card): card is Card => card !== undefined),
    // roundRefs es un array nuevo por render; la identidad útil es la sesión.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session, vocabularyIndex],
  );
  const roundKeys = useMemo(
    () => roundRefs.map((ref) => practiceKey(ref)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session],
  );

  const total = roundCards.length;
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
    // Sin confirmación destructiva desde el resumen: nueva selección del mazo.
    setSessionNonce((nonce) => nonce + 1);
    setRevealed(false);
  }

  return {
    hydrated: true,
    session,
    roundCards,
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
