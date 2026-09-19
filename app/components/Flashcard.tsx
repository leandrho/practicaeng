import type { Card } from "../../src/domain/card";
import FlashcardClient from "./FlashcardClient";

type FlashcardProps = {
  cards: Card[];
  clearFiltersPath: string;
  accent?: string;
  showTypeBadge?: boolean;
};

export function Flashcard({ cards, clearFiltersPath, accent, showTypeBadge = false }: FlashcardProps) {
  return <FlashcardClient cards={cards} clearFiltersPath={clearFiltersPath} accent={accent} showTypeBadge={showTypeBadge} />;
}
