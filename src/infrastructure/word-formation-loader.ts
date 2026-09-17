import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { GapFillSchema, type GapFill, type WordFamily } from "../domain/word-formation";
import { SECTION_FILES } from "../domain/sections";
import { parseWordFamilies } from "./word-formation-parser";

const formFields = ["noun", "adjective", "adverb"] as const;

export function getWordFamilies(rootDirectory = process.cwd()): WordFamily[] {
  const file = SECTION_FILES["word-formation"];
  const markdown = readFileSync(join(rootDirectory, file), "utf8");

  return parseWordFamilies(markdown, file);
}

export function buildGapFills(family: WordFamily): GapFill[] {
  const base = family.base.toUpperCase();

  return formFields.flatMap((field) => {
    const form = family[field];
    if (form === undefined) {
      return [];
    }

    return [
      GapFillSchema.parse({
        prompt: `Complete with the correct form of "${base}": ______ (${base})`,
        base: family.base,
        answer: form.split("/")[0]?.trim(),
      }),
    ];
  });
}
