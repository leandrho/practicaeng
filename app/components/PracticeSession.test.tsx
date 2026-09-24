// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import type { Card } from "../../src/domain/card";
import { PRACTICE_STORAGE_KEY } from "../../src/infrastructure/ui/practice-storage";
import { SectionPracticeClient } from "./SectionPracticeClient";
import { FilterDrawerProvider, HeaderFilterButton } from "./FilterDrawerProvider";

const paramsState = vi.hoisted(() => ({ query: "", push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(paramsState.query),
  useRouter: () => ({ push: paramsState.push }),
}));

function makeCard(
  expression: string,
  overrides: Partial<Card> = {},
): Card {
  return {
    expression,
    type: "collocation",
    level: "B1-B2",
    meaningEn: `meaning of ${expression}`,
    meaningEs: `significado de ${expression}`,
    exampleEn: `Example with ${expression}.`,
    translationEs: `Ejemplo con ${expression}.`,
    category: "general",
    sourceFile: "fixture.md",
    contextEn: `"Context for ${expression}," she said.`,
    contextSource: "Everyday conversation",
    tags: [],
    ...overrides,
  };
}

function deck(size: number, start = 0): Card[] {
  return Array.from({ length: size }, (_, offset) =>
    makeCard(`card-${String(start + offset).padStart(2, "0")}`),
  );
}

afterEach(cleanup);

beforeEach(() => {
  localStorage.clear();
  paramsState.query = "";
  paramsState.push.mockClear();
});

function renderPractice(props: ComponentProps<typeof SectionPracticeClient>) {
  return render(
    <FilterDrawerProvider>
      <HeaderFilterButton />
      <SectionPracticeClient {...props} />
    </FilterDrawerProvider>,
  );
}

function renderOrderedPractice(
  props: ComponentProps<typeof SectionPracticeClient>,
) {
  paramsState.query = "order=ordered";
  renderPractice(props);
  fireEvent.click(screen.getByRole("button", { name: "Filters & Order" }));
}

function revealAndRate(label: "I knew it" | "Almost" | "I didn't know") {
  fireEvent.click(screen.getByRole("button", { name: "Reveal" }));
  fireEvent.click(screen.getByRole("button", { name: label }));
}

function summaryCount(label: string): number {
  const items = screen.getAllByRole("listitem");
  const item = items.find((element) =>
    element.textContent?.startsWith(label),
  );
  expect(item).not.toBeUndefined();
  return Number(item?.querySelector("strong")?.textContent ?? NaN);
}

describe("SPEC 30 — sesiones cortas de vocabulario", () => {
  it("limita la sesión inicial a 10 tarjetas", () => {
    renderOrderedPractice({
      cards: deck(12),
      pathname: "/collocations",
      accent: "red",
    });

    expect(screen.getByText("Card 1 of 10")).not.toBeNull();
  });

  it("conserva mazos cortos completos", () => {
    renderOrderedPractice({
      cards: deck(3),
      pathname: "/collocations",
      accent: "red",
    });

    expect(screen.getByText("Card 1 of 3")).not.toBeNull();
  });

  it("pide Reveal antes de autoevaluar y Skip no revela", () => {
    renderOrderedPractice({
      cards: deck(2),
      pathname: "/collocations",
      accent: "red",
    });

    expect(screen.queryByText("meaning of card-00")).toBeNull();
    expect(screen.queryByRole("button", { name: "I knew it" })).toBeNull();
    expect(screen.getByRole("button", { name: "Skip" })).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Reveal" }));

    expect(screen.getByText("meaning of card-00")).not.toBeNull();
    expect(screen.getByRole("button", { name: "I knew it" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Almost" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "I didn't know" })).not.toBeNull();
  });

  it("Previous oculta la respuesta y la última evaluación es la vigente", () => {
    renderOrderedPractice({
      cards: deck(2),
      pathname: "/collocations",
      accent: "red",
    });

    revealAndRate("I knew it");
    expect(screen.getByText("Card 2 of 2")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Previous" }));

    expect(screen.getByText("Card 1 of 2")).not.toBeNull();
    expect(screen.queryByText("meaning of card-00")).toBeNull();

    revealAndRate("Almost");
    revealAndRate("I knew it");

    expect(screen.getByText("Session summary")).not.toBeNull();
    expect(summaryCount("I knew it:")).toBe(1);
    expect(summaryCount("Almost:")).toBe(1);
  });

  it("Skip entra en pendientes y el resumen ofrece repaso a pedido", () => {
    renderOrderedPractice({
      cards: deck(2),
      pathname: "/collocations",
      accent: "red",
    });

    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(screen.getByText("Card 2 of 2")).not.toBeNull();
    expect(screen.queryByText("meaning of card-00")).toBeNull();

    revealAndRate("I knew it");

    expect(screen.getByText("Session summary")).not.toBeNull();
    expect(summaryCount("Skipped:")).toBe(1);
    expect(summaryCount("I knew it:")).toBe(1);
    expect(screen.getByText("1 pending for review.")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Review pending (1)" }));

    expect(screen.getByText("Review card 1 of 1")).not.toBeNull();
    revealAndRate("I knew it");

    expect(screen.getByText("Session summary")).not.toBeNull();
    expect(summaryCount("I knew it:")).toBe(2);
    expect(screen.getByText("No pending cards. Nice work!")).not.toBeNull();
    expect(
      screen.queryByRole("button", { name: /Review pending/ }),
    ).toBeNull();
  });

  it("permite otra ronda de pendientes sin bucle automático", () => {
    renderOrderedPractice({
      cards: deck(3),
      pathname: "/collocations",
      accent: "red",
    });

    revealAndRate("I knew it");
    revealAndRate("Almost");
    revealAndRate("I didn't know");

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

  it("el resumen permite empezar otra sesión sin confirmación", () => {
    renderOrderedPractice({
      cards: deck(2),
      pathname: "/collocations",
      accent: "red",
    });

    revealAndRate("I knew it");
    revealAndRate("I knew it");

    fireEvent.click(screen.getByRole("button", { name: "Start new session" }));

    expect(screen.getByText("Card 1 of 2")).not.toBeNull();
    expect(
      screen.queryByRole("alertdialog", { name: "Start new session?" }),
    ).toBeNull();
  });

  it("recargar en resumen conserva la fase y los resultados", () => {
    const props = {
      cards: deck(2),
      pathname: "/collocations",
      accent: "red",
    } as const;
    renderOrderedPractice({ ...props });
    revealAndRate("I knew it");
    revealAndRate("Almost");
    expect(screen.getByText("Session summary")).not.toBeNull();

    cleanup();
    renderOrderedPractice({ ...props });

    expect(screen.getByText("Session summary")).not.toBeNull();
    expect(summaryCount("I knew it:")).toBe(1);
    expect(summaryCount("Almost:")).toBe(1);
    expect(screen.queryByText(/Card \d+ of \d+/)).toBeNull();
  });

  it("recargar en repaso conserva índice, pendientes y evaluaciones", () => {
    const props = {
      cards: deck(3),
      pathname: "/collocations",
      accent: "red",
    } as const;
    renderOrderedPractice({ ...props });
    revealAndRate("I knew it");
    revealAndRate("Almost");
    revealAndRate("I didn't know");
    fireEvent.click(screen.getByRole("button", { name: "Review pending (2)" }));
    revealAndRate("I knew it");
    expect(screen.getByText("Review card 2 of 2")).not.toBeNull();

    cleanup();
    renderOrderedPractice({ ...props });

    expect(screen.getByText("Review card 2 of 2")).not.toBeNull();
    expect(screen.queryByText("meaning of card-02")).toBeNull();

    revealAndRate("I didn't know");

    expect(screen.getByText("Session summary")).not.toBeNull();
    expect(summaryCount("I knew it:")).toBe(2);
    expect(summaryCount("I didn't know:")).toBe(1);
  });

  it("mixed limita a 10 sin filtros y conserva su conjunto", () => {
    renderPractice({
      cards: deck(12),
      pathname: "/mixed",
      accent: "green",
      showTypeBadge: true,
      disableFilters: true,
    });

    expect(screen.getByText("Card 1 of 10")).not.toBeNull();
    expect(screen.queryByText("Level")).toBeNull();
  });

  it("aplica orden compartido aunque haya una sesión shuffled guardada", () => {
    const props = { cards: deck(5), pathname: "/collocations", accent: "red" };
    renderPractice(props);
    const shuffled = JSON.parse(localStorage.getItem(PRACTICE_STORAGE_KEY) ?? "{}") as {
      sessions: Record<string, { items: Array<{ id: string }>; selection: { order: string } }>;
    };
    expect(shuffled.sessions[props.pathname]?.selection.order).toBe("shuffled");
    cleanup();

    paramsState.query = "order=ordered&level=B1-B2";
    renderPractice(props);
    expect(screen.getByRole("heading", { name: "card-00" })).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Filters & Order" }));
    expect(screen.getByRole("button", { name: "Ordered" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("link", { name: "general" }).getAttribute("href"))
      .toBe("/collocations?category=general&order=ordered");
  });

  it("recargar shuffled conserva el mazo concreto y el índice", () => {
    const props = { cards: deck(12), pathname: "/collocations", accent: "red" };
    renderPractice(props);
    const first = screen.getByRole("heading", { level: 2 }).textContent;
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    const second = screen.getByRole("heading", { level: 2 }).textContent;
    cleanup();
    renderPractice(props);
    expect(screen.getByText("Card 2 of 10")).not.toBeNull();
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe(second);
    expect(first).not.toBeNull();
  });

  it("un order inválido inicia shuffled y permite enlazar la categoría", () => {
    paramsState.query = "order=invalid&level=B1-B2";
    renderPractice({ cards: deck(2), pathname: "/collocations", accent: "red" });
    fireEvent.click(screen.getByRole("button", { name: "Filters & Order" }));
    expect(screen.getByRole("button", { name: "Shuffled" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("link", { name: "general" }).getAttribute("href"))
      .toBe("/collocations?category=general");
  });

  it("una navegación compartida cambia el modo aun si la ruta sigue montada", () => {
    const props = { cards: deck(3), pathname: "/collocations", accent: "red" };
    const practice = renderPractice(props);
    paramsState.query = "order=ordered";
    practice.rerender(
      <FilterDrawerProvider>
        <HeaderFilterButton />
        <SectionPracticeClient {...props} />
      </FilterDrawerProvider>,
    );
    expect(screen.getByRole("heading", { name: "card-00" })).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Filters & Order" }));
    expect(screen.getByRole("button", { name: "Ordered" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("cambiar orden conserva category y Cancel mantiene URL y sesión", () => {
    paramsState.query = "category=MAKE&order=ordered";
    renderPractice({
      cards: [makeCard("make one", { category: "MAKE" }), makeCard("make two", { category: "MAKE" })],
      pathname: "/collocations",
      accent: "red",
    });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    const before = localStorage.getItem(PRACTICE_STORAGE_KEY);
    fireEvent.click(screen.getByRole("button", { name: "Filters & Order" }));
    fireEvent.click(screen.getByRole("button", { name: "Shuffled" }));
    expect(paramsState.push).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(paramsState.query).toBe("category=MAKE&order=ordered");
    expect(localStorage.getItem(PRACTICE_STORAGE_KEY)).toBe(before);
    expect(screen.getByText("Card 2 of 2")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Filters & Order" }));
    fireEvent.click(screen.getByRole("button", { name: "Shuffled" }));
    fireEvent.click(screen.getByRole("button", { name: "Start new session" }));
    expect(paramsState.push).toHaveBeenCalledWith("/collocations?category=MAKE");
    expect(screen.getByText("Card 1 of 2")).not.toBeNull();
  });

  it("recargar conserva índice, fase y resultados con la respuesta oculta", () => {
    const props = {
      cards: deck(3),
      pathname: "/collocations",
      accent: "red",
    } as const;
    renderOrderedPractice({ ...props });
    revealAndRate("I knew it");
    expect(screen.getByText("Card 2 of 3")).not.toBeNull();

    cleanup();
    renderOrderedPractice({ ...props });

    expect(screen.getByText("Card 2 of 3")).not.toBeNull();
    expect(screen.queryByText("meaning of card-01")).toBeNull();
  });

  it("mantiene una sesión independiente por ruta", () => {
    renderOrderedPractice({
      cards: deck(3),
      pathname: "/route-a",
      accent: "red",
    });
    revealAndRate("I knew it");
    expect(screen.getByText("Card 2 of 3")).not.toBeNull();
    cleanup();

    renderOrderedPractice({
      cards: deck(3),
      pathname: "/route-b",
      accent: "red",
    });
    expect(screen.getByText("Card 1 of 3")).not.toBeNull();
    cleanup();

    renderOrderedPractice({
      cards: deck(3),
      pathname: "/route-a",
      accent: "red",
    });
    expect(screen.getByText("Card 2 of 3")).not.toBeNull();
  });

  it("descarta solo la sesión afectada si una referencia cambió", () => {
    const original = deck(2);
    renderOrderedPractice({
      cards: original,
      pathname: "/stale",
      accent: "red",
    });
    revealAndRate("I knew it");
    expect(screen.getByText("Card 2 of 2")).not.toBeNull();
    cleanup();

    const edited = [
      { ...original[0]!, meaningEs: "significado editado" },
      original[1]!,
    ];
    renderOrderedPractice({
      cards: edited,
      pathname: "/stale",
      accent: "red",
    });

    // La huella cambió: sesión nueva desde la primera tarjeta.
    expect(screen.getByText("Card 1 of 2")).not.toBeNull();

    const stored = JSON.parse(
      localStorage.getItem(PRACTICE_STORAGE_KEY) ?? "{}",
    ) as { evaluations?: Record<string, unknown> };
    expect(stored.evaluations ?? {}).toEqual({});
  });

  it("cambiar filtros con progreso pide confirmación; Cancel conserva todo", () => {
    const mixedCategories = [
      makeCard("card-00", { category: "MAKE" }),
      makeCard("card-01", { category: "TAKE" }),
    ];
    renderOrderedPractice({
      cards: mixedCategories,
      pathname: "/collocations",
      accent: "red",
    });

    revealAndRate("I knew it");
    const before = localStorage.getItem(PRACTICE_STORAGE_KEY);

    fireEvent.click(screen.getByRole("button", { name: "Filters & Order" }));
    fireEvent.click(screen.getByRole("link", { name: "TAKE" }));

    expect(
      screen.getByRole("alertdialog", { name: "Start new session?" }),
    ).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(paramsState.push).not.toHaveBeenCalled();
    expect(screen.getByText("Card 2 of 2")).not.toBeNull();
    expect(localStorage.getItem(PRACTICE_STORAGE_KEY)).toBe(before);
    expect(screen.getByRole("link", { name: "TAKE" }).getAttribute("href"))
      .toBe("/collocations?category=TAKE&order=ordered");
    expect(
      screen.queryByRole("alertdialog", { name: "Start new session?" }),
    ).toBeNull();
  });

  it("confirmar el cambio de filtros inicia una sesión nueva", () => {
    const mixedCategories = [
      makeCard("card-00", { category: "MAKE" }),
      makeCard("card-01", { category: "TAKE" }),
    ];
    const props = {
      cards: mixedCategories,
      pathname: "/collocations",
      accent: "red",
    };
    renderOrderedPractice(props);

    revealAndRate("I knew it");

    fireEvent.click(screen.getByRole("button", { name: "Filters & Order" }));
    fireEvent.click(screen.getByRole("link", { name: "TAKE" }));
    fireEvent.click(screen.getByRole("button", { name: "Start new session" }));

    expect(paramsState.push).toHaveBeenCalledWith(
      "/collocations?category=TAKE&order=ordered",
    );
    // Simula la navegación confirmada al enlace de la nueva categoría.
    paramsState.query = "category=TAKE&order=ordered";
    cleanup();
    renderPractice(props);
    expect(screen.getByText("Card 1 of 1")).not.toBeNull();
    expect(screen.getByRole("heading", { name: "card-01" })).not.toBeNull();
    const stored = JSON.parse(localStorage.getItem(PRACTICE_STORAGE_KEY) ?? "{}") as {
      sessions: Record<string, { index: number; selection: { category?: string; order: string } }>;
    };
    expect(stored.sessions[props.pathname]?.index).toBe(0);
    expect(stored.sessions[props.pathname]?.selection).toEqual({ category: "TAKE", order: "ordered" });
  });

  it("sin localStorage permite terminar la sesión en memoria", () => {
    vi.stubGlobal("localStorage", undefined);
    try {
      render(
        <FilterDrawerProvider>
          <HeaderFilterButton />
          <SectionPracticeClient
            cards={deck(2)}
            pathname="/no-storage"
            accent="red"
          />
        </FilterDrawerProvider>,
      );
      fireEvent.click(screen.getByRole("button", { name: "Filters & Order" }));
      fireEvent.click(screen.getByRole("button", { name: "Ordered" }));

      revealAndRate("I knew it");
      revealAndRate("Almost");

      expect(screen.getByText("Session summary")).not.toBeNull();
      expect(summaryCount("Almost:")).toBe(1);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("muestra el estado vacío sin tarjetas", () => {
    renderPractice({ cards: [], pathname: "/collocations", accent: "red" });

    expect(screen.getByText("No cards match these filters.")).not.toBeNull();
  });
});
