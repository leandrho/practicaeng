import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  assertVerbTenseMinimums,
  VERB_TENSE_SECTIONS,
  type VerbTenseSection,
  type VerbTenseSlug,
} from "../domain/verb-tenses";
import { parseVerbTenseSection } from "./verb-tenses-parser";

export function getVerbTenseSection(
  slug: VerbTenseSlug,
  rootDirectory = process.cwd(),
): VerbTenseSection {
  const meta = VERB_TENSE_SECTIONS.find((entry) => entry.slug === slug);
  if (!meta) {
    throw new Error(`sección de tiempos verbales desconocida: ${slug}`);
  }

  const markdown = readFileSync(join(rootDirectory, meta.file), "utf8");
  const section = parseVerbTenseSection(
    markdown,
    meta.file,
    { slug: meta.slug, title: meta.title },
  );
  assertVerbTenseMinimums(section);
  return section;
}

export function getVerbTenseSections(
  rootDirectory = process.cwd(),
): VerbTenseSection[] {
  return VERB_TENSE_SECTIONS.map((entry) => getVerbTenseSection(entry.slug, rootDirectory));
}
