"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { filterCards, type Filter } from "../../src/application/filterCards";
import type { WordFamily } from "../../src/domain/word-formation";
import {
  getPracticeStorageBackend,
  isValidPracticeSessionShape,
  loadPracticeState,
} from "../../src/infrastructure/ui/practice-storage";
import WordFormationClient from "./WordFormationClient";
import { RegisterPracticeFilters, type OrderMode } from "./FilterDrawerProvider";
import { Button } from "./ui/Button";

type WordFormationSectionClientProps = {
  families: WordFamily[];
  pathname: string;
  accent: string;
};

type PendingChange =
  | { type: "order"; mode: OrderMode; reshuffle: boolean }
  | { type: "filter"; href: string };

function readStoredOrder(
  pathname: string,
  level: string | undefined,
  category: string | undefined,
): OrderMode {
  try {
    const stored = loadPracticeState(getPracticeStorageBackend());
    const candidate = stored.sessions[pathname];
    if (
      candidate !== undefined &&
      isValidPracticeSessionShape(candidate) &&
      (candidate.selection.level ?? undefined) === (level ?? undefined) &&
      (candidate.selection.category ?? undefined) === (category ?? undefined)
    ) {
      return candidate.selection.order;
    }
  } catch {
    // Sin almacenamiento: se empieza mezclado y se sigue en memoria.
  }
  return "shuffled";
}

export function WordFormationSectionClient({
  families,
  pathname,
  accent,
}: WordFormationSectionClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialLevel = searchParams.get("level") ?? undefined;
  const initialCategory = searchParams.get("category") ?? undefined;
  // Recargar conserva el orden: la página vive tras Suspense (solo cliente),
  // así que leer el storage en el inicializador no desincroniza el servidor.
  const [mode, setMode] = useState<OrderMode>(() =>
    readStoredOrder(pathname, initialLevel, initialCategory),
  );
  const [reshuffleCount, setReshuffleCount] = useState(0);
  const [hasProgress, setHasProgress] = useState(false);
  const [pending, setPending] = useState<PendingChange | null>(null);
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  const level = searchParams.get("level") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const filter: Filter = useMemo(
    () => ({
      level,
      category,
    }),
    [level, category],
  );
  const filteredFamilies = useMemo(
    () => filterCards(families, filter),
    [families, filter],
  );
  const selection = useMemo(
    () => ({
      level: filter.level,
      category: filter.category,
      order: mode,
    }),
    [filter.level, filter.category, mode],
  );

  const handleProgressChange = useCallback((progress: boolean) => {
    setHasProgress(progress);
  }, []);

  function applyOrder(next: OrderMode, reshuffle: boolean) {
    setMode(next);
    if (reshuffle) {
      setReshuffleCount((count) => count + 1);
    }
  }

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
    [mode, hasProgress, pending],
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
      const sameLevel = (next.level ?? undefined) === (filter.level ?? undefined);
      const sameCategory =
        (next.category ?? undefined) === (filter.category ?? undefined);
      if (hasProgress && (!sameLevel || !sameCategory)) {
        event.preventDefault();
        setPending({ type: "filter", href });
      }
      // Sin progreso pendiente: navegación por defecto del enlace.
    },
    [filter.level, filter.category, hasProgress, pending],
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
        cards={families}
        filter={filter}
        pathname={pathname}
        order={order}
        onFilterNavigate={handleFilterNavigate}
      />
      <WordFormationClient
        families={filteredFamilies}
        allFamilies={families}
        route={pathname}
        selection={selection}
        reshuffleCount={reshuffleCount}
        clearFiltersPath={pathname}
        accent={accent}
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
