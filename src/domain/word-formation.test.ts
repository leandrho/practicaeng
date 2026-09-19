import { describe, expect, it } from "vitest";
import { GapFillSchema, WordFamilySchema } from "./word-formation";

describe("WordFamilySchema", () => {
  it("familia válida con 1 forma pasa", () => {
    const parsed = WordFamilySchema.parse({
      base: "decide",
      category: "D",
      noun: "decision",
      meaningHintEn: "to make a choice",
      meaningHint: "decidir",
      contextEn:
        '"We must decide now," she said, looking at the two roads ahead. There was no time to wait.',
      contextSource: "Everyday conversation",
    });
    expect(parsed.base).toBe("decide");
    expect(parsed.noun).toBe("decision");
    expect(parsed.examples).toEqual([]);
  });

  it("sin formas (todo --- / ausente) falla por refinamiento", () => {
    expect(() =>
      WordFamilySchema.parse({
        base: "decide",
        category: "D",
        meaningHintEn: "to make a choice",
        meaningHint: "decidir",
        contextEn:
          '"We must decide now," she said, looking at the two roads ahead. There was no time to wait.',
      }),
    ).toThrow();
  });

  it("base vacía falla", () => {
    expect(() =>
      WordFamilySchema.parse({
        base: "",
        category: "D",
        noun: "decision",
        meaningHintEn: "to make a choice",
        meaningHint: "decidir",
        contextEn:
          '"We must decide now," she said, looking at the two roads ahead. There was no time to wait.',
      }),
    ).toThrow();
  });

  it("los hints en inglés y español son obligatorios", () => {
    expect(() =>
      WordFamilySchema.parse({
        base: "decide",
        category: "D",
        noun: "decision",
        meaningHint: "decidir",
        contextEn:
          '"We must decide now," she said, looking at the two roads ahead. There was no time to wait.',
      }),
    ).toThrow();
    expect(() =>
      WordFamilySchema.parse({
        base: "decide",
        category: "D",
        noun: "decision",
        meaningHintEn: "to make a choice",
        contextEn:
          '"We must decide now," she said, looking at the two roads ahead. There was no time to wait.',
      }),
    ).toThrow();
  });

  it("contextEn es obligatorio", () => {
    expect(() =>
      WordFamilySchema.parse({
        base: "decide",
        category: "D",
        noun: "decision",
        meaningHintEn: "to make a choice",
        meaningHint: "decidir",
      }),
    ).toThrow();
    expect(() =>
      WordFamilySchema.parse({
        base: "decide",
        category: "D",
        noun: "decision",
        meaningHintEn: "to make a choice",
        meaningHint: "decidir",
        contextEn: "",
      }),
    ).toThrow();
  });

  it("contextSource es opcional", () => {
    const parsed = WordFamilySchema.parse({
      base: "decide",
      category: "D",
      noun: "decision",
      meaningHintEn: "to make a choice",
      meaningHint: "decidir",
      contextEn:
        '"We must decide now," she said, looking at the two roads ahead. There was no time to wait.',
    });
    expect(parsed.contextSource).toBeUndefined();
  });
});

describe("GapFillSchema", () => {
  it("gap-fill válido pasa", () => {
    const parsed = GapFillSchema.parse({
      prompt: "I haven't made a final ______ yet. (DECIDE)",
      base: "decide",
      answer: "decision",
    });
    expect(parsed.answer).toBe("decision");
  });

  it("prompt vacío falla", () => {
    expect(() =>
      GapFillSchema.parse({ prompt: "", base: "decide", answer: "decision" }),
    ).toThrow();
  });
});
