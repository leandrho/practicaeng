import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { GRAMMAR_PARTS } from "../domain/grammar-catalog";
import type { GrammarTopic } from "../domain/grammar";
import { parseGrammarPart } from "./grammar-parser";

export function getGrammarTopics(rootDirectory = process.cwd()): GrammarTopic[] {
  return GRAMMAR_PARTS.flatMap(({ number }) => {
    const file = `data/grammar-part-${number}.md`;
    const markdown = readFileSync(join(rootDirectory, file), "utf8");
    return parseGrammarPart(markdown, number, file);
  });
}
