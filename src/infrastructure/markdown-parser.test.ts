import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseBulletCards, parsePhrasalVerbCards } from "./markdown-parser";

const collocationsFixture = `## MAKE
- **make a decision** --- tomar una decisión --- *I need to make a decision today.*
- **make a mistake** --- cometer un error --- *Everyone makes
  mistakes.*
- **make progress** --- progresar --- *You're making good progress.*`;

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
  });
});

const phrasalVerbsFixture = `### 1. ask around
- **Significado:** preguntar a varias personas
- **Ejemplo:** I asked around, but nobody knew the answer.

### 2. ask out
- **Significado:** invitar a salir
- **Ejemplo:** He asked her out for dinner.

### 3. back up
- **Significado:** hacer una copia de seguridad
- **Ejemplo:** Back up your files before updating the system.`;

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
      meaningEs: "preguntar a varias personas",
      category: "general",
    });
  });

  it("informa archivo y línea cuando falta Ejemplo", () => {
    let error: unknown;
    try {
      parsePhrasalVerbCards(
        "### 1. ask around\n- **Significado:** preguntar a varias personas",
        "data/phrasal-verbs-b1-b2-200.md",
      );
    } catch (caught) {
      error = caught;
    }

    expect(error).toEqual({
      file: "data/phrasal-verbs-b1-b2-200.md",
      line: 1,
      reason: "tarjeta sin Ejemplo",
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
