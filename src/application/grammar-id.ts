/**
 * Identificadores y huellas estables para ejercicios de Grammar
 * (SPEC 32, paso 1). No modifica el Markdown.
 *
 * - `id`: número de parte + slug de tema + posición del ejercicio en el
 *   tema (`parte::slug::posición`). El orden pedagógico existente se
 *   conserva; la sesión practica los primeros 10 en ese orden.
 * - `fingerprint`: huella del prompt, el modelo, la explicación y la
 *   traducción actuales. Cualquier edición del contenido invalida la
 *   referencia y descarta solo la sesión afectada (SPEC 30).
 */

import type { PracticeItemRef } from "./practice-session";
import { hashFingerprint } from "./practice-id";
import type { GrammarExercise } from "../domain/grammar";

export type GrammarIndexEntry = {
  exercise: GrammarExercise;
  ref: PracticeItemRef;
};

export function normalizeGrammarSlug(slug: string): string {
  return slug.normalize("NFKC").trim().toLowerCase();
}

export function grammarExerciseId(
  part: number,
  slug: string,
  position: number,
): string {
  return `${part}::${normalizeGrammarSlug(slug)}::${position}`;
}

/**
 * Construye las referencias estables para los ejercicios del tema en orden
 * canónico. El resultado está alineado con `exercises`:
 * `refs[i]` corresponde a `exercises[i]`.
 */
export function assignGrammarRefs(
  part: number,
  slug: string,
  exercises: readonly GrammarExercise[],
): PracticeItemRef[] {
  return exercises.map((exercise, position) => ({
    kind: "grammar",
    id: grammarExerciseId(part, slug, position),
    fingerprint: fingerprintGrammarExercise(exercise),
  }));
}

/** Índice `id` → ejercicio + referencia para resolución y validación. */
export function indexGrammarExercises(
  part: number,
  slug: string,
  exercises: readonly GrammarExercise[],
): Map<string, GrammarIndexEntry> {
  const refs = assignGrammarRefs(part, slug, exercises);
  const index = new Map<string, GrammarIndexEntry>();
  exercises.forEach((exercise, position) => {
    const ref = refs[position];
    if (ref !== undefined && !index.has(ref.id)) {
      index.set(ref.id, { exercise, ref });
    }
  });
  return index;
}

function fingerprintInput(exercise: GrammarExercise): string {
  return JSON.stringify([
    exercise.promptEn.normalize("NFKC").trim(),
    exercise.modelEn.normalize("NFKC").trim(),
    exercise.explanationEs.normalize("NFKC").trim(),
    exercise.translationEs.normalize("NFKC").trim(),
  ]);
}

export function fingerprintGrammarExercise(
  exercise: GrammarExercise,
): string {
  return hashFingerprint(fingerprintInput(exercise));
}

/**
 * Resuelve referencias contra el contenido vigente, en el orden de `refs`.
 * Devuelve `null` si cualquier referencia ya no existe o cambió su huella:
 * la sesión afectada se descarta completa.
 */
export function resolveGrammarRefs(
  refs: readonly PracticeItemRef[],
  part: number,
  slug: string,
  exercises: readonly GrammarExercise[],
): GrammarExercise[] | null {
  const index = indexGrammarExercises(part, slug, exercises);
  const resolved: GrammarExercise[] = [];

  for (const ref of refs) {
    if (ref.kind !== "grammar") {
      return null;
    }
    const entry = index.get(ref.id);
    if (entry === undefined || entry.ref.fingerprint !== ref.fingerprint) {
      return null;
    }
    resolved.push(entry.exercise);
  }

  return resolved;
}

/** Valida una referencia suelta contra el contenido vigente. */
export function isGrammarRefValid(
  ref: PracticeItemRef,
  part: number,
  slug: string,
  exercises: readonly GrammarExercise[],
): boolean {
  return (
    resolveGrammarRefs([ref], part, slug, exercises) !== null
  );
}
