/**
 * Persistencia versionada de sesiones de práctica (SPEC 30, paso 3).
 *
 * Clave `practicaeng:practice:v1` con sesiones por ruta, última ruta activa
 * y evaluaciones por `kind:id` con su huella. La lectura valida forma y
 * referencias contra el contenido vigente: una sesión con una referencia
 * ausente o una huella distinta se descarta, mientras las demás
 * sesiones/evaluaciones válidas permanecen. Sin `localStorage`, la práctica
 * continúa en memoria sin interrumpir la experiencia. Sin efectos en render
 * de servidor (todo acceso a `localStorage` está protegido).
 */

import {
  type PracticeRating,
  type PracticeSession,
} from "../../application/practice-session";

export const PRACTICE_STORAGE_KEY = "practicaeng:practice:v1";

export type StoredPracticeEvaluation = {
  rating: PracticeRating;
  fingerprint: string;
  updatedAt: number;
};

export type StoredPracticeState = {
  version: 1;
  sessions: Record<string, PracticeSession>;
  lastRoute: string | null;
  evaluations: Record<string, StoredPracticeEvaluation>;
};

export type PracticeStorageBackend = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
};

const VALID_RATINGS: readonly string[] = [
  "known",
  "almost",
  "unknown",
  "skipped",
];

export function emptyPracticeState(): StoredPracticeState {
  return { version: 1, sessions: {}, lastRoute: null, evaluations: {} };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidRef(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }
  return (
    (value["kind"] === "vocabulary" ||
      value["kind"] === "word-formation" ||
      value["kind"] === "grammar") &&
    typeof value["id"] === "string" &&
    value["id"].length > 0 &&
    typeof value["fingerprint"] === "string" &&
    value["fingerprint"].length > 0
  );
}

function isValidRatings(value: unknown): value is Record<string, PracticeRating> {
  if (!isRecord(value)) {
    return false;
  }
  return Object.values(value).every(
    (rating) => typeof rating === "string" && VALID_RATINGS.includes(rating),
  );
}

function isValidAttempts(
  value: unknown,
): value is Record<string, { hadIncorrectAttempt: boolean }> {
  if (!isRecord(value)) {
    return false;
  }
  return Object.values(value).every(
    (attempt) =>
      isRecord(attempt) &&
      typeof attempt["hadIncorrectAttempt"] === "boolean",
  );
}

/** Validación estructural (sin contenido): la de contenido la pone el lector. */
export function isValidPracticeSessionShape(
  value: unknown,
): value is PracticeSession {
  if (!isRecord(value)) {
    return false;
  }
  const selection = value["selection"];
  if (!isRecord(selection)) {
    return false;
  }
  if (
    selection["order"] !== "ordered" &&
    selection["order"] !== "shuffled"
  ) {
    return false;
  }
  for (const field of ["level", "category"] as const) {
    const fieldValue = selection[field];
    if (
      fieldValue !== undefined &&
      (typeof fieldValue !== "string" || fieldValue.length === 0)
    ) {
      return false;
    }
  }
  if (typeof value["route"] !== "string" || value["route"].length === 0) {
    return false;
  }
  if (
    !Array.isArray(value["items"]) ||
    value["items"].length === 0 ||
    value["items"].length > 10 ||
    !value["items"].every(isValidRef)
  ) {
    return false;
  }
  if (
    !Array.isArray(value["reviewItems"]) ||
    !value["reviewItems"].every(isValidRef)
  ) {
    return false;
  }
  if (
    value["phase"] !== "initial" &&
    value["phase"] !== "review" &&
    value["phase"] !== "summary"
  ) {
    return false;
  }
  if (!Number.isInteger(value["index"]) || (value["index"] as number) < 0) {
    return false;
  }
  if (!isValidRatings(value["ratings"])) {
    return false;
  }
  if (!isValidRatings(value["roundRatings"])) {
    return false;
  }
  // SPEC 31: `attempts` es opcional para no invalidar sesiones legacy de
  // vocabulario; cuando está presente debe tener la forma esperada.
  if (
    value["attempts"] !== undefined &&
    !isValidAttempts(value["attempts"])
  ) {
    return false;
  }
  if (typeof value["updatedAt"] !== "number") {
    return false;
  }
  return true;
}

function clampSessionIndex(session: PracticeSession): PracticeSession {
  const roundLength =
    session.phase === "initial"
      ? session.items.length
      : session.phase === "review"
        ? session.reviewItems.length
        : 0;
  if (roundLength === 0) {
    return session.phase === "summary" ? { ...session, index: 0 } : session;
  }
  if (session.index >= roundLength) {
    return { ...session, index: roundLength - 1 };
  }
  return session;
}

function isValidEvaluation(value: unknown): value is StoredPracticeEvaluation {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value["rating"] === "string" &&
    VALID_RATINGS.includes(value["rating"]) &&
    typeof value["fingerprint"] === "string" &&
    value["fingerprint"].length > 0 &&
    typeof value["updatedAt"] === "number"
  );
}

export type PracticeStateValidators = {
  /** `false` descarta solo la sesión afectada (referencia ausente o huella). */
  isSessionValid?: (session: PracticeSession) => boolean;
  /** `false` invalida solo la evaluación del ítem afectado. */
  isEvaluationValid?: (key: string, evaluation: StoredPracticeEvaluation) => boolean;
};

/**
 * Lee y valida el estado almacenado. Nunca lanza: ante storage ausente,
 * corrupto o contenido cambiado, reinicia solo lo inválido.
 */
export function loadPracticeState(
  backend: PracticeStorageBackend | null | undefined,
  validators: PracticeStateValidators = {},
): StoredPracticeState {
  const empty = emptyPracticeState();
  if (backend === null || backend === undefined) {
    return empty;
  }

  let raw: string | null;
  try {
    raw = backend.getItem(PRACTICE_STORAGE_KEY);
  } catch {
    return empty;
  }
  if (raw === null || raw === "") {
    return empty;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return empty;
  }
  if (!isRecord(parsed) || parsed["version"] !== 1) {
    return empty;
  }

  const state = emptyPracticeState();

  if (typeof parsed["lastRoute"] === "string") {
    state.lastRoute = parsed["lastRoute"];
  }

  if (isRecord(parsed["sessions"])) {
    for (const [route, session] of Object.entries(parsed["sessions"])) {
      if (!isValidPracticeSessionShape(session)) {
        continue;
      }
      if (
        validators.isSessionValid !== undefined &&
        !validators.isSessionValid(session)
      ) {
        continue;
      }
      state.sessions[route] = clampSessionIndex(session);
    }
  }

  if (isRecord(parsed["evaluations"])) {
    for (const [key, evaluation] of Object.entries(parsed["evaluations"])) {
      if (!isValidEvaluation(evaluation)) {
        continue;
      }
      if (
        validators.isEvaluationValid !== undefined &&
        !validators.isEvaluationValid(key, evaluation)
      ) {
        continue;
      }
      state.evaluations[key] = evaluation;
    }
  }

  return state;
}

/** Guarda el estado; ignora cuotas o storage no disponible. */
export function savePracticeState(
  backend: PracticeStorageBackend | null | undefined,
  state: StoredPracticeState,
): void {
  if (backend === null || backend === undefined) {
    return;
  }
  try {
    backend.setItem(PRACTICE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Cuota/modo privado: la sesión continúa en memoria.
  }
}

function memoryBackend(): PracticeStorageBackend {
  const store = new Map<string, string>();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value);
    },
    removeItem: (key) => {
      store.delete(key);
    },
  };
}

let sharedMemoryBackend: PracticeStorageBackend | null = null;

/**
 * Backend de almacenamiento: `localStorage` cuando está disponible, memoria
 * compartida en caso contrario (SSR, privado, cuotas). Nunca lanza.
 */
export function getPracticeStorageBackend(): PracticeStorageBackend {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.getItem(PRACTICE_STORAGE_KEY);
      return localStorage;
    }
  } catch {
    // Sin localStorage: se usa el fallback en memoria.
  }
  if (sharedMemoryBackend === null) {
    sharedMemoryBackend = memoryBackend();
  }
  return sharedMemoryBackend;
}

/** Backend en memoria aislado (tests y práctica sin persistencia). */
export function createMemoryPracticeBackend(
  initial?: StoredPracticeState,
): PracticeStorageBackend {
  const backend = memoryBackend();
  if (initial !== undefined) {
    backend.setItem(PRACTICE_STORAGE_KEY, JSON.stringify(initial));
  }
  return backend;
}
