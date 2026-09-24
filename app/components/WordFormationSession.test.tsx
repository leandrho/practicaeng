// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import type { WordFamily } from "../../src/domain/word-formation";
import {
  createPracticeSession,
  setPracticeIndex,
} from "../../src/application/practice-session";
import { assignWordFormationRefs } from "../../src/application/word-formation-id";
import { PRACTICE_STORAGE_KEY } from "../../src/infrastructure/ui/practice-storage";
import WordFormationClient from "./WordFormationClient";
import { WordFormationSectionClient } from "./WordFormationSectionClient";
import { FilterDrawerProvider, HeaderFilterButton } from "./FilterDrawerProvider";

const paramsState = vi.hoisted(() => ({ query: "", push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(paramsState.query),
  useRouter: () => ({ push: paramsState.push }),
}));

function makeFamily(base: string, overrides: Partial<WordFamily> = {}): WordFamily {
  return {
    base,
    level: "B1-B2",
    category: base.charAt(0).toUpperCase(),
    noun: `${base}ness`,
    adjective: `${base}y`,
    adverb: `${base}ly`,
    meaningHintEn: `to ${base}`,
    meaningHint: base,
    contextEn: `"We must ${base} now," she said. There was no time to wait.`,
    contextSource: "Everyday conversation",
    examples: [`Example with ${base}.`],
    exercise: {
      target: "noun",
      sentenceEn: `It was a clear ____. (${base})`,
      acceptedAnswers: [`${base}ness`],
    },
    ...overrides,
  };
}

function deck(size: number, start = 0): WordFamily[] {
  return Array.from({ length: size }, (_, offset) =>
    makeFamily(`fam-${String(start + offset).padStart(2, "0")}`),
  );
}

afterEach(cleanup);

beforeEach(() => {
  localStorage.clear();
  paramsState.query = "";
  paramsState.push.mockClear();
});

function checkCurrent(answer: string) {
  fireEvent.change(screen.getByLabelText(/complete with the correct form/i), {
    target: { value: answer },
  });
  fireEvent.click(screen.getByRole("button", { name: "Check" }));
}

function summaryCount(label: string): number {
  const items = screen.getAllByRole("listitem");
  const item = items.find((element) => element.textContent?.startsWith(label));
  expect(item).not.toBeUndefined();
  return Number(item?.querySelector("strong")?.textContent ?? NaN);
}

function renderSession(
  props: Partial<ComponentProps<typeof WordFormationClient>> & { families: WordFamily[] },
) {
  return render(
    <WordFormationClient
      clearFiltersPath="/word-formation"
      route="/word-formation"
      selection={{ order: "ordered" }}
      {...props}
    />,
  );
}

describe("SPEC 31 — sesiones y repaso de Word Formation", () => {
  it("limita la sesión inicial a 10 familias", () => {
    renderSession({ families: deck(12), route: "/wf-limit" });

    expect(screen.getByText("Family 1 of 10")).not.toBeNull();
  });

  it("primer acierto limpio es known; fallo previo más acierto es unknown", () => {
    const families = deck(2);
    renderSession({ families, route: "/wf-known-unknown" });

    // Primera familia: acierto sin fallos → known.
    checkCurrent(`${families[0]!.base}ness`);
    expect(screen.getByText(/Correct:/)).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    // Segunda familia: fallo y luego acierto → unknown.
    checkCurrent("wrong-answer");
    expect(screen.getByText("Not yet: try again.")).not.toBeNull();
    checkCurrent(`${families[1]!.base}ness`);
    expect(screen.getByText(/Correct:/)).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "See summary" }));

    expect(screen.getByText("Session summary")).not.toBeNull();
    expect(summaryCount("I knew it:")).toBe(1);
    expect(summaryCount("I didn't know:")).toBe(1);
    expect(screen.getByText("1 pending for review.")).not.toBeNull();
  });

  it("un error posterior al primer acierto cambia known a unknown", () => {
    const families = deck(1);
    renderSession({ families, route: "/wf-correct-then-wrong" });

    checkCurrent(`${families[0]!.base}ness`);
    checkCurrent("wrong-answer");
    // Puede reintentar, pero el error ya deja el ítem marcado para repaso.
    checkCurrent(`${families[0]!.base}ness`);

    fireEvent.click(screen.getByRole("button", { name: "See summary" }));
    expect(summaryCount("I knew it:")).toBe(0);
    expect(summaryCount("I didn't know:")).toBe(1);
  });

  it("Skip después de un intento incorrecto conserva unknown", () => {
    const families = deck(1);
    renderSession({ families, route: "/wf-wrong-then-skip" });

    checkCurrent("wrong-answer");
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    fireEvent.click(screen.getByRole("button", { name: "See summary" }));

    expect(summaryCount("I didn't know:")).toBe(1);
    expect(summaryCount("Skipped:")).toBe(0);
  });

  it("Reveal sin acierto es unknown; Skip sin revelar es skipped sin mostrar la solución", () => {
    const families = deck(2);
    renderSession({ families, route: "/wf-reveal-skip" });

    fireEvent.click(screen.getByRole("button", { name: "Reveal family" }));
    expect(screen.getByText("Noun:")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByText("Family 2 of 2")).not.toBeNull();
    expect(screen.queryByText("Noun:")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    // Skip no muestra la solución y completa la ronda (queda el resumen).
    expect(screen.queryByText("Noun:")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "See summary" }));

    expect(screen.getByText("Session summary")).not.toBeNull();
    expect(summaryCount("I didn't know:")).toBe(1);
    expect(summaryCount("Skipped:")).toBe(1);
  });

  it("mantiene la familia completa y los ejemplos tras Reveal y permite reintentar", () => {
    const families = [makeFamily("decide", {
      noun: "decision",
      adjective: "decisive",
      adverb: "decisively",
      examples: ["She made a decision."],
      exercise: {
        target: "noun",
        sentenceEn: "She made an important ____ yesterday.",
        acceptedAnswers: ["decision"],
      },
    })];
    renderSession({ families, route: "/wf-retry" });

    fireEvent.click(screen.getByRole("button", { name: "Reveal family" }));

    expect(screen.getByText("decision")).not.toBeNull();
    expect(screen.getByText("She made a decision.")).not.toBeNull();

    // Reintento de aprendizaje antes de avanzar (la evaluación ya es unknown).
    checkCurrent("decision");
    expect(screen.getByText("Correct: decision")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "See summary" }));
    expect(screen.getByText("Session summary")).not.toBeNull();
    expect(summaryCount("I didn't know:")).toBe(1);
  });

  it("solo unknown y skipped vuelven en el repaso; tras cada ronda hay un nuevo resumen", () => {
    const families = deck(3);
    renderSession({ families, route: "/wf-review" });

    checkCurrent(`${families[0]!.base}ness`);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    checkCurrent("wrong");
    checkCurrent(`${families[1]!.base}ness`);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    fireEvent.click(screen.getByRole("button", { name: "Skip" }));

    // Completa la ronda inicial.
    fireEvent.click(screen.getByRole("button", { name: "See summary" }));
    expect(screen.getByText("Session summary")).not.toBeNull();
    expect(summaryCount("I knew it:")).toBe(1);
    expect(summaryCount("I didn't know:")).toBe(1);
    expect(summaryCount("Skipped:")).toBe(1);

    fireEvent.click(screen.getByRole("button", { name: "Review pending (2)" }));
    expect(screen.getByText("Review family 1 of 2")).not.toBeNull();

    // Repaso limpio: ambas quedan known.
    const reviewAnswer = screen.getByLabelText(/complete with the correct form/i);
    expect(reviewAnswer).not.toBeNull();
    // Primera del repaso = segunda familia inicial (unknown).
    checkCurrent(`${families[1]!.base}ness`);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    checkCurrent(`${families[2]!.base}ness`);

    fireEvent.click(screen.getByRole("button", { name: "See summary" }));
    expect(screen.getByText("Session summary")).not.toBeNull();
    expect(summaryCount("I knew it:")).toBe(3);
    expect(screen.getByText("No pending cards. Nice work!")).not.toBeNull();
  });

  it("un fallo previo sobrevive a la recarga antes de avanzar", () => {
    const families = deck(1);
    const props = { families, route: "/wf-attempt-persist" } as const;
    renderSession({ ...props });

    checkCurrent("wrong-answer");
    expect(screen.getByText("Not yet: try again.")).not.toBeNull();

    cleanup();
    renderSession({ ...props });

    // La respuesta reaparece oculta, con el índice y el intento conservados.
    expect(screen.getByText("Family 1 of 1")).not.toBeNull();
    expect(screen.queryByText("Noun:")).toBeNull();
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("");

    checkCurrent(`${families[0]!.base}ness`);
    fireEvent.click(screen.getByRole("button", { name: "See summary" }));

    expect(summaryCount("I didn't know:")).toBe(1);
    expect(summaryCount("I knew it:")).toBe(0);
  });

  it("recargar conserva índice, orden y resultados con la respuesta oculta", () => {
    const families = deck(3);
    const props = {
      families,
      route: "/wf-reload",
      selection: { order: "shuffled" as const },
    } as const;
    renderSession({ ...props });

    const firstHeading = screen
      .getByRole("heading", { level: 2 })
      .textContent?.toLowerCase();
    const firstFamily = families.find(
      (candidate) => candidate.base.toLowerCase() === firstHeading,
    );
    expect(firstFamily).not.toBeUndefined();
    checkCurrent(`${firstFamily!.base}ness`);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Family 2 of 3")).not.toBeNull();
    const beforeReload = JSON.parse(
      localStorage.getItem(PRACTICE_STORAGE_KEY) ?? "{}",
    ) as {
      sessions?: Record<
        string,
        { items?: Array<{ id: string }>; ratings?: Record<string, string> }
      >;
    };
    const savedOrder = beforeReload.sessions?.["/wf-reload"]?.items?.map(
      (ref) => ref.id,
    );
    expect(
      beforeReload.sessions?.["/wf-reload"]?.ratings?.[
        `word-formation:${savedOrder?.[0]}`
      ],
    ).toBe("known");

    cleanup();
    renderSession({ ...props });

    expect(screen.getByText("Family 2 of 3")).not.toBeNull();
    expect(screen.queryByText("Noun:")).toBeNull();

    const stored = JSON.parse(
      localStorage.getItem(PRACTICE_STORAGE_KEY) ?? "{}",
    ) as { sessions?: Record<string, { index?: number }> };
    expect(stored.sessions?.["/wf-reload"]?.index).toBe(1);
    const afterReload = JSON.parse(
      localStorage.getItem(PRACTICE_STORAGE_KEY) ?? "{}",
    ) as {
      sessions?: Record<
        string,
        { items?: Array<{ id: string }>; ratings?: Record<string, string> }
      >;
    };
    expect(afterReload.sessions?.["/wf-reload"]?.items?.map((ref) => ref.id)).toEqual(
      savedOrder,
    );
    expect(
      afterReload.sessions?.["/wf-reload"]?.ratings?.[
        `word-formation:${savedOrder?.[0]}`
      ],
    ).toBe("known");
  });

  it("la ruta restaura la sesión cuando su orden coincide con la URL", () => {
    const families = deck(3);
    paramsState.query = "order=ordered";
    let session = createPracticeSession(
      "/word-formation",
      assignWordFormationRefs(families),
      { order: "ordered" },
    );
    session = setPracticeIndex(session, 1);
    localStorage.setItem(
      PRACTICE_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        lastRoute: "/word-formation",
        sessions: { "/word-formation": session },
        evaluations: {},
      }),
    );

    render(
      <FilterDrawerProvider>
        <HeaderFilterButton />
        <WordFormationSectionClient
          families={families}
          pathname="/word-formation"
          accent="red"
        />
      </FilterDrawerProvider>,
    );

    expect(screen.getByText("Family 2 of 3")).not.toBeNull();
    expect(screen.getByRole("heading", { name: "FAM-01" })).not.toBeNull();
    expect(screen.queryByText("Noun:")).toBeNull();
  });

  it("Word Formation lee order y category del enlace y descarta level antiguo", () => {
    paramsState.query = "category=B&order=ordered&level=B1-B2";
    render(
      <FilterDrawerProvider>
        <HeaderFilterButton />
        <WordFormationSectionClient
          families={[makeFamily("alpha", { category: "A" }), makeFamily("bravo", { category: "B" })]}
          pathname="/word-formation"
          accent="red"
        />
      </FilterDrawerProvider>,
    );
    expect(screen.getByRole("heading", { name: "BRAVO" })).not.toBeNull();
    expect(screen.getByText("Family 1 of 1")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Filters & Order" }));
    expect(screen.queryByText("Level")).toBeNull();
    expect(screen.getByRole("button", { name: "Ordered" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("link", { name: "A" }).getAttribute("href"))
      .toBe("/word-formation?category=A&order=ordered");
  });

  it("no retoma una sesión si el filtro vigente cambió", () => {
    const firstA = makeFamily("alpha", { category: "A" });
    const secondA = makeFamily("beta", { category: "A" });
    const familyB = makeFamily("gamma", { category: "B" });
    const allFamilies = [firstA, secondA, familyB];
    const route = "/wf-current-filter";

    renderSession({
      families: [firstA, secondA],
      allFamilies,
      route,
      selection: { level: "B1-B2", category: "A", order: "ordered" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Family 2 of 2")).not.toBeNull();
    cleanup();

    renderSession({
      families: [familyB],
      allFamilies,
      route,
      selection: { level: "B1-B2", category: "B", order: "ordered" },
    });

    expect(screen.getByRole("heading", { name: "GAMMA" })).not.toBeNull();
    expect(screen.getByText("Family 1 of 1")).not.toBeNull();
  });

  it("descarta solo la sesión afectada si el ejercicio cambió", () => {
    const original = deck(2);
    renderSession({ families: original, route: "/wf-stale" });
    checkCurrent(`${original[0]!.base}ness`);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Family 2 of 2")).not.toBeNull();
    cleanup();

    const edited = [
      {
        ...original[0]!,
        exercise: { ...original[0]!.exercise, sentenceEn: "Edited ____ here." },
      },
      original[1]!,
    ];
    renderSession({ families: edited, route: "/wf-stale" });

    // La huella cambió: sesión nueva desde la primera familia.
    expect(screen.getByText("Family 1 of 2")).not.toBeNull();
  });

  it("muestra el estado vacío sin familias", () => {
    renderSession({ families: [], route: "/wf-empty" });

    expect(screen.getByText("No cards match these filters.")).not.toBeNull();
  });

  it("cambiar filtros con progreso pide confirmación; Cancel conserva todo", () => {
    const mixed = [
      makeFamily("alpha", { category: "A" }),
      makeFamily("bravo", { category: "B" }),
    ];
    render(
      <FilterDrawerProvider>
        <HeaderFilterButton />
        <WordFormationSectionClient
          families={mixed}
          pathname="/word-formation"
          accent="red"
        />
      </FilterDrawerProvider>,
    );

    // Orden inicial mezclado: asegura orden canónico para el test.
    fireEvent.click(screen.getByRole("button", { name: "Filters & Order" }));
    fireEvent.click(screen.getByRole("button", { name: "Ordered" }));

    checkCurrent("alphaness");

    fireEvent.click(screen.getByRole("button", { name: "Filters & Order" }));
    fireEvent.click(screen.getByRole("link", { name: "B" }));

    expect(
      screen.getByRole("alertdialog", { name: "Start new session?" }),
    ).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(paramsState.push).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Family 1 of 2")).not.toBeNull();
    const stored = JSON.parse(
      localStorage.getItem(PRACTICE_STORAGE_KEY) ?? "{}",
    ) as {
      sessions?: Record<string, { ratings?: Record<string, string> }>;
    };
    expect(stored.sessions?.["/word-formation"]?.ratings?.["word-formation:alpha"]).toBe(
      "known",
    );
    expect(
      screen.queryByRole("alertdialog", { name: "Start new session?" }),
    ).toBeNull();
  });

  it("confirmar el cambio de filtro navega con la selección pedida", () => {
    const mixed = [
      makeFamily("alpha", { category: "A" }),
      makeFamily("bravo", { category: "B" }),
    ];
    render(
      <FilterDrawerProvider>
        <HeaderFilterButton />
        <WordFormationSectionClient
          families={mixed}
          pathname="/word-formation"
          accent="red"
        />
      </FilterDrawerProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Filters & Order" }));
    fireEvent.click(screen.getByRole("button", { name: "Ordered" }));
    checkCurrent("alphaness");

    fireEvent.click(screen.getByRole("button", { name: "Filters & Order" }));
    fireEvent.click(screen.getByRole("link", { name: "B" }));
    fireEvent.click(screen.getByRole("button", { name: "Start new session" }));

    expect(paramsState.push).toHaveBeenCalledWith(
      "/word-formation?category=B&order=ordered",
    );
  });
});
