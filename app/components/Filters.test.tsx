// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createFilterHref, FiltersContent, parseOrderMode } from "./FiltersContent";

afterEach(cleanup);

describe("FiltersContent", () => {
  it("keeps category and order in links while dropping legacy level", () => {
    render(
      <FiltersContent
        cards={[
          { level: "B1-B2", category: "MAKE" },
          { level: "C1", category: "TAKE" },
        ]}
        filter={{ level: "B1-B2", category: "MAKE" }}
        pathname="/collocations"
        order={{ mode: "ordered", onModeChange: vi.fn() }}
      />,
    );

    expect(screen.queryByText("Level")).toBeNull();
    expect(screen.getByRole("link", { name: "MAKE" })).not.toBeNull();
    expect(screen.getByRole("link", { name: "TAKE" })).not.toBeNull();
    expect(screen.getByRole("link", { name: "TAKE" }).getAttribute("href")).toBe(
      "/collocations?category=TAKE&order=ordered",
    );
    expect(screen.getByRole("link", { name: "All" }).getAttribute("href")).toBe(
      "/collocations?order=ordered",
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

    expect(screen.queryByText("Level")).toBeNull();
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

describe("filter URLs", () => {
  it("normalizes invalid modes and omits shuffled and legacy level", () => {
    expect(parseOrderMode("random")).toBe("shuffled");
    expect(parseOrderMode(null)).toBe("shuffled");
    expect(parseOrderMode("ordered")).toBe("ordered");
    expect(createFilterHref("/collocations", { level: "B1-B2", category: "MAKE" }, "random"))
      .toBe("/collocations?category=MAKE");
    expect(createFilterHref("/collocations", { category: "MAKE" }, "shuffled"))
      .toBe("/collocations?category=MAKE");
    expect(createFilterHref("/collocations", { category: "MAKE" }, "ordered"))
      .toBe("/collocations?category=MAKE&order=ordered");
  });
});
