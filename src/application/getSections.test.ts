import { describe, expect, it } from "vitest";
import { getSections } from "./getSections";

describe("getSections", () => {
  it("devuelve las ocho secciones fijas", () => {
    expect(getSections()).toEqual([
      "phrasal-verbs",
      "collocations",
      "prepositions",
      "idioms",
      "irregular-verbs",
      "word-formation",
      "everyday-phrases",
      "connectors",
    ]);
  });
});
