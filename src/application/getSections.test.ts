import { describe, expect, it } from "vitest";
import { getSections } from "./getSections";

describe("getSections", () => {
  it("devuelve las cinco secciones fijas", () => {
    expect(getSections()).toEqual([
      "phrasal-verbs",
      "collocations",
      "prepositions",
      "idioms",
      "word-formation",
    ]);
  });
});
