import { WordFamilySchema, type WordFamily } from "../domain/word-formation";

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
  const families: WordFamily[] = [];
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
      const context = contextsByBase.get(base.toLowerCase());
      if (context === undefined) {
        throwParseError(file, rowLine, "familia sin Context (EN)");
      }

      families.push(
        WordFamilySchema.parse({
          base,
          level: "B1-B2",
          category: base.charAt(0).toUpperCase(),
          noun: normalizeOptionalCell(row.noun),
          adjective: normalizeOptionalCell(row.adjective),
          adverb: normalizeOptionalCell(row.adverb),
          meaningHintEn,
          meaningHint,
          contextEn: context.contextEn,
          contextSource: context.contextSource,
          examples: examplesByBase.get(base.toLowerCase()) ?? [],
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

  return families;
}

type FamilyContext = { contextEn: string; contextSource: string; line: number };

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
