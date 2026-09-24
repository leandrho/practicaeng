/**
 * Estado de portada a partir del almacenamiento compartido (SPEC 33, paso 1).
 *
 * Módulo puro de infraestructura/UI: no toca `localStorage`, solo decide qué
 * mostrar a partir de un `StoredPracticeState` ya cargado. La página lee las
 * sesiones por ruta, la última ruta activa y las evaluaciones vigentes del
 * esquema versionado de SPEC 30.
 *
 * `Continue` solo se ofrece si la sesión es válida en forma y tiene ronda en
 * curso (`initial`/`review` con ítems) o pendientes de repaso (`summary` con
 * `reviewItems`). El cómputo de dificultades usa las últimas evaluaciones
 * vigentes, una por `kind:id`, sin sumar intentos repetidos.
 */

import {
  getPracticeRoundItems,
  practiceKey,
  type PracticeSession,
} from "../../application/practice-session";
import {
  isValidPracticeSessionShape,
  type StoredPracticeState,
} from "./practice-storage";

export type HomeSummary = {
  /** Ruta para `Continue`, o `null` si no hay sesión retomable. */
  continueRoute: string | null;
  /** Última sesión válida (aunque esté completa), o `null` sin datos. */
  lastSessionRoute: string | null;
  /** Pendientes de la última sesión (vista previa en ronda o repaso). */
  lastSessionPending: number;
  /** Ítems difíciles vigentes (`almost`/`unknown`/`skipped`, uno por clave). */
  difficultCount: number;
  /** Hay sesiones o evaluaciones locales. */
  hasLocalData: boolean;
};

function isRouteKey(route: string): boolean {
  return route.startsWith("/") && route.length > 1;
}

/**
 * Una sesión es retomable si tiene forma válida, su `route` coincide con la
 * clave y le queda trabajo: ronda en curso o repaso pendiente. Un `summary`
 * sin `reviewItems` está completo y no ofrece `Continue`.
 */
export function isContinuableSession(
  routeKey: string,
  session: PracticeSession,
): boolean {
  if (!isValidPracticeSessionShape(session)) {
    return false;
  }
  if (session.route !== routeKey || !isRouteKey(session.route)) {
    return false;
  }
  if (session.items.length === 0) {
    return false;
  }
  if (session.phase === "initial" || session.phase === "review") {
    return getPracticeRoundItems(session).length > 0;
  }
  if (session.phase === "summary") {
    return session.reviewItems.length > 0;
  }
  return false;
}

function isValidSessionEntry(
  routeKey: string,
  session: PracticeSession,
): boolean {
  return (
    isValidPracticeSessionShape(session) &&
    session.route === routeKey &&
    isRouteKey(session.route)
  );
}

/** Pendientes para el resumen: previsualiza la ronda o usa el repaso. */
export function countSessionPending(session: PracticeSession): number {
  if (session.phase === "summary") {
    return session.reviewItems.length;
  }
  const round = getPracticeRoundItems(session);
  if (round.length === 0) {
    return 0;
  }
  let pending = 0;
  for (const ref of round) {
    const key = practiceKey(ref);
    const latest = session.roundRatings[key] ?? session.ratings[key];
    if (latest === undefined || latest !== "known") {
      pending += 1;
    }
  }
  return pending;
}

export function countDifficultEvaluations(
  state: StoredPracticeState,
): number {
  let count = 0;
  for (const evaluation of Object.values(state.evaluations)) {
    if (
      evaluation.rating === "almost" ||
      evaluation.rating === "unknown" ||
      evaluation.rating === "skipped"
    ) {
      count += 1;
    }
  }
  return count;
}

/**
 * Selecciona el estado de portada. Nunca lanza: ante entradas con forma
 * inesperada, degrada a estado vacío.
 */
export function selectHomeState(state: StoredPracticeState): HomeSummary {
  const empty: HomeSummary = {
    continueRoute: null,
    lastSessionRoute: null,
    lastSessionPending: 0,
    difficultCount: 0,
    hasLocalData: false,
  };

  let sessions: Record<string, PracticeSession>;
  let evaluations: StoredPracticeState["evaluations"];
  let lastRoute: string | null;
  try {
    sessions = state.sessions ?? {};
    evaluations = state.evaluations ?? {};
    lastRoute = state.lastRoute ?? null;
  } catch {
    return empty;
  }

  const validEntries: Array<{ route: string; session: PracticeSession }> = [];
  for (const [routeKey, session] of Object.entries(sessions)) {
    try {
      if (isValidSessionEntry(routeKey, session)) {
        validEntries.push({ route: routeKey, session });
      }
    } catch {
      continue;
    }
  }

  const continuable = validEntries.filter(({ route, session }) => {
    try {
      return isContinuableSession(route, session);
    } catch {
      return false;
    }
  });

  const byRecency = (a: { session: PracticeSession }, b: { session: PracticeSession }) =>
    (b.session.updatedAt ?? 0) - (a.session.updatedAt ?? 0);
  const recentValid = [...validEntries].sort(byRecency)[0] ?? null;
  const recentContinuable = [...continuable].sort(byRecency)[0] ?? null;

  // La última ruta activa manda cuando sigue retomable; si se invalidó o se
  // cerró, se ofrece la retomable más reciente en vez de un enlace roto.
  let continueEntry: { route: string; session: PracticeSession } | null = null;
  if (lastRoute !== null) {
    const pinned = continuable.find(({ route }) => route === lastRoute) ?? null;
    if (pinned !== null) {
      continueEntry = pinned;
    }
  }
  if (continueEntry === null) {
    continueEntry = recentContinuable;
  }

  let difficultCount = 0;
  try {
    difficultCount = countDifficultEvaluations({
      ...state,
      sessions,
      evaluations,
    });
  } catch {
    difficultCount = 0;
  }

  const hasLocalData =
    validEntries.length > 0 || Object.keys(evaluations).length > 0;

  return {
    continueRoute: continueEntry?.route ?? null,
    lastSessionRoute: recentValid?.route ?? null,
    lastSessionPending:
      recentValid === null ? 0 : countSessionPending(recentValid.session),
    difficultCount,
    hasLocalData,
  };
}

/** Etiqueta breve para una ruta de sesión en el resumen local. */
export function homeRouteLabel(route: string): string {
  const vocabulary: Record<string, string> = {
    "/mixed": "Mixed Practice",
    "/phrasal-verbs": "Phrasal verbs",
    "/collocations": "Collocations",
    "/prepositions": "Prepositions",
    "/idioms": "Idioms & Expressions",
    "/irregular-verbs": "Irregular Verbs",
    "/everyday-phrases": "Everyday Phrases",
    "/connectors": "Connectors",
    "/word-formation": "Word Formation",
    "/grammar": "Grammar",
  };
  const direct = vocabulary[route];
  if (direct !== undefined) {
    return direct;
  }
  if (route.startsWith("/grammar/")) {
    const slug = route.split("/").filter(Boolean).pop() ?? "";
    const words = slug.replace(/-/g, " ").trim();
    if (words.length === 0) {
      return "Grammar";
    }
    return `Grammar · ${words.slice(0, 42)}`;
  }
  return route;
}
