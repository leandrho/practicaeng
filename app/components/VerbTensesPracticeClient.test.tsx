// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { VerbTenseExercise } from "../../src/domain/verb-tenses";
import { VerbTensesPracticeClient } from "./VerbTensesPracticeClient";

const first: VerbTenseExercise = {
  form: "Present Simple",
  promptEn: "Complete the routine: she / walk to school every day.",
  sentenceEn: "She ____ to school every day.",
  acceptedAnswers: ["walks"],
  modelEn: "She walks to school every day.",
  explanationEs: "El *present simple* expresa hábitos y la tercera persona lleva -s.",
  translationEs: "Ella camina a la escuela todos los días.",
  contextEn: '"Do you walk to school?" "Yes, I walk there every day with my brother."',
  contextSource: "Everyday conversation",
};

const second: VerbTenseExercise = {
  form: "Present Progressive",
  promptEn: "Describe what is happening now: she / work in the garden.",
  sentenceEn: "She ____ in the garden now.",
  acceptedAnswers: ["is working", "'s working"],
  modelEn: "She is working in the garden now.",
  explanationEs: "El *present progressive* con *now* describe una acción en curso.",
  translationEs: "Ella está trabajando en el jardín ahora.",
  contextEn: '"Where is she?" "She stays outside every afternoon and loves plants."',
  contextSource: "Everyday conversation",
};

afterEach(cleanup);

describe("VerbTensesPracticeClient", () => {
  it("muestra consigna y hueco sin modelo, explicación ni traducción en el DOM", () => {
    const { container } = render(<VerbTensesPracticeClient exercises={[first]} />);

    expect(screen.getByText(first.promptEn)).not.toBeNull();
    expect(screen.getByText(first.sentenceEn)).not.toBeNull();
    expect(screen.getByText("Present Simple")).not.toBeNull();
    expect(container.textContent).not.toContain(first.modelEn);
    expect(container.textContent).not.toContain("tercera persona lleva -s");
    expect(container.textContent).not.toContain(first.translationEs);
  });

  it("acepta todas las respuestas declaradas e ignora mayúsculas y espacios", () => {
    render(<VerbTensesPracticeClient exercises={[second]} />);
    const input = screen.getByLabelText("Type the missing words");

    fireEvent.change(input, { target: { value: "is working" } });
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(screen.getByText("Correct: is working / 's working")).not.toBeNull();

    fireEvent.change(input, { target: { value: "  'S WORKING " } });
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(screen.getByText("Correct: is working / 's working")).not.toBeNull();
  });

  it("rechaza formas ajenas a Answers", () => {
    render(<VerbTensesPracticeClient exercises={[first]} />);

    fireEvent.change(screen.getByLabelText("Type the missing words"), {
      target: { value: "walk" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Check" }));

    expect(screen.getByText("Not yet: try again.")).not.toBeNull();
  });

  it("comprueba con Enter dentro del input", () => {
    render(<VerbTensesPracticeClient exercises={[first]} />);
    const input = screen.getByLabelText("Type the missing words");

    fireEvent.change(input, { target: { value: "walks" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(screen.getByText("Correct: walks")).not.toBeNull();
  });

  it("no revela con Espacio en el input pero sí fuera de él", () => {
    const { container } = render(<VerbTensesPracticeClient exercises={[first]} />);
    const input = screen.getByLabelText("Type the missing words");

    fireEvent.keyDown(input, { key: " " });
    expect(container.textContent).not.toContain(first.modelEn);

    fireEvent.keyDown(window, { key: " " });
    expect(screen.getByText(first.modelEn)).not.toBeNull();
  });

  it("mantiene el contexto libro fuera del DOM hasta pulsar el botón cyan", () => {
    render(<VerbTensesPracticeClient exercises={[first]} />);

    expect(document.querySelector(".book-page")).toBeNull();

    const contextButton = screen.getByRole("button", { name: "Show context hint" });
    fireEvent.click(contextButton);

    expect(contextButton.getAttribute("aria-pressed")).toBe("true");
    expect(document.querySelector(".book-page")).not.toBeNull();
    expect(screen.getByText("Everyday conversation")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Hide context hint" }));
    expect(document.querySelector(".book-page")).toBeNull();
  });

  it("Reveal muestra modelo, explicación con cursiva y traducción", () => {
    const { container } = render(<VerbTensesPracticeClient exercises={[first]} />);

    fireEvent.click(screen.getByRole("button", { name: "Reveal" }));

    expect(screen.getByText(first.modelEn)).not.toBeNull();
    const explanation = container.querySelector(".answer-text[lang='es']");
    expect(explanation?.textContent).toBe(
      "El present simple expresa hábitos y la tercera persona lleva -s.",
    );
    expect(explanation?.querySelector("em[lang='en']")?.textContent).toBe("present simple");
    expect(screen.getByText(first.translationEs)).not.toBeNull();
  });

  it("al cambiar de tarjeta se resetea respuesta, contexto y revelado", () => {
    const { container } = render(
      <VerbTensesPracticeClient exercises={[first, second]} />,
    );

    fireEvent.change(screen.getByLabelText("Type the missing words"), {
      target: { value: "walks" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    fireEvent.click(screen.getByRole("button", { name: "Show context hint" }));
    fireEvent.click(screen.getByRole("button", { name: "Reveal" }));
    expect(screen.getByText(first.modelEn)).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByText("Card 2 of 2")).not.toBeNull();
    expect(screen.getByText(second.promptEn)).not.toBeNull();
    expect((screen.getByLabelText("Type the missing words") as HTMLInputElement).value).toBe("");
    expect(container.textContent).not.toContain(second.modelEn);
    expect(container.textContent).not.toContain(first.modelEn);
    expect(document.querySelector(".book-page")).toBeNull();
    expect(
      screen.getByRole("button", { name: "Show context hint" }).getAttribute("aria-pressed"),
    ).toBe("false");
    expect(screen.getByRole("button", { name: "Previous" }).hasAttribute("disabled")).toBe(false);
    expect(screen.getByRole("button", { name: "Next" }).hasAttribute("disabled")).toBe(true);
  });

  it("no ofrece pista visual en estas páginas", () => {
    render(<VerbTensesPracticeClient exercises={[first]} />);

    expect(screen.queryByRole("button", { name: "Show visual hint" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Hide visual hint" })).toBeNull();
    expect(document.querySelector(".visual-hint")).toBeNull();
    expect(document.querySelector(".flashcard__hint-panel")).toBeNull();
  });

  it("muestra un mensaje cuando no hay ejercicios", () => {
    render(<VerbTensesPracticeClient exercises={[]} />);
    expect(screen.getByText("No exercises available.")).not.toBeNull();
  });

  it("soporta ejercicios del pasado sin cambiar el formato", () => {
    const past: VerbTenseExercise = {
      form: "Past Simple",
      promptEn: "Complete the finished action: I / visit my grandmother yesterday.",
      sentenceEn: "I ____ my grandmother yesterday.",
      acceptedAnswers: ["visited"],
      modelEn: "I visited my grandmother yesterday.",
      explanationEs: "El *past simple* expresa acciones terminadas con referencia pasada.",
      translationEs: "Ayer visité a mi abuela.",
      contextEn: '"Did you see your grandmother?" "Yes, I visited her yesterday afternoon."',
      contextSource: "Everyday conversation",
    };
    const { container } = render(<VerbTensesPracticeClient exercises={[past]} />);

    expect(screen.getByText("Past Simple")).not.toBeNull();
    expect(container.textContent).not.toContain(past.modelEn);

    fireEvent.change(screen.getByLabelText("Type the missing words"), {
      target: { value: "visited" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(screen.getByText("Correct: visited")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Reveal" }));
    expect(screen.getByText(past.modelEn)).not.toBeNull();
  });

  it("soporta ejercicios del futuro sin cambiar el formato", () => {
    const future: VerbTenseExercise = {
      form: "Be going to",
      promptEn: "State your prior plan: I / make soup tonight.",
      sentenceEn: "I ____ make soup tonight.",
      acceptedAnswers: ["am going to"],
      modelEn: "I am going to make soup tonight.",
      explanationEs: "El *be going to* expresa una intención formada antes de hablar.",
      translationEs: "Voy a preparar sopa esta noche.",
      contextEn: '"What is for dinner?" "I bought vegetables, so the kitchen smells fresh already."',
      contextSource: "Everyday conversation",
    };
    const { container } = render(<VerbTensesPracticeClient exercises={[future]} />);

    expect(screen.getByText("Be going to")).not.toBeNull();
    expect(container.textContent).not.toContain(future.modelEn);

    fireEvent.change(screen.getByLabelText("Type the missing words"), {
      target: { value: "am going to" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(screen.getByText("Correct: am going to")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Reveal" }));
    expect(screen.getByText(future.modelEn)).not.toBeNull();
  });
});
