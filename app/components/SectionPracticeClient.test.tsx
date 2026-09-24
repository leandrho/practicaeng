// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import type { Card } from "../../src/domain/card";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

import { SectionPracticeClient } from "./SectionPracticeClient";
import { FilterDrawerProvider, HeaderFilterButton } from "./FilterDrawerProvider";

function makeCard(expression: string, type: Card["type"] = "collocation"): Card {
  return {
    expression,
    type,
    level: "B1-B2",
    meaningEn: `meaning of ${expression}`,
    meaningEs: `significado de ${expression}`,
    exampleEn: `Example with ${expression}.`,
    translationEs: `Ejemplo con ${expression}.`,
    category: "general",
    sourceFile: "fixture.md",
    contextEn: `"Context for ${expression}," she said.`,
    contextSource: "Everyday conversation",
    tags: [],
  };
}

const cards = ["alpha", "bravo", "charlie", "delta", "echo"].map((expression) =>
  makeCard(expression),
);

afterEach(cleanup);

function renderPractice(props: ComponentProps<typeof SectionPracticeClient>) {
  return render(
    <FilterDrawerProvider>
      <HeaderFilterButton />
      <SectionPracticeClient {...props} />
    </FilterDrawerProvider>,
  );
}

function openFilters() {
  fireEvent.click(screen.getByRole("button", { name: "Filters & Order" }));
  expect(screen.getByRole("dialog", { name: "Filters & Order" })).not.toBeNull();
}

describe("SectionPracticeClient", () => {
  it("starts shuffled with order controls inside the filters drawer", () => {
    renderPractice({ cards, pathname: "/collocations", accent: "red" });

    expect(screen.queryByRole("button", { name: "Shuffled" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Ordered" })).toBeNull();
    expect(screen.getByText("Card 1 of 5")).not.toBeNull();

    openFilters();
    expect(screen.getByRole("button", { name: "Shuffled" }).getAttribute("aria-pressed")).toBe(
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "Ordered" }));

    expect(screen.getByRole("heading", { name: "alpha" })).not.toBeNull();
    expect(screen.getByText("Card 1 of 5")).not.toBeNull();
  });

  it("reshuffles from the drawer and closes it", () => {
    renderPractice({ cards, pathname: "/collocations", accent: "red" });

    openFilters();
    fireEvent.click(screen.getByRole("button", { name: "Ordered" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Card 2 of 5")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Shuffled" }));

    expect(screen.getByText("Card 1 of 5")).not.toBeNull();
    expect(screen.queryByRole("dialog", { name: "Filters & Order" })).toBeNull();
  });

  it("shows the section badge when requested", () => {
    renderPractice({
      cards: [makeCard("make a decision")],
      pathname: "/mixed",
      accent: "green",
      showTypeBadge: true,
      disableFilters: true,
    });

    expect(screen.getByText("Collocations")).not.toBeNull();
  });

  it("registers an order-only drawer on mixed practice", () => {
    renderPractice({
      cards: [makeCard("make a decision")],
      pathname: "/mixed",
      accent: "green",
      showTypeBadge: true,
      disableFilters: true,
    });

    openFilters();

    expect(screen.queryByText("Level")).toBeNull();
    expect(screen.getByRole("button", { name: "Shuffled" })).not.toBeNull();
  });
});
