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
  it("does not show the button on pages without filters (home)", () => {
    render(
      <FilterDrawerProvider>
        <HeaderFilterButton />
      </FilterDrawerProvider>,
    );

    expect(screen.queryByRole("button", { name: "Filters & Order" })).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows the button after filters register and opens and closes with Escape", () => {
    renderWithFilters();

    const trigger = screen.getByRole("button", { name: "Filters & Order" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("dialog", { name: "Filters & Order" })).not.toBeNull();
    expect(
      screen.getByRole("link", { name: "MAKE" }).getAttribute("href"),
    ).toBe("/collocations?category=MAKE");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
  });

  it("closes with the close button, overlay, and a chip click", () => {
    renderWithFilters();

    const trigger = screen.getByRole("button", { name: "Filters & Order" });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: "Close filters" }));
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(trigger);
    fireEvent.click(
      screen.getByRole("button", { name: "Close filters panel" }),
    );
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("link", { name: "MAKE" }));
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("hides the button when registration unmounts", () => {
    const { unmount } = renderWithFilters();
    expect(screen.getByRole("button", { name: "Filters & Order" })).not.toBeNull();

    unmount();
    cleanup();
    render(
      <FilterDrawerProvider>
        <HeaderFilterButton />
      </FilterDrawerProvider>,
    );
    expect(screen.queryByRole("button", { name: "Filters & Order" })).toBeNull();
  });
});
