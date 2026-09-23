import {
  CardSchema,
  ConnectorChannelSchema,
  ConnectorRegisterSchema,
  type Card,
  type CardType,
} from "../domain/card";

export type ParseError = { file: string; line: number; reason: string };

type BulletCardType = Exclude<CardType, "phrasal-verb">;

type BulletParserOptions = {
  file: string;
  type: BulletCardType;
};

export function parseBulletCards(
  markdown: string,
  { file, type }: BulletParserOptions,
): Card[] {
  const lines = markdown.split(/\r?\n/);
  const cards: Card[] = [];
  let category = "general";

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line === undefined) {
      continue;
    }

    const header = /^##\s+(.+?)\s*$/.exec(line);
    if (header?.[1] !== undefined) {
      category = header[1];
      continue;
    }

    if (!/^\s*-\s+/.test(line)) {
      continue;
    }

    const startLine = index + 1;
    let bullet = line.trim();

    while (!/\*\s*$/.test(bullet)) {
      const continuation = lines[index + 1];
      if (
        continuation === undefined ||
        !/^\s+/.test(continuation) ||
        /^\s*-\s+/.test(continuation)
      ) {
        throwParseError(file, startLine, "bullet sin ejemplo en cursiva cerrado");
      }

      index += 1;
      bullet = `${bullet} ${continuation.trim()}`;
    }

    const parsed = parseBulletLine(bullet, file, startLine, type);

    cards.push(
      parseCard(
        {
          expression: parsed.expression,
          type,
          meaningEn: parsed.meaningEn,
          meaningEs: parsed.meaningEs,
          exampleEn: parsed.exampleEn,
          translationEs: parsed.translationEs,
          contextEn: parsed.contextEn,
          contextSource: parsed.contextSource,
          register: parsed.register,
          channel: parsed.channel,
          category,
          sourceFile: file,
        },
        file,
        startLine,
      ),
    );
  }

  return cards;
}

const BULLET_WITH_CONTEXT =
  /^-\s+\*\*(.+?)\*\*\s+---\s+(.+?)\s+---\s+(.+?)\s+---\s+\*(.+?)\*\s+---\s+\*(.+?)\*\s+---\s+\*(.+?)\*\s*(?:---\s+\*(.+?)\*\s*)?$/;
const BULLET_WITHOUT_CONTEXT =
  /^-\s+\*\*(.+?)\*\*\s+---\s+(.+?)\s+---\s+(.+?)\s+---\s+\*(.+?)\*\s+---\s+\*(.+?)\*\s*$/;
const BULLET_WITH_CONNECTOR_USAGE =
  /^-\s+\*\*(.+?)\*\*\s+---\s+(.+?)\s+---\s+(.+?)\s+---\s+\*(.+?)\*\s+---\s+\*(.+?)\*\s+---\s+\*(.+?)\*\s*(?:---\s+\*(?!Register:)(.+?)\*\s*)?---\s+\*Register:\s*(formal|neutral|informal);\s*Channel:\s*(spoken|written|both)\*\s*$/;

function parseBulletLine(
  bullet: string,
  file: string,
  line: number,
  type?: BulletCardType,
) {
  if (type === "connector") {
    const usageMatch = BULLET_WITH_CONNECTOR_USAGE.exec(bullet);
    if (usageMatch !== null) {
      const contextEn = usageMatch[6]?.trim();
      const contextSource = (usageMatch[7] ?? "Everyday conversation").trim();
      if (contextEn === undefined || contextEn.length === 0) {
        throwParseError(file, line, "tarjeta sin Context (EN)");
      }
      if (contextEn.includes("---") || contextSource.includes("---")) {
        throwParseError(file, line, "contexto no puede contener ---");
      }

      return {
        expression: usageMatch[1]!.trim(),
        meaningEn: usageMatch[2]!.trim(),
        meaningEs: usageMatch[3]!.trim(),
        exampleEn: usageMatch[4]!.trim(),
        translationEs: usageMatch[5]!.trim(),
        contextEn,
        contextSource,
        register: ConnectorRegisterSchema.parse(usageMatch[8]),
        channel: ConnectorChannelSchema.parse(usageMatch[9]),
      };
    }

    if (/---\s+\*Register:/i.test(bullet)) {
      throwParseError(file, line, "etiquetas Register/Channel inválidas");
    }
  }

  const match = BULLET_WITH_CONTEXT.exec(bullet);
  if (
    match?.[1] === undefined ||
    match[2] === undefined ||
    match[3] === undefined ||
    match[4] === undefined ||
    match[5] === undefined ||
    match[6] === undefined
  ) {
    if (BULLET_WITHOUT_CONTEXT.test(bullet)) {
      throwParseError(file, line, "tarjeta sin Context (EN)");
    }
    throwParseError(
      file,
      line,
      "bullet debe tener expresión, meaningEn, meaningEs, exampleEn, translationEs y Context (EN)",
    );
  }

  const contextEn = match[6].trim();
  const contextSource = (match[7] ?? "Everyday conversation").trim();
  if (contextEn.includes("---") || contextSource.includes("---")) {
    throwParseError(file, line, "contexto no puede contener ---");
  }
  if (contextEn.length === 0) {
    throwParseError(file, line, "tarjeta sin Context (EN)");
  }

  if (type === "connector") {
    throwParseError(file, line, "conector sin etiquetas Register y Channel");
  }

  return {
    expression: match[1].trim(),
    meaningEn: match[2].trim(),
    meaningEs: match[3].trim(),
    exampleEn: match[4].trim(),
    translationEs: match[5].trim(),
    contextEn,
    contextSource,
  };
}

export function parseIrregularVerbCards(markdown: string, file: string): Card[] {
  const lines = markdown.split(/\r?\n/);
  const cards: Card[] = [];
  let category = "general";

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line === undefined) {
      continue;
    }

    const header = /^##\s+(.+?)\s*$/.exec(line);
    if (header?.[1] !== undefined) {
      category = header[1];
      continue;
    }

    if (!/^\s*-\s+/.test(line)) {
      continue;
    }

    const startLine = index + 1;
    let bullet = line.trim();

    while (!/\*\s*$/.test(bullet)) {
      const continuation = lines[index + 1];
      if (
        continuation === undefined ||
        !/^\s+/.test(continuation) ||
        /^\s*-\s+/.test(continuation)
      ) {
        throwParseError(file, startLine, "bullet sin ejemplo en cursiva cerrado");
      }

      index += 1;
      bullet = `${bullet} ${continuation.trim()}`;
    }

    const parsed = parseBulletLine(bullet, file, startLine);

    const forms = parsed.expression
      .split(/\s+[–—-]\s+/)
      .map((form) => form.trim())
      .filter((form) => form.length > 0);
    if (forms.length !== 3) {
      throwParseError(
        file,
        startLine,
        "forma irregular debe tener base, pasado y participio separados por –",
      );
    }

    const [base, pastSimple, pastParticiple] = forms as [string, string, string];

    cards.push(
      parseCard(
        {
          expression: base,
          type: "irregular-verb",
          meaningEn: parsed.meaningEn,
          meaningEs: parsed.meaningEs,
          exampleEn: parsed.exampleEn,
          translationEs: parsed.translationEs,
          contextEn: parsed.contextEn,
          contextSource: parsed.contextSource,
          category,
          sourceFile: file,
          pastSimple,
          pastParticiple,
        },
        file,
        startLine,
      ),
    );
  }

  return cards;
}

export function parsePhrasalVerbCards(markdown: string, file: string): Card[] {
  const cards: Card[] = [];
  const lines = markdown.split(/\r?\n/);
  let card:
    | {
        expression: string;
        line: number;
        meaningEn?: string;
        meaningEs?: string;
        exampleEn?: string;
        translationEs?: string;
        contextEn?: string;
        contextSource?: string;
      }
    | undefined;

  const addCard = () => {
    if (card === undefined) {
      return;
    }

    if (card.meaningEs === undefined) {
      throwParseError(file, card.line, "tarjeta sin Significado");
    }
    if (card.meaningEn === undefined) {
      throwParseError(file, card.line, "tarjeta sin Meaning (EN)");
    }
    if (card.exampleEn === undefined) {
      throwParseError(file, card.line, "tarjeta sin Ejemplo");
    }
    if (card.translationEs === undefined) {
      throwParseError(file, card.line, "tarjeta sin Traducción (ES)");
    }
    if (card.contextEn === undefined) {
      throwParseError(file, card.line, "tarjeta sin Context (EN)");
    }
    if (card.contextEn.includes("---")) {
      throwParseError(file, card.line, "contexto no puede contener ---");
    }

    cards.push(
      parseCard(
        {
          expression: card.expression,
          type: "phrasal-verb",
          meaningEn: card.meaningEn,
          meaningEs: card.meaningEs,
          exampleEn: card.exampleEn,
          translationEs: card.translationEs,
          contextEn: card.contextEn,
          contextSource: card.contextSource ?? "Everyday conversation",
          category: "general",
          sourceFile: file,
        },
        file,
        card.line,
      ),
    );
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line === undefined) {
      continue;
    }

    if (/^##\s+Estructura sugerida para la app\s*$/.test(line)) {
      break;
    }

    if (/^>\s/.test(line)) {
      continue;
    }

    const header = /^###\s+\d+\.\s+(.+?)\s*$/.exec(line);
    if (header?.[1] !== undefined) {
      addCard();
      card = { expression: header[1], line: index + 1 };
      continue;
    }

    if (card === undefined) {
      continue;
    }

    const meaningEn = /^\s*-\s+\*\*Meaning \(EN\):\*\*\s*(.+?)\s*$/.exec(line);
    if (meaningEn?.[1] !== undefined) {
      card.meaningEn = meaningEn[1];
      continue;
    }

    const meaning = /^\s*-\s+\*\*Significado:\*\*\s*(.+?)\s*$/.exec(line);
    if (meaning?.[1] !== undefined) {
      card.meaningEs = meaning[1];
      continue;
    }

    const example = /^\s*-\s+\*\*Ejemplo:\*\*\s*(.+?)\s*$/.exec(line);
    if (example?.[1] !== undefined) {
      card.exampleEn = example[1];
      continue;
    }

    const translationEs = /^\s*-\s+\*\*Traducción \(ES\):\*\*\s*(.+?)\s*$/.exec(line);
    if (translationEs?.[1] !== undefined) {
      card.translationEs = translationEs[1];
      continue;
    }

    const contextEn = /^\s*-\s+\*\*Context \(EN\):\*\*\s*(.+?)\s*$/.exec(line);
    if (contextEn?.[1] !== undefined) {
      card.contextEn = contextEn[1];
      continue;
    }

    const contextSource = /^\s*-\s+\*\*Context source:\*\*\s*(.+?)\s*$/.exec(line);
    if (contextSource?.[1] !== undefined) {
      card.contextSource = contextSource[1];
    }
  }

  addCard();
  return cards;
}

function parseCard(
  card: Omit<Card, "level">,
  file: string,
  line: number,
): Card {
  try {
    return CardSchema.parse(card);
  } catch (error) {
    throwParseError(
      file,
      line,
      error instanceof Error ? error.message : "tarjeta inválida",
    );
  }
}

function throwParseError(file: string, line: number, reason: string): never {
  throw { file, line, reason } satisfies ParseError;
}
