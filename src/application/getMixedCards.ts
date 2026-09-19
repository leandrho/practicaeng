import type { Card } from "../domain/card";
import type { CardRepository, CardSection } from "./getCards";

export function getMixedCards(
  repository: CardRepository,
  sections: readonly CardSection[],
): Card[] {
  return sections.flatMap((section) => repository.getCards(section));
}
