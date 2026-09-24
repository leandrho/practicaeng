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

  it("parsea Tags de registro y uso para conectores", () => {
    const [card] = parseBulletCards(
      "- **however** --- used to introduce an opposite idea --- sin embargo --- *The food was good; however, the service was slow.* --- *La comida estaba bien; sin embargo, el servicio fue lento.* --- *The room was small. However, the view was lovely.* --- *Tags: Neutral, Spoken & written*",
      { file: "data/connectors-b1-b2.md", type: "connector" },
    );

    expect(card).toMatchObject({
      expression: "however",
      tags: ["Neutral", "Spoken & written"],
    });
  });

  it("permite omitir la fuente del contexto manteniendo las etiquetas", () => {
    const [card] = parseBulletCards(
      "- **moreover** --- in addition --- además --- *The room is small; moreover, it is bright.* --- *La habitación es pequeña; además, es luminosa.* --- *The room is small. Moreover, it is bright.* --- *Tags: Formal, Written*",
      { file: "data/connectors-b1-b2.md", type: "connector" },
    );

    expect(card).toMatchObject({
      contextSource: "Everyday conversation",
      tags: ["Formal", "Written"],
    });
  });

  it("asigna tags vacíos por defecto a bullets sin Tags", () => {
    const [card] = parseBulletCards(collocationsFixture, {
      file: "data/collocations-b1-b2.md",
      type: "collocation",
    });

    expect(card?.tags).toEqual([]);
  });

  it("rechaza tags desconocidos o no permitidos con archivo y línea", () => {
    const invalidTags = [
      { type: "preposition" as const, tag: "Academic", reason: "tag desconocido: Academic" },
      {
        type: "preposition" as const,
        tag: "Transitive",
        reason: expect.stringContaining("tag Transitive no permitido para preposition"),
      },
    ];

    for (const { type, tag, reason } of invalidTags) {
      let error: unknown;
      try {
        parseBulletCards(
          `- **interested in** --- wanting to know more about --- interesado en --- *I'm interested in technology.* --- *Me interesa la tecnología.* --- *I'm interested in it.* --- *Tags: ${tag}*`,
          { file: "data/fixed-prepositions-b1-b2.md", type },
        );
      } catch (caught) {
        error = caught;
      }

      expect(error).toMatchObject({
        file: "data/fixed-prepositions-b1-b2.md",
        line: 1,
        reason,
      });
    }
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
- **Tags:** Intransitive
- **Meaning (EN):** to ask several people
- **Significado:** preguntar a varias personas
- **Ejemplo:** I asked around, but nobody knew the answer.
- **Traducción (ES):** Pregunté a varias personas, pero nadie sabía la respuesta.
- **Context (EN):** "We asked around the village, but nobody knew the answer," she said. We waited in silence.
- **Context source:** Pride and Prejudice · J. Austen (adapted)

### 2. ask out
- **Tags:** Transitive, Separable
- **Meaning (EN):** to invite someone on a date
- **Significado:** invitar a salir
- **Ejemplo:** He asked her out for dinner.
- **Traducción (ES):** La invitó a cenar.
- **Context (EN):** "Are you free tomorrow?" he asked. "I would like to ask you out for dinner."

### 3. back up
- **Tags:** Transitive, Separable
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
      tags: ["Transitive", "Separable"],
    });
    expect(cards[0]?.tags).toEqual(["Intransitive"]);
  });

  it("rechaza combinaciones incompatibles de Tags con archivo y línea", () => {
    let error: unknown;
    try {
      parsePhrasalVerbCards(
        "### 1. ask around\n- **Meaning (EN):** to ask several people\n- **Significado:** preguntar a varias personas\n- **Ejemplo:** I asked around.\n- **Traducción (ES):** Pregunté a varias personas.\n- **Context (EN):** I asked around the village.\n- **Tags:** Intransitive, Separable",
        "data/phrasal-verbs-b1-b2-200.md",
      );
    } catch (caught) {
      error = caught;
    }

    expect(error).toMatchObject({
      file: "data/phrasal-verbs-b1-b2-200.md",
      line: 1,
      reason: expect.stringContaining("la separabilidad solo se etiqueta para sentidos Transitive"),
    });
  });

  it("usa tags vacíos por defecto cuando una tarjeta phrasal omite Tags", () => {
    const [card] = parsePhrasalVerbCards(
      "### 1. ask around\n- **Meaning (EN):** to ask several people\n- **Significado:** preguntar a varias personas\n- **Ejemplo:** I asked around.\n- **Traducción (ES):** Pregunté a varias personas.\n- **Context (EN):** I asked around the village.",
      "data/phrasal-verbs-b1-b2-200.md",
    );

    expect(card?.tags).toEqual([]);
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
