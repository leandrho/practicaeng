import {
  WordFamilySchema,
  WordFormationTargetSchema,
  type WordFamily,
} from "../domain/word-formation";

export type WordFormationParseError = { file: string; line: number; reason: string };

type WordFamilyField = "base" | "noun" | "adjective" | "adverb" | "meaningHintEn" | "meaningHint";
type WordFamilyRow = Record<WordFamilyField, string>;

const fields: readonly WordFamilyField[] = [
  "base",
  "noun",
  "adjective",
  "adverb",
  "meaningHintEn",
  "meaningHint",
];

export function parseWordFamilies(markdown: string, file: string): WordFamily[] {
  const lines = markdown.split(/\r?\n/);
  const headerIndex = lines.findIndex(isWordFormationHeader);

  if (headerIndex === -1) {
    return [];
  }

  const separator = lines[headerIndex + 1];
  if (separator === undefined || !isTableSeparator(separator)) {
    throwParseError(file, headerIndex + 1, "tabla de word formation sin separador");
  }

  const extractCells = separator.includes("|")
    ? extractPipeCells
    : createFixedWidthCellExtractor(separator);
  const examplesByBase = extractExamples(lines);
  const contextsByBase = extractContexts(lines, file);
  const exercisesByBase = extractExercises(lines, file);
  const families: WordFamily[] = [];
  const familyLines = new Map<string, number>();
  let row: WordFamilyRow | undefined;
  let rowLine = 0;

  const addRow = () => {
    if (row === undefined) {
      return;
    }

    try {
      const meaningHintEn = normalizeOptionalCell(row.meaningHintEn);
      if (meaningHintEn === undefined) {
        throwParseError(file, rowLine, "familia sin Hint (EN)");
      }
      const meaningHint = normalizeOptionalCell(row.meaningHint);
      if (meaningHint === undefined) {
        throwParseError(file, rowLine, "familia sin Significado (ES)");
      }
      const base = normalizeRequiredCell(row.base);
      const baseKey = base.toLowerCase();
      const context = contextsByBase.get(baseKey);
      if (context === undefined) {
        throwParseError(file, rowLine, "familia sin Context (EN)");
      }
      const exercise = exercisesByBase.get(baseKey);
      if (exercise === undefined) {
        throwParseError(file, rowLine, `familia sin ejercicio: ${baseKey}`);
      }
      if (familyLines.has(baseKey)) {
        throwParseError(file, rowLine, `familia duplicada: ${baseKey}`);
      }

      const noun = normalizeOptionalCell(row.noun);
      const adjective = normalizeOptionalCell(row.adjective);
      const adverb = normalizeOptionalCell(row.adverb);
      if (noun === undefined && adjective === undefined && adverb === undefined) {
        throwParseError(file, rowLine, "familia sin formas");
      }
      const targetValue =
        exercise.target === "noun" ? noun : exercise.target === "adjective" ? adjective : adverb;
      if (targetValue === undefined) {
        throwParseError(
          file,
          exercise.line,
          `objetivo inexistente en la familia: ${exercise.target}`,
        );
      }
      const variants = new Set(
        targetValue
          .split("/")
          .map((part) => part.trim().toLowerCase().replace(/\s+/g, " "))
          .filter((part) => part !== ""),
      );
      for (const answer of exercise.acceptedAnswers) {
        const normalized = answer.trim().toLowerCase().replace(/\s+/g, " ");
        if (!variants.has(normalized)) {
          throwParseError(
            file,
            exercise.line,
            `respuesta no presente en la categoría ${exercise.target}: ${answer}`,
          );
        }
      }

      familyLines.set(baseKey, rowLine);

      families.push(
        WordFamilySchema.parse({
          base,
          level: "B1-B2",
          category: base.charAt(0).toUpperCase(),
          noun,
          adjective,
          adverb,
          meaningHintEn,
          meaningHint,
          contextEn: context.contextEn,
          contextSource: context.contextSource,
          examples: examplesByBase.get(baseKey) ?? [],
          exercise: {
            target: exercise.target,
            sentenceEn: exercise.sentenceEn,
            acceptedAnswers: exercise.acceptedAnswers,
          },
        }),
      );
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "reason" in error &&
        "file" in error &&
        "line" in error
      ) {
        throw error;
      }
      throwParseError(
        file,
        rowLine,
        error instanceof Error ? error.message : "familia de palabras inválida",
      );
    }
  };

  for (let index = headerIndex + 2; index < lines.length; index += 1) {
    const line = lines[index];
    if (line === undefined || line.trim() === "") {
      continue;
    }
    if (isTableSeparator(line) || /^##\s+/.test(line)) {
      break;
    }

    const cells = extractCells(line);
    if (cells === undefined) {
      continue;
    }

    if (cells.base !== "") {
      addRow();
      row = cells;
      rowLine = index + 1;
      continue;
    }

    if (row !== undefined) {
      appendCells(row, cells);
    }
  }

  addRow();

  const familyBases = new Set(families.map((family) => family.base.toLowerCase()));
  for (const [base, context] of contextsByBase) {
    if (!familyBases.has(base)) {
      throwParseError(file, context.line, `contexto sin familia: ${base}`);
    }
  }
  for (const [base, exercise] of exercisesByBase) {
    if (!familyBases.has(base)) {
      throwParseError(file, exercise.line, `ejercicio sin familia: ${base}`);
    }
  }

  return families;
}

type FamilyContext = { contextEn: string; contextSource: string; line: number };

type FamilyExercise = {
  target: "noun" | "adjective" | "adverb";
  sentenceEn: string;
  acceptedAnswers: string[];
  line: number;
};

function normalizeExerciseAnswer(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function extractExercises(
  lines: readonly string[],
  file: string,
): Map<string, FamilyExercise> {
  const exercisesByBase = new Map<string, FamilyExercise>();
  let inExercisesSection = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line === undefined) {
      continue;
    }

    if (/^##\s+Ejercicios\s*$/.test(line)) {
      inExercisesSection = true;
      continue;
    }
    if (inExercisesSection && /^##\s+/.test(line)) {
      break;
    }
    if (!inExercisesSection || !/^\s*-\s+/.test(line)) {
      continue;
    }

    const startLine = index + 1;
    let bullet = line.trim();
    while (index + 1 < lines.length && /^\s+\S/.test(lines[index + 1] ?? "")) {
      const continuation = lines[index + 1];
      if (continuation === undefined || /^\s*-\s+/.test(continuation)) {
        break;
      }
      index += 1;
      bullet = `${bullet} ${lines[index]?.trim()}`;
    }

    const match =
      /^-\s+\*\*Base:\*\*\s*(.+?)\s*---\s*\*\*Target:\*\*\s*(.+?)\s*---\s*\*\*Sentence \(EN\):\*\*\s*(.+?)\s*---\s*\*\*Answers:\*\*\s*(.+?)\s*$/.exec(
        bullet,
      );
    if (match?.[1] === undefined || match[2] === undefined || match[3] === undefined || match[4] === undefined) {
      throwParseError(
        file,
        startLine,
        "ejercicio debe tener Base, Target, Sentence (EN) y Answers separados por ---",
      );
    }

    const base = match[1].trim().toLowerCase();
    const rawTarget = match[2].trim().toLowerCase();
    const sentenceEn = match[3].trim();
    const rawAnswers = match[4].trim();
    if (base.length === 0) {
      throwParseError(file, startLine, "ejercicio sin base");
    }
    if (exercisesByBase.has(base)) {
      throwParseError(file, startLine, `ejercicio duplicado: ${base}`);
    }

    const targetParsed = WordFormationTargetSchema.safeParse(rawTarget);
    if (!targetParsed.success) {
      throwParseError(file, startLine, `objetivo inválido: ${match[2].trim()}`);
    }

    const gapRuns = sentenceEn.match(/_+/g) ?? [];
    if (gapRuns.length !== 1 || gapRuns[0] !== "____") {
      throwParseError(file, startLine, "ejercicio debe tener exactamente un hueco ____");
    }

    if (rawAnswers.length === 0) {
      throwParseError(file, startLine, "respuestas vacías");
    }
    const acceptedAnswers = rawAnswers
      .split("/")
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
    if (acceptedAnswers.length === 0) {
      throwParseError(file, startLine, "respuestas vacías");
    }
    const rawParts = rawAnswers.split("/");
    if (rawParts.some((part) => part.trim() === "")) {
      throwParseError(file, startLine, "respuestas vacías");
    }
    const seenAnswers = new Set<string>();
    for (const answer of acceptedAnswers) {
      const normalized = normalizeExerciseAnswer(answer);
      if (seenAnswers.has(normalized)) {
        throwParseError(file, startLine, `respuestas duplicadas: ${answer}`);
      }
      seenAnswers.add(normalized);
    }

    exercisesByBase.set(base, {
      target: targetParsed.data,
      sentenceEn,
      acceptedAnswers,
      line: startLine,
    });
  }

  return exercisesByBase;
}

function extractContexts(lines: readonly string[], file: string): Map<string, FamilyContext> {
  const contextsByBase = new Map<string, FamilyContext>();
  let inContextsSection = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line === undefined) {
      continue;
    }

    if (/^##\s+Contextos\s*$/.test(line)) {
      inContextsSection = true;
      continue;
    }
    if (inContextsSection && /^##\s+/.test(line)) {
      break;
    }
    if (!inContextsSection || !/^\s*-\s+/.test(line)) {
      continue;
    }

    const startLine = index + 1;
    let bullet = line.trim();
    while (index + 1 < lines.length && /^\s+\S/.test(lines[index + 1] ?? "")) {
      const continuation = lines[index + 1];
      if (continuation === undefined || /^\s*-\s+/.test(continuation)) {
        break;
      }
      index += 1;
      bullet = `${bullet} ${lines[index]?.trim()}`;
    }

    const match = /^-\s+\*\*(.+?):\*\*\s*(.+?)\s*(?:[—–]\s+(.+?)\s*|\s+-\s+(.+?)\s*)?$/.exec(bullet);
    if (match?.[1] === undefined || match[2] === undefined) {
      throwParseError(file, startLine, "contexto debe tener base y fragmento en inglés");
    }

    const base = match[1].trim().toLowerCase();
    const contextEn = match[2].trim();
    const contextSource = (match[3] ?? match[4] ?? "Everyday conversation").trim();
    if (base.length === 0 || contextEn.length === 0) {
      throwParseError(file, startLine, "familia sin Context (EN)");
    }
    if (contextEn.includes("---")) {
      throwParseError(file, startLine, "contexto no puede contener ---");
    }
    if (contextsByBase.has(base)) {
      throwParseError(file, startLine, `contexto duplicado: ${base}`);
    }
    contextsByBase.set(base, { contextEn, contextSource, line: startLine });
  }

  return contextsByBase;
}

function extractExamples(lines: readonly string[]): Map<string, string[]> {
  const examplesByBase = new Map<string, string[]>();
  let inExamplesSection = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line === undefined) {
      continue;
    }

    if (/^##\s+Ejemplos para practicar en contexto\s*$/.test(line)) {
      inExamplesSection = true;
      continue;
    }
    if (inExamplesSection && /^##\s+/.test(line)) {
      break;
    }
    if (!inExamplesSection || !/^\s*-\s+/.test(line)) {
      continue;
    }

    let bullet = line.trim();
    while (index + 1 < lines.length && /^\s+\S/.test(lines[index + 1] ?? "")) {
      index += 1;
      bullet = `${bullet} ${lines[index]?.trim()}`;
    }

    const match = /^-\s+\*\*([^→*]+?)\s*→.+?:\*\*\s*(.+)$/.exec(bullet);
    if (match?.[1] === undefined || match[2] === undefined) {
      continue;
    }

    const examples = [...match[2].matchAll(/\*([^*]+)\*/g)]
      .map((example) => example[1]?.trim())
      .filter((example): example is string => example !== undefined && example !== "");
    if (examples.length > 0) {
      examplesByBase.set(match[1].trim().toLowerCase(), examples);
    }
  }

  return examplesByBase;
}

function isWordFormationHeader(line: string): boolean {
  const normalized = line.toLowerCase();
  return (
    normalized.includes("base") &&
    normalized.includes("sustantivo") &&
    normalized.includes("adjetivo") &&
    normalized.includes("adverbio")
  );
}

function isTableSeparator(line: string): boolean {
  return /^\s*\|?\s*:?-{3,}:?(?:\s*\|\s*:?-{3,}:?)+\s*\|?\s*$/.test(line) ||
    /^\s*-{3,}(?:\s+-{3,}){4,}\s*$/.test(line) ||
    /^\s*-{5,}\s*$/.test(line);
}

function extractPipeCells(line: string): WordFamilyRow | undefined {
  if (!line.includes("|")) {
    return undefined;
  }

  const cells = line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => cell.trim());

  return createRow(cells);
}

function createFixedWidthCellExtractor(separator: string): (line: string) => WordFamilyRow {
  const starts = [...separator.matchAll(/-{3,}/g)].map((match) => match.index ?? 0);

  return (line) => {
    const cells = starts.map((start, index) => {
      const nextStart = starts[index + 1];
      return line.slice(start, nextStart).trim();
    });

    return createRow(cells);
  };
}

function createRow(cells: readonly string[]): WordFamilyRow {
  return Object.fromEntries(
    fields.map((field, index) => [field, cells[index] ?? ""]),
  ) as WordFamilyRow;
}

function appendCells(row: WordFamilyRow, continuation: WordFamilyRow): void {
  for (const field of fields) {
    if (continuation[field] !== "") {
      row[field] = `${row[field]} ${continuation[field]}`.trim();
    }
  }
}

function normalizeRequiredCell(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeOptionalCell(value: string): string | undefined {
  const normalized = normalizeRequiredCell(value);
  return normalized === "" || /^-+$/.test(normalized) ? undefined : normalized;
}

function throwParseError(file: string, line: number, reason: string): never {
  throw { file, line, reason } satisfies WordFormationParseError;
}
