// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import HomePage from "./page";
import { contentRepository } from "../src/infrastructure/content-loader";
import { getWordFamilies } from "../src/infrastructure/word-formation-loader";

afterEach(cleanup);

describe("HomePage", () => {
  it("shows the hero, six sections with correct counts, and working links", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: "Practice English" }),
    ).not.toBeNull();

    const expected: Array<[string, number]> = [
      ["Phrasal verbs", contentRepository.getCards("phrasal-verbs").length],
      ["Collocations", contentRepository.getCards("collocations").length],
      ["Prepositions", contentRepository.getCards("prepositions").length],
      ["Idioms & Expressions", contentRepository.getCards("idioms").length],
      ["Irregular Verbs", contentRepository.getCards("irregular-verbs").length],
      ["Word Formation", getWordFamilies().length],
    ];

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(6);

    for (const [name, count] of expected) {
      const link = screen.getByRole("link", {
        name: new RegExp(`Practice ${name}, ${count}`),
      });
      expect(link.getAttribute("href")).toMatch(/^\/[a-z-]+$/);
      const scope = within(link);
      expect(scope.getByText(name)).not.toBeNull();
      expect(scope.getByText(String(count))).not.toBeNull();
    }
  });

  it("shows the session bar with the total number of cards", () => {
    render(<HomePage />);

    const total =
      contentRepository.getCards("phrasal-verbs").length +
      contentRepository.getCards("collocations").length +
      contentRepository.getCards("prepositions").length +
      contentRepository.getCards("idioms").length +
      contentRepository.getCards("irregular-verbs").length +
      getWordFamilies().length;

    expect(screen.getByText(new RegExp(`${total} cards`))).not.toBeNull();
    expect(
      screen.getByRole("img", { name: /Card distribution by section/ }),
    ).not.toBeNull();
  });
});
