import type { Card } from "../../src/domain/card";
import FlashcardClient from "./FlashcardClient";

type FlashcardProps = {
  cards: Card[];
};

export function Flashcard({ cards }: FlashcardProps) {
  return <FlashcardClient cards={cards} />;
}
