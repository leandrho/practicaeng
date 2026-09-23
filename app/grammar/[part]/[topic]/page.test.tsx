// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import GrammarTopicPage, { dynamicParams, generateStaticParams } from "./page";

afterEach(cleanup);

describe("GrammarTopicPage", () => {
  it("genera exactamente las 26 rutas estáticas del catálogo", () => {
    expect(dynamicParams).toBe(false);
    const routes = generateStaticParams();
    expect(routes).toHaveLength(26);
    expect(routes[0]).toEqual({ part: "parte-1", topic: "present-simple-present-progressive" });
    expect(routes.at(-1)).toEqual({ part: "parte-8", topic: "causative-form" });
  });

  it("muestra la teoría y el enlace de vuelta para un tema válido", async () => {
    render(await GrammarTopicPage({ params: Promise.resolve({ part: "parte-1", topic: "stative-verbs" }) }));
    expect(screen.getByRole("heading", { name: "Stative verbs" })).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Formación" })).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Regla" })).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Stative verbs (estado)" })).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Cuándo se usa" })).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Ojo con esto" })).not.toBeNull();
    expect(screen.getByRole("heading", { name: "In context" })).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Practice · 5 cards" })).not.toBeNull();
    expect(screen.getByRole("link", { name: /All grammar topics/ }).getAttribute("href")).toBe("/grammar");
    expect(screen.getByRole("link", { name: /Go to practice/ }).getAttribute("href")).toBe("#grammar-practice");
    expect(screen.getByText("These keys belong to our neighbor.")).not.toBeNull();
    expect(screen.getByText("Estas llaves pertenecen a nuestro vecino.")).not.toBeNull();
    expect(screen.queryByText("I know the answer to that question.")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Reveal" }));
    expect(screen.getByText("I know the answer to that question.")).not.toBeNull();
  });

  it("muestra por separado las dos formaciones de los tiempos perfectos progresivos y resalta sus claves en la regla", async () => {
    const { container } = render(await GrammarTopicPage({
      params: Promise.resolve({ part: "parte-2", topic: "past-perfect-simple-past-perfect-progressive" }),
    }));
    expect(screen.getByRole("heading", { name: "Past Perfect Simple" })).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Past Perfect Progressive" })).not.toBeNull();
    expect(container.querySelectorAll(".grammar-formation")).toHaveLength(2);
    expect(container.querySelector(".grammar-theory__highlight")?.textContent).toBe("past perfect simple");
    expect(container.textContent).toContain("sujeto + had + been + verbo en -ing");
    expect(container.querySelectorAll(".grammar-formation__pattern strong")).toHaveLength(6);
    expect(container.querySelector(".grammar-formation__pattern strong")?.textContent).toBe("Afirmativa:");
    expect(container.querySelector(".grammar-formation__pattern strong + code")?.textContent)
      .toBe("sujeto + had + participio pasado");
  });

  it("mantiene en regular el texto de la regla y resalta los dos tiempos por igual", async () => {
    const { container } = render(await GrammarTopicPage({
      params: Promise.resolve({ part: "parte-2", topic: "past-simple-past-progressive" }),
    }));
    const ruleParagraphs = Array.from(container.querySelectorAll(".grammar-theory__rule p"));
    expect(ruleParagraphs).toHaveLength(2);
    expect(ruleParagraphs[0]?.querySelector(".grammar-theory__highlight")?.textContent).toBe("past simple");
    expect(ruleParagraphs[1]?.querySelector(".grammar-theory__highlight")?.textContent).toBe("past progressive");
  });

  it("rechaza partes y slugs ajenos al catálogo", async () => {
    await expect(GrammarTopicPage({ params: Promise.resolve({ part: "parte-9", topic: "stative-verbs" }) }))
      .rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK;404/);
    await expect(GrammarTopicPage({ params: Promise.resolve({ part: "parte-1", topic: "passive-voice" }) }))
      .rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK;404/);
  });
});
