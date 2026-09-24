// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { WordFamily } from "../../src/domain/word-formation";
import WordFormationClient from "./WordFormationClient";

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

const secondFamily: WordFamily = {
  base: "act",
  level: "B1-B2",
  category: "A",
  noun: "action",
  adjective: "active",
  adverb: "actively",
  meaningHintEn: "to do something",
  meaningHint: "actuar",
  contextEn: '"We must act now," he whispered when the lights went out during the school play.',
  contextSource: "Everyday conversation",
  examples: [],
  exercise: {
    target: "noun",
    sentenceEn: "The committee took immediate ____.",
    acceptedAnswers: ["action"],
  },
};

const familyWithMissingForms: WordFamily = {
  base: "announce",
  level: "B1-B2",
  category: "A",
  noun: "announcement",
  meaningHintEn: "to make something public",
  meaningHint: "anunciar",
  contextEn: '"We must announce the news today," she said. Everyone waited in silence.',
  contextSource: "Everyday conversation",
  examples: [],
  exercise: {
    target: "noun",
    sentenceEn: "They will make an ____ on Friday.",
    acceptedAnswers: ["announcement"],
  },
};

// Bases inexistentes en data/ y en curated.ts: ejercen la rama fallback.
const fallbackFamily: WordFamily = {
  base: "zzfallback",
  level: "B1-B2",
  category: "A",
  noun: "zzfallbackness",
  meaningHintEn: "to do something uncurated",
  meaningHint: "hacer algo no curado",
  contextEn: '"We must zzfallback now," he said. There was no time to wait.',
  contextSource: "Everyday conversation",
  examples: [],
  exercise: {
    target: "noun",
    sentenceEn: "It was a clear ____.",
    acceptedAnswers: ["zzfallbackness"],
  },
};

const secondFallbackFamily: WordFamily = {
  base: "zzsecond",
  level: "B1-B2",
  category: "A",
  noun: "zzsecondness",
  meaningHintEn: "to do another uncurated thing",
  meaningHint: "hacer otra cosa no curada",
  contextEn: '"We must zzsecond now," she said. There was no time to wait.',
  contextSource: "Everyday conversation",
  examples: [],
  exercise: {
    target: "noun",
    sentenceEn: "It was another ____.",
    acceptedAnswers: ["zzsecondness"],
  },
};

const twoVariantFamily: WordFamily = {
  base: "apply",
  level: "B1-B2",
  category: "A",
  noun: "application / applicant",
  adjective: "applicable",
  meaningHintEn: "to request",
  meaningHint: "solicitar",
  contextEn: '"You must apply early," he said. There is no time to wait.',
  contextSource: "Everyday conversation",
  examples: [],
  exercise: {
    target: "noun",
    sentenceEn: "She submitted her ____ yesterday.",
    acceptedAnswers: ["application", "applicant"],
  },
};

afterEach(cleanup);

describe("WordFormationClient", () => {
  it("shows the base without forms before reveal", () => {
    render(<WordFormationClient clearFiltersPath="/word-formation" families={[family]} />);

    expect(screen.getByRole("heading", { name: "DECIDE" })).not.toBeNull();
    expect(screen.queryByText("decision")).toBeNull();
    expect(screen.queryByText("decisive")).toBeNull();
    expect(screen.queryByText("decisively")).toBeNull();
  });

  it("keeps the produce prompt out of the card and the base as h2", () => {
    render(<WordFormationClient clearFiltersPath="/word-formation" families={[family]} />);

    expect(screen.queryByText("Produce: noun / adjective / adverb.")).toBeNull();
    expect(screen.getByRole("heading", { name: "DECIDE" }).tagName).toBe("H2");

    fireEvent.click(screen.getByRole("button", { name: "Reveal family" }));

    expect(screen.queryByText("Produce: noun / adjective / adverb.")).toBeNull();
    expect(screen.getByRole("heading", { name: "DECIDE" }).tagName).toBe("H2");
  });

  it("shows, hides, and resets the fallback SVG hint", () => {
    render(
      <WordFormationClient
        clearFiltersPath="/word-formation"
        families={[fallbackFamily, secondFallbackFamily]}
      />,
    );

    expect(screen.queryByRole("img", { name: "Pista visual animada" })).toBeNull();
    expect(screen.queryByAltText("Pista visual")).toBeNull();

    const hintButton = screen.getByRole("button", { name: "Show visual hint" });
    fireEvent.click(hintButton);

    expect(hintButton.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("img", { name: "Pista visual animada" })).not.toBeNull();
    expect(screen.queryByAltText("Pista visual")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Hide visual hint" }));

    expect(screen.queryByRole("img", { name: "Pista visual animada" })).toBeNull();
    expect(screen.queryByAltText("Pista visual")).toBeNull();
    expect(hintButton.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(hintButton);
    fireEvent.click(screen.getByRole("button", { name: "Reveal family" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.queryByRole("img", { name: "Pista visual animada" })).toBeNull();
    expect(screen.queryByAltText("Pista visual")).toBeNull();
    expect(screen.getByRole("button", { name: "Show visual hint" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("reports when the answer is correct", () => {
    render(<WordFormationClient clearFiltersPath="/word-formation" families={[family]} />);

    fireEvent.change(screen.getByLabelText(/complete with the correct form/i), {
      target: { value: "decision" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Check" }));

    expect(screen.getByText("Correct: decision")).not.toBeNull();
  });

  it("reports when the answer is incorrect", () => {
    render(<WordFormationClient clearFiltersPath="/word-formation" families={[family]} />);

    fireEvent.change(screen.getByLabelText(/complete with the correct form/i), {
      target: { value: "decisions" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Check" }));

    expect(screen.getByText("Not yet: try again.")).not.toBeNull();
  });

  it("resets the front when changing family", () => {
    render(
      <WordFormationClient
        clearFiltersPath="/word-formation"
        families={[family, secondFamily]}
      />,
    );

    fireEvent.change(screen.getByLabelText(/complete with the correct form/i), {
      target: { value: "decision" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    fireEvent.click(screen.getByRole("button", { name: "Reveal family" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("");
    expect(screen.queryByText("Correct: decision")).toBeNull();
    expect(screen.queryByText("action")).toBeNull();
  });

  it("checks with Enter in the input", () => {
    render(<WordFormationClient clearFiltersPath="/word-formation" families={[family]} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "decision" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(screen.getByText("Correct: decision")).not.toBeNull();
  });

  it("does not reveal when Space is used in the input", () => {
    render(<WordFormationClient clearFiltersPath="/word-formation" families={[family]} />);

    const input = screen.getByRole("textbox");
    expect(fireEvent.keyDown(input, { key: " " })).toBe(true);
    fireEvent.change(input, { target: { value: " " } });

    expect((input as HTMLInputElement).value).toBe(" ");
    expect(screen.queryByText("Noun:")).toBeNull();
  });

  it("reveals with Space outside the input", () => {
    render(<WordFormationClient clearFiltersPath="/word-formation" families={[family]} />);

    fireEvent.keyDown(window, { key: " " });

    expect(screen.getByText("Noun:")).not.toBeNull();
    expect(screen.getByText("decision")).not.toBeNull();
    expect(screen.getByText("decisive")).not.toBeNull();
    expect(screen.getByText("decisively")).not.toBeNull();
  });

  it("switches Hint between English and Spanish", () => {
    render(<WordFormationClient clearFiltersPath="/word-formation" families={[family]} />);

    fireEvent.click(screen.getByRole("button", { name: "Reveal family" }));

    expect(screen.getByText(family.meaningHintEn)).not.toBeNull();
    expect(screen.queryByText(family.meaningHint)).toBeNull();

    const esButton = screen.getByRole("button", { name: "Show Spanish translation" });
    fireEvent.click(esButton);

    expect(esButton.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText(family.meaningHint)).not.toBeNull();
    expect(screen.queryByText(family.meaningHintEn)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Show English explanation" }));

    expect(screen.queryByText(family.meaningHint)).toBeNull();
    expect(screen.getByText(family.meaningHintEn)).not.toBeNull();
    expect(esButton.getAttribute("aria-pressed")).toBe("false");
  });

  it("resets ES when changing family", () => {
    render(
      <WordFormationClient
        clearFiltersPath="/word-formation"
        families={[family, secondFamily]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Reveal family" }));
    fireEvent.click(screen.getByRole("button", { name: "Show Spanish translation" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Reveal family" }));

    expect(screen.getByText(secondFamily.meaningHintEn)).not.toBeNull();
    expect(screen.queryByText(secondFamily.meaningHint)).toBeNull();
    expect(screen.getByRole("button", { name: "Show Spanish translation" }).getAttribute("aria-pressed")).toBe(
      "false",
    );
  });

  it("shows missing forms as dashes when revealed", () => {
    render(
      <WordFormationClient
        clearFiltersPath="/word-formation"
        families={[familyWithMissingForms]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Reveal family" }));

    expect(screen.getByText("announcement")).not.toBeNull();
    expect(screen.getAllByText("—")).toHaveLength(2);
  });

  it("shows the empty filters state and allows clearing them", () => {
    render(<WordFormationClient clearFiltersPath="/word-formation" families={[]} />);

    expect(screen.getByText("No cards match these filters.")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Clear filters" })).not.toBeNull();
  });

  it("keeps the book context out of the DOM until the cyan button is pressed", () => {
    render(<WordFormationClient clearFiltersPath="/word-formation" families={[family]} />);

    expect(document.querySelector(".book-page")).toBeNull();
    expect(screen.queryByText(family.meaningHint)).toBeNull();

    const contextButton = screen.getByRole("button", { name: "Show context hint" });
    fireEvent.click(contextButton);

    expect(contextButton.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Hide context hint" })).not.toBeNull();
    expect(document.querySelector(".book-page")).not.toBeNull();
    expect(document.querySelector(".book-page mark")).not.toBeNull();
    expect(screen.getByText("Everyday conversation")).not.toBeNull();
    expect(screen.queryByText(family.meaningHint)).toBeNull();
  });

  it("hides the book context when pressed again", () => {
    render(<WordFormationClient clearFiltersPath="/word-formation" families={[family]} />);

    fireEvent.click(screen.getByRole("button", { name: "Show context hint" }));
    fireEvent.click(screen.getByRole("button", { name: "Hide context hint" }));

    expect(document.querySelector(".book-page")).toBeNull();
    expect(
      screen.getByRole("button", { name: "Show context hint" }).getAttribute("aria-pressed"),
    ).toBe("false");
  });

  it("resets the book context when changing family", () => {
    render(
      <WordFormationClient
        clearFiltersPath="/word-formation"
        families={[family, secondFamily]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Show context hint" }));
    expect(document.querySelector(".book-page")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(document.querySelector(".book-page")).toBeNull();
    expect(
      screen.getByRole("button", { name: "Show context hint" }).getAttribute("aria-pressed"),
    ).toBe("false");
  });

  it("keeps visual hint and book context independent", () => {
    render(
      <WordFormationClient
        clearFiltersPath="/word-formation"
        families={[fallbackFamily, secondFallbackFamily]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Show visual hint" }));
    fireEvent.click(screen.getByRole("button", { name: "Show context hint" }));

    expect(screen.getByRole("img", { name: "Pista visual animada" })).not.toBeNull();
    expect(document.querySelector(".book-page")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Hide visual hint" }));

    expect(screen.queryByRole("img", { name: "Pista visual animada" })).toBeNull();
    expect(document.querySelector(".book-page")).not.toBeNull();
  });

  it("shows the exercise sentence and target before reveal without answers", () => {
    render(<WordFormationClient clearFiltersPath="/word-formation" families={[family]} />);

    expect(screen.getByText("She made an important ____ yesterday.")).not.toBeNull();
    expect(screen.getAllByText(/noun/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("decision")).toBeNull();
  });

  it("accepts any declared answer and rejects other-category forms", () => {
    render(
      <WordFormationClient clearFiltersPath="/word-formation" families={[twoVariantFamily]} />,
    );

    const input = screen.getByLabelText(/complete with the correct form/i);

    fireEvent.change(input, { target: { value: "application" } });
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(screen.getByText("Correct: application / applicant")).not.toBeNull();

    fireEvent.change(input, { target: { value: "APPLICANT" } });
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(screen.getByText("Correct: application / applicant")).not.toBeNull();

    fireEvent.change(input, { target: { value: "applicable" } });
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(screen.getByText("Not yet: try again.")).not.toBeNull();
  });

  it("shows a message when the family has no exercise", () => {
    const withoutExercise = { ...family } as unknown as Record<string, unknown>;
    delete withoutExercise.exercise;

    render(
      <WordFormationClient
        clearFiltersPath="/word-formation"
        families={[withoutExercise as unknown as WordFamily]}
      />,
    );

    expect(screen.getByText("This family has no exercises available.")).not.toBeNull();
  });

  it("shows an icon at the end of correct and incorrect feedback", () => {
    render(<WordFormationClient clearFiltersPath="/word-formation" families={[family]} />);

    expect(document.querySelector(".feedback-icon")).toBeNull();

    const input = screen.getByLabelText(/complete with the correct form/i);
    fireEvent.change(input, { target: { value: "decision" } });
    fireEvent.click(screen.getByRole("button", { name: "Check" }));

    const correctRow = document.querySelector(".feedback--correct");
    expect(correctRow).not.toBeNull();
    const correctIcon = correctRow?.querySelector(".feedback-icon--correct");
    expect(correctIcon).not.toBeNull();
    expect(correctIcon?.tagName).toBe("svg");
    expect(correctRow?.firstElementChild?.tagName).toBe("svg");
    expect(correctRow?.textContent).toContain("Correct:");
    expect(
      (correctIcon?.querySelector("circle")?.getAttribute("fill") ?? "").toLowerCase(),
    ).toBe("#16a34a");

    fireEvent.change(input, { target: { value: "decisions" } });
    fireEvent.click(screen.getByRole("button", { name: "Check" }));

    expect(document.querySelector(".feedback--correct")).toBeNull();
    const incorrectRow = document.querySelector(".feedback--incorrect");
    expect(incorrectRow).not.toBeNull();
    const incorrectIcon = incorrectRow?.querySelector(".feedback-icon--incorrect");
    expect(incorrectIcon).not.toBeNull();
    expect(incorrectIcon?.tagName).toBe("svg");
    expect(incorrectRow?.firstElementChild?.tagName).toBe("svg");
    expect(incorrectRow?.textContent).toContain("Not yet:");
    expect(
      (incorrectIcon?.querySelector("circle")?.getAttribute("fill") ?? "").toLowerCase(),
    ).toBe("#dc2626");
  });
});
