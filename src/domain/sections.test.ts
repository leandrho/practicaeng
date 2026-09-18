import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SECTIONS, SECTION_FILES } from "./sections";

describe("sections", () => {
  it("lista exactamente 6 secciones", () => {
    expect(SECTIONS).toHaveLength(6);
    expect(Object.keys(SECTION_FILES)).toHaveLength(6);
  });

  it("los 6 archivos existen en data/", () => {
    for (const section of SECTIONS) {
      expect(existsSync(SECTION_FILES[section])).toBe(true);
    }
  });
});
