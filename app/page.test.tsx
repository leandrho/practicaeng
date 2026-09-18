// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import HomePage from "./page";
import { contentRepository } from "../src/infrastructure/content-loader";
import { getWordFamilies } from "../src/infrastructure/word-formation-loader";

afterEach(cleanup);

describe("HomePage", () => {
  it("muestra hero, 5 secciones con conteos correctos y links funcionales", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: "Practicá inglés" }),
    ).not.toBeNull();

    const expected: Array<[string, number]> = [
      ["Phrasal verbs", contentRepository.getCards("phrasal-verbs").length],
      ["Colocaciones", contentRepository.getCards("collocations").length],
      ["Preposiciones", contentRepository.getCards("prepositions").length],
      ["Modismos y expresiones", contentRepository.getCards("idioms").length],
      ["Formación de palabras", getWordFamilies().length],
    ];

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(5);

    for (const [name, count] of expected) {
      const link = screen.getByRole("link", {
        name: new RegExp(`Practicar ${name}, ${count}`),
      });
      expect(link.getAttribute("href")).toMatch(/^\/[a-z-]+$/);
      const scope = within(link);
      expect(scope.getByText(name)).not.toBeNull();
      expect(scope.getByText(String(count))).not.toBeNull();
    }
  });

  it("muestra la barra de sesión con el total de tarjetas", () => {
    render(<HomePage />);

    const total =
      contentRepository.getCards("phrasal-verbs").length +
      contentRepository.getCards("collocations").length +
      contentRepository.getCards("prepositions").length +
      contentRepository.getCards("idioms").length +
      getWordFamilies().length;

    expect(screen.getByText(new RegExp(`${total} tarjetas`))).not.toBeNull();
    expect(
      screen.getByRole("img", { name: /Distribución de tarjetas/ }),
    ).not.toBeNull();
  });
});
