import { describe, expect, it } from "vitest";
import { CardSchema } from "./card";

const validCard = {
  expression: "give up",
  type: "phrasal-verb",
  meaningEn: "to stop trying",
  meaningEs: "rendirse",
  exampleEn: "Don't give up.",
  translationEs: "No te rindas.",
  category: "GENERAL",
  sourceFile: "data/idioms-b1-b2.md",
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
});
