// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeToggle } from "./ThemeToggle";
import { THEME_STORAGE_KEY } from "../../src/infrastructure/ui/theme";

function mockMatchMedia(dark: boolean) {
  const listeners = new Set<(e: { matches: boolean }) => void>();
  const media = {
    matches: dark,
    media: "(prefers-color-scheme: dark)",
    addEventListener: vi.fn((_event: string, cb: (e: { matches: boolean }) => void) => {
      listeners.add(cb);
    }),
    removeEventListener: vi.fn((_: string, cb: (e: { matches: boolean }) => void) => {
      listeners.delete(cb);
    }),
    // jsdom legacy API
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
  vi.stubGlobal("matchMedia", vi.fn(() => media));
  return media;
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  vi.unstubAllGlobals();
});

afterEach(cleanup);

describe("ThemeToggle", () => {
  it("respeta al SO en primera visita (oscuro)", () => {
    mockMatchMedia(true);
    render(<ThemeToggle />);

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(
      screen.getByRole("button", { name: "Cambiar a tema claro" }),
    ).not.toBeNull();
  });

  it("respeta al SO en primera visita (claro)", () => {
    mockMatchMedia(false);
    render(<ThemeToggle />);

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(
      screen.getByRole("button", { name: "Cambiar a tema oscuro" }),
    ).not.toBeNull();
  });

  it("el toggle cambia data-theme y persiste tras reload", () => {
    mockMatchMedia(false);
    render(<ThemeToggle />);

    fireEvent.click(
      screen.getByRole("button", { name: "Cambiar a tema oscuro" }),
    );

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");

    cleanup();
    render(<ThemeToggle />);

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(
      screen.getByRole("button", { name: "Cambiar a tema claro" }),
    ).not.toBeNull();
  });

  it("usa el valor guardado en vez del SO", () => {
    mockMatchMedia(true);
    localStorage.setItem(THEME_STORAGE_KEY, "light");
    document.documentElement.setAttribute("data-theme", "light");
    render(<ThemeToggle />);

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });
});
