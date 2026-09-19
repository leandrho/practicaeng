"use client";

import { useSearchParams } from "next/navigation";
import { filterCards, type Filter } from "../../src/application/filterCards";
import type { Card } from "../../src/domain/card";
import FlashcardClient from "./FlashcardClient";
import { RegisterPracticeFilters } from "./FilterDrawerProvider";

type SectionPracticeClientProps = {
  cards: Card[];
  pathname: string;
  accent: string;
};

export function SectionPracticeClient({
  cards,
  pathname,
  accent,
}: SectionPracticeClientProps) {
  const searchParams = useSearchParams();
  const filter: Filter = {
    level: searchParams.get("level") ?? undefined,
    category: searchParams.get("category") ?? undefined,
  };
  const filteredCards = filterCards(cards, filter);

  return (
    <>
      <RegisterPracticeFilters cards={cards} filter={filter} pathname={pathname} />
      <FlashcardClient
        cards={filteredCards}
        clearFiltersPath={pathname}
        accent={accent}
        key={`${filter.level ?? ""}:${filter.category ?? ""}`}
      />
    </>
  );
}
