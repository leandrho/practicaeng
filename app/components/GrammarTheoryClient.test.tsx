// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { GrammarTopic } from "../../src/domain/grammar";
import { GrammarTheoryClient } from "./GrammarTheoryClient";

afterEach(cleanup);

const topic: GrammarTopic = {
  part: 1,
  slug: "present-simple-present-progressive",
  title: "Present Simple / Present Progressive",
  ruleEn: "The **present simple** uses the base verb and adds **-s/-es** in the third person.",
  ruleEs: "El **present simple** usa el verbo base y agrega **-s/-es** en tercera persona.",
  formations: [
    {
      name: "Present Simple",
      patterns: [
        { label: "Affirmative", pattern: "subject + base verb (+ -s/-es in the third person)" },
        { label: "Negative", pattern: "subject + don't/doesn't + base verb" },
      ],
    },
  ],
  usesEn: "Use it for habits and general facts. Expressions like every day point to the simple.",
  usesEs: "Usalo para hábitos y hechos generales. Expresiones como every day orientan al simple.",
  contrastsEn: "A repeated habit does not take -ing just because it happens now.",
  contrastsEs: "Un hábito repetido no requiere -ing solo porque ocurre en el presente.",
  examples: [
    { exampleEn: "My brother takes the train every morning.", translationEs: "Mi hermano toma el tren todas las mañanas." },
    { exampleEn: "The museum opens at nine on weekdays.", translationEs: "El museo abre a las nueve los días de semana." },
  ],
  exercises: Array.from({ length: 5 }, (_, index) => ({
    promptEn: `Prompt ${index}.`,
    modelEn: `Model ${index}.`,
    explanationEs: `Explicación ${index}.`,
    translationEs: `Traducción ${index}.`,
  })),
};

function renderTheory() {
  return render(<GrammarTheoryClient topic={topic} />);
}

describe("GrammarTheoryClient", () => {
  it("muestra la prosa en inglés por defecto, sin el texto español en el DOM", () => {
    const { container } = renderTheory();
    expect(container.textContent).toContain("uses the base verb and adds");
    expect(screen.getByText(/Use it for habits and general facts/)).not.toBeNull();
    expect(screen.getByText(/A repeated habit does not take -ing/)).not.toBeNull();
    expect(container.textContent).not.toContain("usa el verbo base");
    expect(container.textContent).not.toContain("Usalo para hábitos");
    expect(container.textContent).not.toContain("no requiere -ing");
    expect(container.textContent).toContain("uses the base verb and adds");
  });

  it("pulsar ES reemplaza las tres secciones por español y oculta el inglés del DOM", () => {
    const { container } = renderTheory();
    const toggle = screen.getByRole("button", { name: "Show Spanish theory" });
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    expect(toggle.textContent).toBe("ES");

    fireEvent.click(toggle);

    expect(container.textContent).not.toContain("uses the base verb");
    expect(container.textContent).not.toContain("Use it for habits");
    expect(container.textContent).not.toContain("does not take -ing");
    expect(container.textContent).toContain("usa el verbo base");
    expect(screen.getByText(/Usalo para hábitos/)).not.toBeNull();
    expect(screen.getByText(/no requiere -ing/)).not.toBeNull();
    const pressed = screen.getByRole("button", { name: "Show English theory" });
    expect(pressed.getAttribute("aria-pressed")).toBe("true");
    expect(pressed.textContent).toBe("EN");
  });

  it("pulsar EN restaura el inglés sin texto español de prosa en el DOM", () => {
    const { container } = renderTheory();
    fireEvent.click(screen.getByRole("button", { name: "Show Spanish theory" }));
    fireEvent.click(screen.getByRole("button", { name: "Show English theory" }));
    expect(container.textContent).not.toContain("usa el verbo base");
    expect(container.textContent).not.toContain("Usalo para hábitos");
    expect(container.textContent).not.toContain("no requiere -ing");
    expect(container.textContent).toContain("uses the base verb and adds");
    expect(screen.getByRole("button", { name: "Show Spanish theory" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("mantiene los encabezados en inglés y la formación en inglés en ambos modos", () => {
    const { container } = renderTheory();
    const headings = () => ["Theory", "Formation", "Rule", "When to use", "Watch out for this", "In context"]
      .map((name) => screen.queryByRole("heading", { name }));
    headings().forEach((heading) => expect(heading).not.toBeNull());
    expect(container.textContent).not.toContain("Formación");
    expect(container.textContent).not.toContain("Regla");
    expect(container.textContent).not.toContain("Cuándo se usa");
    expect(container.textContent).not.toContain("Ojo con esto");

    fireEvent.click(screen.getByRole("button", { name: "Show Spanish theory" }));

    headings().forEach((heading) => expect(heading).not.toBeNull());
    expect(screen.getByText("Affirmative:")).not.toBeNull();
    expect(screen.getByText("subject + base verb (+ -s/-es in the third person)")).not.toBeNull();
    expect(screen.getByText("Negative:")).not.toBeNull();
    expect(screen.getByText("subject + don't/doesn't + base verb")).not.toBeNull();
  });

  it("muestra siempre el par EN + ES de los ejemplos en ambos modos", () => {
    const { container } = renderTheory();
    const assertExamples = () => {
      expect(screen.getByText("My brother takes the train every morning.")).not.toBeNull();
      expect(screen.getByText("Mi hermano toma el tren todas las mañanas.")).not.toBeNull();
      expect(screen.getByText("The museum opens at nine on weekdays.")).not.toBeNull();
      expect(screen.getByText("El museo abre a las nueve los días de semana.")).not.toBeNull();
    };
    assertExamples();
    fireEvent.click(screen.getByRole("button", { name: "Show Spanish theory" }));
    assertExamples();
    expect(container.querySelectorAll(".grammar-theory__examples li")).toHaveLength(2);
  });

  it("resetea a inglés al remontar (navegar a otro tema)", () => {
    const first = renderTheory();
    fireEvent.click(screen.getByRole("button", { name: "Show Spanish theory" }));
    expect(screen.getByRole("button", { name: "Show English theory" })).not.toBeNull();
    first.unmount();

    const second = renderTheory();
    expect(screen.getByRole("button", { name: "Show Spanish theory" }).getAttribute("aria-pressed")).toBe("false");
    expect(second.container.textContent).not.toContain("usa el verbo base");
    expect(second.container.textContent).toContain("uses the base verb and adds");
  });

  it("expone la prosa conmutable en una región aria-live", () => {
    const { container } = renderTheory();
    const region = container.querySelector(".grammar-theory__prose");
    expect(region?.getAttribute("aria-live")).toBe("polite");
  });
});
