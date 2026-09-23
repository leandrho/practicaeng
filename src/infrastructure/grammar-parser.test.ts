import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseGrammarPart } from "./grammar-parser";

const file = "data/grammar-part-6.md";
const titles = ["Passive Voice", "Clauses of concession"];

function topic(title: string) {
  return `## ${title}
### Regla y forma
Regla en español.
### Usos
Uso en español.
### Contrastes y errores
Error habitual en español.
### Ejemplos
- **EN:** A letter was sent. --- **ES:** Se envió una carta.
- **EN:** The door was opened. --- **ES:** Se abrió la puerta.
### Ejercicios
${Array.from({ length: 5 }, (_, index) => `- **Prompt (EN):** Say who received the letter ${index}. --- **Model (EN):** A letter was sent to Jane ${index}. --- **Explanation (ES):** Se usa la voz pasiva. --- **Translation (ES):** Se envió una carta a Jane.`).join("\n")}`;
}

const valid = titles.map(topic).join("\n");

describe("parseGrammarPart", () => {
  it.each([
    [1, ["Present Simple / Present Progressive", "Stative verbs", "Comparisons", "Countable and uncountable nouns"]],
    [2, ["Past Simple / Past Progressive", "Past Perfect Simple / Past Perfect Progressive", "Used to / would / was-were going to"]],
    [3, ["Present Perfect Simple / Present Perfect Progressive", "Defining and Non-Defining Relative Clauses", "Should / ought to / had better"]],
    [4, ["Future tenses", "Other future forms", "Time clauses", "Conditional Sentences: Types Zero, 1 and 2", "Must / have to / need"]],
    [5, ["Infinitives and the -ing form", "Expressing possibility: may / might / would", "Making deductions: must / can’t", "Question tags"]],
    [6, ["Passive Voice", "Clauses of concession"]],
    [7, ["Reported Speech: statements, special introductory verbs, questions, commands and requests", "Clauses of result"]],
    [8, ["Unreal past", "Conditional Sentences: Type 3", "Causative Form"]],
  ] as const)("valida el contenido editorial completo de la Parte %i", (number, titles) => {
    const source = `data/grammar-part-${number}.md`;
    const topics = parseGrammarPart(readFileSync(source, "utf8"), number, source);
    expect(topics.map(({ title }) => title)).toEqual(titles);
    expect(topics.every(({ examples, exercises }) => examples.length >= 2 && exercises.length >= 5)).toBe(true);
    expect(topics.flatMap(({ exercises }) => exercises)).toHaveLength(titles.length * 5);
  });

  it("parsea los temas de una parte en orden y valida el esquema", () => {
    const topics = parseGrammarPart(valid, 6, file);
    expect(topics.map((entry) => entry.slug)).toEqual(["passive-voice", "clauses-of-concession"]);
    expect(topics[0]?.exercises).toHaveLength(5);
    expect(topics[0]?.examples).toHaveLength(2);
  });

  it("señala el campo ausente en un ejercicio con archivo, tema y línea", () => {
    const broken = valid.replace(" --- **Model (EN):** A letter was sent to Jane 0.", "");
    expect(() => parseGrammarPart(broken, 6, file)).toThrow(/data\/grammar-part-6\.md:12 \(Passive Voice\): campo Model \(EN\) faltante/);
  });

  it("rechaza secciones obligatorias y mínimos incompletos", () => {
    expect(() => parseGrammarPart(valid.replace("### Usos", "### Otra cosa"), 6, file)).toThrow(/:4 \(Passive Voice\): sección desconocida/);
    expect(() => parseGrammarPart(valid.replace("### Usos\nUso en español.\n", ""), 6, file)).toThrow(/Passive Voice\): sección usesEs faltante/);
    expect(() => parseGrammarPart(valid.replace(/- \*\*EN:\*\* The door was opened[^\n]*\n/, ""), 6, file)).toThrow(/Passive Voice\): examples: Too small/);
    expect(() => parseGrammarPart(valid.replace(/- \*\*Prompt \(EN\):\*\* Say who received the letter 4[^\n]*\n/, ""), 6, file)).toThrow(/Passive Voice\): exercises: Too small/);
  });

  it("rechaza temas duplicados, ausentes y fuera de orden", () => {
    expect(() => parseGrammarPart(`${valid}\n${topic("Passive Voice")}`, 6, file)).toThrow(/duplicado o fuera de orden/);
    expect(() => parseGrammarPart(topic("Passive Voice"), 6, file)).toThrow(/tema faltante: Clauses of concession/);
    expect(() => parseGrammarPart(titles.map(topic).reverse().join("\n"), 6, file)).toThrow(/se esperaba Passive Voice/);
  });
});
