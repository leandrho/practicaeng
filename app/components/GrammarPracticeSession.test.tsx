// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ComponentProps } from "react";
import type { GrammarExercise } from "../../src/domain/grammar";
import { PRACTICE_STORAGE_KEY } from "../../src/infrastructure/ui/practice-storage";
import { GrammarPracticeClient } from "./GrammarPracticeClient";

function makeExercise(
  promptEn: string,
  overrides: Partial<GrammarExercise> = {},
): GrammarExercise {
  return {
    promptEn,
    modelEn: `Model for ${promptEn}.`,
    explanationEs: `Explicación de ${promptEn}.`,
    translationEs: `Traducción de ${promptEn}.`,
    ...overrides,
  };
}

function deck(size: number, start = 0): GrammarExercise[] {
  return Array.from({ length: size }, (_, offset) =>
    makeExercise(`prompt-${String(start + offset).padStart(2, "0")}`),
  );
}

afterEach(cleanup);

beforeEach(() => {
  localStorage.clear();
});

function renderSession(
  props: Partial<ComponentProps<typeof GrammarPracticeClient>> & {
    exercises: GrammarExercise[];
  },
) {
  return render(
    <GrammarPracticeClient part={1} slug="comparisons" {...props} />,
  );
}

function revealAndRate(label: "I knew it" | "Almost" | "I didn't know") {
  fireEvent.click(screen.getByRole("button", { name: "Reveal" }));
  fireEvent.click(screen.getByRole("button", { name: label }));
}

function summaryCount(label: string): number {
  const items = screen.getAllByRole("listitem");
  const item = items.find((element) => element.textContent?.startsWith(label));
  expect(item).not.toBeUndefined();
  return Number(item?.querySelector("strong")?.textContent ?? NaN);
}

describe("SPEC 32 — sesiones y repaso de Grammar", () => {
  it("practica hasta 10 ejercicios en el orden existente del tema", () => {
    renderSession({ exercises: deck(12), route: "/grammar-limit" });

    expect(screen.getByText("Card 1 of 10")).not.toBeNull();
    expect(screen.getByText("prompt-00")).not.toBeNull();
  });

  it("conserva temas con menos de 10 ejercicios completos", () => {
    renderSession({ exercises: deck(5), route: "/grammar-short" });

    expect(screen.getByText("Card 1 of 5")).not.toBeNull();
  });

  it("pide Reveal antes de autoevaluar y Skip no revela", () => {
    renderSession({ exercises: deck(2), route: "/grammar-reveal-skip" });

    expect(screen.queryByText("Model for prompt-00.")).toBeNull();
    expect(screen.queryByRole("button", { name: "I knew it" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Almost" })).toBeNull();
    expect(screen.queryByRole("button", { name: "I didn't know" })).toBeNull();
    expect(screen.getByRole("button", { name: "Skip" })).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Reveal" }));

    expect(screen.getByText("Model for prompt-00.")).not.toBeNull();
    expect(screen.getByRole("button", { name: "I knew it" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Almost" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "I didn't know" })).not.toBeNull();
  });

  it("Skip deja el ejercicio pendiente sin mostrar el modelo", () => {
    renderSession({ exercises: deck(2), route: "/grammar-skip" });

    fireEvent.click(screen.getByRole("button", { name: "Skip" }));

    expect(screen.getByText("Card 2 of 2")).not.toBeNull();
    expect(screen.queryByText("Model for prompt-00.")).toBeNull();
    expect(screen.queryByText("Model for prompt-01.")).toBeNull();

    revealAndRate("I knew it");

    expect(screen.getByText("Session summary")).not.toBeNull();
    expect(summaryCount("Skipped:")).toBe(1);
    expect(summaryCount("I knew it:")).toBe(1);
    expect(screen.getByText("1 pending for review.")).not.toBeNull();
  });

  it("Previous oculta el modelo y la última evaluación es la vigente", () => {
    renderSession({ exercises: deck(2), route: "/grammar-prev" });

    revealAndRate("I knew it");
    expect(screen.getByText("Card 2 of 2")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Previous" }));

    expect(screen.getByText("Card 1 of 2")).not.toBeNull();
    expect(screen.queryByText("Model for prompt-00.")).toBeNull();

    revealAndRate("Almost");
    revealAndRate("I knew it");

    expect(screen.getByText("Session summary")).not.toBeNull();
    expect(summaryCount("I knew it:")).toBe(1);
    expect(summaryCount("Almost:")).toBe(1);
  });

  it("el resumen cuenta resultados y el repaso vuelve solo con pendientes", () => {
    renderSession({ exercises: deck(3), route: "/grammar-review" });

    revealAndRate("I knew it");
    revealAndRate("Almost");
    revealAndRate("I didn't know");

    expect(screen.getByText("Session summary")).not.toBeNull();
    expect(summaryCount("I knew it:")).toBe(1);
    expect(summaryCount("Almost:")).toBe(1);
    expect(summaryCount("I didn't know:")).toBe(1);

    fireEvent.click(screen.getByRole("button", { name: "Review pending (2)" }));
    expect(screen.getByText("Review card 1 of 2")).not.toBeNull();

    revealAndRate("Almost");
    revealAndRate("I knew it");

    // Tras la ronda vuelve al resumen con resultados actualizados.
    expect(screen.getByText("Session summary")).not.toBeNull();
    expect(summaryCount("I knew it:")).toBe(2);
    expect(summaryCount("Almost:")).toBe(1);
    expect(screen.getByRole("button", { name: "Review pending (1)" })).not.toBeNull();
  });

  it("sin pendientes no ofrece repaso", () => {
    renderSession({ exercises: deck(2), route: "/grammar-no-pending" });

    revealAndRate("I knew it");
    revealAndRate("I knew it");

    expect(screen.getByText("Session summary")).not.toBeNull();
    expect(screen.getByText("No pending cards. Nice work!")).not.toBeNull();
    expect(screen.queryByRole("button", { name: /Review pending/ })).toBeNull();
  });

  it("recargar restaura índice, fase y resultados con el modelo oculto", () => {
    const props = {
      exercises: deck(3),
      route: "/grammar-reload",
    } as const;
    renderSession({ ...props });
    revealAndRate("I knew it");
    expect(screen.getByText("Card 2 of 3")).not.toBeNull();

    cleanup();
    renderSession({ ...props });

    expect(screen.getByText("Card 2 of 3")).not.toBeNull();
    expect(screen.queryByText("Model for prompt-01.")).toBeNull();

    const stored = JSON.parse(
      localStorage.getItem(PRACTICE_STORAGE_KEY) ?? "{}",
    ) as { sessions?: Record<string, { index?: number }> };
    expect(stored.sessions?.["/grammar-reload"]?.index).toBe(1);
  });

  it("mantiene una sesión independiente por ruta", () => {
    renderSession({
      exercises: deck(3),
      part: 1,
      slug: "comparisons",
      route: "/grammar/parte-1/comparisons",
    });
    revealAndRate("I knew it");
    expect(screen.getByText("Card 2 of 3")).not.toBeNull();
    cleanup();

    renderSession({
      exercises: deck(3),
      part: 1,
      slug: "stative-verbs",
      route: "/grammar/parte-1/stative-verbs",
    });
    expect(screen.getByText("Card 1 of 3")).not.toBeNull();
    cleanup();

    renderSession({
      exercises: deck(3),
      part: 1,
      slug: "comparisons",
      route: "/grammar/parte-1/comparisons",
    });
    expect(screen.getByText("Card 2 of 3")).not.toBeNull();
  });

  it("descarta solo la sesión afectada si un ejercicio cambió", () => {
    const original = deck(2);
    renderSession({ exercises: original, route: "/grammar-stale" });
    revealAndRate("I knew it");
    expect(screen.getByText("Card 2 of 2")).not.toBeNull();
    cleanup();

    const edited = [
      { ...original[0]!, modelEn: "Edited model." },
      original[1]!,
    ];
    renderSession({ exercises: edited, route: "/grammar-stale" });

    // La huella cambió: sesión nueva desde el primer ejercicio.
    expect(screen.getByText("Card 1 of 2")).not.toBeNull();
  });

  it("no mezcla ejercicios de temas distintos", () => {
    const comparisons = deck(2);
    renderSession({
      exercises: comparisons,
      part: 1,
      slug: "comparisons",
      route: "/grammar-no-mix",
    });

    expect(screen.getByText("prompt-00")).not.toBeNull();
    expect(screen.queryByText("prompt-99")).toBeNull();
    // Sin campo de escritura ni verificación automática: solo Reveal/Skip.
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("navega con el teclado y mantiene el modelo oculto al volver", () => {
    renderSession({ exercises: deck(2), route: "/grammar-keyboard" });

    fireEvent.keyDown(window, { key: " " });
    expect(screen.getByText("Model for prompt-00.")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "I knew it" }));
    expect(screen.getByText("Card 2 of 2")).not.toBeNull();

    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(screen.getByText("Card 1 of 2")).not.toBeNull();
    expect(screen.queryByText("Model for prompt-00.")).toBeNull();
  });

  it("muestra el estado vacío sin ejercicios", () => {
    renderSession({ exercises: [], route: "/grammar-empty" });

    expect(screen.getByText("No exercises available for this topic.")).not.toBeNull();
  });

  it("el resumen permite empezar otra sesión", () => {
    renderSession({ exercises: deck(2), route: "/grammar-new" });

    revealAndRate("I knew it");
    revealAndRate("I knew it");

    fireEvent.click(screen.getByRole("button", { name: "Start new session" }));

    expect(screen.getByText("Card 1 of 2")).not.toBeNull();
  });
});
