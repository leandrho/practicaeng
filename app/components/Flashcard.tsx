import type { Card } from "../../src/domain/card";
import FlashcardClient from "./FlashcardClient";

type FlashcardProps = {
  cards: Card[];
  clearFiltersPath: string;
  accent?: string;
};

export function Flashcard({ cards, clearFiltersPath, accent }: FlashcardProps) {
  return <FlashcardClient cards={cards} clearFiltersPath={clearFiltersPath} accent={accent} />;
}
