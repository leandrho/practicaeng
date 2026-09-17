import { describe, expect, it } from "vitest";
import { shuffle } from "./shuffle";

describe("shuffle", () => {
  it("devuelve el mismo orden con la misma semilla", () => {
    const cards = ["make a decision", "give up", "in charge of", "piece of cake"];

    expect(shuffle(cards, 42)).toEqual(shuffle(cards, 42));
  });

  it("no muta el array de entrada", () => {
    const cards = ["make a decision", "give up", "in charge of", "piece of cake"];
    const original = [...cards];
    const shuffled = shuffle(cards, 42);

    expect(shuffled).not.toBe(cards);
    expect(cards).toEqual(original);
    expect(shuffled).toHaveLength(cards.length);
    expect(shuffled).toEqual(expect.arrayContaining(cards));
  });
});
