// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { getVerbTenseSection } from "../../../src/infrastructure/verb-tenses-loader";
import FuturePracticePage from "./page";

afterEach(cleanup);

describe("FuturePracticePage", () => {
  it("presenta la práctica de Future con el conteo real y sin pista visual", () => {
    const section = getVerbTenseSection("future");
    render(<FuturePracticePage />);

    expect(screen.getByRole("heading", { name: "Future" })).not.toBeNull();
    expect(screen.getByText("Grammar practice · Future")).not.toBeNull();
    expect(
      screen.getByRole("link", { name: /All sections/ }).getAttribute("href"),
    ).toBe("/");
    expect(screen.getByText(`Card 1 of ${section.exercises.length}`)).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Show visual hint" })).toBeNull();
    expect(document.querySelector(".visual-hint")).toBeNull();
  });

  it("recorre una tarjeta completa: gap-fill, contexto y Reveal", () => {
    const section = getVerbTenseSection("future");
    const { container } = render(<FuturePracticePage />);
    const exercise = section.exercises[0];
    if (!exercise) throw new Error("La sección Future no tiene ejercicios");

    expect(screen.getByText(exercise.promptEn)).not.toBeNull();
    expect(container.textContent).not.toContain(exercise.modelEn);

    fireEvent.change(screen.getByLabelText("Type the missing words"), {
      target: { value: exercise.acceptedAnswers[0] ?? "" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(screen.getByText(`Correct: ${exercise.acceptedAnswers.join(" / ")}`)).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Show context hint" }));
    expect(document.querySelector(".book-page")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Reveal" }));
    expect(screen.getByText(exercise.modelEn)).not.toBeNull();
    expect(screen.getByText(exercise.translationEs)).not.toBeNull();
  });
});
