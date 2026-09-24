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
import { SlidersIcon } from "./ui/SlidersIcon";

export type OrderMode = "shuffled" | "ordered";

export type OrderControls = {
  mode: OrderMode;
  onModeChange: (mode: OrderMode) => void;
};

export type PracticeFilters = {
  cards: readonly Filterable[];
  filter: Filter;
  pathname: string;
  order?: OrderControls;
  hideFilters?: boolean;
  /**
   * Intercepta la navegación de filtros (SPEC 30 paso 7). Se llama antes de
   * navegar; si `event.preventDefault()` queda activo, el drawer no se cierra
   * y la navegación no ocurre (p. ej. diálogo de confirmación pendiente).
   */
  onFilterNavigate?: (
    href: string,
    next: Filter,
    event: React.MouseEvent,
  ) => void;
};

type FilterDrawerContextValue = {
  config: PracticeFilters | null;
  open: boolean;
  panelId: string;
  register: (config: PracticeFilters) => void;
  updateFilters: (config: PracticeFilters) => void;
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
  const panelRef = useRef<HTMLDivElement | null>(null);

  const returnFocusToTrigger = useCallback(() => {
    const trigger = triggerRef.current;
    if (trigger !== null && trigger.isConnected) {
      trigger.focus();
      return;
    }
    if (typeof document === "undefined") {
      return;
    }
    const candidates = [
      document.querySelector("main h1"),
      document.querySelector("h1"),
      document.querySelector("header a"),
      document.querySelector("header button"),
      document.querySelector("main"),
    ];
    for (const candidate of candidates) {
      if (candidate instanceof HTMLElement && candidate.isConnected) {
        if (!candidate.hasAttribute("tabindex")) {
          candidate.setAttribute("tabindex", "-1");
        }
        candidate.focus();
        return;
      }
    }
  }, []);

  const closeDrawer = useCallback(() => {
    setOpen(false);
    returnFocusToTrigger();
  }, [returnFocusToTrigger]);

  const openDrawer = useCallback(() => {
    setOpen(true);
  }, []);

  const register = useCallback((next: PracticeFilters) => {
    setConfig(next);
  }, []);

  const updateFilters = useCallback((next: PracticeFilters) => {
    setConfig(next);
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
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function getFocusable(): HTMLElement[] {
      const panel = panelRef.current;
      if (panel === null) {
        return [];
      }
      const nodes = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      return nodes.filter(
        (element) => element.getAttribute("aria-hidden") !== "true",
      );
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDrawer();
        return;
      }
      if (event.key !== "Tab") {
        return;
      }
      const focusable = getFocusable();
      if (focusable.length === 0) {
        event.preventDefault();
        closeRef.current?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (first === undefined || last === undefined) {
        return;
      }
      const active = document.activeElement as HTMLElement | null;
      if (event.shiftKey) {
        if (active === first || !panelRef.current?.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, closeDrawer]);

  const value = useMemo<FilterDrawerContextValue>(
    () => ({
      config,
      open,
      panelId,
      register,
      updateFilters,
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
      updateFilters,
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
            ref={panelRef}
            className="filters-drawer__panel"
            role="dialog"
            aria-modal="true"
            aria-label="Filters & Order"
            data-open={open}
            aria-hidden={!open}
            inert={!open}
          >
            <div className="filters-drawer__header">
              <h2 className="filters-drawer__title">Filters & Order</h2>
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
              order={config.order}
              hideFilters={config.hideFilters}
              onFilterNavigate={config.onFilterNavigate}
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
      aria-label="Filters & Order"
      onClick={openDrawer}
    >
      <SlidersIcon />
    </button>
  );
}

export function RegisterPracticeFilters(config: PracticeFilters) {
  const { register, updateFilters, unregister } = useFilterDrawerContext();
  const { cards, filter, pathname, order, hideFilters, onFilterNavigate } = config;

  // Alta al montar la página y baja al salir (ahí sí se cierra el drawer).
  useEffect(() => {
    register({ cards, filter, pathname, order, hideFilters, onFilterNavigate });
    return () => {
      unregister();
    };
    // Intencionalmente una sola vez por página; los cambios van por updateFilters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [register, unregister]);

  // Cambios de filtros u orden: actualiza el contenido sin cerrar el drawer.
  useEffect(() => {
    updateFilters({ cards, filter, pathname, order, hideFilters, onFilterNavigate });
  }, [updateFilters, cards, filter, pathname, order, hideFilters, onFilterNavigate]);

  return null;
}
