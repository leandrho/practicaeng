import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SECTIONS, SECTION_FILES } from "./sections";

describe("sections", () => {
  it("lista exactamente 8 secciones", () => {
    expect(SECTIONS).toHaveLength(8);
    expect(Object.keys(SECTION_FILES)).toHaveLength(8);
    expect(SECTIONS).toContain("everyday-phrases");
    expect(SECTIONS).toContain("connectors");
  });

  it("los 8 archivos existen en data/", () => {
    for (const section of SECTIONS) {
      expect(existsSync(SECTION_FILES[section])).toBe(true);
    }
  });
});
