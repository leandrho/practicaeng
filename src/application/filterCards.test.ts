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
    contextEn: '"I must make a decision before nightfall," she said, looking at the two roads ahead.',
    contextSource: "Everyday conversation",
    tags: [],
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
    contextEn: '"Take responsibility now," he said. There was no time to wait.',
    contextSource: "Everyday conversation",
    tags: [],
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
    contextEn: '"Are you ready?" "Give me a minute, I don\'t want to give up now."',
    contextSource: "Everyday conversation",
    tags: [],
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
