/**
 * Identificadores y huellas estables para tarjetas de vocabulario
 * (SPEC 30, paso 2). No modifica el Markdown.
 *
 * - `id`: archivo + categoría + expresión normalizada + ordinal solo entre
 *   homónimos de esa combinación. Insertar una tarjeta *diferente* no
 *   modifica los IDs previos. Nunca usa la posición después del shuffle:
 *   los IDs siempre se calculan sobre el mazo canónico (orden de archivo).
 * - `fingerprint`: huella de pregunta, respuesta, ejemplo y traducción
 *   actuales (más contexto y formas para irregulares). Cualquier edición del
 *   contenido invalida la referencia.
 */

import type { Card } from "../domain/card";
import type { PracticeItemRef } from "./practice-session";

export type VocabularyIndexEntry = {
  card: Card;
  ref: PracticeItemRef;
};

export function normalizeVocabularyExpression(expression: string): string {
  return expression
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function vocabularyIdBase(card: Card): string {
  const category = card.sourceFile === undefined ? "" : card.category.trim();
  return `${card.sourceFile}::${category}::${normalizeVocabularyExpression(card.expression)}`;
}

/**
 * Totales por grupo de homónimos (misma combinación archivo + categoría +
 * expresión normalizada), en el orden canónico recibido.
 */
function countHomonymGroups(cards: readonly Card[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const card of cards) {
    const base = vocabularyIdBase(card);
    counts.set(base, (counts.get(base) ?? 0) + 1);
  }
  return counts;
}

/**
 * Construye las referencias estables para el mazo canónico. El resultado
 * está alineado con `cards`: `refs[i]` corresponde a `cards[i]`.
 */
export function assignVocabularyRefs(
  cards: readonly Card[],
): PracticeItemRef[] {
  const counts = countHomonymGroups(cards);
  const seen = new Map<string, number>();

  return cards.map((card) => {
    const base = vocabularyIdBase(card);
    const total = counts.get(base) ?? 1;
    let id = base;
    if (total > 1) {
      const occurrence = (seen.get(base) ?? 0) + 1;
      seen.set(base, occurrence);
      id = `${base}#${occurrence}`;
    }
    return { kind: "vocabulary", id, fingerprint: fingerprintCard(card) };
  });
}

/** Índice `id` → tarjeta + referencia para resolución y validación. */
export function indexVocabularyCards(
  cards: readonly Card[],
): Map<string, VocabularyIndexEntry> {
  const refs = assignVocabularyRefs(cards);
  const index = new Map<string, VocabularyIndexEntry>();
  cards.forEach((card, position) => {
    const ref = refs[position];
    if (ref !== undefined && !index.has(ref.id)) {
      index.set(ref.id, { card, ref });
    }
  });
  return index;
}

function fingerprintInput(card: Card): string {
  return JSON.stringify([
    card.expression.normalize("NFKC").trim(),
    card.type,
    card.level,
    card.meaningEn,
    card.meaningEs,
    card.exampleEn,
    card.translationEs,
    card.category,
    card.sourceFile,
    card.contextEn,
    card.contextSource ?? "",
    [...card.tags].sort().join(","),
    card.pastSimple ?? "",
    card.pastParticiple ?? "",
  ]);
}

/** Hash FNV-1a de 32 bits en hexadecimal (puro, apto para cliente). */
export function hashFingerprint(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function fingerprintCard(card: Card): string {
  return hashFingerprint(fingerprintInput(card));
}

/**
 * Resuelve referencias contra el contenido vigente, en el orden de `refs`.
 * Devuelve `null` si cualquier referencia ya no existe o cambió su huella:
 * la sesión afectada se descarta completa.
 */
export function resolveVocabularyRefs(
  refs: readonly PracticeItemRef[],
  cards: readonly Card[],
): Card[] | null {
  const index = indexVocabularyCards(cards);
  const resolved: Card[] = [];

  for (const ref of refs) {
    if (ref.kind !== "vocabulary") {
      return null;
    }
    const entry = index.get(ref.id);
    if (entry === undefined || entry.ref.fingerprint !== ref.fingerprint) {
      return null;
    }
    resolved.push(entry.card);
  }

  return resolved;
}

/** Valida una referencia suelta contra el contenido vigente. */
export function isVocabularyRefValid(
  ref: PracticeItemRef,
  cards: readonly Card[],
): boolean {
  return resolveVocabularyRefs([ref], cards) !== null;
}
