import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseBulletCards, parsePhrasalVerbCards } from "./markdown-parser";

const collocationsFixture = `## MAKE
- **make a decision** --- to choose something --- tomar una decisión --- *I need to make a decision today.* --- *Necesito tomar una decisión hoy.*
- **make a mistake** --- to do something wrong --- cometer un error --- *Everyone makes
  mistakes.* --- *Todos cometemos errores.*
- **make progress** --- to improve --- progresar --- *You're making good progress.* --- *Estás progresando mucho.*`;

describe("parseBulletCards", () => {
  it("parsea bullets, conserva la categoría y une ejemplos multilínea", () => {
    const cards = parseBulletCards(collocationsFixture, {
      file: "data/collocations-b1-b2.md",
      type: "collocation",
    });

    expect(cards).toHaveLength(3);
    expect(cards[0]).toMatchObject({
      expression: "make a decision",
      category: "MAKE",
      type: "collocation",
      level: "B1-B2",
    });
    expect(cards[1]?.exampleEn).toBe("Everyone makes mistakes.");
    expect(cards[1]?.translationEs).toBe("Todos cometemos errores.");
  });
});

const phrasalVerbsFixture = `### 1. ask around
- **Meaning (EN):** to ask several people
- **Significado:** preguntar a varias personas
- **Ejemplo:** I asked around, but nobody knew the answer.
- **Traducción (ES):** Pregunté a varias personas, pero nadie sabía la respuesta.

### 2. ask out
- **Meaning (EN):** to invite someone on a date
- **Significado:** invitar a salir
- **Ejemplo:** He asked her out for dinner.
- **Traducción (ES):** La invitó a cenar.

### 3. back up
- **Meaning (EN):** to make a copy of data
- **Significado:** hacer una copia de seguridad
- **Ejemplo:** Back up your files before updating the system.
- **Traducción (ES):** Hacé una copia de tus archivos antes de actualizar el sistema.`;

describe("parsePhrasalVerbCards", () => {
  it("parsea tarjetas phrasal con categoría general", () => {
    const cards = parsePhrasalVerbCards(
      phrasalVerbsFixture,
      "data/phrasal-verbs-b1-b2-200.md",
    );

    expect(cards).toHaveLength(3);
    expect(cards[0]).toMatchObject({
      expression: "ask around",
      type: "phrasal-verb",
      meaningEn: "to ask several people",
      meaningEs: "preguntar a varias personas",
      category: "general",
    });
  });

  it("informa archivo y línea cuando falta Meaning (EN)", () => {
    let error: unknown;
    try {
      parsePhrasalVerbCards(
        "### 1. ask around\n- **Significado:** preguntar a varias personas\n- **Ejemplo:** I asked around.\n- **Traducción (ES):** Pregunté a varias personas.",
        "data/phrasal-verbs-b1-b2-200.md",
      );
    } catch (caught) {
      error = caught;
    }

    expect(error).toEqual({
      file: "data/phrasal-verbs-b1-b2-200.md",
      line: 1,
      reason: "tarjeta sin Meaning (EN)",
    });
  });

  it("ignora la cola JSON real", () => {
    const markdown = readFileSync("data/phrasal-verbs-b1-b2-200.md", "utf8");
    const finalSection = markdown.slice(
      markdown.indexOf("## Estructura sugerida para la app"),
    );

    expect(
      parsePhrasalVerbCards(finalSection, "data/phrasal-verbs-b1-b2-200.md"),
    ).toEqual([]);
  });
});
