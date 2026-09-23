import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CardSchema } from "../domain/card";
import {
  CONTENT_SECTIONS,
  MIXED_SECTIONS,
  createContentRepository,
  type ContentSection,
} from "./content-loader";
import { parseBulletCards } from "./markdown-parser";

const fixtureDirectory = join(
  process.cwd(),
  "src/infrastructure/fixtures/content",
);

const realContentCounts: Record<ContentSection, number> = {
  "phrasal-verbs": 200,
  collocations: 50,
  prepositions: 49,
  idioms: 35,
  "irregular-verbs": 100,
  "everyday-phrases": 150,
  connectors: 70,
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
      "irregular-verbs": "irregular-verb",
      "everyday-phrases": "everyday-phrase",
      connectors: "connector",
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

  it("carga 150 everyday phrases B1-B2 en seis categorías de 25", () => {
    const cards = createContentRepository().getCards("everyday-phrases");
    const expectedCategories = [
      "Greetings & socializing",
      "Courtesy & requests",
      "Home & daily routine",
      "Shopping, food & services",
      "Travel & directions",
      "Work, plans & problems",
    ];

    expect(cards).toHaveLength(150);
    expect(cards.every((card) => card.type === "everyday-phrase")).toBe(true);
    expect(cards.every((card) => card.level === "B1-B2")).toBe(true);
    expect([...new Set(cards.map((card) => card.category))]).toEqual(expectedCategories);

    for (const category of expectedCategories) {
      expect(cards.filter((card) => card.category === category)).toHaveLength(25);
    }
  });

  it("mantiene las everyday phrases normalizadas sin duplicados", () => {
    const repository = createContentRepository();
    const cards = repository.getCards("everyday-phrases");
    const expressions = cards.map((card) => normalizeExpression(card.expression));
    const existingExpressions = new Set(
      CONTENT_SECTIONS.filter((section) => section !== "everyday-phrases").flatMap(
        (section) =>
          repository
            .getCards(section)
            .map((card) => normalizeExpression(card.expression)),
      ),
    );

    expect(new Set(expressions)).toHaveLength(cards.length);
    expect(expressions.some((expression) => existingExpressions.has(expression))).toBe(false);
  });

  it("expone solo la base en expression y el pasado por separado", () => {
    const repository = createContentRepository();
    const be = repository
      .getCards("irregular-verbs")
      .find((card) => card.expression === "be");

    expect(be).toMatchObject({
      type: "irregular-verb",
      pastSimple: "was/were",
      pastParticiple: "been",
    });
  });

  it("carga al menos 70 conectores con los nueve grupos de función", () => {
    const cards = createContentRepository().getCards("connectors");
    const expectedCategories = [
      "Adding information",
      "Contrast and concession",
      "Cause and reason",
      "Result and consequence",
      "Purpose",
      "Time and sequence",
      "Examples and clarification",
      "Opinion and stance",
      "Summary and conclusion",
    ];

    expect(cards.length).toBeGreaterThanOrEqual(70);
    expect(cards.every((card) => card.type === "connector")).toBe(true);
    expect(cards.every((card) => card.level === "B1-B2")).toBe(true);
    expect([...new Set(cards.map((card) => card.category))].sort()).toEqual(
      [...expectedCategories].sort(),
    );

    for (const category of expectedCategories) {
      expect(cards.filter((card) => card.category === category).length).toBeGreaterThanOrEqual(5);
    }

    for (const card of cards) {
      expect([
        card.expression,
        card.meaningEn,
        card.meaningEs,
        card.exampleEn,
        card.translationEs,
        card.category,
        card.contextEn,
      ].every((field) => field.length > 0)).toBe(true);
    }
  });

  it("MIXED_SECTIONS deja fuera connectors", () => {
    expect(MIXED_SECTIONS).not.toContain("connectors");
    expect(MIXED_SECTIONS).toEqual(
      CONTENT_SECTIONS.filter((section) => section !== "connectors"),
    );
  });

  it("un bullet de conectores incompleto falla con archivo y línea", () => {
    let error: unknown;
    try {
      parseBulletCards(
        "## Purpose\n- **so that** --- con el fin de que --- para que --- *Speak slowly so that everyone can understand.* --- *Hablá despacio para que todos puedan entender.*",
        { file: "data/connectors-b1-b2.md", type: "connector" },
      );
    } catch (caught) {
      error = caught;
    }

    expect(error).toEqual({
      file: "data/connectors-b1-b2.md",
      line: 2,
      reason: "tarjeta sin Context (EN)",
    });
  });
});

function normalizeExpression(expression: string): string {
  return expression.toLowerCase().trim();
}
