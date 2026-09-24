// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { Card } from "../../src/domain/card";
import type { GrammarExercise } from "../../src/domain/grammar";
import type { WordFamily } from "../../src/domain/word-formation";
import { Flashcard } from "./Flashcard";
import { GrammarPracticeClient } from "./GrammarPracticeClient";
import WordFormationClient from "./WordFormationClient";

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
  contextEn: '"Are you ready?" "Give me a minute, I don\'t want to give up now."',
  contextSource: "Everyday conversation",
  tags: [],
};

const secondCard: Card = { ...card, expression: "take off" };

const family: WordFamily = {
  base: "decide",
  level: "B1-B2",
  category: "D",
  noun: "decision",
  adjective: "decisive",
  adverb: "decisively",
  meaningHintEn: "to make a choice",
  meaningHint: "decidir",
  contextEn: '"We must decide now," she said, looking at the two roads ahead. There was no time to wait.',
  contextSource: "Everyday conversation",
  examples: [],
  exercise: {
    target: "noun",
    sentenceEn: "She made an important ____ yesterday.",
    acceptedAnswers: ["decision"],
  },
};

const exercises: [GrammarExercise, GrammarExercise] = [
  {
    promptEn: "Ask about a daily routine.",
    modelEn: "She walks to work.",
    explanationEs: "El *present simple* expresa hábitos.",
    translationEs: "Ella camina al trabajo.",
  },
  {
    promptEn: "Describe an action happening now.",
    modelEn: "She is walking now.",
    explanationEs: "El progressive expresa acciones en curso.",
    translationEs: "Ella está caminando ahora.",
  },
];

afterEach(cleanup);

describe("SPEC 29 — atajos de práctica", () => {
  it("Space sobre Reveal enfocado no revela por el atajo global; en contenido sí", () => {
    render(<Flashcard cards={[card]} clearFiltersPath="/phrasal-verbs" />);

    const revealButton = screen.getByRole("button", { name: "Reveal" });
    fireEvent.keyDown(revealButton, { key: " " });
    expect(screen.queryByText(card.meaningEn)).toBeNull();

    fireEvent.keyDown(window, { key: " " });
    expect(screen.getByText(card.meaningEn)).not.toBeNull();
  });

  it("Flechas sobre un botón enfocado no navegan; en contenido sí", () => {
    render(
      <Flashcard cards={[card, secondCard]} clearFiltersPath="/phrasal-verbs" />,
    );

    const nextButton = screen.getByRole("button", { name: "Next" });
    fireEvent.keyDown(nextButton, { key: "ArrowRight" });
    expect(screen.getByText(card.expression)).not.toBeNull();
    expect(screen.queryByText(secondCard.expression)).toBeNull();

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByText(secondCard.expression)).not.toBeNull();
  });

  it("Space en diálogo abierto no revela la tarjeta", () => {
    render(<Flashcard cards={[card]} clearFiltersPath="/phrasal-verbs" />);

    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("data-open", "true");
    dialog.innerHTML = "<button>Close</button>";
    document.body.append(dialog);

    fireEvent.keyDown(window, { key: " " });
    expect(screen.queryByText(card.meaningEn)).toBeNull();

    dialog.remove();
    fireEvent.keyDown(window, { key: " " });
    expect(screen.getByText(card.meaningEn)).not.toBeNull();
  });

  it("Word Formation: Space sobre Check enfocado no revela; fuera del input sí", () => {
    render(
      <WordFormationClient clearFiltersPath="/word-formation" families={[family]} />,
    );

    const checkButton = screen.getByRole("button", { name: "Check" });
    fireEvent.keyDown(checkButton, { key: " " });
    expect(screen.queryByText("Noun:")).toBeNull();

    const input = screen.getByRole("textbox");
    fireEvent.keyDown(input, { key: " " });
    expect(screen.queryByText("Noun:")).toBeNull();

    fireEvent.keyDown(window, { key: " " });
    expect(screen.getByText("Noun:")).not.toBeNull();
  });

  it("Grammar mantiene interacción por botones sin atajos globales", () => {
    render(<GrammarPracticeClient exercises={exercises} />);

    fireEvent.keyDown(window, { key: " " });
    expect(screen.queryByText(exercises[0].modelEn)).toBeNull();

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByText(exercises[0].promptEn)).not.toBeNull();
    expect(screen.queryByText(exercises[1].promptEn)).toBeNull();

    fireEvent.keyDown(screen.getByRole("button", { name: "Reveal" }), {
      key: " ",
    });
    expect(screen.queryByText(exercises[0].modelEn)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Reveal" }));
    expect(screen.getByText(exercises[0].modelEn)).not.toBeNull();
  });
});
