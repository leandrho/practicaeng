import type { Card, CardType } from "../domain/card";

export type Filter = {
  level?: string;
  category?: string;
  type?: CardType;
};

export function filterCards(cards: Card[], filter: Filter): Card[] {
  return cards.filter(
    (card) =>
      (filter.level === undefined || card.level === filter.level) &&
      (filter.category === undefined || card.category === filter.category) &&
      (filter.type === undefined || card.type === filter.type),
  );
}
