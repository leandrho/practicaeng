/**
 * Identificadores y huellas estables para familias de Word Formation
 * (SPEC 31, paso 1). No modifica el Markdown.
 *
 * - `id`: base normalizada + ordinal solo entre homónimos de esa base.
 *   Insertar una familia *diferente* no modifica los IDs previos. Nunca usa
 *   la posición después del shuffle: los IDs siempre se calculan sobre el
 *   mazo canónico (orden de archivo).
 * - `fingerprint`: huella de la oración, el objetivo y las respuestas
 *   aceptadas actuales (más formas, pistas, contexto y ejemplos para
 *   invalidar la revelación). Cualquier edición del contenido invalida la
 *   referencia.
 */

import type { PracticeItemRef } from "./practice-session";
import { hashFingerprint } from "./practice-id";
import type { WordFamily } from "../domain/word-formation";

export type WordFormationIndexEntry = {
  family: WordFamily;
  ref: PracticeItemRef;
};

export function normalizeWordFormationBase(base: string): string {
  return base.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
}

function countBaseGroups(families: readonly WordFamily[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const family of families) {
    const base = normalizeWordFormationBase(family.base);
    counts.set(base, (counts.get(base) ?? 0) + 1);
  }
  return counts;
}

/**
 * Construye las referencias estables para el mazo canónico. El resultado
 * está alineado con `families`: `refs[i]` corresponde a `families[i]`.
 */
export function assignWordFormationRefs(
  families: readonly WordFamily[],
): PracticeItemRef[] {
  const counts = countBaseGroups(families);
  const seen = new Map<string, number>();

  return families.map((family) => {
    const base = normalizeWordFormationBase(family.base);
    const total = counts.get(base) ?? 1;
    let id = base;
    if (total > 1) {
      const occurrence = (seen.get(base) ?? 0) + 1;
      seen.set(base, occurrence);
      id = `${base}#${occurrence}`;
    }
    return {
      kind: "word-formation",
      id,
      fingerprint: fingerprintWordFamily(family),
    } as PracticeItemRef;
  });
}

/** Índice `id` → familia + referencia para resolución y validación. */
export function indexWordFormationFamilies(
  families: readonly WordFamily[],
): Map<string, WordFormationIndexEntry> {
  const refs = assignWordFormationRefs(families);
  const index = new Map<string, WordFormationIndexEntry>();
  families.forEach((family, position) => {
    const ref = refs[position];
    if (ref !== undefined && !index.has(ref.id)) {
      index.set(ref.id, { family, ref });
    }
  });
  return index;
}

function fingerprintInput(family: WordFamily): string {
  const exercise = (family as { exercise?: WordFamily["exercise"] }).exercise;
  return JSON.stringify([
    normalizeWordFormationBase(family.base),
    family.level,
    family.category,
    family.noun ?? "",
    family.adjective ?? "",
    family.adverb ?? "",
    family.meaningHintEn,
    family.meaningHint,
    family.contextEn,
    family.contextSource ?? "",
    [...family.examples],
    exercise?.target ?? "",
    exercise?.sentenceEn ?? "",
    [...(exercise?.acceptedAnswers ?? [])],
  ]);
}

export function fingerprintWordFamily(family: WordFamily): string {
  return hashFingerprint(fingerprintInput(family));
}

/**
 * Resuelve referencias contra el contenido vigente, en el orden de `refs`.
 * Devuelve `null` si cualquier referencia ya no existe o cambió su huella:
 * la sesión afectada se descarta completa.
 */
export function resolveWordFormationRefs(
  refs: readonly PracticeItemRef[],
  families: readonly WordFamily[],
): WordFamily[] | null {
  const index = indexWordFormationFamilies(families);
  const resolved: WordFamily[] = [];

  for (const ref of refs) {
    if (ref.kind !== "word-formation") {
      return null;
    }
    const entry = index.get(ref.id);
    if (entry === undefined || entry.ref.fingerprint !== ref.fingerprint) {
      return null;
    }
    resolved.push(entry.family);
  }

  return resolved;
}

/** Valida una referencia suelta contra el contenido vigente. */
export function isWordFormationRefValid(
  ref: PracticeItemRef,
  families: readonly WordFamily[],
): boolean {
  return resolveWordFormationRefs([ref], families) !== null;
}
