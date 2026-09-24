// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { HomeLocal } from "./HomeLocal";
import { createPracticeSession } from "../../src/application/practice-session";
import {
  PRACTICE_STORAGE_KEY,
  type StoredPracticeState,
} from "../../src/infrastructure/ui/practice-storage";

afterEach(cleanup);

beforeEach(() => {
  localStorage.clear();
});

function save(state: StoredPracticeState) {
  localStorage.setItem(PRACTICE_STORAGE_KEY, JSON.stringify(state));
}

describe("HomeLocal", () => {
  it("SSR reserva espacio estable sin desajuste de hidratación", () => {
    const html = renderToString(<HomeLocal />);
    expect(html).toContain("Loading saved progress");
    expect(html).not.toContain("Continue");
  });

  it("no pide tutorial en primer uso y reserva región sin CTA", async () => {
    render(<HomeLocal />);

    // Tras cargar el almacenamiento vacío no hay Continue ni resumen,
    // solo el CTA principal de la portada (fuera de este componente).
    await waitFor(() => {
      expect(
        screen.queryByLabelText("Loading saved progress"),
      ).toBeNull();
    });
    expect(screen.queryByRole("link", { name: /Continue/ })).toBeNull();
    expect(screen.queryByText(/Saved on this device/)).toBeNull();
  });

  it("muestra Continue hacia la última sesión válida interrumpida", async () => {
    const session = createPracticeSession(
      "/mixed",
      [
        { kind: "vocabulary", id: "a", fingerprint: "fp-a" },
        { kind: "vocabulary", id: "b", fingerprint: "fp-b" },
      ],
      { order: "shuffled" },
      2000,
    );
    save({
      version: 1,
      lastRoute: "/mixed",
      sessions: { "/mixed": session },
      evaluations: {
        "vocabulary:b": { rating: "unknown", fingerprint: "fp-b", updatedAt: 2000 },
      },
    });

    render(<HomeLocal />);

    const continueLink = await screen.findByRole("link", { name: /Continue/ });
    expect(continueLink.getAttribute("href")).toBe("/mixed");
    expect(await screen.findByText(/Saved on this device/)).not.toBeNull();
    expect(await screen.findByText(/Last session:/)).not.toBeNull();
    expect(await screen.findByText(/Difficult items:/)).not.toBeNull();
    const review = await screen.findByRole("link", { name: "Review difficulties" });
    expect(review.getAttribute("href")).toBe("/mixed");
  });

  it("una sesión inválida o cerrada no genera un enlace roto", async () => {
    // Sesión completa sin pendientes + referencia rota: sin Continue.
    const completed = {
      ...createPracticeSession(
        "/collocations",
        [{ kind: "vocabulary", id: "a", fingerprint: "fp-a" }],
        { order: "shuffled" },
        1000,
      ),
      phase: "summary" as const,
      reviewItems: [],
    };
    save({
      version: 1,
      lastRoute: "/broken",
      sessions: {
        "/collocations": completed,
        "/broken": { route: "/broken" } as never,
      },
      evaluations: {},
    });

    render(<HomeLocal />);

    await waitFor(() => {
      expect(screen.queryByLabelText("Loading saved progress")).toBeNull();
    });
    expect(screen.queryByRole("link", { name: /Continue/ })).toBeNull();
    for (const link of screen.queryAllByRole("link")) {
      expect(link.getAttribute("href")).not.toBe("/broken");
    }
  });

  it("funciona con almacenamiento corrupto o deshabilitado sin romper la portada", async () => {
    localStorage.setItem(PRACTICE_STORAGE_KEY, "not-json{{{");
    const { unmount } = render(<HomeLocal />);
    await waitFor(() => {
      expect(screen.queryByLabelText("Loading saved progress")).toBeNull();
    });
    expect(screen.queryByRole("link", { name: /Continue/ })).toBeNull();
    unmount();

    // Storage que lanza: degrada a vacío en vez de romper el render.
    const throwing = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
    };
    Object.defineProperty(window, "localStorage", {
      value: throwing,
      configurable: true,
    });
    render(<HomeLocal />);
    await waitFor(() => {
      expect(screen.queryByLabelText("Loading saved progress")).toBeNull();
    });
  });
});
