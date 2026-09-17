import type { Card } from "../domain/card";

export type SessionState = {
  cards: Card[];
  index: number;
  revealed: boolean;
};

export type SessionView = SessionState & {
  current: Card | null;
  atStart: boolean;
  atEnd: boolean;
};

export function init(cards: Card[]): SessionView {
  return toView({ cards, index: 0, revealed: false });
}

export function reveal(state: SessionState): SessionView {
  return toView({ ...state, revealed: true });
}

export function next(state: SessionState): SessionView {
  return toView({
    ...state,
    index:
      state.cards.length === 0
        ? 0
        : Math.min(state.index + 1, state.cards.length - 1),
    revealed: false,
  });
}

export function prev(state: SessionState): SessionView {
  return toView({
    ...state,
    index: Math.max(state.index - 1, 0),
    revealed: false,
  });
}

export function goTo(state: SessionState, index: number): SessionView {
  if (index < 0 || index >= state.cards.length) {
    throw new RangeError("El índice de tarjeta está fuera de rango");
  }

  return toView({ ...state, index, revealed: false });
}

function toView(state: SessionState): SessionView {
  const empty = state.cards.length === 0;

  return {
    ...state,
    current: state.cards[state.index] ?? null,
    atStart: empty || state.index === 0,
    atEnd: empty || state.index === state.cards.length - 1,
  };
}
