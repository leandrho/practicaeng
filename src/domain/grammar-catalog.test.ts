import { describe, expect, it } from "vitest";
import { GRAMMAR_PARTS } from "./grammar-catalog";

describe("grammar catalog", () => {
  it("mantiene ocho partes consecutivas y la cantidad de temas acordada", () => {
    expect(GRAMMAR_PARTS.map((part) => part.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(GRAMMAR_PARTS.map((part) => part.topics.length)).toEqual([4, 3, 3, 5, 4, 2, 2, 3]);
  });

  it("conserva el orden editorial y tiene 26 slugs únicos", () => {
    const slugs = GRAMMAR_PARTS.flatMap((part) => part.topics.map((topic) => topic.slug));

    expect(slugs).toEqual([
      "present-simple-present-progressive",
      "stative-verbs",
      "comparisons",
      "countable-and-uncountable-nouns",
      "past-simple-past-progressive",
      "past-perfect-simple-past-perfect-progressive",
      "used-to-would-was-were-going-to",
      "present-perfect-simple-present-perfect-progressive",
      "defining-and-non-defining-relative-clauses",
      "should-ought-to-had-better",
      "future-tenses",
      "other-future-forms",
      "time-clauses",
      "conditional-sentences-types-zero-1-and-2",
      "must-have-to-need",
      "infinitives-and-the-ing-form",
      "expressing-possibility-may-might-would",
      "making-deductions-must-cant",
      "question-tags",
      "passive-voice",
      "clauses-of-concession",
      "reported-speech-statements-special-introductory-verbs-questions-commands-and-requests",
      "clauses-of-result",
      "unreal-past",
      "conditional-sentences-type-3",
      "causative-form",
    ]);
    expect(new Set(slugs).size).toBe(26);
  });

  it("mantiene los títulos editoriales únicos para resolver los encabezados Markdown", () => {
    const titles = GRAMMAR_PARTS.flatMap((part) => part.topics.map((topic) => topic.title));
    expect(new Set(titles).size).toBe(26);
    expect(titles[0]).toBe("Present Simple / Present Progressive");
    expect(titles[21]).toBe("Reported Speech: statements, special introductory verbs, questions, commands and requests");
    expect(titles.at(-1)).toBe("Causative Form");
  });
});
