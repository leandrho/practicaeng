// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { MIXED_SECTIONS } from "../../src/infrastructure/content-loader";
import MixedPage from "./page";

vi.mock("../components/SectionPracticeClient", () => ({
  SectionPracticeClient: () => null,
}));

afterEach(cleanup);

it("describe las seis secciones de vocabulario de Mixed sin prometer todas", async () => {
  render(await MixedPage());
  const description = screen.getByText(/Phrasal verbs, collocations/).textContent ?? "";
  for (const name of ["phrasal verbs", "collocations", "prepositions", "idioms", "irregular verbs", "everyday phrases"]) {
    expect(description.toLowerCase()).toContain(name);
  }
  expect(description).not.toMatch(/all sections|connectors|word formation|grammar/i);
  expect(MIXED_SECTIONS).toHaveLength(6);
});
