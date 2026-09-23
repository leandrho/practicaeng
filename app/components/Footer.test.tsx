// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Footer } from "./Footer";

afterEach(cleanup);

describe("Footer", () => {
  it("shows the current year and LeanDev without hardcoding", () => {
    render(<Footer />);

    const year = String(new Date().getFullYear());
    const footer = screen.getByRole("contentinfo");
    expect(footer.textContent).toContain(year);
    expect(footer.textContent).toContain("LeanDev");
  });
});
