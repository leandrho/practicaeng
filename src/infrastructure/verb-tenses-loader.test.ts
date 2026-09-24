import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
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

function presentBullet(form: (typeof PRESENT_FORMS)[number], index: number): string {
  return `- **Form:** ${form} --- **Prompt (EN):** Complete case ${form} number ${index}. --- **Sentence (EN):** They ____ together every day (case ${form} ${index}). --- **Answers:** gather --- **Model (EN):** They gather together every day (case ${form} ${index}). --- **Explanation (ES):** El *present simple* explica el caso ${index}. --- **Translation (ES):** Ellos se reúnen todos los días (caso ${index}). --- **Context (EN):** "Do they meet often?" "Yes, they meet here every day after work." --- **Context source:** Everyday conversation`;
}

function pastBullet(form: (typeof PAST_FORMS)[number], index: number): string {
  return `- **Form:** ${form} --- **Prompt (EN):** Complete past case ${form} number ${index}. --- **Sentence (EN):** They ____ together yesterday (past case ${form} ${index}). --- **Answers:** gathered --- **Model (EN):** They gathered together yesterday (past case ${form} ${index}). --- **Explanation (ES):** El *past simple* explica el caso ${index}. --- **Translation (ES):** Ellos se reunieron ayer (caso ${index}). --- **Context (EN):** "Did they meet yesterday?" "Yes, they met here after work." --- **Context source:** Everyday conversation`;
}

function presentMarkdown(): string {
  const bullets = PRESENT_FORMS.flatMap((form) =>
    Array.from({ length: 10 }, (_, index) => presentBullet(form, index)),
  );
  return ["## Presente", ...bullets].join("\n");
}

function pastMarkdown(): string {
  const bullets = PAST_FORMS.flatMap((form) =>
    Array.from({ length: 10 }, (_, index) => pastBullet(form, index)),
  );
  return ["## Pasado", ...bullets].join("\n");
}

beforeAll(() => {
  fixtureDirectory = mkdtempSync("/tmp/opencode/verb-tenses-fixture-");
  mkdirSync(join(fixtureDirectory, "data"), { recursive: true });
  writeFileSync(join(fixtureDirectory, "data/verb-tenses-present.md"), presentMarkdown());
  writeFileSync(join(fixtureDirectory, "data/verb-tenses-past.md"), pastMarkdown());
});

afterAll(() => {
  if (fixtureDirectory) rmSync(fixtureDirectory, { recursive: true, force: true });
});

describe("getVerbTenseSection", () => {
  it("carga la sección real presente con 50 o más ejercicios y los mínimos por forma", () => {
    const section = getVerbTenseSection("present");
    expect(section.slug).toBe("present");
    expect(section.title).toBe("Presente");
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
    expect(section.title).toBe("Pasado");
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

  it("lee desde fixtures sin exponer filesystem al cliente", () => {
    const sections = getVerbTenseSections(fixtureDirectory);
    expect(sections).toHaveLength(2);
    expect(sections[0]?.exercises).toHaveLength(50);
    expect(sections[1]?.exercises).toHaveLength(50);
    expect(getVerbTenseSection("present", fixtureDirectory).title).toBe("Presente");
    expect(getVerbTenseSection("past", fixtureDirectory).title).toBe("Pasado");
  });

  it("rechaza slugs ajenos al catálogo", () => {
    expect(() =>
      getVerbTenseSection("future" as "present", fixtureDirectory),
    ).toThrow(/desconocida/);
  });

  it("propaga errores del archivo con ubicación", () => {
    const file = join(fixtureDirectory, "data/verb-tenses-present.md");
    writeFileSync(file, "## Presente\n- **Form:** Present Simple\n");
    try {
      expect(() => getVerbTenseSection("present", fixtureDirectory)).toThrow();
    } finally {
      writeFileSync(file, presentMarkdown());
    }
  });

  it("un ejercicio del pasado con forma ajena falla con archivo, línea y campo", () => {
    const file = join(fixtureDirectory, "data/verb-tenses-past.md");
    writeFileSync(file, `## Pasado\n${pastBullet("Past Simple", 0).replace("Past Simple", "Present Simple")}`);
    try {
      expect(() => getVerbTenseSection("past", fixtureDirectory)).toThrow();
    } finally {
      writeFileSync(file, pastMarkdown());
    }
  });
});
