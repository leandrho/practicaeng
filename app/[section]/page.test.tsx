import { describe, expect, it } from "vitest";
import { generateStaticParams } from "./page";

describe("SectionPage", () => {
  it("genera estáticamente la ruta de everyday phrases", () => {
    expect(generateStaticParams()).toContainEqual({ section: "everyday-phrases" });
  });

  it("genera estáticamente la ruta de connectors", () => {
    expect(generateStaticParams()).toContainEqual({ section: "connectors" });
  });
});
