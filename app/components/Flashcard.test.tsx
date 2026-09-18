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

const fallbackCard: Card = {
  ...card,
  expression: "run into",
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

  it("keeps the recall prompt out of the card and the expression as h2", () => {
    render(<Flashcard cards={[card]} clearFiltersPath="/phrasal-verbs" />);

    expect(
      screen.queryByText("What does it mean? Think of an example with this expression."),
    ).toBeNull();
    expect(screen.getByRole("heading", { name: card.expression }).tagName).toBe("H2");

    fireEvent.click(screen.getByRole("button", { name: "Reveal" }));

    expect(
      screen.queryByText("What does it mean? Think of an example with this expression."),
    ).toBeNull();
    expect(screen.getByRole("heading", { name: card.expression }).tagName).toBe("H2");
  });

  it("shows, hides, and resets a photo hint without exposing answers", () => {
    render(<Flashcard cards={[card, secondCard]} clearFiltersPath="/phrasal-verbs" />);

    expect(screen.queryByAltText("Pista visual")).toBeNull();
    expect(screen.queryByText("Foto: David Rosen / CC BY 2.0")).toBeNull();
    expect(screen.queryByText(card.meaningEs)).toBeNull();
    expect(screen.queryByText(card.exampleEn)).toBeNull();
    expect(screen.queryByText(card.translationEs!)).toBeNull();

    const hintButton = screen.getByRole("button", { name: "Show visual hint" });
    fireEvent.click(hintButton);

    expect(hintButton.getAttribute("aria-pressed")).toBe("true");
    const photo = screen.getByAltText("Pista visual");
    expect(photo.getAttribute("alt")).toBe("Pista visual");
    expect(photo.getAttribute("alt")).not.toContain(card.meaningEs);
    expect(photo.getAttribute("alt")).not.toContain(card.exampleEn);
    expect(photo.getAttribute("alt")).not.toContain(card.translationEs!);
    expect(screen.getByText("Foto: David Rosen / CC BY 2.0")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Hide visual hint" }));

    expect(screen.queryByAltText("Pista visual")).toBeNull();
    expect(screen.queryByText("Foto: David Rosen / CC BY 2.0")).toBeNull();
    expect(hintButton.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(hintButton);
    fireEvent.click(screen.getByRole("button", { name: "Reveal" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.queryByAltText("Pista visual")).toBeNull();
    expect(screen.getByRole("button", { name: "Show visual hint" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("keeps the SVG fallback for expressions without a curated photo", () => {
    render(<Flashcard cards={[fallbackCard]} clearFiltersPath="/phrasal-verbs" />);

    fireEvent.click(screen.getByRole("button", { name: "Show visual hint" }));

    expect(screen.getByRole("img", { name: "Pista visual animada" })).not.toBeNull();
    expect(screen.queryByAltText("Pista visual")).toBeNull();
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
