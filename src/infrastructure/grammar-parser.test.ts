import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseGrammarPart } from "./grammar-parser";

const file = "data/grammar-part-6.md";
const titles = ["Passive Voice", "Clauses of concession"];

function topic(title: string) {
  return `## ${title}
### Regla y forma
- **EN:** Rule in English.
- **ES:** Regla en español.
### Formación
- **Name (EN):** Present Simple --- **Pattern:** subject + base verb
### Usos
- **EN:** Use in English.
- **ES:** Uso en español.
### Contrastes y errores
- **EN:** Common error in English.
- **ES:** Error habitual en español.
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
    expect(topics.every(({ formations }) => formations.length > 0)).toBe(true);
    expect(topics.every(({ examples, exercises }) => examples.length >= 2 && exercises.length >= 5)).toBe(true);
    expect(topics.flatMap(({ exercises }) => exercises)).toHaveLength(titles.length * 5);
  });

  it("parsea los temas de una parte en orden y valida el esquema", () => {
    const topics = parseGrammarPart(valid, 6, file);
    expect(topics.map((entry) => entry.slug)).toEqual(["passive-voice", "clauses-of-concession"]);
    expect(topics[0]?.exercises).toHaveLength(5);
    expect(topics[0]?.examples).toHaveLength(2);
    expect(topics[0]?.formations).toEqual([{ name: "Present Simple", patterns: [{ pattern: "subject + base verb" }] }]);
    expect(topics[0]?.ruleEn).toBe("Rule in English.");
    expect(topics[0]?.ruleEs).toBe("Regla en español.");
  });

  it("parsea formaciones verbales con etiquetas y fórmulas separadas", () => {
    const grouped = valid.replace(
      "- **Name (EN):** Present Simple --- **Pattern:** subject + base verb",
      "- **Name (EN):** Present Simple\n  - **Affirmative:** subject + base verb\n  - **Negative:** subject + don't + base verb\n  - **Question:** Do + subject + base verb?",
    );
    const parsed = parseGrammarPart(grouped, 6, file);
    expect(parsed[0]?.formations[0]).toEqual({
      name: "Present Simple",
      patterns: [
        { label: "Affirmative", pattern: "subject + base verb" },
        { label: "Negative", pattern: "subject + don't + base verb" },
        { label: "Question", pattern: "Do + subject + base verb?" },
      ],
    });
  });

  it("señala el campo ausente en un ejercicio con archivo, tema y línea", () => {
    const broken = valid.replace(" --- **Model (EN):** A letter was sent to Jane 0.", "");
    expect(() => parseGrammarPart(broken, 6, file)).toThrow(/data\/grammar-part-6\.md:17 \(Passive Voice\): campo Model \(EN\) faltante/);
  });

  it("rechaza secciones obligatorias y mínimos incompletos", () => {
    expect(() => parseGrammarPart(valid.replace("### Usos", "### Otra cosa"), 6, file)).toThrow(/:7 \(Passive Voice\): sección desconocida/);
    expect(() => parseGrammarPart(valid.replace("### Usos\n- **EN:** Use in English.\n- **ES:** Uso en español.\n", ""), 6, file)).toThrow(/Passive Voice\): sección usesEs faltante/);
    expect(() => parseGrammarPart(valid.replace(/### Formación\n- \*\*Name \(EN\):\*\* Present Simple --- \*\*Pattern:\*\* subject \+ base verb\n/, ""), 6, file)).toThrow(/Passive Voice\): sección formations faltante/);
    expect(() => parseGrammarPart(valid.replace(/- \*\*EN:\*\* The door was opened[^\n]*\n/, ""), 6, file)).toThrow(/Passive Voice\): examples: Too small/);
    expect(() => parseGrammarPart(valid.replace(/- \*\*Prompt \(EN\):\*\* Say who received the letter 4[^\n]*\n/, ""), 6, file)).toThrow(/Passive Voice\): exercises: Too small/);
  });

  it("rechaza temas duplicados, ausentes y fuera de orden", () => {
    expect(() => parseGrammarPart(`${valid}\n${topic("Passive Voice")}`, 6, file)).toThrow(/duplicado o fuera de orden/);
    expect(() => parseGrammarPart(topic("Passive Voice"), 6, file)).toThrow(/tema faltante: Clauses of concession/);
    expect(() => parseGrammarPart(titles.map(topic).reverse().join("\n"), 6, file)).toThrow(/se esperaba Passive Voice/);
  });

  it("parsea las tres secciones de prosa como bullets EN/ES bilingües", () => {
    const topics = parseGrammarPart(valid, 6, file);
    expect(topics[0]?.ruleEn).toBe("Rule in English.");
    expect(topics[0]?.ruleEs).toBe("Regla en español.");
    expect(topics[0]?.usesEn).toBe("Use in English.");
    expect(topics[0]?.usesEs).toBe("Uso en español.");
    expect(topics[0]?.contrastsEn).toBe("Common error in English.");
    expect(topics[0]?.contrastsEs).toBe("Error habitual en español.");
    expect(topics[1]?.usesEn).toBe("Use in English.");
  });

  it("rechaza la prosa legacy sin bullets con archivo, línea, tema y sección", () => {
    const legacy = valid.replace("- **EN:** Rule in English.\n- **ES:** Regla en español.", "Regla en español suelta.");
    expect(() => parseGrammarPart(legacy, 6, file))
      .toThrow(/data\/grammar-part-6\.md:3 \(Passive Voice\): sección ruleEs: prosa legacy sin bullets/);
    const partialLegacy = valid.replace("- **EN:** Use in English.", "Use in English sin bullet.");
    expect(() => parseGrammarPart(partialLegacy, 6, file))
      .toThrow(/data\/grammar-part-6\.md:8 \(Passive Voice\): sección usesEs:/);
  });

  it("rechaza una etiqueta desconocida en la prosa bilingüe con archivo, línea, tema y sección", () => {
    const broken = valid.replace("- **ES:** Regla en español.", "- **FR:** Regla en español.");
    expect(() => parseGrammarPart(broken, 6, file))
      .toThrow(/data\/grammar-part-6\.md:4 \(Passive Voice\): sección ruleEs: etiqueta desconocida \*\*FR:\*\*/);
  });

  it("rechaza un bullet de más o faltante en la prosa bilingüe", () => {
    const extra = valid.replace(
      "- **ES:** Regla en español.",
      "- **ES:** Regla en español.\n- **EN:** Oración de más.",
    );
    expect(() => parseGrammarPart(extra, 6, file))
      .toThrow(/data\/grammar-part-6\.md:4 \(Passive Voice\): sección ruleEs: se esperan exactamente dos bullets/);
    const missing = valid.replace("- **ES:** Uso en español.\n", "");
    expect(() => parseGrammarPart(missing, 6, file))
      .toThrow(/data\/grammar-part-6\.md:\d+ \(Passive Voice\): sección usesEs: se esperan exactamente dos bullets/);
  });

  it("rechaza bullets EN o ES vacíos y fuera de orden", () => {
    const empty = valid.replace("- **EN:** Common error in English.", "- **EN:**");
    expect(() => parseGrammarPart(empty, 6, file))
      .toThrow(/data\/grammar-part-6\.md:\d+ \(Passive Voice\): sección contrastsEs: bullet \*\*EN:\*\* vacío/);
    const swapped = valid.replace(
      "- **EN:** Use in English.\n- **ES:** Uso en español.",
      "- **ES:** Uso en español.\n- **EN:** Use in English.",
    );
    expect(() => parseGrammarPart(swapped, 6, file))
      .toThrow(/data\/grammar-part-6\.md:\d+ \(Passive Voice\): sección usesEs: bullet \*\*ES:\*\* fuera de orden/);
  });

  it("rechaza etiquetas de formación fuera de la lista cerrada en inglés", () => {
    const spanishLabel = valid.replace("- **Name (EN):** Present Simple --- **Pattern:** subject + base verb", "- **Name (EN):** Present Simple\n  - **Afirmativa:** subject + base verb");
    expect(() => parseGrammarPart(spanishLabel, 6, file))
      .toThrow(/data\/grammar-part-6\.md:6 \(Passive Voice\): formations\.0\.patterns\.0\.label/);
    const unknownLabel = valid.replace("- **Name (EN):** Present Simple --- **Pattern:** subject + base verb", "- **Name (EN):** Present Simple\n  - **Result:** subject + base verb");
    // "Result" sí está en la lista, pero solo como etiqueta válida: acá se verifica que pase.
    expect(parseGrammarPart(unknownLabel, 6, file)[0]?.formations[0]?.patterns[0]?.label).toBe("Result");
  });
});
