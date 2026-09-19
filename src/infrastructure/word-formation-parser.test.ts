import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseWordFamilies } from "./word-formation-parser";

function fixedRow(
  base: string,
  noun: string,
  adjective: string,
  adverb: string,
  meaningEn: string,
  meaning: string,
): string {
  return `${base.padEnd(6)}${noun.padEnd(15)}${adjective.padEnd(16)}${adverb.padEnd(16)}${meaningEn.padEnd(25)}${meaning}`;
}

const fixture = [
  "Base  Sustantivo     Adjetivo        Adverbio        Hint (EN)                Significado orientativo",
  "----  -------------  --------------  --------------  -----------------------  -----------------------",
  fixedRow("act", "action", "active", "actively", "to do something", "actuar / acción / activo /"),
  "".padEnd(78) + "activamente",
  fixedRow("amaze", "amazement", "amazing /", "amazingly", "to surprise", "asombrar / asombro /"),
  "".padEnd(21) + "amazed".padEnd(57) + "increíble-asombrado",
  fixedRow("apply", "application /", "applicable", "---", "to request", "solicitar-aplicar /"),
  "".padEnd(6) + "applicant".padEnd(72) + "solicitud-solicitante /",
  "".padEnd(78) + "aplicable",
  "---------------------------------------------------------------------------------------------------------",
  "## Ejemplos para practicar en contexto",
  "- **act → action → active → actively:** *Act now.* / *Action matters.*",
  "## Contextos",
  '- **act:** "We must act now," he whispered when the lights went out during the school play. — Everyday conversation',
  '- **amaze:** "The view amazed us completely," she said. We stood in silence for a while. — Emma · J. Austen (adapted)',
  '- **apply:** "You must apply early," he said. There is no time to wait.',
  "## Idea de tarjeta para la app",
  "**Frente:** `ACT`",
].join("\n");

describe("parseWordFamilies", () => {
  it("parsea filas de ancho fijo, celdas multilínea y formas alternativas", () => {
    expect(parseWordFamilies(fixture, "data/word-formation-b1-b2.md")).toEqual([
      {
        base: "act",
        level: "B1-B2",
        category: "A",
        noun: "action",
        adjective: "active",
        adverb: "actively",
        meaningHintEn: "to do something",
        meaningHint: "actuar / acción / activo / activamente",
        contextEn:
          '"We must act now," he whispered when the lights went out during the school play.',
        contextSource: "Everyday conversation",
        examples: ["Act now.", "Action matters."],
      },
      {
        base: "amaze",
        level: "B1-B2",
        category: "A",
        noun: "amazement",
        adjective: "amazing / amazed",
        adverb: "amazingly",
        meaningHintEn: "to surprise",
        meaningHint: "asombrar / asombro / increíble-asombrado",
        contextEn: '"The view amazed us completely," she said. We stood in silence for a while.',
        contextSource: "Emma · J. Austen (adapted)",
        examples: [],
      },
      {
        base: "apply",
        level: "B1-B2",
        category: "A",
        noun: "application / applicant",
        adjective: "applicable",
        meaningHintEn: "to request",
        meaningHint: "solicitar-aplicar / solicitud-solicitante / aplicable",
        contextEn: '"You must apply early," he said. There is no time to wait.',
        contextSource: "Everyday conversation",
        examples: [],
      },
    ]);
  });

  it("convierte --- a undefined", () => {
    const [family] = parseWordFamilies(
      `Base | Sustantivo | Adjetivo | Adverbio | Hint (EN) | Significado orientativo
| --- | --- | --- | --- | --- | --- |
| announce | announcement | --- | --- | to make something public | anunciar / anuncio |
## Contextos
- **announce:** "We must announce the news today," she said. Everyone waited in silence.`,
      "data/word-formation-b1-b2.md",
    );

    expect(family).toMatchObject({
      base: "announce",
      noun: "announcement",
      adjective: undefined,
      adverb: undefined,
      contextSource: "Everyday conversation",
    });
  });

  it("informa archivo y línea cuando una familia no tiene formas", () => {
    let error: unknown;
    try {
      parseWordFamilies(
        `Base | Sustantivo | Adjetivo | Adverbio | Hint (EN) | Significado orientativo
| --- | --- | --- | --- | --- | --- |
| invalid | --- | --- | --- | without forms | sin formas |
## Contextos
- **invalid:** "We must invalid now," she said. There was no time to wait.`,
        "data/word-formation-b1-b2.md",
      );
    } catch (caught) {
      error = caught;
    }

    expect(error).toMatchObject({
      file: "data/word-formation-b1-b2.md",
      line: 3,
      reason: expect.any(String),
    });
  });

  it("falla cuando falta el bullet de contexto", () => {
    let error: unknown;
    try {
      parseWordFamilies(
        `Base | Sustantivo | Adjetivo | Adverbio | Hint (EN) | Significado orientativo
| --- | --- | --- | --- | --- | --- |
| act | action | active | actively | to do something | actuar |
## Contextos
- **other:** "Something else," she said. We waited.`,
        "data/word-formation-b1-b2.md",
      );
    } catch (caught) {
      error = caught;
    }

    expect(error).toMatchObject({
      file: "data/word-formation-b1-b2.md",
      line: 3,
      reason: "familia sin Context (EN)",
    });
  });

  it("falla cuando sobra un contexto sin familia", () => {
    let error: unknown;
    try {
      parseWordFamilies(
        `Base | Sustantivo | Adjetivo | Adverbio | Hint (EN) | Significado orientativo
| --- | --- | --- | --- | --- | --- |
| act | action | active | actively | to do something | actuar |
## Contextos
- **act:** "We must act now," he said. There was no time to wait.
- **extra:** "Something extra," she said. We waited.`,
        "data/word-formation-b1-b2.md",
      );
    } catch (caught) {
      error = caught;
    }

    expect(error).toMatchObject({
      file: "data/word-formation-b1-b2.md",
      reason: expect.stringContaining("contexto sin familia"),
    });
  });

  it("ignora la cola real del archivo fuera de la tabla", () => {
    const markdown = readFileSync("data/word-formation-b1-b2.md", "utf8");
    const finalSections = markdown.slice(markdown.indexOf("## Ejemplos para practicar"));

    expect(parseWordFamilies(finalSections, "data/word-formation-b1-b2.md")).toEqual([]);
  });
});
