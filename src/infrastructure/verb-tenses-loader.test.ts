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

const FORMS = [
  "Present Simple",
  "Present Progressive",
  "Present Perfect Simple",
  "Present Perfect Progressive",
  "Mixed",
] as const;

function fixtureBullet(form: (typeof FORMS)[number], index: number): string {
  return `- **Form:** ${form} --- **Prompt (EN):** Complete case ${form} number ${index}. --- **Sentence (EN):** They ____ together every day (case ${form} ${index}). --- **Answers:** gather --- **Model (EN):** They gather together every day (case ${form} ${index}). --- **Explanation (ES):** El *present simple* explica el caso ${index}. --- **Translation (ES):** Ellos se reúnen todos los días (caso ${index}). --- **Context (EN):** "Do they meet often?" "Yes, they meet here every day after work." --- **Context source:** Everyday conversation`;
}

function fixtureMarkdown(): string {
  const bullets = FORMS.flatMap((form) =>
    Array.from({ length: 10 }, (_, index) => fixtureBullet(form, index)),
  );
  return ["## Presente", ...bullets].join("\n");
}

beforeAll(() => {
  fixtureDirectory = mkdtempSync("/tmp/opencode/verb-tenses-fixture-");
  mkdirSync(join(fixtureDirectory, "data"), { recursive: true });
  writeFileSync(join(fixtureDirectory, "data/verb-tenses-present.md"), fixtureMarkdown());
});

afterAll(() => {
  if (fixtureDirectory) rmSync(fixtureDirectory, { recursive: true, force: true });
});

describe("getVerbTenseSection", () => {
  it("carga la sección real con 50 o más ejercicios y los mínimos por forma", () => {
    const section = getVerbTenseSection("present");
    expect(section.slug).toBe("present");
    expect(section.title).toBe("Presente");
    expect(section.exercises.length).toBeGreaterThanOrEqual(VERB_TENSE_MIN_TOTAL);
    const counts = getVerbTenseFormCounts(section.exercises);
    for (const form of FORMS) {
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
    expect(sections).toHaveLength(1);
    expect(sections[0]?.exercises).toHaveLength(50);
    expect(getVerbTenseSection("present", fixtureDirectory).title).toBe("Presente");
  });

  it("rechaza slugs ajenos al catálogo", () => {
    expect(() =>
      getVerbTenseSection("past" as "present", fixtureDirectory),
    ).toThrow(/desconocida/);
  });

  it("propaga errores del archivo con ubicación", () => {
    const file = join(fixtureDirectory, "data/verb-tenses-present.md");
    writeFileSync(file, "## Presente\n- **Form:** Present Simple\n");
    try {
      expect(() => getVerbTenseSection("present", fixtureDirectory)).toThrow();
    } finally {
      writeFileSync(file, fixtureMarkdown());
    }
  });
});
