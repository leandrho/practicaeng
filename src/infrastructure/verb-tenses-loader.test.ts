import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  FUTURE_VERB_TENSE_MIN_MIXED,
  FUTURE_VERB_TENSE_MIN_PER_FORM,
  getVerbTenseFormCounts,
  VERB_TENSE_MIN_PER_FORM,
  VERB_TENSE_MIN_TOTAL,
  VerbTenseSectionSchema,
} from "../domain/verb-tenses";
import { getVerbTenseSection, getVerbTenseSections } from "./verb-tenses-loader";

let fixtureDirectory: string;

const PRESENT_FORMS = [
  "Present Simple",
  "Present Progressive",
  "Present Perfect Simple",
  "Present Perfect Progressive",
  "Mixed",
] as const;

const PAST_FORMS = [
  "Past Simple",
  "Past Progressive",
  "Past Perfect Simple",
  "Past Perfect Progressive",
  "Mixed",
] as const;

const FUTURE_FORMS = [
  "Will",
  "Be going to",
  "Present Progressive (future arrangement)",
  "Present Simple (timetable)",
  "Future Progressive",
  "Future Perfect Simple",
  "Be about to / Be due to",
  "Mixed",
] as const;

const CONDITIONAL_FORMS = [
  "Conditional Zero",
  "Conditional Type 1",
  "Conditional Type 2",
  "Conditional Type 3",
  "Mixed",
] as const;

function presentBullet(form: (typeof PRESENT_FORMS)[number], index: number): string {
  return `- **Form:** ${form} --- **Prompt (EN):** Complete case ${form} number ${index}. --- **Sentence (EN):** They ____ together every day (case ${form} ${index}). --- **Answers:** gather --- **Model (EN):** They gather together every day (case ${form} ${index}). --- **Explanation (ES):** El *present simple* explica el caso ${index}. --- **Translation (ES):** Ellos se reúnen todos los días (caso ${index}). --- **Context (EN):** "Do they meet often?" "Yes, they meet here every day after work." --- **Context source:** Everyday conversation`;
}

function pastBullet(form: (typeof PAST_FORMS)[number], index: number): string {
  return `- **Form:** ${form} --- **Prompt (EN):** Complete past case ${form} number ${index}. --- **Sentence (EN):** They ____ together yesterday (past case ${form} ${index}). --- **Answers:** gathered --- **Model (EN):** They gathered together yesterday (past case ${form} ${index}). --- **Explanation (ES):** El *past simple* explica el caso ${index}. --- **Translation (ES):** Ellos se reunieron ayer (caso ${index}). --- **Context (EN):** "Did they meet yesterday?" "Yes, they met here after work." --- **Context source:** Everyday conversation`;
}

function futureBullet(form: (typeof FUTURE_FORMS)[number], index: number): string {
  return `- **Form:** ${form} --- **Prompt (EN):** Complete future case ${form} number ${index}. --- **Sentence (EN):** They ____ together tomorrow (future case ${form} ${index}). --- **Answers:** will gather --- **Model (EN):** They will gather together tomorrow (future case ${form} ${index}). --- **Explanation (ES):** El *future* explica el caso ${index}. --- **Translation (ES):** Ellos se reunirán mañana (caso ${index}). --- **Context (EN):** "Will they meet tomorrow?" "Yes, they meet here every day after work." --- **Context source:** Everyday conversation`;
}

function presentMarkdown(): string {
  const bullets = PRESENT_FORMS.flatMap((form) =>
    Array.from({ length: 10 }, (_, index) => presentBullet(form, index)),
  );
  return ["## Present", ...bullets].join("\n");
}

function pastMarkdown(): string {
  const bullets = PAST_FORMS.flatMap((form) =>
    Array.from({ length: 10 }, (_, index) => pastBullet(form, index)),
  );
  return ["## Past", ...bullets].join("\n");
}

function futureMarkdown(): string {
  const bullets = [
    ...FUTURE_FORMS.filter((form) => form !== "Mixed").flatMap((form) =>
      Array.from({ length: 6 }, (_, index) => futureBullet(form, index)),
    ),
    ...Array.from({ length: 8 }, (_, index) => futureBullet("Mixed", 100 + index)),
  ];
  return ["## Future", ...bullets].join("\n");
}

function conditionalBullet(form: (typeof CONDITIONAL_FORMS)[number], index: number): string {
  return `- **Form:** ${form} --- **Prompt (EN):** Complete conditional case ${form} number ${index}. --- **Sentence (EN):** If they ____ together every day (conditional case ${form} ${index}), they save money. --- **Answers:** gather --- **Model (EN):** If they gather together every day (conditional case ${form} ${index}), they save money. --- **Explanation (ES):** El *conditional* explica el caso ${index}. --- **Translation (ES):** Ellos se reúnen todos los días (caso ${index}). --- **Context (EN):** "Do they meet often?" "Yes, they meet here every day after work." --- **Context source:** Everyday conversation`;
}

function conditionalMarkdown(): string {
  const bullets = CONDITIONAL_FORMS.flatMap((form) =>
    Array.from({ length: 10 }, (_, index) => conditionalBullet(form, index)),
  );
  return ["## Conditionals", ...bullets].join("\n");
}

beforeAll(() => {
  fixtureDirectory = mkdtempSync("/tmp/opencode/verb-tenses-fixture-");
  mkdirSync(join(fixtureDirectory, "data"), { recursive: true });
  writeFileSync(join(fixtureDirectory, "data/verb-tenses-present.md"), presentMarkdown());
  writeFileSync(join(fixtureDirectory, "data/verb-tenses-past.md"), pastMarkdown());
  writeFileSync(join(fixtureDirectory, "data/verb-tenses-future.md"), futureMarkdown());
  writeFileSync(join(fixtureDirectory, "data/verb-tenses-conditionals.md"), conditionalMarkdown());
});

afterAll(() => {
  if (fixtureDirectory) rmSync(fixtureDirectory, { recursive: true, force: true });
});

describe("getVerbTenseSection", () => {
  it("carga la sección real presente con 50 o más ejercicios y los mínimos por forma", () => {
    const section = getVerbTenseSection("present");
    expect(section.slug).toBe("present");
    expect(section.title).toBe("Present");
    expect(section.exercises.length).toBeGreaterThanOrEqual(VERB_TENSE_MIN_TOTAL);
    const counts = getVerbTenseFormCounts(section.exercises);
    for (const form of PRESENT_FORMS) {
      expect(counts[form]).toBeGreaterThanOrEqual(VERB_TENSE_MIN_PER_FORM);
    }
    for (const exercise of section.exercises) {
      expect(VerbTenseSectionSchema.parse(section)).toEqual(section);
      expect(exercise.sentenceEn).toContain("____");
      expect(exercise.acceptedAnswers.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("carga la sección real pasado con 50 o más ejercicios y los mínimos por forma", () => {
    const section = getVerbTenseSection("past");
    expect(section.slug).toBe("past");
    expect(section.title).toBe("Past");
    expect(section.exercises.length).toBeGreaterThanOrEqual(VERB_TENSE_MIN_TOTAL);
    const counts = getVerbTenseFormCounts(section.exercises);
    for (const form of PAST_FORMS) {
      expect(counts[form]).toBeGreaterThanOrEqual(VERB_TENSE_MIN_PER_FORM);
    }
    for (const exercise of section.exercises) {
      expect(VerbTenseSectionSchema.parse(section)).toEqual(section);
      expect(exercise.sentenceEn).toContain("____");
      expect(exercise.acceptedAnswers.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("carga la sección real futuro con 50 o más ejercicios y los mínimos por forma", () => {
    const section = getVerbTenseSection("future");
    expect(section.slug).toBe("future");
    expect(section.title).toBe("Future");
    expect(section.exercises.length).toBeGreaterThanOrEqual(VERB_TENSE_MIN_TOTAL);
    const counts = getVerbTenseFormCounts(section.exercises);
    for (const form of FUTURE_FORMS) {
      const minimum = form === "Mixed" ? FUTURE_VERB_TENSE_MIN_MIXED : FUTURE_VERB_TENSE_MIN_PER_FORM;
      expect(counts[form]).toBeGreaterThanOrEqual(minimum);
    }
    expect(counts["Will"]).toBeGreaterThanOrEqual(6);
    expect(counts["Be going to"]).toBeGreaterThanOrEqual(6);
    expect(counts["Present Progressive (future arrangement)"]).toBeGreaterThanOrEqual(6);
    expect(counts["Present Simple (timetable)"]).toBeGreaterThanOrEqual(6);
    expect(counts["Future Progressive"]).toBeGreaterThanOrEqual(6);
    expect(counts["Future Perfect Simple"]).toBeGreaterThanOrEqual(6);
    expect(counts["Be about to / Be due to"]).toBeGreaterThanOrEqual(6);
    expect(counts["Mixed"]).toBeGreaterThanOrEqual(8);
    for (const exercise of section.exercises) {
      expect(VerbTenseSectionSchema.parse(section)).toEqual(section);
      expect(exercise.sentenceEn).toContain("____");
      expect(exercise.acceptedAnswers.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("carga la sección real condicionales con 50 o más ejercicios y los mínimos por forma", () => {
    const section = getVerbTenseSection("conditionals");
    expect(section.slug).toBe("conditionals");
    expect(section.title).toBe("Conditionals");
    expect(section.exercises.length).toBeGreaterThanOrEqual(VERB_TENSE_MIN_TOTAL);
    const counts = getVerbTenseFormCounts(section.exercises);
    for (const form of CONDITIONAL_FORMS) {
      expect(counts[form]).toBeGreaterThanOrEqual(VERB_TENSE_MIN_PER_FORM);
    }
    for (const exercise of section.exercises) {
      expect(VerbTenseSectionSchema.parse(section)).toEqual(section);
      expect(exercise.sentenceEn).toContain("____");
      expect(exercise.acceptedAnswers.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("lee desde fixtures sin exponer filesystem al cliente", () => {
    const sections = getVerbTenseSections(fixtureDirectory);
    expect(sections).toHaveLength(4);
    expect(sections[0]?.exercises).toHaveLength(50);
    expect(sections[1]?.exercises).toHaveLength(50);
    expect(sections[2]?.exercises).toHaveLength(50);
    expect(sections[3]?.exercises).toHaveLength(50);
    expect(getVerbTenseSection("present", fixtureDirectory).title).toBe("Present");
    expect(getVerbTenseSection("past", fixtureDirectory).title).toBe("Past");
    expect(getVerbTenseSection("future", fixtureDirectory).title).toBe("Future");
    expect(getVerbTenseSection("conditionals", fixtureDirectory).title).toBe("Conditionals");
  });

  it("rechaza slugs ajenos al catálogo", () => {
    expect(() =>
      getVerbTenseSection("subjunctive" as "present", fixtureDirectory),
    ).toThrow(/desconocida/);
  });

  it("propaga errores del archivo con ubicación", () => {
    const file = join(fixtureDirectory, "data/verb-tenses-present.md");
    writeFileSync(file, "## Present\n- **Form:** Present Simple\n");
    try {
      expect(() => getVerbTenseSection("present", fixtureDirectory)).toThrow();
    } finally {
      writeFileSync(file, presentMarkdown());
    }
  });

  it("un ejercicio del pasado con forma ajena falla con archivo, línea y campo", () => {
    const file = join(fixtureDirectory, "data/verb-tenses-past.md");
    writeFileSync(file, `## Past\n${pastBullet("Past Simple", 0).replace("Past Simple", "Present Simple")}`);
    try {
      expect(() => getVerbTenseSection("past", fixtureDirectory)).toThrow();
    } finally {
      writeFileSync(file, pastMarkdown());
    }
  });

  it("un ejercicio del futuro con forma ajena falla con archivo, línea y campo", () => {
    const file = join(fixtureDirectory, "data/verb-tenses-future.md");
    writeFileSync(file, `## Future\n${futureBullet("Will", 0).replace("Will", "Past Simple")}`);
    try {
      expect(() => getVerbTenseSection("future", fixtureDirectory)).toThrow();
    } finally {
      writeFileSync(file, futureMarkdown());
    }
  });

  it("un ejercicio de condicionales con forma ajena falla con archivo, línea y campo", () => {
    const file = join(fixtureDirectory, "data/verb-tenses-conditionals.md");
    writeFileSync(file, `## Conditionals\n${conditionalBullet("Conditional Type 1", 0).replace("Conditional Type 1", "Present Simple")}`);
    try {
      expect(() => getVerbTenseSection("conditionals", fixtureDirectory)).toThrow();
    } finally {
      writeFileSync(file, conditionalMarkdown());
    }
  });
});
