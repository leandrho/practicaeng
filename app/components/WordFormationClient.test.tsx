// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { WordFamily } from "../../src/domain/word-formation";
import WordFormationClient from "./WordFormationClient";

const family: WordFamily = {
  base: "decide",
  noun: "decision",
  adjective: "decisive",
  adverb: "decisively",
  meaningHint: "decidir",
  examples: [],
};

const secondFamily: WordFamily = {
  base: "act",
  noun: "action",
  adjective: "active",
  adverb: "actively",
  meaningHint: "actuar",
  examples: [],
};

const familyWithMissingForms: WordFamily = {
  base: "announce",
  noun: "announcement",
  meaningHint: "anunciar",
  examples: [],
};

afterEach(cleanup);

describe("WordFormationClient", () => {
  it("muestra la base sin las formas antes de revelar", () => {
    render(<WordFormationClient families={[family]} />);

    expect(screen.getByRole("heading", { name: "DECIDE" })).not.toBeNull();
    expect(screen.queryByText("decision")).toBeNull();
    expect(screen.queryByText("decisive")).toBeNull();
    expect(screen.queryByText("decisively")).toBeNull();
  });

  it("informa cuando la respuesta es correcta", () => {
    render(<WordFormationClient families={[family]} />);

    fireEvent.change(screen.getByLabelText(/complete with the correct form/i), {
      target: { value: "decision" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Comprobar" }));

    expect(screen.getByText("Correcto: decision")).not.toBeNull();
  });

  it("informa cuando la respuesta es incorrecta", () => {
    render(<WordFormationClient families={[family]} />);

    fireEvent.change(screen.getByLabelText(/complete with the correct form/i), {
      target: { value: "decisions" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Comprobar" }));

    expect(screen.getByText("Todavía no: probá de nuevo.")).not.toBeNull();
  });

  it("resetea el frente al cambiar de familia", () => {
    render(<WordFormationClient families={[family, secondFamily]} />);

    fireEvent.change(screen.getByLabelText(/complete with the correct form/i), {
      target: { value: "decision" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Comprobar" }));
    fireEvent.click(screen.getByRole("button", { name: "Revelar familia" }));
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("");
    expect(screen.queryByText("Correcto: decision")).toBeNull();
    expect(screen.queryByText("action")).toBeNull();
  });

  it("comprueba con Enter dentro del input", () => {
    render(<WordFormationClient families={[family]} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "decision" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(screen.getByText("Correcto: decision")).not.toBeNull();
  });

  it("no revela cuando Espacio se usa en el input", () => {
    render(<WordFormationClient families={[family]} />);

    const input = screen.getByRole("textbox");
    expect(fireEvent.keyDown(input, { key: " " })).toBe(true);
    fireEvent.change(input, { target: { value: " " } });

    expect((input as HTMLInputElement).value).toBe(" ");
    expect(screen.queryByText("Noun:")).toBeNull();
  });

  it("revela con Espacio fuera del input", () => {
    render(<WordFormationClient families={[family]} />);

    fireEvent.keyDown(window, { key: " " });

    expect(screen.getByText("Noun:")).not.toBeNull();
    expect(screen.getByText("decision")).not.toBeNull();
    expect(screen.getByText("decisive")).not.toBeNull();
    expect(screen.getByText("decisively")).not.toBeNull();
  });

  it("muestra las formas ausentes como un guion al revelar", () => {
    render(<WordFormationClient families={[familyWithMissingForms]} />);

    fireEvent.click(screen.getByRole("button", { name: "Revelar familia" }));

    expect(screen.getByText("announcement")).not.toBeNull();
    expect(screen.getAllByText("—")).toHaveLength(2);
  });
});
