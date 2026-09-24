import { describe, expect, it } from "vitest";
import {
  GapFillSchema,
  WordFamilySchema,
  WordFormationExerciseSchema,
} from "./word-formation";

const validExercise = {
  target: "noun" as const,
  sentenceEn: "She made an important ____ yesterday.",
  acceptedAnswers: ["decision"],
};

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
      exercise: validExercise,
    });
    expect(parsed.base).toBe("decide");
    expect(parsed.noun).toBe("decision");
    expect(parsed.examples).toEqual([]);
    expect(parsed.exercise).toEqual(validExercise);
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
        exercise: validExercise,
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
        exercise: validExercise,
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
        exercise: validExercise,
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
        exercise: validExercise,
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
        exercise: validExercise,
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
        exercise: validExercise,
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
      exercise: validExercise,
    });
    expect(parsed.contextSource).toBeUndefined();
  });

  it("familia sin ejercicio falla", () => {
    expect(() =>
      WordFamilySchema.parse({
        base: "decide",
        category: "D",
        noun: "decision",
        meaningHintEn: "to make a choice",
        meaningHint: "decidir",
        contextEn:
          '"We must decide now," she said, looking at the two roads ahead. There was no time to wait.',
      }),
    ).toThrow();
  });

  it("objetivo inexistente en la familia falla", () => {
    expect(() =>
      WordFamilySchema.parse({
        base: "announce",
        category: "A",
        noun: "announcement",
        meaningHintEn: "to make something public",
        meaningHint: "anunciar",
        contextEn: '"We must announce the news today," she said. Everyone waited.',
        exercise: {
          target: "adjective",
          sentenceEn: "It was very ____.",
          acceptedAnswers: ["announcement"],
        },
      }),
    ).toThrow();
  });

  it("respuesta no presente en la categoría falla", () => {
    expect(() =>
      WordFamilySchema.parse({
        base: "decide",
        category: "D",
        noun: "decision",
        adjective: "decisive",
        meaningHintEn: "to make a choice",
        meaningHint: "decidir",
        contextEn:
          '"We must decide now," she said, looking at the two roads ahead. There was no time to wait.',
        exercise: {
          target: "noun",
          sentenceEn: "She made an important ____ yesterday.",
          acceptedAnswers: ["decisive"],
        },
      }),
    ).toThrow();
  });
});

describe("WordFormationExerciseSchema", () => {
  it("ejercicio válido con dos respuestas pasa", () => {
    const parsed = WordFormationExerciseSchema.parse({
      target: "adjective",
      sentenceEn: "The view was ____.",
      acceptedAnswers: ["amazing", "amazed"],
    });
    expect(parsed.acceptedAnswers).toEqual(["amazing", "amazed"]);
  });

  it("sin hueco falla", () => {
    expect(() =>
      WordFormationExerciseSchema.parse({
        target: "noun",
        sentenceEn: "No gap here.",
        acceptedAnswers: ["decision"],
      }),
    ).toThrow();
  });

  it("dos huecos fallan", () => {
    expect(() =>
      WordFormationExerciseSchema.parse({
        target: "noun",
        sentenceEn: "____ and ____.",
        acceptedAnswers: ["decision"],
      }),
    ).toThrow();
  });

  it("hueco con distinto número de guiones falla", () => {
    expect(() =>
      WordFormationExerciseSchema.parse({
        target: "noun",
        sentenceEn: "She made an important ___ yesterday.",
        acceptedAnswers: ["decision"],
      }),
    ).toThrow();
  });

  it("respuestas duplicadas tras normalizar fallan", () => {
    expect(() =>
      WordFormationExerciseSchema.parse({
        target: "noun",
        sentenceEn: "She made an important ____ yesterday.",
        acceptedAnswers: ["decision", "  DECISION "],
      }),
    ).toThrow();
  });

  it("respuestas vacías fallan", () => {
    expect(() =>
      WordFormationExerciseSchema.parse({
        target: "noun",
        sentenceEn: "She made an important ____ yesterday.",
        acceptedAnswers: [],
      }),
    ).toThrow();
  });

  it("target inválido falla", () => {
    expect(() =>
      WordFormationExerciseSchema.parse({
        target: "verb",
        sentenceEn: "She made an important ____ yesterday.",
        acceptedAnswers: ["decision"],
      }),
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
