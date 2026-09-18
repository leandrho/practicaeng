import { describe, expect, it } from "vitest";
import { GapFillSchema, WordFamilySchema } from "./word-formation";

describe("WordFamilySchema", () => {
  it("familia válida con 1 forma pasa", () => {
    const parsed = WordFamilySchema.parse({
      base: "decide",
      category: "D",
      noun: "decision",
    });
    expect(parsed.base).toBe("decide");
    expect(parsed.noun).toBe("decision");
    expect(parsed.examples).toEqual([]);
  });

  it("sin formas (todo --- / ausente) falla por refinamiento", () => {
    expect(() => WordFamilySchema.parse({ base: "decide", category: "D" })).toThrow();
  });

  it("base vacía falla", () => {
    expect(() =>
      WordFamilySchema.parse({ base: "", category: "D", noun: "decision" }),
    ).toThrow();
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
