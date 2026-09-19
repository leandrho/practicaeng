import { describe, expect, it } from "vitest";
import type { Card } from "../domain/card";
import type { CardSection } from "./getCards";
import { getMixedCards } from "./getMixedCards";
import type { CardRepository } from "./getCards";

function makeCard(expression: string, type: Card["type"]): Card {
  return {
    expression,
    type,
    level: "B1-B2",
    meaningEn: `meaning of ${expression}`,
    meaningEs: `significado de ${expression}`,
    exampleEn: `Example with ${expression}.`,
    translationEs: `Ejemplo con ${expression}.`,
    category: "general",
    sourceFile: "fixture.md",
    contextEn: `"Context for ${expression}," she said.`,
    contextSource: "Everyday conversation",
  };
}

const sections: CardSection[] = ["phrasal-verbs", "collocations", "idioms"];

const repository: CardRepository = {
  getCards: (section) => {
    switch (section) {
      case "phrasal-verbs":
        return [makeCard("give up", "phrasal-verb")];
      case "collocations":
        return [
          makeCard("make a decision", "collocation"),
          makeCard("take a break", "collocation"),
        ];
      case "idioms":
        return [];
      default:
        return [];
    }
  },
};

describe("getMixedCards", () => {
  it("concatena las tarjetas en el orden de las secciones", () => {
    const mixed = getMixedCards(repository, sections);

    expect(mixed.map((card) => card.expression)).toEqual([
      "give up",
      "make a decision",
      "take a break",
    ]);
  });

  it("devuelve un array vacío cuando no hay secciones ni tarjetas", () => {
    expect(getMixedCards(repository, [])).toEqual([]);
    expect(getMixedCards({ getCards: () => [] }, sections)).toEqual([]);
  });

  it("no muta las listas del repositorio", () => {
    const before = (["phrasal-verbs", "collocations"] as CardSection[]).map(
      (section) => repository.getCards(section).map((card) => card.expression),
    );
    const mixed = getMixedCards(repository, sections);

    expect(mixed).toHaveLength(3);
    expect(
      (["phrasal-verbs", "collocations"] as CardSection[]).map((section) =>
        repository.getCards(section).map((card) => card.expression),
      ),
    ).toEqual(before);
  });
});
