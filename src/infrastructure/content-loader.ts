import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Card } from "../domain/card";
import { SECTION_FILES } from "../domain/sections";
import { parseBulletCards, parseIrregularVerbCards, parsePhrasalVerbCards } from "./markdown-parser";

export const CONTENT_SECTIONS = [
  "phrasal-verbs",
  "collocations",
  "prepositions",
  "idioms",
  "irregular-verbs",
  "everyday-phrases",
] as const;

export type ContentSection = (typeof CONTENT_SECTIONS)[number];

export type ContentRepository = {
  getCards(section: ContentSection): Card[];
  getSections(): readonly ContentSection[];
};

export function createContentRepository(
  rootDirectory = process.cwd(),
): ContentRepository {
  return {
    getCards(section) {
      const file = SECTION_FILES[section];
      const markdown = readFileSync(join(rootDirectory, file), "utf8");

      return parseCards(markdown, section, file);
    },
    getSections() {
      return CONTENT_SECTIONS;
    },
  };
}

export const contentRepository = createContentRepository();

function parseCards(markdown: string, section: ContentSection, file: string): Card[] {
  switch (section) {
    case "phrasal-verbs":
      return parsePhrasalVerbCards(markdown, file);
    case "collocations":
      return parseBulletCards(markdown, { file, type: "collocation" });
    case "prepositions":
      return parseBulletCards(markdown, { file, type: "preposition" });
    case "idioms":
      return parseBulletCards(markdown, { file, type: "idiom" });
    case "irregular-verbs":
      return parseIrregularVerbCards(markdown, file);
    case "everyday-phrases":
      return parseBulletCards(markdown, { file, type: "everyday-phrase" });
  }
}
