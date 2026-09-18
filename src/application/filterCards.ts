import type { Card, CardType } from "../domain/card";

export type Filterable = {
  level: string;
  category: string;
};

export type Filter = {
  level?: string;
  category?: string;
  type?: CardType;
};

export function filterCards(cards: Card[], filter: Filter): Card[];
export function filterCards<T extends Filterable>(
  cards: T[],
  filter: Omit<Filter, "type">,
): T[];
export function filterCards<T extends Filterable>(cards: T[], filter: Filter): T[] {
  return cards.filter(
    (card) =>
      (filter.level === undefined || card.level === filter.level) &&
      (filter.category === undefined || card.category === filter.category) &&
      (filter.type === undefined || ("type" in card && card.type === filter.type)),
  );
}
