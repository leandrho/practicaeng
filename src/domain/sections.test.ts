import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SECTIONS, SECTION_FILES } from "./sections";

describe("sections", () => {
  it("lista exactamente 7 secciones", () => {
    expect(SECTIONS).toHaveLength(7);
    expect(Object.keys(SECTION_FILES)).toHaveLength(7);
    expect(SECTIONS).toContain("everyday-phrases");
  });

  it("los 7 archivos existen en data/", () => {
    for (const section of SECTIONS) {
      expect(existsSync(SECTION_FILES[section])).toBe(true);
    }
  });
});
