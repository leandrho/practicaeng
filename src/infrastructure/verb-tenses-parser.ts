import {
  getVerbTenseFormsForSlug,
  VerbTenseExerciseSchema,
  type VerbTenseExercise,
  type VerbTenseSection,
  type VerbTenseSlug,
} from "../domain/verb-tenses";

export type VerbTenseParseError = {
  file: string;
  line: number;
  reason: string;
};

const LABELS = [
  "Form",
  "Prompt (EN)",
  "Sentence (EN)",
  "Answers",
  "Model (EN)",
  "Explanation (ES)",
  "Translation (ES)",
  "Context (EN)",
] as const;

const SOURCE_LABEL = "Context source";
const DEFAULT_SOURCE = "Everyday conversation";

function throwParseError(file: string, line: number, reason: string): never {
  throw { file, line, reason } satisfies VerbTenseParseError;
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function parseVerbTenseSection(
  markdown: string,
  file: string,
  expected: { slug: VerbTenseSlug; title: string },
): VerbTenseSection {
  const lines = markdown.split(/\r?\n/);
  let titleLine = 0;
  let title = "";
  let headingCount = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const text = (lines[index] ?? "").trim();
    if (/^##\s+/.test(text)) {
      headingCount += 1;
      if (headingCount === 1) {
        title = text.replace(/^##\s+/, "").trim();
        titleLine = index + 1;
      } else {
        throwParseError(file, index + 1, "sección duplicada o inesperada");
      }
    }
  }

  if (headingCount === 0 || title === "") {
    throwParseError(file, 1, "sección sin encabezado ## con el título");
  }

  if (title !== expected.title) {
    throwParseError(
      file,
      titleLine,
      `título ${title} no coincide con el catálogo ${expected.title}`,
    );
  }

  const exercises: VerbTenseExercise[] = [];
  const seenModels = new Set<string>();

  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index] ?? "";
    const text = raw.trim();
    if (text === "" || text.startsWith("##") || text.startsWith("#")) {
      continue;
    }
    if (!/^\s*-\s+/.test(raw)) {
      throwParseError(file, index + 1, "contenido fuera de sección");
    }

    const lineNumber = index + 1;
    const bullet = text;
    const segments = bullet.replace(/^-\s+/, "").split(" --- ");

    if (segments.length < LABELS.length || segments.length > LABELS.length + 1) {
      throwParseError(file, lineNumber, "cantidad de campos incorrecta");
    }

    const values: Record<string, string> = {};
    const expectedLabels = [...LABELS, ...(segments.length > LABELS.length ? [SOURCE_LABEL] : [])];
    for (let part = 0; part < expectedLabels.length; part += 1) {
      const label = expectedLabels[part] ?? "";
      const segment = segments[part] ?? "";
      const prefix = `**${label}:** `;
      if (!segment.startsWith(prefix) || segment.slice(prefix.length).trim() === "") {
        throwParseError(file, lineNumber, `campo ${label} faltante o vacío`);
      }
      values[label] = segment.slice(prefix.length).trim();
    }

    const form = (values["Form"] ?? "").trim();
    if (!(getVerbTenseFormsForSlug(expected.slug) as readonly string[]).includes(form)) {
      throwParseError(file, lineNumber, `forma inválida: ${form}`);
    }

    const promptEn = values["Prompt (EN)"] ?? "";
    const sentenceEn = values["Sentence (EN)"] ?? "";
    const rawAnswers = values["Answers"] ?? "";
    const modelEn = values["Model (EN)"] ?? "";
    const explanationEs = values["Explanation (ES)"] ?? "";
    const translationEs = values["Translation (ES)"] ?? "";
    const contextEn = values["Context (EN)"] ?? "";
    const contextSource = (values[SOURCE_LABEL] ?? DEFAULT_SOURCE).trim() || DEFAULT_SOURCE;

    const gapMatches = sentenceEn.match(/_+/g) ?? [];
    if (gapMatches.length !== 1 || gapMatches[0] !== "____") {
      throwParseError(
        file,
        lineNumber,
        "campo Sentence (EN): el ejercicio debe tener exactamente un hueco ____",
      );
    }
    if (sentenceEn.includes(" --- ")) {
      throwParseError(
        file,
        lineNumber,
        "campo Sentence (EN): no puede contener el separador ---",
      );
    }
    if (contextEn.includes("---")) {
      throwParseError(file, lineNumber, "campo Context (EN): no puede contener ---");
    }

    if (rawAnswers.trim() === "") {
      throwParseError(file, lineNumber, "campo Answers: respuestas vacías");
    }
    const rawParts = rawAnswers.split("/");
    if (rawParts.some((part) => part.trim() === "")) {
      throwParseError(file, lineNumber, "campo Answers: respuestas vacías");
    }
    const acceptedAnswers = rawParts.map((part) => part.trim());
    const seenAnswers = new Set<string>();
    for (const answer of acceptedAnswers) {
      const normalized = normalize(answer);
      if (seenAnswers.has(normalized)) {
        throwParseError(file, lineNumber, `campo Answers: respuestas duplicadas: ${answer}`);
      }
      seenAnswers.add(normalized);
    }

    const promptNorm = normalize(promptEn);
    const modelNorm = normalize(modelEn);
    if (promptNorm === modelNorm || (modelNorm.length > 0 && promptNorm.includes(modelNorm))) {
      throwParseError(
        file,
        lineNumber,
        "campo Prompt (EN): el prompt adelanta el modelo literalmente",
      );
    }
    if (seenModels.has(modelNorm)) {
      throwParseError(file, lineNumber, "campo Model (EN): modelo duplicado en la sección");
    }
    seenModels.add(modelNorm);

    try {
      exercises.push(
        VerbTenseExerciseSchema.parse({
          form,
          promptEn,
          sentenceEn,
          acceptedAnswers,
          modelEn,
          explanationEs,
          translationEs,
          contextEn,
          contextSource,
        }),
      );
    } catch (error) {
      if (error instanceof Error) {
        throwParseError(file, lineNumber, error.message);
      }
      throwParseError(file, lineNumber, "ejercicio inválido");
    }
  }

  if (exercises.length === 0) {
    throwParseError(file, titleLine, "sección sin ejercicios");
  }

  return { slug: expected.slug, title: expected.title, exercises };
}
