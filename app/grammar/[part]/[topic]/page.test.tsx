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
    expect(screen.getByRole("heading", { name: "Regla y forma" })).not.toBeNull();
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

  it("rechaza partes y slugs ajenos al catálogo", async () => {
    await expect(GrammarTopicPage({ params: Promise.resolve({ part: "parte-9", topic: "stative-verbs" }) }))
      .rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK;404/);
    await expect(GrammarTopicPage({ params: Promise.resolve({ part: "parte-1", topic: "passive-voice" }) }))
      .rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK;404/);
  });
});
