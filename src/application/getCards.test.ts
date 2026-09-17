import { describe, expect, it } from "vitest";
import type { Card } from "../domain/card";
import { getCards, type CardRepository } from "./getCards";

const cards: Card[] = [
  {
    expression: "make a decision",
    type: "collocation",
    level: "B1-B2",
    meaningEs: "tomar una decisión",
    exampleEn: "I need to make a decision.",
    category: "MAKE",
    sourceFile: "fixture.md",
  },
];

describe("getCards", () => {
  it("obtiene las tarjetas de la sección solicitada", () => {
    const repository: CardRepository = {
      getCards: (section) => (section === "collocations" ? cards : []),
    };

    expect(getCards(repository, "collocations")).toBe(cards);
  });
});
