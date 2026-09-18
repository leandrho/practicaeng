// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { Card } from "../../src/domain/card";
import { Flashcard } from "./Flashcard";

const card: Card = {
  expression: "give up",
  type: "phrasal-verb",
  level: "B1-B2",
  meaningEs: "rendirse",
  exampleEn: "Don't give up.",
  translationEs: "No te rindas.",
  category: "general",
  sourceFile: "data/phrasal-verbs-b1-b2-200.md",
};

const secondCard: Card = {
  ...card,
  expression: "take off",
  meaningEs: "despegar",
  exampleEn: "The plane takes off at noon.",
};

afterEach(cleanup);

describe("Flashcard", () => {
  it("does not include answers in the DOM before Reveal", () => {
    render(<Flashcard cards={[card]} clearFiltersPath="/phrasal-verbs" />);

    expect(screen.getByText(card.expression)).not.toBeNull();
    expect(screen.queryByText(card.meaningEs)).toBeNull();
    expect(screen.queryByText(card.exampleEn)).toBeNull();
    expect(screen.queryByText(card.translationEs!)).toBeNull();
  });

  it("shows the back when revealed", () => {
    render(<Flashcard cards={[card]} clearFiltersPath="/phrasal-verbs" />);

    fireEvent.click(screen.getByRole("button", { name: "Reveal" }));

    expect(screen.getByText(card.meaningEs)).not.toBeNull();
    expect(screen.getByText(card.exampleEn)).not.toBeNull();
    expect(screen.getByText(card.translationEs!)).not.toBeNull();
  });

  it("navigates with buttons and shortcuts without exceeding boundaries", () => {
    render(<Flashcard cards={[card, secondCard]} clearFiltersPath="/phrasal-verbs" />);

    fireEvent.keyDown(window, { key: "ArrowLeft" });
    fireEvent.keyDown(window, { key: " " });
    expect((screen.getByRole("button", { name: "Previous" }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText(secondCard.expression)).not.toBeNull();
    expect(screen.queryByText(secondCard.meaningEs)).toBeNull();

    fireEvent.keyDown(window, { key: " " });
    expect((screen.getByRole("button", { name: "Next" }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByText(secondCard.expression)).not.toBeNull();
  });

  it("shows session progress", () => {
    render(<Flashcard cards={[card, secondCard]} clearFiltersPath="/phrasal-verbs" />);

    expect(screen.getByText("Card 1 of 2")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Reveal" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByText("Card 2 of 2")).not.toBeNull();
  });

  it("shows the empty filters state and allows clearing them", () => {
    render(<Flashcard cards={[]} clearFiltersPath="/collocations" />);

    expect(screen.getByText("No cards match these filters.")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Clear filters" })).not.toBeNull();
  });
});
