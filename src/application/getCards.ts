import type { Card } from "../domain/card";
import type { Section } from "../domain/sections";

export type CardSection = Exclude<Section, "word-formation">;

export type CardRepository = {
  getCards(section: CardSection): Card[];
};

export function getCards(repository: CardRepository, section: CardSection): Card[] {
  return repository.getCards(section);
}
