// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FiltersContent } from "./FiltersContent";

afterEach(cleanup);

describe("FiltersContent", () => {
  it("shows received levels and categories while preserving the other filter", () => {
    render(
      <FiltersContent
        cards={[
          { level: "B1-B2", category: "MAKE" },
          { level: "C1", category: "TAKE" },
        ]}
        filter={{ category: "MAKE" }}
        pathname="/collocations"
      />,
    );

    expect(screen.getByRole("link", { name: "B1-B2" })).not.toBeNull();
    expect(screen.getByRole("link", { name: "C1" })).not.toBeNull();
    expect(screen.getByRole("link", { name: "MAKE" })).not.toBeNull();
    expect(screen.getByRole("link", { name: "TAKE" })).not.toBeNull();
    expect(screen.getByRole("link", { name: "B1-B2" }).getAttribute("href")).toBe(
      "/collocations?level=B1-B2&category=MAKE",
    );
  });

  it("shows the order controls next to the filters", () => {
    const onModeChange = vi.fn();
    render(
      <FiltersContent
        cards={[{ level: "B1-B2", category: "MAKE" }]}
        filter={{}}
        pathname="/collocations"
        order={{ mode: "ordered", onModeChange }}
      />,
    );

    expect(screen.getByText("Level")).not.toBeNull();
    expect(screen.getByText("Order")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Ordered" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(screen.getByRole("button", { name: "Shuffled" }).getAttribute("aria-pressed")).toBe(
      "false",
    );

    fireEvent.click(screen.getByRole("button", { name: "Shuffled" }));
    expect(onModeChange).toHaveBeenCalledWith("shuffled");
  });

  it("closes the menu when Shuffled is selected", () => {
    const onModeChange = vi.fn();
    const onNavigate = vi.fn();
    render(
      <FiltersContent
        cards={[]}
        filter={{}}
        pathname="/mixed"
        onNavigate={onNavigate}
        order={{ mode: "ordered", onModeChange }}
        hideFilters
      />,
    );

    expect(screen.queryByText("Level")).toBeNull();
    expect(screen.queryByText("Category")).toBeNull();
    expect(screen.queryByRole("link", { name: "Clear filters" })).toBeNull();
    expect(screen.getByText("Order")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Shuffled" }));
    expect(onModeChange).toHaveBeenCalledWith("shuffled");
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it("keeps the menu open when switching order mode", () => {
    const onModeChange = vi.fn();
    const onNavigate = vi.fn();
    render(
      <FiltersContent
        cards={[{ level: "B1-B2", category: "MAKE" }]}
        filter={{}}
        pathname="/collocations"
        onNavigate={onNavigate}
        order={{ mode: "shuffled", onModeChange }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Ordered" }));
    expect(onModeChange).toHaveBeenCalledWith("ordered");
    expect(onNavigate).not.toHaveBeenCalled();
  });
});
