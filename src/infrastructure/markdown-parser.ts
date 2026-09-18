import { CardSchema, type Card, type CardType } from "../domain/card";

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

    const match = /^-\s+\*\*(.+?)\*\*\s+---\s+(.+?)\s+---\s+(.+?)\s+---\s+\*(.+?)\*\s+---\s+\*(.+)\*\s*$/.exec(
      bullet,
    );
    if (
      match?.[1] === undefined ||
      match[2] === undefined ||
      match[3] === undefined ||
      match[4] === undefined ||
      match[5] === undefined
    ) {
      throwParseError(
        file,
        startLine,
        "bullet debe tener expresión, meaningEn, meaningEs, exampleEn y translationEs",
      );
    }

    cards.push(
      parseCard(
        {
          expression: match[1],
          type,
          meaningEn: match[2],
          meaningEs: match[3],
          exampleEn: match[4],
          translationEs: match[5],
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

    const match = /^-\s+\*\*(.+?)\*\*\s+---\s+(.+?)\s+---\s+(.+?)\s+---\s+\*(.+?)\*\s+---\s+\*(.+)\*\s*$/.exec(
      bullet,
    );
    if (
      match?.[1] === undefined ||
      match[2] === undefined ||
      match[3] === undefined ||
      match[4] === undefined ||
      match[5] === undefined
    ) {
      throwParseError(
        file,
        startLine,
        "bullet debe tener formas, meaningEn, meaningEs, exampleEn y translationEs",
      );
    }

    const forms = match[1]
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
          meaningEn: match[2],
          meaningEs: match[3],
          exampleEn: match[4],
          translationEs: match[5],
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

    cards.push(
      parseCard(
        {
          expression: card.expression,
          type: "phrasal-verb",
          meaningEn: card.meaningEn,
          meaningEs: card.meaningEs,
          exampleEn: card.exampleEn,
          translationEs: card.translationEs,
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
