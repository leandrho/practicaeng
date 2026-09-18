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
      <HeaderFilterButton />
      <RegisterPracticeFilters
        cards={cards}
        filter={{}}
        pathname="/collocations"
      />
    </FilterDrawerProvider>,
  );
}

afterEach(cleanup);

describe("FilterDrawerProvider", () => {
  it("no muestra el botón en páginas sin filtros (home)", () => {
    render(
      <FilterDrawerProvider>
        <HeaderFilterButton />
      </FilterDrawerProvider>,
    );

    expect(screen.queryByRole("button", { name: "Filtros" })).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("muestra el botón al registrar filtros y abre/cierra con Esc devolviendo el foco", () => {
    renderWithFilters();

    const trigger = screen.getByRole("button", { name: "Filtros" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("dialog", { name: "Filtros" })).not.toBeNull();
    expect(
      screen.getByRole("link", { name: "MAKE" }).getAttribute("href"),
    ).toBe("/collocations?category=MAKE");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
  });

  it("cierra con botón cerrar, overlay y click en un chip", () => {
    renderWithFilters();

    const trigger = screen.getByRole("button", { name: "Filtros" });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: "Cerrar filtros" }));
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(trigger);
    fireEvent.click(
      screen.getByRole("button", { name: "Cerrar panel de filtros" }),
    );
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("link", { name: "MAKE" }));
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("oculta el botón al desmontar el registro", () => {
    const { unmount } = renderWithFilters();
    expect(screen.getByRole("button", { name: "Filtros" })).not.toBeNull();

    unmount();
    cleanup();
    render(
      <FilterDrawerProvider>
        <HeaderFilterButton />
      </FilterDrawerProvider>,
    );
    expect(screen.queryByRole("button", { name: "Filtros" })).toBeNull();
  });
});
