import { describe, expect, it } from "vitest";
import type { Card } from "../domain/card";
import { goTo, init, next, prev, reveal } from "./session";

const cards: Card[] = [
  {
    expression: "make a decision",
    type: "collocation",
    level: "B1-B2",
    meaningEs: "tomar una decisión",
    exampleEn: "I need to make a decision.",
    category: "MAKE",
    sourceFile: "fixture.md",
  },
  {
    expression: "give up",
    type: "phrasal-verb",
    level: "B1-B2",
    meaningEs: "rendirse",
    exampleEn: "Do not give up.",
    category: "general",
    sourceFile: "fixture.md",
  },
];

describe("session", () => {
  it("inicializa en la primera tarjeta", () => {
    const state = init(cards);

    expect(state).toMatchObject({
      index: 0,
      revealed: false,
      current: cards[0],
      atStart: true,
      atEnd: false,
    });
  });

  it("revela sin cambiar índice ni tarjetas", () => {
    const state = init(cards);
    const revealed = reveal(state);

    expect(revealed).not.toBe(state);
    expect(revealed.index).toBe(0);
    expect(revealed.cards).toBe(state.cards);
    expect(revealed.revealed).toBe(true);
    expect(state.revealed).toBe(false);
  });

  it("avanza y resetea el revelado", () => {
    const state = reveal(init(cards));
    const advanced = next(state);

    expect(advanced).toMatchObject({
      index: 1,
      revealed: false,
      current: cards[1],
      atEnd: true,
    });
  });

  it("se queda en la última tarjeta", () => {
    const state = goTo(init(cards), 1);

    expect(next(state)).toMatchObject({ index: 1, atEnd: true });
  });

  it("se queda en la primera tarjeta", () => {
    const state = init(cards);

    expect(prev(state)).toMatchObject({ index: 0, atStart: true });
  });

  it("mantiene una sesión vacía en los límites", () => {
    const state = init([]);

    expect(next(state)).toMatchObject({
      index: 0,
      current: null,
      atStart: true,
      atEnd: true,
    });
    expect(prev(state)).toMatchObject({
      index: 0,
      current: null,
      atStart: true,
      atEnd: true,
    });
  });

  it("salta a una tarjeta válida y resetea el revelado", () => {
    const state = reveal(init(cards));

    expect(goTo(state, 1)).toMatchObject({
      index: 1,
      current: cards[1],
      revealed: false,
    });
  });

  it("rechaza índices fuera de rango", () => {
    const state = init(cards);

    expect(() => goTo(state, -1)).toThrow(RangeError);
    expect(() => goTo(state, cards.length)).toThrow(RangeError);
  });

  it("no muta el estado de entrada", () => {
    const state = Object.freeze(init(cards));
    const before = { ...state };

    next(state);
    prev(state);
    reveal(state);
    goTo(state, 1);

    expect(state).toEqual(before);
  });
});
