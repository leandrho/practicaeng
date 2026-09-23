import { GRAMMAR_PARTS } from "../domain/grammar-catalog";
import { GrammarTopicSchema, type GrammarTopic } from "../domain/grammar";

type Section = "ruleEs" | "usesEs" | "contrastsEs" | "examples" | "exercises";
const HEADINGS: Record<string, Section> = {
  "Regla y forma": "ruleEs",
  "Usos": "usesEs",
  "Contrastes y errores": "contrastsEs",
  "Ejemplos": "examples",
  "Ejercicios": "exercises",
};

type Draft = {
  title: string;
  slug: string;
  line: number;
  sections: Partial<Record<Section, { line: number; lines: { text: string; line: number }[] }>>;
};

function fail(file: string, line: number, topic: string, reason: string): never {
  throw new Error(`${file}:${line} (${topic}): ${reason}`);
}

function fields(
  text: string,
  labels: readonly string[],
  file: string,
  line: number,
  topic: string,
): string[] {
  const segments = text.replace(/^-\s+/, "").split(/\s+---\s+/);
  return labels.map((label, index) => {
    const prefix = `**${label}:** `;
    const segment = segments[index];
    if (segment === undefined || !segment.startsWith(prefix) || !segment.slice(prefix.length).trim()) {
      fail(file, line, topic, `campo ${label} faltante o vacío`);
    }
    if (index === labels.length - 1 && segments.length !== labels.length) {
      fail(file, line, topic, "cantidad de campos incorrecta");
    }
    return segment.slice(prefix.length).trim();
  });
}

export function parseGrammarPart(markdown: string, partNumber: number, file: string): GrammarTopic[] {
  const part = GRAMMAR_PARTS.find((entry) => entry.number === partNumber);
  if (!part) fail(file, 1, `Parte ${partNumber}`, "parte desconocida");

  const lines = markdown.split(/\r?\n/);
  const topics: GrammarTopic[] = [];
  let draft: Draft | undefined;
  let section: Section | undefined;

  function finish() {
    if (!draft) return;
    const current = draft;
    const prose = (key: Section) => {
      const block = current.sections[key];
      if (!block) fail(file, current.line, current.title, `sección ${key} faltante`);
      const value = block.lines.map((entry) => entry.text).join(" ").trim();
      if (!value) fail(file, block.line, current.title, `sección ${key} vacía`);
      return value;
    };
    const bullets = (key: "examples" | "exercises", labels: readonly string[]) => {
      const block = current.sections[key];
      if (!block) fail(file, current.line, current.title, `sección ${key} faltante`);
      return block.lines.map(({ text, line }) => {
        if (!text.startsWith("- ")) fail(file, line, current.title, `bullet inválido en ${key}`);
        return { values: fields(text, labels, file, line, current.title), line };
      });
    };
    const examples = bullets("examples", ["EN", "ES"]);
    const exercises = bullets("exercises", ["Prompt (EN)", "Model (EN)", "Explanation (ES)", "Translation (ES)"]);
    const result = GrammarTopicSchema.safeParse({
      part: partNumber,
      title: current.title,
      slug: current.slug,
      ruleEs: prose("ruleEs"),
      usesEs: prose("usesEs"),
      contrastsEs: prose("contrastsEs"),
      examples: examples.map(({ values }) => ({ exampleEn: values[0], translationEs: values[1] })),
      exercises: exercises.map(({ values }) => ({
        promptEn: values[0], modelEn: values[1], explanationEs: values[2], translationEs: values[3],
      })),
    });
    if (!result.success) {
      const issue = result.error.issues[0];
      if (!issue) fail(file, current.line, current.title, "validación de tema fallida");
      const key = issue.path[0];
      const index = issue.path[1];
      const source = key === "examples" ? examples : key === "exercises" ? exercises : undefined;
      const line = source && typeof index === "number"
        ? source[index]?.line ?? current.line
        : current.sections[key as Section]?.line ?? current.line;
      fail(file, line, current.title, `${issue.path.join(".")}: ${issue.message}`);
    }
    topics.push(result.data);
  }

  for (const [index, raw] of lines.entries()) {
    const text = raw.trim();
    if (!text) continue;
    const line = index + 1;
    if (text.startsWith("## ")) {
      finish();
      const title = text.slice(3).trim();
      const expected = part.topics[topics.length];
      if (!expected || title !== expected.title) {
        fail(file, line, title, `tema desconocido, duplicado o fuera de orden; se esperaba ${expected?.title ?? "fin del archivo"}`);
      }
      draft = { title, slug: expected.slug, line, sections: {} };
      section = undefined;
    } else if (text.startsWith("### ")) {
      if (!draft) fail(file, line, `Parte ${partNumber}`, "sección sin tema");
      const heading = text.slice(4).trim();
      const key = HEADINGS[heading];
      if (!key) fail(file, line, draft.title, `sección desconocida: ${heading}`);
      if (draft.sections[key]) fail(file, line, draft.title, `sección duplicada: ${heading}`);
      draft.sections[key] = { line, lines: [] };
      section = key;
    } else {
      if (!draft || !section) fail(file, line, draft?.title ?? `Parte ${partNumber}`, "contenido fuera de sección");
      draft.sections[section]?.lines.push({ text, line });
    }
  }
  finish();
  if (topics.length !== part.topics.length) {
    fail(file, lines.length, `Parte ${partNumber}`, `tema faltante: ${part.topics[topics.length]?.title}`);
  }
  return topics;
}
