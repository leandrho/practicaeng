// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { FiltersContent } from "./FiltersContent";

afterEach(cleanup);

describe("FiltersContent", () => {
  it("muestra los niveles y categorías recibidos y preserva el otro filtro", () => {
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
});
