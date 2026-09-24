"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { filterCards, type Filter } from "../../src/application/filterCards";
import type { Card } from "../../src/domain/card";
import FlashcardClient from "./FlashcardClient";
import { RegisterPracticeFilters, type OrderMode } from "./FilterDrawerProvider";
import { createFilterHref, parseOrderMode } from "./FiltersContent";
import { Button } from "./ui/Button";

type SectionPracticeClientProps = {
  cards: Card[];
  pathname: string;
  accent: string;
  showTypeBadge?: boolean;
  disableFilters?: boolean;
};

type PendingChange =
  | { type: "order"; mode: OrderMode; reshuffle: boolean }
  | { type: "filter"; href: string };

export function SectionPracticeClient({
  cards,
  pathname,
  accent,
  showTypeBadge = false,
  disableFilters = false,
}: SectionPracticeClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlKey = searchParams.toString();
  const urlMode = parseOrderMode(searchParams.get("order"));
  const [orderState, setOrderState] = useState(() => ({ urlKey, mode: urlMode }));
  // En navegación externa (back/forward o URL compartida), prevalece la URL.
  const mode = orderState.urlKey === urlKey ? orderState.mode : urlMode;
  if (orderState.urlKey !== urlKey) {
    setOrderState({ urlKey, mode: urlMode });
  }
  const [reshuffleCount, setReshuffleCount] = useState(0);
  const [hasProgress, setHasProgress] = useState(false);
  const [pending, setPending] = useState<PendingChange | null>(null);
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  const category = searchParams.get("category") ?? undefined;
  const filter: Filter = useMemo(
    () =>
      disableFilters
        ? {}
        : { category },
    [disableFilters, category],
  );
  const filteredCards = useMemo(
    () => (disableFilters ? cards : filterCards(cards, filter)),
    [cards, disableFilters, filter],
  );
  const selection = useMemo(
    () => ({
      category: filter.category,
      order: mode,
    }),
    [filter.category, mode],
  );

  const handleProgressChange = useCallback((progress: boolean) => {
    setHasProgress(progress);
  }, []);

  const applyOrder = useCallback(
    (next: OrderMode, reshuffle: boolean) => {
      setOrderState({ urlKey, mode: next });
      router.push(createFilterHref(pathname, filter, next));
      if (reshuffle) {
        setReshuffleCount((count) => count + 1);
      }
    },
    [urlKey, router, pathname, filter],
  );

  const requestOrderChange = useCallback(
    (next: OrderMode) => {
      if (pending !== null) {
        return;
      }
      if (next === mode) {
        if (next !== "shuffled") {
          return;
        }
        if (hasProgress) {
          setPending({ type: "order", mode: next, reshuffle: true });
        } else {
          setReshuffleCount((count) => count + 1);
        }
        return;
      }
      if (hasProgress) {
        setPending({ type: "order", mode: next, reshuffle: next === "shuffled" });
      } else {
        applyOrder(next, next === "shuffled");
      }
    },
    [mode, hasProgress, pending, applyOrder],
  );

  const order = useMemo(
    () => ({ mode, onModeChange: requestOrderChange }),
    [mode, requestOrderChange],
  );

  const handleFilterNavigate = useCallback(
    (href: string, next: Filter, event: React.MouseEvent) => {
      if (pending !== null) {
        event.preventDefault();
        return;
      }
      const sameCategory =
        (next.category ?? undefined) === (filter.category ?? undefined);
      if (hasProgress && !sameCategory) {
        event.preventDefault();
        setPending({ type: "filter", href });
      }
      // Sin progreso pendiente: navegación por defecto del enlace.
    },
    [filter.category, hasProgress, pending],
  );

  function confirmPending() {
    if (pending === null) {
      return;
    }
    if (pending.type === "order") {
      applyOrder(pending.mode, pending.reshuffle);
    } else {
      router.push(pending.href);
    }
    setPending(null);
  }

  function cancelPending() {
    // Cancel conserva sesión, selección y URL previas.
    setPending(null);
  }

  useEffect(() => {
    if (pending === null) {
      return;
    }
    cancelRef.current?.focus();
  }, [pending]);

  useEffect(() => {
    if (pending === null) {
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setPending(null);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [pending]);

  return (
    <>
      <RegisterPracticeFilters
        cards={cards}
        filter={filter}
        pathname={pathname}
        order={order}
        hideFilters={disableFilters}
        onFilterNavigate={handleFilterNavigate}
      />
      <FlashcardClient
        cards={filteredCards}
        allCards={cards}
        route={pathname}
        selection={selection}
        reshuffleCount={reshuffleCount}
        clearFiltersPath={createFilterHref(pathname, {}, mode)}
        accent={accent}
        showTypeBadge={showTypeBadge}
        onProgressChange={handleProgressChange}
      />
      {pending !== null ? (
        <div className="practice-confirm__overlay">
          <div
            className="practice-confirm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="practice-confirm-title"
            aria-describedby="practice-confirm-desc"
          >
            <h2 id="practice-confirm-title">Start new session?</h2>
            <p id="practice-confirm-desc">
              This replaces the active session and its progress will be lost.
            </p>
            <div className="practice-confirm__actions">
              <Button
                className="btn btn--primary"
                onClick={confirmPending}
              >
                Start new session
              </Button>
              <Button
                ref={cancelRef}
                className="btn btn--ghost"
                onClick={cancelPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
