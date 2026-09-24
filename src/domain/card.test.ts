import { describe, expect, it } from "vitest";
import { CardSchema, CardTagSchema } from "./card";

const validCard = {
  expression: "give up",
  type: "phrasal-verb",
  meaningEn: "to stop trying",
  meaningEs: "rendirse",
  exampleEn: "Don't give up.",
  translationEs: "No te rindas.",
  category: "GENERAL",
  sourceFile: "data/idioms-b1-b2.md",
  contextEn: '"Are you ready?" "Give me a minute, I don\'t want to give up now."',
  contextSource: "Everyday conversation",
} as const;

describe("CardSchema", () => {
  it("Card válida pasa", () => {
    const parsed = CardSchema.parse(validCard);
    expect(parsed.expression).toBe("give up");
  });

  it("Card completa no muta salvo level default", () => {
    const parsed = CardSchema.parse(validCard);
    expect(parsed).toMatchObject(validCard);
    expect(parsed.level).toBe("B1-B2");
    expect(parsed.tags).toEqual([]);
  });

  it("level ausente → default B1-B2", () => {
    const parsed = CardSchema.parse(validCard);
    expect(parsed.level).toBe("B1-B2");
  });

  it("expression vacía falla", () => {
    expect(() =>
      CardSchema.parse({ ...validCard, expression: "" }),
    ).toThrow();
  });

  it("type inválido falla", () => {
    expect(() => CardSchema.parse({ ...validCard, type: "verb" })).toThrow();
  });

  it("everyday-phrase es un tipo válido", () => {
    expect(CardSchema.parse({ ...validCard, type: "everyday-phrase" }).type).toBe(
      "everyday-phrase",
    );
  });

  it("connector es un tipo válido", () => {
    const parsed = CardSchema.parse({
      ...validCard,
      type: "connector",
      tags: ["Neutral", "Spoken & written"],
    });
    expect(parsed.type).toBe("connector");
    expect(parsed.tags).toEqual(["Neutral", "Spoken & written"]);
  });

  it("rechaza conectores sin exactamente un tag de registro y uno de uso", () => {
    expect(() => CardSchema.parse({ ...validCard, type: "connector" })).toThrow();
    expect(() =>
      CardSchema.parse({
        ...validCard,
        type: "connector",
        tags: ["Neutral"],
      }),
    ).toThrow();
    expect(() =>
      CardSchema.parse({
        ...validCard,
        type: "connector",
        tags: ["Neutral", "Formal", "Written"],
      }),
    ).toThrow();
  });

  it("valida el allowlist de tags según el tipo", () => {
    expect(() =>
      CardSchema.parse({ ...validCard, type: "phrasal-verb", tags: ["Formal"] }),
    ).toThrow();
    expect(() =>
      CardSchema.parse({ ...validCard, type: "collocation", tags: ["Transitive"] }),
    ).toThrow();
    expect(() => CardTagSchema.parse("NotATag")).toThrow();
    expect(CardTagSchema.parse("Academic")).toBe("Academic");
    expect(CardTagSchema.parse("Polite")).toBe("Polite");
    expect(CardTagSchema.parse("Work")).toBe("Work");
    expect(CardTagSchema.parse("Daily life")).toBe("Daily life");
  });

  it("acepta tags de registro y canal para idiom", () => {
    expect(
      CardSchema.parse({ ...validCard, type: "idiom", tags: ["Informal", "Spoken"] }).tags,
    ).toEqual(["Informal", "Spoken"]);
    expect(
      CardSchema.parse({ ...validCard, type: "idiom", tags: [] }).tags,
    ).toEqual([]);
    for (const tags of [["Polite"], ["Work"], ["Academic"], ["Daily life"], ["Transitive"]]) {
      expect(() => CardSchema.parse({ ...validCard, type: "idiom", tags })).toThrow();
    }
  });

  it("acepta registro, canal y Polite para everyday-phrase", () => {
    expect(
      CardSchema.parse({ ...validCard, type: "everyday-phrase", tags: ["Formal", "Polite"] })
        .tags,
    ).toEqual(["Formal", "Polite"]);
    expect(
      CardSchema.parse({ ...validCard, type: "everyday-phrase", tags: [] }).tags,
    ).toEqual([]);
    for (const tags of [["Work"], ["Academic"], ["Daily life"], ["Transitive"]]) {
      expect(() =>
        CardSchema.parse({ ...validCard, type: "everyday-phrase", tags }),
      ).toThrow();
    }
  });

  it("acepta registro, canal y ámbito para collocation", () => {
    expect(
      CardSchema.parse({ ...validCard, type: "collocation", tags: ["Academic"] }).tags,
    ).toEqual(["Academic"]);
    expect(
      CardSchema.parse({ ...validCard, type: "collocation", tags: ["Work", "Formal"] }).tags,
    ).toEqual(["Work", "Formal"]);
    expect(
      CardSchema.parse({ ...validCard, type: "collocation", tags: ["Daily life"] }).tags,
    ).toEqual(["Daily life"]);
    expect(
      CardSchema.parse({ ...validCard, type: "collocation", tags: [] }).tags,
    ).toEqual([]);
    for (const tags of [["Polite"], ["Transitive"], ["+ noun phrase"]]) {
      expect(() => CardSchema.parse({ ...validCard, type: "collocation", tags })).toThrow();
    }
  });

  it("acepta patrones gramaticales válidos por sección", () => {
    expect(
      CardSchema.parse({ ...validCard, type: "phrasal-verb", tags: ["Transitive", "Separable"] })
        .tags,
    ).toEqual(["Transitive", "Separable"]);
    expect(
      CardSchema.parse({ ...validCard, type: "preposition", tags: ["+ noun phrase", "+ -ing"] })
        .tags,
    ).toEqual(["+ noun phrase", "+ -ing"]);
  });

  it("rechaza combinaciones contradictorias de tags phrasal", () => {
    for (const tags of [
      ["Transitive", "Intransitive"],
      ["Intransitive", "Separable"],
      ["Transitive", "Separable", "Inseparable"],
    ]) {
      expect(() =>
        CardSchema.parse({ ...validCard, type: "phrasal-verb", tags }),
      ).toThrow();
    }
  });

  it("meaningEn y translationEs son obligatorios", () => {
    expect(() =>
      CardSchema.parse({ ...validCard, meaningEn: "" }),
    ).toThrow();
    expect(() => {
      const { translationEs: _translationEs, ...cardWithoutTranslation } = validCard;
      CardSchema.parse(cardWithoutTranslation);
    }).toThrow();
    expect(() =>
      CardSchema.parse({ ...validCard, translationEs: "" }),
    ).toThrow();
  });

  it("irregular-verb sin pasado falla", () => {
    expect(() =>
      CardSchema.parse({ ...validCard, type: "irregular-verb" }),
    ).toThrow();
  });

  it("irregular-verb con pasado pasa", () => {
    const parsed = CardSchema.parse({
      ...validCard,
      type: "irregular-verb",
      pastSimple: "went",
      pastParticiple: "gone",
    });
    expect(parsed.pastSimple).toBe("went");
    expect(parsed.pastParticiple).toBe("gone");
  });

  it("contextEn es obligatorio", () => {
    expect(() => {
      const { contextEn: _contextEn, ...cardWithoutContext } = validCard;
      CardSchema.parse(cardWithoutContext);
    }).toThrow();
    expect(() => CardSchema.parse({ ...validCard, contextEn: "" })).toThrow();
  });

  it("contextSource es opcional", () => {
    const { contextSource: _contextSource, ...cardWithoutSource } = validCard;
    const parsed = CardSchema.parse(cardWithoutSource);
    expect(parsed.contextEn).toBe(validCard.contextEn);
    expect(parsed.contextSource).toBeUndefined();
  });
});
