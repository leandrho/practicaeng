import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CardSchema } from "../domain/card";
import {
  CONTENT_SECTIONS,
  createContentRepository,
  type ContentSection,
} from "./content-loader";

const fixtureDirectory = join(
  process.cwd(),
  "src/infrastructure/fixtures/content",
);

const realContentCounts: Record<ContentSection, number> = {
  "phrasal-verbs": 200,
  collocations: 50,
  prepositions: 49,
  idioms: 35,
};

// The versioned Markdown is a fixed baseline, so content changes must update it explicitly.
const realContentCountTolerance = 0;

describe("ContentRepository", () => {
  it("lee las secciones y devuelve Card[] validadas desde fixtures", () => {
    const repository = createContentRepository(fixtureDirectory);

    expect(repository.getSections()).toEqual(CONTENT_SECTIONS);

    for (const section of CONTENT_SECTIONS) {
      const cards = repository.getCards(section);

      expect(cards).toHaveLength(1);
      expect(CardSchema.parse(cards[0])).toEqual(cards[0]);
    }
  });

  it("devuelve el tipo asociado a cada sección", () => {
    const repository = createContentRepository(fixtureDirectory);
    const expectedTypes: Record<ContentSection, string> = {
      "phrasal-verbs": "phrasal-verb",
      collocations: "collocation",
      prepositions: "preposition",
      idioms: "idiom",
    };

    for (const section of CONTENT_SECTIONS) {
      expect(repository.getCards(section)[0]?.type).toBe(expectedTypes[section]);
    }
  });

  it("carga los datos reales dentro de los conteos esperados", () => {
    const repository = createContentRepository();

    for (const section of CONTENT_SECTIONS) {
      const cardCount = repository.getCards(section).length;
      const expectedCount = realContentCounts[section];

      expect(cardCount).toBeGreaterThanOrEqual(
        expectedCount - realContentCountTolerance,
      );
      expect(cardCount).toBeLessThanOrEqual(
        expectedCount + realContentCountTolerance,
      );
    }
  });

  it("deriva categorías desde los encabezados y general para phrasal verbs", () => {
    const repository = createContentRepository();
    const doHomework = repository
      .getCards("collocations")
      .find((card) => card.expression === "do homework");

    expect(doHomework?.category).toBe("DO");
    expect(repository.getCards("phrasal-verbs")[0]?.category).toBe("general");
  });
});
