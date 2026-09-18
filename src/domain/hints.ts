export type HintKind = "curated" | "fallback";

export type HintId = string;

export function normalizeHintExpression(expression: string): string {
  return expression.toLowerCase().trim();
}

export function resolveHint(
  expression: string,
  type: string,
  _category: string,
): HintId {
  const curatedHint = curatedHints[normalizeHintExpression(expression)];

  if (curatedHint !== undefined) {
    return curatedHint;
  }

  switch (type) {
    case "phrasal-verb":
    case "collocation":
    case "preposition":
    case "idiom":
    case "irregular-verb":
      return `fallback:${type}`;
    default:
      return "fallback:word-formation";
  }
}
import { curatedHints } from "../infrastructure/hints/curated";
