"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { filterCards, type Filter } from "../../src/application/filterCards";
import { shuffle } from "../../src/application/shuffle";
import type { Card } from "../../src/domain/card";
import FlashcardClient from "./FlashcardClient";
import { RegisterPracticeFilters, type OrderMode } from "./FilterDrawerProvider";

type SectionPracticeClientProps = {
  cards: Card[];
  pathname: string;
  accent: string;
  showTypeBadge?: boolean;
  disableFilters?: boolean;
};

export function SectionPracticeClient({
  cards,
  pathname,
  accent,
  showTypeBadge = false,
  disableFilters = false,
}: SectionPracticeClientProps) {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<OrderMode>("shuffled");
  const [reshuffleCount, setReshuffleCount] = useState(0);
  const filter: Filter = disableFilters
    ? {}
    : {
        level: searchParams.get("level") ?? undefined,
        category: searchParams.get("category") ?? undefined,
      };
  const filteredCards = disableFilters ? cards : filterCards(cards, filter);
  const visibleCards = useMemo(
    () => (mode === "ordered" ? filteredCards : shuffle(filteredCards)),
    // reshuffleCount forces a fresh shuffle on demand.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredCards, mode, reshuffleCount],
  );

  const handleModeChange = useCallback((next: OrderMode) => {
    setMode(next);
    if (next === "shuffled") {
      setReshuffleCount((count) => count + 1);
    }
  }, []);

  const order = useMemo(
    () => ({ mode, onModeChange: handleModeChange }),
    [mode, handleModeChange],
  );

  return (
    <>
      <RegisterPracticeFilters
        cards={cards}
        filter={filter}
        pathname={pathname}
        order={order}
        hideFilters={disableFilters}
      />
      <FlashcardClient
        cards={visibleCards}
        clearFiltersPath={pathname}
        accent={accent}
        showTypeBadge={showTypeBadge}
        key={`${filter.level ?? ""}:${filter.category ?? ""}:${mode}:${reshuffleCount}`}
      />
    </>
  );
}
