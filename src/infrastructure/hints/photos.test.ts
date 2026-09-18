import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
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
});
