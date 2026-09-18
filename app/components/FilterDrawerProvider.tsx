"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Filter, Filterable } from "../../src/application/filterCards";
import { FiltersContent } from "./FiltersContent";

export type PracticeFilters = {
  cards: readonly Filterable[];
  filter: Filter;
  pathname: string;
};

type FilterDrawerContextValue = {
  config: PracticeFilters | null;
  open: boolean;
  panelId: string;
  register: (config: PracticeFilters) => void;
  unregister: () => void;
  setTrigger: (element: HTMLButtonElement | null) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const FilterDrawerContext =
  createContext<FilterDrawerContextValue | null>(null);

function useFilterDrawerContext(): FilterDrawerContextValue {
  const value = useContext(FilterDrawerContext);
  if (value === null) {
    throw new Error(
      "useFilterDrawerContext must be used within FilterDrawerProvider",
    );
  }
  return value;
}

/**
 * Isla Client global (SPEC 11 paso 7). Vive en `app/layout.tsx` y expone:
 * - botón "Filtros" en el header (solo en páginas de práctica),
 * - drawer superpuesto con overlay en todos los viewports.
 * Cada página de práctica registra sus filtros con
 * `RegisterPracticeFilters`. Sin persistencia: siempre arranca oculto.
 */
export function FilterDrawerProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<PracticeFilters | null>(null);
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  const closeDrawer = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  const openDrawer = useCallback(() => {
    setOpen(true);
  }, []);

  const register = useCallback((next: PracticeFilters) => {
    setConfig(next);
    setOpen(false);
  }, []);

  const unregister = useCallback(() => {
    setConfig(null);
    setOpen(false);
  }, []);

  const setTrigger = useCallback((element: HTMLButtonElement | null) => {
    triggerRef.current = element;
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDrawer();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, closeDrawer]);

  const value = useMemo<FilterDrawerContextValue>(
    () => ({
      config,
      open,
      panelId,
      register,
      unregister,
      setTrigger,
      openDrawer,
      closeDrawer,
    }),
    [
      config,
      open,
      panelId,
      register,
      unregister,
      setTrigger,
      openDrawer,
      closeDrawer,
    ],
  );

  return (
    <FilterDrawerContext.Provider value={value}>
      {children}
      {config !== null && (
        <>
          {open && (
            <button
              type="button"
              tabIndex={-1}
              className="filters-drawer__overlay"
              aria-label="Close filters panel"
              onClick={closeDrawer}
            />
          )}
          <div
            id={panelId}
            className="filters-drawer__panel"
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            data-open={open}
            aria-hidden={!open}
            inert={!open}
          >
            <div className="filters-drawer__header">
              <h2 className="filters-drawer__title">Filters</h2>
              <button
                type="button"
                ref={closeRef}
                className="btn btn--ghost"
                aria-label="Close filters"
                onClick={closeDrawer}
              >
                ✕
              </button>
            </div>
            <FiltersContent
              cards={config.cards}
              filter={config.filter}
              pathname={config.pathname}
              onNavigate={closeDrawer}
            />
          </div>
        </>
      )}
    </FilterDrawerContext.Provider>
  );
}

export function HeaderFilterButton() {
  const { config, open, panelId, setTrigger, openDrawer } =
    useFilterDrawerContext();

  if (config === null) {
    return null;
  }

  return (
    <button
      type="button"
      ref={setTrigger}
      className="btn btn--ghost site-header__filters"
      aria-expanded={open}
      aria-controls={panelId}
      onClick={openDrawer}
    >
      Filters
    </button>
  );
}

export function RegisterPracticeFilters(config: PracticeFilters) {
  const { register, unregister } = useFilterDrawerContext();
  const { cards, filter, pathname } = config;

  useEffect(() => {
    register({ cards, filter, pathname });
    return () => {
      unregister();
    };
  }, [register, unregister, cards, filter, pathname]);

  return null;
}
