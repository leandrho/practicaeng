import { describe, expect, it } from "vitest";
import { checkGapFill } from "./checkGapFill";

describe("checkGapFill", () => {
  it("acepta diferencias de mayúsculas", () => {
    expect(checkGapFill("  DECISION ", "decision")).toEqual({ correct: true });
  });

  it("rechaza contenido distinto", () => {
    expect(checkGapFill("decisions", "decision")).toEqual({ correct: false });
  });

  it("ignora espacios al inicio, final y entre palabras", () => {
    expect(checkGapFill("  MAKE   A  DECISION ", "make a decision")).toEqual({
      correct: true,
    });
  });

  it("acepta la primera forma de una respuesta alternativa", () => {
    expect(checkGapFill("careful", "careful / careless")).toEqual({
      correct: true,
    });
  });
});
