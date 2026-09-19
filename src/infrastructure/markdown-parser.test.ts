import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseBulletCards, parseIrregularVerbCards, parsePhrasalVerbCards } from "./markdown-parser";

const collocationsFixture = `## MAKE
- **make a decision** --- to choose something --- tomar una decisión --- *I need to make a decision today.* --- *Necesito tomar una decisión hoy.* --- *"I must make a decision before nightfall," she said, looking at the two roads ahead.* --- *Everyday conversation*
- **make a mistake** --- to do something wrong --- cometer un error --- *Everyone makes
  mistakes.* --- *Todos cometemos errores.* --- *"We all make mistakes sometimes," he said. Nobody laughed at her.* --- *Emma · J. Austen (adapted)*
- **make progress** --- to improve --- progresar --- *You're making good progress.* --- *Estás progresando mucho.* --- *"You are making good progress," the teacher said. Keep practicing every day.*`;

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
      contextEn:
        '"I must make a decision before nightfall," she said, looking at the two roads ahead.',
      contextSource: "Everyday conversation",
    });
    expect(cards[1]?.exampleEn).toBe("Everyone makes mistakes.");
    expect(cards[1]?.translationEs).toBe("Todos cometemos errores.");
    expect(cards[1]).toMatchObject({
      contextSource: "Emma · J. Austen (adapted)",
    });
  });

  it("informa archivo y línea cuando falta Context (EN)", () => {
    let error: unknown;
    try {
      parseBulletCards(
        "- **make a decision** --- to choose something --- tomar una decisión --- *I need to make a decision today.* --- *Necesito tomar una decisión hoy.*",
        { file: "data/collocations-b1-b2.md", type: "collocation" },
      );
    } catch (caught) {
      error = caught;
    }

    expect(error).toEqual({
      file: "data/collocations-b1-b2.md",
      line: 1,
      reason: "tarjeta sin Context (EN)",
    });
  });

  it("usa Everyday conversation por defecto sin séptimo bloque", () => {
    const [card] = parseBulletCards(
      "- **make a decision** --- to choose something --- tomar una decisión --- *I need to make a decision today.* --- *Necesito tomar una decisión hoy.* --- *\"I must make a decision soon,\" she said.*",
      { file: "data/collocations-b1-b2.md", type: "collocation" },
    );

    expect(card?.contextSource).toBe("Everyday conversation");
  });
});

const irregularVerbsFixture = `## A–B
- **be – was/were – been** --- exist or be present --- ser / estar --- *I was tired yesterday.* --- *Ayer estaba cansado.* --- *"To be or not to be," he read aloud. The whole class listened quietly.* --- *Everyday conversation*
- **go – went – gone** --- move or travel --- ir --- *We went to the beach.* --- *Fuimos a la playa.* --- *"We must go now," she said when the lights went out. There was no time to wait.*`;

describe("parseIrregularVerbCards", () => {
  it("separa base, pasado y participio y conserva la categoría", () => {
    const cards = parseIrregularVerbCards(
      irregularVerbsFixture,
      "data/irregular-verbs-b1-b2.md",
    );

    expect(cards).toHaveLength(2);
    expect(cards[0]).toMatchObject({
      expression: "be",
      type: "irregular-verb",
      pastSimple: "was/were",
      pastParticiple: "been",
      category: "A–B",
      level: "B1-B2",
    });
    expect(cards[1]).toMatchObject({
      expression: "go",
      pastSimple: "went",
      pastParticiple: "gone",
    });
  });

  it("informa archivo y línea cuando faltan formas", () => {
    let error: unknown;
    try {
      parseIrregularVerbCards(
        "- **be** --- exist --- ser --- *I was tired.* --- *Estaba cansado.* --- *\"To be here,\" he said. We waited.*",
        "data/irregular-verbs-b1-b2.md",
      );
    } catch (caught) {
      error = caught;
    }

    expect(error).toEqual({
      file: "data/irregular-verbs-b1-b2.md",
      line: 1,
      reason: "forma irregular debe tener base, pasado y participio separados por –",
    });
  });

  it("informa archivo y línea cuando falta Context (EN) en irregulares", () => {
    let error: unknown;
    try {
      parseIrregularVerbCards(
        "- **be – was/were – been** --- exist --- ser --- *I was tired.* --- *Estaba cansado.*",
        "data/irregular-verbs-b1-b2.md",
      );
    } catch (caught) {
      error = caught;
    }

    expect(error).toEqual({
      file: "data/irregular-verbs-b1-b2.md",
      line: 1,
      reason: "tarjeta sin Context (EN)",
    });
  });

  it("parsea las 100 tarjetas reales sin exponer el pasado en expression", () => {
    const markdown = readFileSync("data/irregular-verbs-b1-b2.md", "utf8");
    const cards = parseIrregularVerbCards(markdown, "data/irregular-verbs-b1-b2.md");

    expect(cards).toHaveLength(100);
    for (const card of cards) {
      expect(card.expression).not.toContain("–");
      expect(card.pastSimple).toBeDefined();
      expect(card.pastParticiple).toBeDefined();
    }
  });
});

const phrasalVerbsFixture = `### 1. ask around
- **Meaning (EN):** to ask several people
- **Significado:** preguntar a varias personas
- **Ejemplo:** I asked around, but nobody knew the answer.
- **Traducción (ES):** Pregunté a varias personas, pero nadie sabía la respuesta.
- **Context (EN):** "We asked around the village, but nobody knew the answer," she said. We waited in silence.
- **Context source:** Pride and Prejudice · J. Austen (adapted)

### 2. ask out
- **Meaning (EN):** to invite someone on a date
- **Significado:** invitar a salir
- **Ejemplo:** He asked her out for dinner.
- **Traducción (ES):** La invitó a cenar.
- **Context (EN):** "Are you free tomorrow?" he asked. "I would like to ask you out for dinner."

### 3. back up
- **Meaning (EN):** to make a copy of data
- **Significado:** hacer una copia de seguridad
- **Ejemplo:** Back up your files before updating the system.
- **Traducción (ES):** Hacé una copia de tus archivos antes de actualizar el sistema.
- **Context (EN):** "Back up your files now," the teacher said. The whole class opened their laptops together.`;

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
      contextEn:
        '"We asked around the village, but nobody knew the answer," she said. We waited in silence.',
      contextSource: "Pride and Prejudice · J. Austen (adapted)",
    });
    expect(cards[1]).toMatchObject({
      expression: "ask out",
      contextSource: "Everyday conversation",
    });
  });

  it("informa archivo y línea cuando falta Meaning (EN)", () => {
    let error: unknown;
    try {
      parsePhrasalVerbCards(
        "### 1. ask around\n- **Significado:** preguntar a varias personas\n- **Ejemplo:** I asked around.\n- **Traducción (ES):** Pregunté a varias personas.\n- **Context (EN):** \"We asked around.\"",
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

  it("informa archivo y línea cuando falta Context (EN)", () => {
    let error: unknown;
    try {
      parsePhrasalVerbCards(
        "### 1. ask around\n- **Meaning (EN):** to ask several people\n- **Significado:** preguntar a varias personas\n- **Ejemplo:** I asked around.\n- **Traducción (ES):** Pregunté a varias personas.",
        "data/phrasal-verbs-b1-b2-200.md",
      );
    } catch (caught) {
      error = caught;
    }

    expect(error).toEqual({
      file: "data/phrasal-verbs-b1-b2-200.md",
      line: 1,
      reason: "tarjeta sin Context (EN)",
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
