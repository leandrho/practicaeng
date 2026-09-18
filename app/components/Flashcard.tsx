import type { Card } from "../../src/domain/card";
import FlashcardClient from "./FlashcardClient";

type FlashcardProps = {
  cards: Card[];
  clearFiltersPath: string;
};

export function Flashcard({ cards, clearFiltersPath }: FlashcardProps) {
  return <FlashcardClient cards={cards} clearFiltersPath={clearFiltersPath} />;
}
