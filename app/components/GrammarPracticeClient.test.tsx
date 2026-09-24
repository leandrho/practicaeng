// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { GrammarExercise } from "../../src/domain/grammar";
import { GrammarPracticeClient } from "./GrammarPracticeClient";

afterEach(cleanup);

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

describe("GrammarPracticeClient", () => {
  it("oculta respuestas hasta Reveal y vuelve a ocultarlas al navegar en ambos sentidos", () => {
    const { container } = render(
      <GrammarPracticeClient exercises={exercises} part={1} slug="comparisons" />,
    );
    expect(screen.getByText("Ask about a daily routine.")).not.toBeNull();
    expect(container.textContent).not.toContain(exercises[0].modelEn);
    expect(container.textContent).not.toContain(exercises[0].explanationEs);
    expect(container.textContent).not.toContain(exercises[0].translationEs);
    expect(screen.getByRole("button", { name: "Previous" }).hasAttribute("disabled")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Reveal" }));
    expect(screen.getByText(exercises[0].modelEn)).not.toBeNull();
    const explanation = container.querySelector(".answer-text[lang='es']");
    expect(explanation?.textContent).toBe("El present simple expresa hábitos.");
    expect(explanation?.querySelector("em[lang='en']")?.textContent).toBe("present simple");
    expect(screen.getByText(exercises[0].translationEs)).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Card 2 of 2")).not.toBeNull();
    expect(screen.getByText(exercises[1].promptEn)).not.toBeNull();
    expect(container.textContent).not.toContain(exercises[1].modelEn);
    expect(container.textContent).not.toContain(exercises[0].modelEn);
    expect(screen.getByRole("button", { name: "Next" }).hasAttribute("disabled")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(screen.getByText("Card 1 of 2")).not.toBeNull();
    expect(container.textContent).not.toContain(exercises[0].modelEn);
    expect(screen.getByRole("button", { name: "Reveal" })).not.toBeNull();
  });
});
