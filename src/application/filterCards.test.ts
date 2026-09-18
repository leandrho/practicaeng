import { describe, expect, it } from "vitest";
import type { Card } from "../domain/card";
import { filterCards } from "./filterCards";

const cards: Card[] = [
  {
    expression: "make a decision",
    type: "collocation",
    level: "B1-B2",
    meaningEn: "to choose what to do",
    meaningEs: "tomar una decisión",
    exampleEn: "I need to make a decision.",
    translationEs: "Necesito tomar una decisión.",
    category: "MAKE",
    sourceFile: "fixture.md",
  },
  {
    expression: "take responsibility",
    type: "collocation",
    level: "B1-B2",
    meaningEn: "to accept responsibility",
    meaningEs: "asumir responsabilidad",
    exampleEn: "Take responsibility for your actions.",
    translationEs: "Asumí la responsabilidad de tus acciones.",
    category: "TAKE",
    sourceFile: "fixture.md",
  },
  {
    expression: "give up",
    type: "phrasal-verb",
    level: "B1-B2",
    meaningEn: "to stop trying",
    meaningEs: "rendirse",
    exampleEn: "Do not give up.",
    translationEs: "No te rindas.",
    category: "general",
    sourceFile: "fixture.md",
  },
];

describe("filterCards", () => {
  it("devuelve todas las tarjetas B1-B2", () => {
    expect(filterCards(cards, { level: "B1-B2" })).toEqual(cards);
  });

  it("devuelve una lista vacía para una categoría inexistente", () => {
    expect(filterCards(cards, { category: "NOPE" })).toEqual([]);
  });

  it("combina nivel y categoría con AND", () => {
    expect(
      filterCards(cards, { level: "B1-B2", category: "MAKE" }),
    ).toEqual([cards[0]]);
  });
});
