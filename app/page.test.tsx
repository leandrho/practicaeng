// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import HomePage from "./page";
import {
  MIXED_SECTIONS,
  contentRepository,
} from "../src/infrastructure/content-loader";
import { getWordFamilies } from "../src/infrastructure/word-formation-loader";

afterEach(cleanup);

describe("HomePage", () => {
  it("shows the hero, ten sections with correct counts, and working links", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: "Practice English" }),
    ).not.toBeNull();

    const mixedCount =
      contentRepository.getCards("phrasal-verbs").length +
      contentRepository.getCards("collocations").length +
      contentRepository.getCards("prepositions").length +
      contentRepository.getCards("idioms").length +
      contentRepository.getCards("irregular-verbs").length +
      contentRepository.getCards("everyday-phrases").length;

    const expected: Array<[string, number]> = [
      ["Phrasal verbs", contentRepository.getCards("phrasal-verbs").length],
      ["Collocations", contentRepository.getCards("collocations").length],
      ["Prepositions", contentRepository.getCards("prepositions").length],
      ["Idioms & Expressions", contentRepository.getCards("idioms").length],
      ["Irregular Verbs", contentRepository.getCards("irregular-verbs").length],
      ["Word Formation", getWordFamilies().length],
      ["Everyday Phrases", contentRepository.getCards("everyday-phrases").length],
      ["Connectors", contentRepository.getCards("connectors").length],
      ["Mixed Practice", mixedCount],
      ["Grammar B1+", 26],
    ];

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(10);

    for (const [name, count] of expected) {
      const link = screen.getByRole("link", {
        name: (accessibleName) => accessibleName.startsWith(`Practice ${name}, ${count} `),
      });
      expect(link.getAttribute("href")).toMatch(/^\/[a-z-]+$/);
      const scope = within(link);
      expect(scope.getByText(name)).not.toBeNull();
      expect(scope.getByText(String(count))).not.toBeNull();
    }

    expect(
      screen.getByRole("link", { name: /^Practice Connectors, \d+/ }).getAttribute("href"),
    ).toBe("/connectors");

    const mixedSections = MIXED_SECTIONS as readonly string[];
    expect(mixedSections).not.toContain("connectors");
    const mixedFromSections = mixedSections.reduce(
      (sum, section) =>
        sum +
        contentRepository.getCards(
          section as Parameters<typeof contentRepository.getCards>[0],
        ).length,
      0,
    );
    expect(mixedCount).toBe(mixedFromSections);
    expect(
      within(screen.getByRole("link", { name: /Practice Mixed Practice/ })).getByText(
        String(mixedCount),
      ),
    ).not.toBeNull();

    expect(
      within(screen.getByRole("link", { name: /Practice Everyday Phrases, 150/ })).getByText(
        "Common phrases for daily situations",
      ),
    ).not.toBeNull();
  });

  it("shows the session bar with the total number of cards", () => {
    render(<HomePage />);

    const total =
      contentRepository.getCards("phrasal-verbs").length +
      contentRepository.getCards("collocations").length +
      contentRepository.getCards("prepositions").length +
      contentRepository.getCards("idioms").length +
      contentRepository.getCards("irregular-verbs").length +
      getWordFamilies().length +
      contentRepository.getCards("everyday-phrases").length +
      contentRepository.getCards("connectors").length;

    expect(screen.getByText(new RegExp(`${total} cards`))).not.toBeNull();
    expect(
      screen.getByRole("img", { name: /Card distribution by section/ }),
    ).not.toBeNull();
  });
});
