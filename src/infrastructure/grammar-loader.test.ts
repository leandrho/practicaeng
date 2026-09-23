import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { GrammarTopicSchema } from "../domain/grammar";
import { GRAMMAR_PARTS } from "../domain/grammar-catalog";
import { getGrammarTopics } from "./grammar-loader";

let fixtureDirectory: string;

function fixtureMarkdown(part: (typeof GRAMMAR_PARTS)[number]): string {
  return part.topics.map(({ title }) => `## ${title}
### Regla y forma
- **EN:** Rule in English.
- **ES:** Regla en español.
### Formación
- **Name (EN):** Present Simple --- **Pattern:** subject + base verb
### Definición
- **EN:** Definition in English.
- **ES:** Definición en español.
### Usos
- **EN:** Use in English.
- **ES:** Uso en español.
### Contrastes y errores
- **EN:** Common error in English.
- **ES:** Error habitual en español.
### Ejemplos
- **EN:** A sentence works. --- **ES:** Una oración funciona.
- **EN:** Another example works. --- **ES:** Otro ejemplo funciona.
### Ejercicios
${Array.from({ length: 5 }, (_, index) => `- **Prompt (EN):** Make a sentence about case ${index}. --- **Model (EN):** This is a sentence. --- **Explanation (ES):** Una explicación. --- **Translation (ES):** Esta es una oración.`).join("\n")}`).join("\n");
}

beforeAll(() => {
  fixtureDirectory = mkdtempSync("/tmp/opencode/grammar-fixture-");
  mkdirSync(join(fixtureDirectory, "data"));

  for (const part of GRAMMAR_PARTS) {
    writeFileSync(join(fixtureDirectory, `data/grammar-part-${part.number}.md`), fixtureMarkdown(part));
  }
});

afterAll(() => {
  if (fixtureDirectory) rmSync(fixtureDirectory, { recursive: true, force: true });
});

describe("getGrammarTopics", () => {
  it("carga el conjunto real de 26 temas y al menos 130 ejercicios", () => {
    const topics = getGrammarTopics();
    expect(topics).toHaveLength(26);
    expect(topics.reduce((total, topic) => total + topic.exercises.length, 0)).toBeGreaterThanOrEqual(130);
    expect(topics.map(({ slug }) => slug)).toEqual(
      GRAMMAR_PARTS.flatMap((part) => part.topics.map(({ slug }) => slug)),
    );
  });

  it("lee los ocho Markdown de fixtures completos y devuelve 26 temas validados en orden", () => {
    const topics = getGrammarTopics(fixtureDirectory);
    expect(topics).toHaveLength(26);
    expect(topics.map(({ part }) => part)).toEqual(
      GRAMMAR_PARTS.flatMap(({ number, topics: entries }) => entries.map(() => number)),
    );
    expect(topics[0]?.slug).toBe("present-simple-present-progressive");
    expect(topics.at(-1)?.slug).toBe("causative-form");
    for (const topic of topics) {
      expect(GrammarTopicSchema.parse(topic)).toEqual(topic);
      expect(topic.exercises).toHaveLength(5);
    }
  });

  it("propaga errores del archivo y tema inválidos", () => {
    const file = join(fixtureDirectory, "data/grammar-part-8.md");
    const part = GRAMMAR_PARTS[7];
    if (!part) throw new Error("Fixture de Parte 8 no disponible");
    writeFileSync(file, "## Unreal past\n");
    try {
      expect(() => getGrammarTopics(fixtureDirectory)).toThrow(/data\/grammar-part-8\.md:1 \(Unreal past\): sección formations faltante/);
    } finally {
      writeFileSync(file, fixtureMarkdown(part));
    }
  });
});
