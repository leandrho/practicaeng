// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  FilterDrawerProvider,
  HeaderFilterButton,
  RegisterPracticeFilters,
} from "./FilterDrawerProvider";

const cards = [
  { level: "B1-B2", category: "MAKE" },
  { level: "C1", category: "TAKE" },
];

function renderWithFilters() {
  return render(
    <FilterDrawerProvider>
      <main>
        <h1>Practice</h1>
        <button type="button">Outside</button>
      </main>
      <HeaderFilterButton />
      <RegisterPracticeFilters
        cards={cards}
        filter={{}}
        pathname="/collocations"
      />
    </FilterDrawerProvider>,
  );
}

function openDrawer() {
  const trigger = screen.getByRole("button", { name: "Filters & Order" });
  fireEvent.click(trigger);
  return trigger;
}

function focusableInDialog(): HTMLElement[] {
  const dialog = screen.getByRole("dialog", { name: "Filters & Order" });
  return Array.from(
    dialog.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
}

afterEach(cleanup);

describe("SPEC 29 — diálogo de filtros como modal", () => {
  it("enfoca el cierre al abrir y bloquea el scroll del fondo", () => {
    renderWithFilters();
    openDrawer();

    expect(
      screen.getByRole("button", { name: "Close filters" }),
    ).toBe(document.activeElement);
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.body.style.overflow).toBe("");
  });

  it("Tab envuelve del último al primero y Shift+Tab del primero al último", () => {
    renderWithFilters();
    openDrawer();

    const focusable = focusableInDialog();
    expect(focusable.length).toBeGreaterThan(2);
    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;

    last.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(first);

    first.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it("Escape y overlay cierran y devuelven el foco al disparador", () => {
    renderWithFilters();
    const trigger = openDrawer();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);

    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    fireEvent.click(
      screen.getByRole("button", { name: "Close filters panel" }),
    );
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
  });

  it("no alcanza el fondo con Tab mientras el panel está abierto", () => {
    renderWithFilters();
    openDrawer();

    const outside = screen.getByRole("button", { name: "Outside" });
    const focusable = focusableInDialog();
    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;

    // Desde el último, Tab no lleva al botón de fondo sino al primero.
    last.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).not.toBe(outside);
    expect(document.activeElement).toBe(first);

    // Desde el primero, Shift+Tab no lleva al fondo sino al último.
    first.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).not.toBe(outside);
    expect(document.activeElement).toBe(last);
  });
});
