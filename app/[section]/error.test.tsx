// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SectionError from "./error";

afterEach(cleanup);

describe("SectionError", () => {
  it("shows the error in English and retries", () => {
    const retry = vi.fn();
    render(<SectionError retry={retry} />);

    expect(screen.getByText("We couldn't load this section")).not.toBeNull();
    expect(screen.getByText("Something went wrong.")).not.toBeNull();
    expect(
      screen.getByText("Try again. If the problem persists, come back later."),
    ).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
