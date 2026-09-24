import { describe, expect, it } from "vitest";
import { checkGapFill } from "./checkGapFill";

describe("checkGapFill", () => {
  it("acepta diferencias de mayúsculas", () => {
    expect(checkGapFill("  DECISION ", ["decision"])).toEqual({ correct: true });
  });

  it("rechaza contenido distinto", () => {
    expect(checkGapFill("decisions", ["decision"])).toEqual({ correct: false });
  });

  it("ignora espacios al inicio, final y entre palabras", () => {
    expect(checkGapFill("  MAKE   A  DECISION ", ["make a decision"])).toEqual({
      correct: true,
    });
  });

  it("acepta cualquiera de las respuestas declaradas", () => {
    expect(checkGapFill("careful", ["careful", "careless"])).toEqual({
      correct: true,
    });
    expect(checkGapFill("careless", ["careful", "careless"])).toEqual({
      correct: true,
    });
  });

  it("rechaza formas de otra categoría no declaradas", () => {
    expect(checkGapFill("carefully", ["careful", "careless"])).toEqual({
      correct: false,
    });
  });

  it("acepta string único como respuesta", () => {
    expect(checkGapFill("decision", "decision")).toEqual({ correct: true });
  });
});
