/**
 * Sesiones cortas de práctica (SPEC 30, paso 1).
 *
 * Módulo puro: selecciona hasta 10 referencias del mazo filtrado, mantiene
 * el orden fijo durante la sesión y representa las fases inicial, repaso y
 * resumen. Sin E/S: la persistencia vive en `infrastructure/ui`.
 */

export const PRACTICE_SESSION_LIMIT = 10;

export type PracticeRating = "known" | "almost" | "unknown" | "skipped";

export type PracticeItemKind = "vocabulary" | "word-formation" | "grammar";

export type PracticeItemRef = {
  kind: PracticeItemKind;
  /** vocabulario: archivo + categoría + expresión + ocurrencia homónima */
  id: string;
  /** huella de pregunta, respuesta, ejemplo y traducción actuales */
  fingerprint: string;
};

/**
 * Dificultad previa por ítem (`kind:id` → intento). SPEC 31 la persiste para
 * no perder un fallo al recargar antes de avanzar; la evaluación se decide
 * al concluir el ejercicio. Ausente en sesiones legacy de vocabulario.
 */
export type PracticeAttempt = {
  hadIncorrectAttempt: boolean;
};

export type PracticePhase = "initial" | "review" | "summary";

export type PracticeSelection = {
  level?: string;
  category?: string;
  order: "ordered" | "shuffled";
};

export type PracticeSession = {
  route: string;
  /** hasta 10 en ronda inicial; referencias fijas */
  items: PracticeItemRef[];
  reviewItems: PracticeItemRef[];
  index: number;
  phase: PracticePhase;
  /** última evaluación por ítem (`kind:id` → rating) */
  ratings: Record<string, PracticeRating>;
  /** avance de la ronda actual (`kind:id` → rating) */
  roundRatings: Record<string, PracticeRating>;
  /**
   * Dificultad previa por ítem en la ronda actual (SPEC 31). Opcional para
   * no invalidar sesiones legacy de vocabulario persistidas sin el campo.
   */
  attempts?: Record<string, PracticeAttempt>;
  selection: PracticeSelection;
  updatedAt: number;
};

export type PracticeResultCounts = {
  known: number;
  almost: number;
  unknown: number;
  skipped: number;
  unrated: number;
  total: number;
};

const VALID_RATINGS: readonly PracticeRating[] = [
  "known",
  "almost",
  "unknown",
  "skipped",
];

export function practiceKey(
  ref: Pick<PracticeItemRef, "kind" | "id">,
): string {
  return `${ref.kind}:${ref.id}`;
}

function isRating(value: unknown): value is PracticeRating {
  return (
    typeof value === "string" &&
    (VALID_RATINGS as readonly string[]).includes(value)
  );
}

/**
 * Crea una sesión nueva con los primeros `PRACTICE_SESSION_LIMIT` ítems del
 * mazo ya filtrado y ordenado. El orden recibido queda congelado en `items`.
 */
export function createPracticeSession(
  route: string,
  refs: readonly PracticeItemRef[],
  selection: PracticeSelection,
  now: number = Date.now(),
): PracticeSession {
  return {
    route,
    items: refs.slice(0, PRACTICE_SESSION_LIMIT).map((ref) => ({ ...ref })),
    reviewItems: [],
    index: 0,
    phase: "initial",
    ratings: {},
    roundRatings: {},
    attempts: {},
    selection: { ...selection },
    updatedAt: now,
  };
}

/** Ítems de la ronda activa. En `summary` no hay ronda activa. */
export function getPracticeRoundItems(
  session: PracticeSession,
): PracticeItemRef[] {
  if (session.phase === "initial") {
    return session.items;
  }
  if (session.phase === "review") {
    return session.reviewItems;
  }
  return [];
}

/**
 * Registra la evaluación de un ítem sin mover el índice: la navegación
 * (Previous/Next) es responsabilidad de la UI. Conserva el último resultado
 * por ítem y el avance de la ronda actual.
 */
export function ratePracticeCard(
  session: PracticeSession,
  key: string,
  rating: PracticeRating,
  now: number = Date.now(),
): PracticeSession {
  if (!isRating(rating)) {
    throw new Error(`Calificación desconocida: ${String(rating)}`);
  }

  return {
    ...session,
    ratings: { ...session.ratings, [key]: rating },
    roundRatings: { ...session.roundRatings, [key]: rating },
    updatedAt: now,
  };
}

/** Mueve el índice dentro de la ronda activa. Fuera de rango → RangeError. */
export function setPracticeIndex(
  session: PracticeSession,
  index: number,
  now: number = Date.now(),
): PracticeSession {
  const round = getPracticeRoundItems(session);
  if (round.length === 0) {
    throw new RangeError("La sesión no tiene ronda activa");
  }
  if (!Number.isInteger(index) || index < 0 || index >= round.length) {
    throw new RangeError("El índice de tarjeta está fuera de rango");
  }

  return { ...session, index, updatedAt: now };
}

/** La ronda termina cuando cada ítem tiene evaluación en esta ronda. */
export function isPracticeRoundComplete(session: PracticeSession): boolean {
  const round = getPracticeRoundItems(session);
  if (round.length === 0) {
    return false;
  }
  return round.every((ref) =>
    Object.prototype.hasOwnProperty.call(
      session.roundRatings,
      practiceKey(ref),
    ),
  );
}

/**
 * Cierra la ronda activa y pasa a `summary`. Los pendientes son los ítems
 * con último resultado `almost`, `unknown`, `skipped` o sin evaluar.
 * `ratings` conserva el último resultado; `roundRatings` queda como
 * historial hasta que un repaso lo vacíe.
 */
export function finishPracticeRound(
  session: PracticeSession,
  now: number = Date.now(),
): PracticeSession {
  if (session.phase === "summary") {
    return session;
  }

  const round = getPracticeRoundItems(session);
  const pending = round.filter((ref) => {
    const key = practiceKey(ref);
    const latest = session.roundRatings[key] ?? session.ratings[key];
    return latest === undefined || latest !== "known";
  });

  return {
    ...session,
    reviewItems: pending.map((ref) => ({ ...ref })),
    index: 0,
    phase: "summary",
    updatedAt: now,
  };
}

/**
 * Inicia una ronda de repaso a pedido explícito. Vacía `roundRatings` y
 * `attempts` (la dificultad se reevalúa en la ronda nueva) y conserva
 * `ratings` para el resumen.
 */
export function startPracticeReview(
  session: PracticeSession,
  now: number = Date.now(),
): PracticeSession {
  if (session.phase !== "summary") {
    throw new Error("El repaso solo puede empezar desde el resumen");
  }
  if (session.reviewItems.length === 0) {
    throw new Error("No hay pendientes para repasar");
  }

  return {
    ...session,
    index: 0,
    phase: "review",
    roundRatings: {},
    attempts: {},
    updatedAt: now,
  };
}

/** Cantidades por resultado sobre los ítems iniciales (último vigente). */
export function countPracticeResults(
  session: PracticeSession,
): PracticeResultCounts {
  const counts: PracticeResultCounts = {
    known: 0,
    almost: 0,
    unknown: 0,
    skipped: 0,
    unrated: 0,
    total: session.items.length,
  };

  for (const ref of session.items) {
    const rating = session.ratings[practiceKey(ref)];
    if (rating === undefined) {
      counts.unrated += 1;
    } else {
      counts[rating] += 1;
    }
  }

  return counts;
}

/**
 * Indica si la sesión tiene progreso que valga la pena confirmar antes de
 * reemplazarla (cambio de filtros u orden). Una sesión recién creada o un
 * resumen no piden confirmación. Un intento fallido (SPEC 31) también cuenta
 * como progreso aunque el ítem aún no tenga evaluación.
 */
export function hasPracticeProgress(session: PracticeSession): boolean {
  if (session.phase === "summary") {
    return false;
  }
  if (session.phase === "review") {
    return true;
  }
  return (
    session.index > 0 ||
    Object.keys(session.roundRatings).length > 0 ||
    Object.keys(session.attempts ?? {}).length > 0
  );
}

export function practiceSelectionsEqual(
  a: PracticeSelection,
  b: PracticeSelection,
): boolean {
  return (
    a.level === b.level && a.category === b.category && a.order === b.order
  );
}

/** Dificultad previa del ítem en la ronda actual (`undefined` = sin fallos). */
export function getPracticeAttempt(
  session: PracticeSession,
  key: string,
): PracticeAttempt | undefined {
  return session.attempts?.[key];
}

/**
 * Conserva por ítem si hubo un intento incorrecto, incluso si se recarga
 * antes de avanzar (SPEC 31). No evalúa: la evaluación se decide al concluir
 * el ejercicio (acierto, Reveal o Skip).
 */
export function setPracticeAttempt(
  session: PracticeSession,
  key: string,
  attempt: PracticeAttempt,
  now: number = Date.now(),
): PracticeSession {
  return {
    ...session,
    attempts: { ...(session.attempts ?? {}), [key]: { ...attempt } },
    updatedAt: now,
  };
}
