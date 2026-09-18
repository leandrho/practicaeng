// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SectionError from "./error";

afterEach(cleanup);

describe("SectionError", () => {
  it("muestra el error en español rioplatense y reintenta", () => {
    const retry = vi.fn();
    render(<SectionError retry={retry} />);

    expect(screen.getByText("No pudimos cargar esta sección")).not.toBeNull();
    expect(screen.getByText("Algo salió mal.")).not.toBeNull();
    expect(
      screen.getByText("Probá de nuevo. Si el problema sigue, volvé más tarde."),
    ).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
