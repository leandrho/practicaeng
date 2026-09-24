import { describe, expect, it } from "vitest";
import { parseVerbTenseSection } from "./verb-tenses-parser";

const FILE = "data/verb-tenses-present.md";
const EXPECTED = { slug: "present" as const, title: "Present" };

function bullet(overrides: Partial<Record<string, string>> = {}): string {
  const fields: Record<string, string> = {
    "Form": "Present Simple",
    "Prompt (EN)": "Complete the routine: she / walk to school every day.",
    "Sentence (EN)": "She ____ to school every day.",
    "Answers": "walks",
    "Model (EN)": "She walks to school every day.",
    "Explanation (ES)": "El *present simple* expresa hábitos y la tercera persona lleva -s.",
    "Translation (ES)": "Ella camina a la escuela todos los días.",
    "Context (EN)": '"Do you walk to school?" "Yes, I walk there every day with my brother."',
    "Context source": "Everyday conversation",
    ...overrides,
  };
  return `- **Form:** ${fields["Form"]} --- **Prompt (EN):** ${fields["Prompt (EN)"]} --- **Sentence (EN):** ${fields["Sentence (EN)"]} --- **Answers:** ${fields["Answers"]} --- **Model (EN):** ${fields["Model (EN)"]} --- **Explanation (ES):** ${fields["Explanation (ES)"]} --- **Translation (ES):** ${fields["Translation (ES)"]} --- **Context (EN):** ${fields["Context (EN)"]} --- **Context source:** ${fields["Context source"]}`;
}

function expectParseError(markdown: string, match: RegExp | string) {
  let error: unknown;
  try {
    parseVerbTenseSection(markdown, FILE, EXPECTED);
  } catch (caught) {
    error = caught;
  }
  expect(error).toMatchObject({ file: FILE, line: expect.any(Number), reason: expect.any(String) });
  expect((error as { reason: string }).reason).toMatch(match);
}

describe("parseVerbTenseSection", () => {
  it("un fixture válido pasa y aplica la fuente por defecto", () => {
    const withSource = ["## Present", bullet()].join("\n");
    const parsed = parseVerbTenseSection(withSource, FILE, EXPECTED);
    expect(parsed.slug).toBe("present");
    expect(parsed.title).toBe("Present");
    expect(parsed.exercises).toHaveLength(1);
    expect(parsed.exercises[0]).toMatchObject({
      form: "Present Simple",
      acceptedAnswers: ["walks"],
      contextSource: "Everyday conversation",
    });

    const withoutSource = [
      "## Present",
      bullet()
        .replace(" --- **Context source:** Everyday conversation", "")
        .replace("Second model.", "Second model."),
    ].join("\n");
    const parsedDefault = parseVerbTenseSection(withoutSource, FILE, EXPECTED);
    expect(parsedDefault.exercises[0]?.contextSource).toBe("Everyday conversation");
  });

  it("acepta varias respuestas separadas por /", () => {
    const markdown = [
      "## Present",
      bullet({
        "Form": "Present Progressive",
        "Prompt (EN)": "Describe what is happening now: she / work in the garden.",
        "Sentence (EN)": "She ____ in the garden now.",
        "Answers": "is working / 's working",
        "Model (EN)": "She is working in the garden now.",
        "Explanation (ES)": "El *present progressive* describe acciones en curso.",
        "Translation (ES)": "Ella está trabajando en el jardín ahora.",
        "Context (EN)": '"Where is she?" "She is outside. She stays there every afternoon."',
      }),
    ].join("\n");
    const parsed = parseVerbTenseSection(markdown, FILE, EXPECTED);
    expect(parsed.exercises[0]?.acceptedAnswers).toEqual(["is working", "'s working"]);
  });

  it("falla sin hueco único", () => {
    expectParseError(
      ["## Present", bullet({ "Sentence (EN)": "She walks to school." })].join("\n"),
      /hueco/,
    );
    expectParseError(
      ["## Present", bullet({ "Sentence (EN)": "She ____ and ____ today." })].join("\n"),
      /hueco/,
    );
  });

  it("falla sin respuestas o con duplicados", () => {
    expectParseError(
      ["## Present", bullet({ "Answers": "walks / WALKS" })].join("\n"),
      /duplicadas/,
    );
    const missing = ["## Present", bullet()].join("\n").replace(" --- **Answers:** walks", "");
    expectParseError(missing, /cantidad de campos|campo Answers/);
  });

  it("falla con forma inválida", () => {
    expectParseError(
      ["## Present", bullet({ "Form": "Future Simple" })].join("\n"),
      /forma inválida/,
    );
  });

  it("rechaza formas del pasado en la sección presente", () => {
    expectParseError(
      ["## Present", bullet({ "Form": "Past Simple" })].join("\n"),
      /forma inválida/,
    );
  });

  it("un fixture del pasado carga y una forma ajena falla", () => {
    const pastExpected = { slug: "past" as const, title: "Past" };
    const pastBullet = bullet({
      "Form": "Past Simple",
      "Prompt (EN)": "Complete the finished action: I / visit my grandmother yesterday.",
      "Sentence (EN)": "I ____ my grandmother yesterday.",
      "Answers": "visited",
      "Model (EN)": "I visited my grandmother yesterday.",
      "Explanation (ES)": "El *past simple* expresa acciones terminadas con referencia pasada.",
      "Translation (ES)": "Ayer visité a mi abuela.",
      "Context (EN)": '"Did you see your grandmother?" "Yes, I visited her yesterday afternoon."',
    });
    const parsed = parseVerbTenseSection(
      ["## Past", pastBullet].join("\n"),
      "data/verb-tenses-past.md",
      pastExpected,
    );
    expect(parsed.slug).toBe("past");
    expect(parsed.exercises[0]).toMatchObject({ form: "Past Simple" });

    let error: unknown;
    try {
      parseVerbTenseSection(
        ["## Past", bullet({ "Form": "Present Simple" })].join("\n"),
        "data/verb-tenses-past.md",
        pastExpected,
      );
    } catch (caught) {
      error = caught;
    }
    expect(error).toMatchObject({
      file: "data/verb-tenses-past.md",
      line: expect.any(Number),
      reason: expect.any(String),
    });
    expect((error as { reason: string }).reason).toMatch(/forma inválida/);
  });

  it("un fixture del futuro carga y una forma ajena falla", () => {
    const futureExpected = { slug: "future" as const, title: "Future" };
    const futureBullet = bullet({
      "Form": "Be going to",
      "Prompt (EN)": "State your prior plan: I / make soup tonight.",
      "Sentence (EN)": "I ____ make soup tonight.",
      "Answers": "am going to",
      "Model (EN)": "I am going to make soup tonight.",
      "Explanation (ES)": "El *be going to* expresa una intención formada antes de hablar.",
      "Translation (ES)": "Voy a preparar sopa esta noche.",
      "Context (EN)": '"What is for dinner?" "I bought vegetables, so the kitchen smells fresh already."',
    });
    const parsed = parseVerbTenseSection(
      ["## Future", futureBullet].join("\n"),
      "data/verb-tenses-future.md",
      futureExpected,
    );
    expect(parsed.slug).toBe("future");
    expect(parsed.exercises[0]).toMatchObject({ form: "Be going to" });

    let error: unknown;
    try {
      parseVerbTenseSection(
        ["## Future", bullet({ "Form": "Present Simple" })].join("\n"),
        "data/verb-tenses-future.md",
        futureExpected,
      );
    } catch (caught) {
      error = caught;
    }
    expect(error).toMatchObject({
      file: "data/verb-tenses-future.md",
      line: expect.any(Number),
      reason: expect.any(String),
    });
    expect((error as { reason: string }).reason).toMatch(/forma inválida/);
  });

  it("un fixture de condicionales carga y una forma ajena falla", () => {
    const conditionalsExpected = { slug: "conditionals" as const, title: "Conditionals" };
    const conditionalsBullet = bullet({
      "Form": "Conditional Type 2",
      "Prompt (EN)": "Imagine the opposite of now: If I / be you, I would accept.",
      "Sentence (EN)": "If I ____ you, I would accept.",
      "Answers": "were",
      "Model (EN)": "If I were you, I would accept.",
      "Explanation (ES)": "El *second conditional* usa pasado simple en la condición para un presente hipotético.",
      "Translation (ES)": "Si yo fuera vos, aceptaría.",
      "Context (EN)": '"Should I accept the offer?" "If I were you, I would accept it today."',
    });
    const parsed = parseVerbTenseSection(
      ["## Conditionals", conditionalsBullet].join("\n"),
      "data/verb-tenses-conditionals.md",
      conditionalsExpected,
    );
    expect(parsed.slug).toBe("conditionals");
    expect(parsed.exercises[0]).toMatchObject({ form: "Conditional Type 2" });

    let error: unknown;
    try {
      parseVerbTenseSection(
        ["## Conditionals", bullet({ "Form": "Present Simple" })].join("\n"),
        "data/verb-tenses-conditionals.md",
        conditionalsExpected,
      );
    } catch (caught) {
      error = caught;
    }
    expect(error).toMatchObject({
      file: "data/verb-tenses-conditionals.md",
      line: expect.any(Number),
      reason: expect.any(String),
    });
    expect((error as { reason: string }).reason).toMatch(/forma inválida/);
  });

  it("falla sin contexto", () => {
    const missing = ["## Present", bullet()]
      .join("\n")
      .replace(/ --- \*\*Context \(EN\):\*\*.*$/, "");
    expectParseError(missing, /cantidad de campos|campo Context/);
  });

  it("falla si el prompt adelanta el modelo", () => {
    expectParseError(
      [
        "## Present",
        bullet({
          "Prompt (EN)": "Repeat: She walks to school every day.",
          "Model (EN)": "She walks to school every day.",
        }),
      ].join("\n"),
      /adelanta el modelo/,
    );
  });

  it("falla con modelos duplicados", () => {
    expectParseError(["## Present", bullet(), bullet()].join("\n"), /duplicado/);
  });

  it("falla con título distinto del catálogo o sin encabezado", () => {
    expectParseError(["## Past", bullet()].join("\n"), /catálogo/);
    expectParseError([bullet()].join("\n"), /encabezado/);
  });

  it("falla con formato de campos incorrecto identificando campo", () => {
    const broken = ["## Present", bullet().replace("**Answers:**", "**Respuesta:**")].join("\n");
    expectParseError(broken, /campo Answers/);
  });
});
