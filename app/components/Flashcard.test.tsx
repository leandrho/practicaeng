// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { Card } from "../../src/domain/card";
import { Flashcard } from "./Flashcard";

const card: Card = {
  expression: "give up",
  type: "phrasal-verb",
  level: "B1-B2",
  meaningEn: "to stop trying",
  meaningEs: "rendirse",
  exampleEn: "Don't give up.",
  translationEs: "No te rindas.",
  category: "general",
  sourceFile: "data/phrasal-verbs-b1-b2-200.md",
};

const secondCard: Card = {
  ...card,
  expression: "take off",
  meaningEn: "to leave the ground and begin flying",
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

  it("shows, hides, and resets the visual hint", () => {
    render(<Flashcard cards={[card, secondCard]} clearFiltersPath="/phrasal-verbs" />);

    expect(screen.queryByRole("img", { name: "Pista visual animada" })).toBeNull();

    const hintButton = screen.getByRole("button", { name: "Show visual hint" });
    fireEvent.click(hintButton);

    expect(hintButton.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("img", { name: "Pista visual animada" })).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Hide visual hint" }));

    expect(screen.queryByRole("img", { name: "Pista visual animada" })).toBeNull();
    expect(hintButton.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(hintButton);
    fireEvent.click(screen.getByRole("button", { name: "Reveal" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.queryByRole("img", { name: "Pista visual animada" })).toBeNull();
    expect(screen.getByRole("button", { name: "Show visual hint" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("switches the complete explanation between English and Spanish", () => {
    render(<Flashcard cards={[card]} clearFiltersPath="/phrasal-verbs" />);

    fireEvent.click(screen.getByRole("button", { name: "Reveal" }));

    expect(screen.getByText(card.meaningEn)).not.toBeNull();
    expect(screen.getByText(card.exampleEn)).not.toBeNull();
    expect(screen.queryByText(card.meaningEs)).toBeNull();
    expect(screen.queryByText(card.translationEs!)).toBeNull();

    const esButton = screen.getByRole("button", { name: "Show Spanish translation" });
    fireEvent.click(esButton);

    expect(esButton.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText(card.meaningEs)).not.toBeNull();
    expect(screen.getByText(card.translationEs)).not.toBeNull();
    expect(screen.getByText("Meaning:")).not.toBeNull();
    expect(screen.getByText("Example:")).not.toBeNull();
    expect(screen.queryByText(card.meaningEn)).toBeNull();
    expect(screen.queryByText(card.exampleEn)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Show English explanation" }));

    expect(screen.queryByText(card.meaningEs)).toBeNull();
    expect(screen.queryByText(card.translationEs)).toBeNull();
    expect(screen.getByText(card.meaningEn)).not.toBeNull();
    expect(screen.getByText(card.exampleEn)).not.toBeNull();
    expect(esButton.getAttribute("aria-pressed")).toBe("false");
  });

  it("navigates with buttons and shortcuts without exceeding boundaries", () => {
    render(<Flashcard cards={[card, secondCard]} clearFiltersPath="/phrasal-verbs" />);

    fireEvent.keyDown(window, { key: "ArrowLeft" });
    fireEvent.keyDown(window, { key: " " });
    expect((screen.getByRole("button", { name: "Previous" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Show Spanish translation" }));

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText(secondCard.expression)).not.toBeNull();
    expect(screen.queryByText(secondCard.meaningEn)).toBeNull();
    expect(screen.queryByText(secondCard.meaningEs)).toBeNull();

    fireEvent.keyDown(window, { key: " " });
    expect(screen.getByText(secondCard.meaningEn)).not.toBeNull();
    expect(screen.queryByText(secondCard.meaningEs)).toBeNull();
    expect(screen.getByRole("button", { name: "Show Spanish translation" }).getAttribute("aria-pressed")).toBe(
      "false",
    );
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
