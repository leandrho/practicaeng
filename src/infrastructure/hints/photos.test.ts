import { existsSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveHint } from "../../domain/hints";
import { contentRepository } from "../content-loader";
import { curatedHints } from "./curated";
import { hintPhotos } from "./photos";

const MAX_PHOTO_BYTES = 120 * 1024;

describe("hintPhotos", () => {
  it("references existing photos within the size budget", () => {
    for (const photo of Object.values(hintPhotos)) {
      if (photo === undefined) {
        continue;
      }

      const filePath = resolve(process.cwd(), "public", photo.src.slice(1));
      expect(existsSync(filePath)).toBe(true);
      expect(statSync(filePath).size).toBeLessThanOrEqual(MAX_PHOTO_BYTES);
    }
  });

  it("covers every curated hint", () => {
    const expectedHintIds = Object.values(curatedHints);

    expect(Object.keys(hintPhotos).sort()).toEqual(expectedHintIds.sort());
  });

  it.each([
    "Greetings & socializing",
    "Courtesy & requests",
    "Home & daily routine",
    "Shopping, food & services",
    "Travel & directions",
    "Work, plans & problems",
  ])("resolves the 25 %s phrases to local curated photos", (category) => {
    const cards = contentRepository
      .getCards("everyday-phrases")
      .filter((card) => card.category === category);

    expect(cards).toHaveLength(25);

    for (const card of cards) {
      const hintId = resolveHint(card.expression, card.type, card.category);

      expect(hintId.startsWith("fallback:")).toBe(false);
      expect(hintPhotos[hintId]).toBeDefined();
    }
  });

  it("keeps exact file parity for the 150 everyday phrases", () => {
    const cards = contentRepository.getCards("everyday-phrases");
    const expectedFiles = cards
      .map((card) => `${resolveHint(card.expression, card.type, card.category)}.webp`)
      .sort();
    const actualFiles = readdirSync(resolve(process.cwd(), "public/hints/everyday-phrases"))
      .filter((file) => file.endsWith(".webp"))
      .sort();

    expect(actualFiles).toEqual(expectedFiles);
  });
});
