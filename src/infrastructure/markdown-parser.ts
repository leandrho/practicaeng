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

    const match = /^-\s+\*\*(.+?)\*\*\s+---\s+(.+?)\s+---\s+\*(.+)\*\s*$/.exec(
      bullet,
    );
    if (match?.[1] === undefined || match[2] === undefined || match[3] === undefined) {
      throwParseError(
        file,
        startLine,
        "bullet debe tener expresión, significado y ejemplo",
      );
    }

    cards.push(
      parseCard(
        {
          expression: match[1],
          type,
          meaningEs: match[2],
          exampleEn: match[3],
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

export function parsePhrasalVerbCards(markdown: string, file: string): Card[] {
  const cards: Card[] = [];
  const lines = markdown.split(/\r?\n/);
  let card:
    | {
        expression: string;
        line: number;
        meaningEs?: string;
        exampleEn?: string;
      }
    | undefined;

  const addCard = () => {
    if (card === undefined) {
      return;
    }

    if (card.meaningEs === undefined) {
      throwParseError(file, card.line, "tarjeta sin Significado");
    }
    if (card.exampleEn === undefined) {
      throwParseError(file, card.line, "tarjeta sin Ejemplo");
    }

    cards.push(
      parseCard(
        {
          expression: card.expression,
          type: "phrasal-verb",
          meaningEs: card.meaningEs,
          exampleEn: card.exampleEn,
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

    const meaning = /^\s*-\s+\*\*Significado:\*\*\s*(.+?)\s*$/.exec(line);
    if (meaning?.[1] !== undefined) {
      card.meaningEs = meaning[1];
      continue;
    }

    const example = /^\s*-\s+\*\*Ejemplo:\*\*\s*(.+?)\s*$/.exec(line);
    if (example?.[1] !== undefined) {
      card.exampleEn = example[1];
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
