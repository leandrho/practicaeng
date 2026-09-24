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

  it("carga los 70 conectores con los nueve grupos y dos tags complementarios", () => {
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

    expect(cards).toHaveLength(70);
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
      expect(card.tags).toHaveLength(2);
      expect(
        card.tags.filter((tag) => ["Formal", "Neutral", "Informal"].includes(tag)),
      ).toHaveLength(1);
      expect(
        card.tags.filter((tag) => ["Spoken", "Written", "Spoken & written"].includes(tag)),
      ).toHaveLength(1);
    }
  });

  it("mantiene las categorías de Prepositions y añade formas de complemento", () => {
    const cards = createContentRepository().getCards("prepositions");
    const interestedIn = cards.find((card) => card.expression === "interested in");
    const dependsOn = cards.find((card) => card.expression === "depend on");
    const expectedCategories = [
      "Adjective + preposition",
      "Noun + preposition",
      "Verb + preposition",
    ];

    expect(cards).toHaveLength(49);
    expect([...new Set(cards.map((card) => card.category))].sort()).toEqual(
      expectedCategories.sort(),
    );
    expect(interestedIn).toMatchObject({
      category: "Adjective + preposition",
      tags: ["+ noun phrase", "+ -ing"],
    });
    expect(dependsOn?.tags).toEqual(["+ noun phrase", "+ -ing", "+ clause"]);
    expect(cards.every((card) => card.type === "preposition")).toBe(true);
  });

  it("valida las etiquetas de las 200 tarjetas de Phrasal Verbs", () => {
    const cards = createContentRepository().getCards("phrasal-verbs");

    expect(cards).toHaveLength(200);
    for (const card of cards) {
      const tags = new Set(card.tags);
      expect(tags.has("Transitive") && tags.has("Intransitive")).toBe(false);
      expect(tags.has("Separable") && tags.has("Inseparable")).toBe(false);
      if (tags.has("Separable") || tags.has("Inseparable")) {
        expect(tags.has("Transitive")).toBe(true);
      }
      expect(tags.size).toBeGreaterThan(0);
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

  it("un conector sin Tags falla con archivo y línea", () => {
    let error: unknown;
    try {
      parseBulletCards(
        "## Purpose\n- **so that** --- with the purpose that --- para que --- *Speak slowly so that everyone can understand.* --- *Hablá despacio para que todos puedan entender.* --- *Speak slowly. That way, everyone can follow.* --- *Everyday conversation*",
        { file: "data/connectors-b1-b2.md", type: "connector" },
      );
    } catch (caught) {
      error = caught;
    }

    expect(error).toEqual({
      file: "data/connectors-b1-b2.md",
      line: 2,
      reason: "conector sin Tags de registro y uso",
    });
  });
});

function normalizeExpression(expression: string): string {
  return expression.toLowerCase().trim();
}
