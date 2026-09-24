// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import HomePage from "./page";
import {
  MIXED_SECTIONS,
  contentRepository,
} from "../src/infrastructure/content-loader";
import { getVerbTenseSection } from "../src/infrastructure/verb-tenses-loader";
import { getWordFamilies } from "../src/infrastructure/word-formation-loader";

afterEach(cleanup);

describe("HomePage", () => {
  it("shows the hero, three groups with fourteen sections, and working links", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: "Practice English" }),
    ).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "Practice" }),
    ).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "Grammar & theory" }),
    ).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "Grammar practice" }),
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
      ["Present", getVerbTenseSection("present").exercises.length],
      ["Past", getVerbTenseSection("past").exercises.length],
      ["Future", getVerbTenseSection("future").exercises.length],
      ["Conditionals", getVerbTenseSection("conditionals").exercises.length],
    ];

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(14);

    const practiceGroup = screen.getByRole("region", { name: "Practice" });
    const theoryGroup = screen.getByRole("region", {
      name: "Grammar & theory",
    });
    const grammarPracticeGroup = screen.getByRole("region", {
      name: "Grammar practice",
    });
    expect(within(practiceGroup).getAllByRole("link")).toHaveLength(9);
    expect(within(theoryGroup).getAllByRole("link")).toHaveLength(1);
    expect(within(grammarPracticeGroup).getAllByRole("link")).toHaveLength(4);

    for (const [name, count] of expected) {
      const link = screen.getByRole("link", {
        name: (accessibleName) => accessibleName.startsWith(`Practice ${name}, ${count} `),
      });
      expect(link.getAttribute("href")).toMatch(/^\/[a-z-]+(\/[a-z-]+)?$/);
      const scope = within(link);
      expect(scope.getByText(name)).not.toBeNull();
      expect(scope.getByText(String(count))).not.toBeNull();
    }

    expect(
      screen.getByRole("link", { name: /^Practice Present, \d+/ }).getAttribute("href"),
    ).toBe("/verb-tenses/present");

    expect(
      screen.getByRole("link", { name: /^Practice Past, \d+/ }).getAttribute("href"),
    ).toBe("/verb-tenses/past");

    expect(
      screen.getByRole("link", { name: /^Practice Future, \d+/ }).getAttribute("href"),
    ).toBe("/verb-tenses/future");

    expect(
      screen.getByRole("link", { name: /^Practice Conditionals, \d+/ }).getAttribute("href"),
    ).toBe("/verb-tenses/conditionals");

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
      contentRepository.getCards("everyday-phrases").length +
      contentRepository.getCards("connectors").length;

    expect(screen.getByText(new RegExp(`${total} cards`))).not.toBeNull();
    expect(screen.getByText(new RegExp(`${getWordFamilies().length} families`))).not.toBeNull();
    expect(
      screen.getByRole("img", { name: /Card distribution by section/ }),
    ).not.toBeNull();
  });
});
