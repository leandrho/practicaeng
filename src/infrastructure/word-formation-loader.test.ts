import { describe, expect, it } from "vitest";
import { WordFamilySchema } from "../domain/word-formation";
import { buildGapFills, getWordFamilies } from "./word-formation-loader";
import { parseWordFamilies } from "./word-formation-parser";

const realWordFamilyCount = 76;
// The versioned Markdown is a fixed baseline, so content changes must update it explicitly.
const realWordFamilyCountTolerance = 0;

describe("buildGapFills", () => {
  it("deriva una actividad por forma presente, en orden noun, adjective y adverb", () => {
    const [family] = parseWordFamilies(
      `Base | Sustantivo | Adjetivo | Adverbio | Hint (EN) | Significado orientativo
| --- | --- | --- | --- | --- | --- |
| amaze | amazement | amazing / amazed | amazingly | to surprise | asombrar |
## Contextos
- **amaze:** "The view amazed us completely," she said. We stood in silence for a while.
## Ejercicios
- **Base:** amaze --- **Target:** adjective --- **Sentence (EN):** The tourists were ____ by the view. --- **Answers:** amazed`,
      "data/word-formation-b1-b2.md",
    );
    if (family === undefined) {
      throw new Error("La familia amaze debía haberse parseado");
    }

    const gapFills = buildGapFills(family);

    expect(gapFills).toEqual([
      {
        prompt: 'Complete with the correct form of "AMAZE": ______ (AMAZE)',
        base: "amaze",
        answer: "amazement",
      },
      {
        prompt: 'Complete with the correct form of "AMAZE": ______ (AMAZE)',
        base: "amaze",
        answer: "amazing",
      },
      {
        prompt: 'Complete with the correct form of "AMAZE": ______ (AMAZE)',
        base: "amaze",
        answer: "amazingly",
      },
    ]);
    expect(family.adjective).toBe("amazing / amazed");
    expect(buildGapFills(family)).toEqual(gapFills);
  });

  it("deriva una sola actividad para una familia con solo noun", () => {
    const family = WordFamilySchema.parse({
      base: "announce",
      category: "A",
      noun: "announcement",
      meaningHintEn: "to make something public",
      meaningHint: "anunciar",
      contextEn: '"We must announce the news today," she said. Everyone waited in silence.',
      contextSource: "Everyday conversation",
      exercise: {
        target: "noun",
        sentenceEn: "They will make an ____ on Friday.",
        acceptedAnswers: ["announcement"],
      },
    });

    expect(buildGapFills(family)).toEqual([
      {
        prompt: 'Complete with the correct form of "ANNOUNCE": ______ (ANNOUNCE)',
        base: "announce",
        answer: "announcement",
      },
    ]);
  });

  it("carga y valida todas las familias del Markdown real", () => {
    const families = getWordFamilies();

    expect(families.length).toBeGreaterThanOrEqual(
      realWordFamilyCount - realWordFamilyCountTolerance,
    );
    expect(families.length).toBeLessThanOrEqual(
      realWordFamilyCount + realWordFamilyCountTolerance,
    );

    for (const family of families) {
      expect(WordFamilySchema.parse(family)).toEqual(family);
      expect(family.exercise.sentenceEn).toContain("____");
      expect(family.exercise.acceptedAnswers.length).toBeGreaterThanOrEqual(1);
    }
  });
});
