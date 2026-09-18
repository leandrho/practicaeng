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
  examples: [],
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
  examples: [],
};

const familyWithMissingForms: WordFamily = {
  base: "announce",
  level: "B1-B2",
  category: "A",
  noun: "announcement",
  meaningHintEn: "to make something public",
  meaningHint: "anunciar",
  examples: [],
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

  it("shows, hides, and resets the visual hint", () => {
    render(
      <WordFormationClient
        clearFiltersPath="/word-formation"
        families={[family, secondFamily]}
      />,
    );

    expect(screen.queryByRole("img", { name: "Pista visual animada" })).toBeNull();

    const hintButton = screen.getByRole("button", { name: "Show visual hint" });
    fireEvent.click(hintButton);

    expect(hintButton.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("img", { name: "Pista visual animada" })).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Hide visual hint" }));

    expect(screen.queryByRole("img", { name: "Pista visual animada" })).toBeNull();
    expect(hintButton.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(hintButton);
    fireEvent.click(screen.getByRole("button", { name: "Reveal family" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.queryByRole("img", { name: "Pista visual animada" })).toBeNull();
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
});
