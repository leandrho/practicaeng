// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { GRAMMAR_PARTS } from "../../src/domain/grammar-catalog";
import GrammarPage from "./page";

afterEach(cleanup);

describe("GrammarPage", () => {
  it("agrupa los 26 enlaces por las ocho partes en el orden editorial", () => {
    render(<GrammarPage />);

    expect(screen.getByRole("heading", { name: "Grammar B1+" })).not.toBeNull();
    expect(screen.getAllByRole("link")).toHaveLength(27); // 26 temas + regreso al inicio.
    for (const part of GRAMMAR_PARTS) {
      const section = screen.getByRole("region", { name: `Part ${part.number}` });
      const links = within(section).getAllByRole("link");
      expect(links.map((link) => link.getAttribute("href"))).toEqual(
        part.topics.map(({ slug }) => `/grammar/parte-${part.number}/${slug}`),
      );
      links.forEach((link, index) => {
        expect(within(link).getByText(part.topics[index]?.title ?? "missing title")).not.toBeNull();
      });
    }
  });
});
