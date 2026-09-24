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
  it("muestra hero con CTA principal y catálogo reorganizado sin tutorial previo", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: "Practice English" }),
    ).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "Choose a path" }),
    ).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "Browse vocabulary" }),
    ).not.toBeNull();

    // CTA principal visible de inmediato hacia /mixed.
    const primary = screen.getByRole("link", { name: "Practice 10 cards" });
    expect(primary.getAttribute("href")).toBe("/mixed");

    // Sin tutorial extenso ni ciclo repetido en la portada.
    expect(
      screen.queryByText(/see, recall, produce/i),
    ).toBeNull();
    expect(
      screen.queryByRole("img", { name: /distribution/i }),
    ).toBeNull();
  });

  it("conserva todos los destinos: 3 rutas guiadas + 7 de vocabulario", () => {
    render(<HomePage />);

    const mixedCount =
      contentRepository.getCards("phrasal-verbs").length +
      contentRepository.getCards("collocations").length +
      contentRepository.getCards("prepositions").length +
      contentRepository.getCards("idioms").length +
      contentRepository.getCards("irregular-verbs").length +
      contentRepository.getCards("everyday-phrases").length;

    const expected: Array<[string, number, string]> = [
      ["Mixed Practice", mixedCount, "/mixed"],
      ["Grammar B1+", 26, "/grammar"],
      ["Word Formation", getWordFamilies().length, "/word-formation"],
      ["Phrasal verbs", contentRepository.getCards("phrasal-verbs").length, "/phrasal-verbs"],
      ["Collocations", contentRepository.getCards("collocations").length, "/collocations"],
      ["Prepositions", contentRepository.getCards("prepositions").length, "/prepositions"],
      ["Idioms & Expressions", contentRepository.getCards("idioms").length, "/idioms"],
      ["Irregular Verbs", contentRepository.getCards("irregular-verbs").length, "/irregular-verbs"],
      ["Everyday Phrases", contentRepository.getCards("everyday-phrases").length, "/everyday-phrases"],
      ["Connectors", contentRepository.getCards("connectors").length, "/connectors"],
    ];

    // Catálogo SSR: hero principal + 10 tarjetas (HomeLocal aún carga).
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(11);

    const pathGroup = screen.getByRole("region", { name: "Choose a path" });
    const vocabGroup = screen.getByRole("region", { name: "Browse vocabulary" });
    expect(within(pathGroup).getAllByRole("link")).toHaveLength(3);
    expect(within(vocabGroup).getAllByRole("link")).toHaveLength(7);

    for (const [name, count, href] of expected) {
      const link = screen.getByRole("link", {
        name: (accessibleName) => accessibleName.startsWith(`Practice ${name}, ${count} `),
      });
      expect(link.getAttribute("href")).toBe(href);
      const scope = within(link);
      expect(scope.getByText(name)).not.toBeNull();
      expect(scope.getByText(String(count))).not.toBeNull();
    }

    // Grammar queda en rutas guiadas, separado del vocabulario.
    expect(
      within(pathGroup).getByRole("link", { name: /Practice Grammar B1\+/ }),
    ).not.toBeNull();
    expect(
      within(vocabGroup).queryByRole("link", { name: /Practice Grammar B1\+/ }),
    ).toBeNull();
    expect(
      within(vocabGroup).queryByRole("link", { name: /Practice Word Formation/ }),
    ).toBeNull();
  });

  it("describe Mixed solo con las secciones que realmente incluye", () => {
    render(<HomePage />);

    const pathGroup = screen.getByRole("region", { name: "Choose a path" });
    const mixedLink = within(pathGroup).getByRole("link", {
      name: /Practice Mixed Practice/,
    });
    const detail = within(mixedLink).getByText(/shuffled/i).textContent ?? "";

    expect(detail).toMatch(/Phrasal verbs/i);
    expect(detail).toMatch(/Everyday Phrases/i);
    expect(detail).not.toMatch(/Word Formation/i);
    expect(detail).not.toMatch(/Connector/i);

    const mixedSections = MIXED_SECTIONS as readonly string[];
    expect(mixedSections).not.toContain("connectors");
    expect(mixedSections).not.toContain("word-formation");
    const mixedFromSections = mixedSections.reduce(
      (sum, section) =>
        sum +
        contentRepository.getCards(
          section as Parameters<typeof contentRepository.getCards>[0],
        ).length,
      0,
    );
    expect(
      within(mixedLink).getByText(String(mixedFromSections)),
    ).not.toBeNull();
  });

  it("ordena el DOM hero → Choose a path → Browse vocabulary", () => {
    const { container } = render(<HomePage />);
    const main = container.querySelector("main.home");
    expect(main).not.toBeNull();

    const order = Array.from(
      main!.querySelectorAll("h1, h2"),
    ).map((heading) => heading.textContent);
    expect(order).toEqual([
      "Practice English",
      "Choose a path",
      "Browse vocabulary",
    ]);

    // El orden de tabulación sigue el DOM: hero primero, luego guiadas, luego vocabulario.
    const hrefs = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    expect(hrefs[0]).toBe("/mixed");
    expect(hrefs.slice(1, 4)).toEqual(["/mixed", "/grammar", "/word-formation"]);
    expect(hrefs.slice(4)).toEqual([
      "/phrasal-verbs",
      "/collocations",
      "/prepositions",
      "/idioms",
      "/irregular-verbs",
      "/everyday-phrases",
      "/connectors",
    ]);
  });
});
