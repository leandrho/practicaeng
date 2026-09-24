import type { Filter, Filterable } from "../../src/application/filterCards";
import type { OrderControls, OrderMode } from "./FilterDrawerProvider";
import { OrderedIcon } from "./ui/OrderedIcon";
import { ShuffleIcon } from "./ui/ShuffleIcon";

export type FiltersContentProps = {
  cards: readonly Filterable[];
  filter: Filter;
  pathname: string;
  onNavigate?: () => void;
  order?: OrderControls;
  hideFilters?: boolean;
  formFilter?: {
    options: readonly string[];
    selected?: string;
    onChange: (form?: string) => void;
  };
};

export function createFilterHref(pathname: string, filter: Filter): string {
  const searchParams = new URLSearchParams();

  if (filter.level !== undefined) {
    searchParams.set("level", filter.level);
  }
  if (filter.category !== undefined) {
    searchParams.set("category", filter.category);
  }

  const query = searchParams.toString();
  return query === "" ? pathname : `${pathname}?${query}`;
}

export function FiltersContent({
  cards,
  filter,
  pathname,
  onNavigate,
  order,
  hideFilters = false,
  formFilter,
}: FiltersContentProps) {
  const levels = [...new Set(cards.map((card) => card.level))];
  const categories = [...new Set(cards.map((card) => card.category))];

  function handleOrderSelect(next: OrderMode) {
    if (order === undefined) {
      return;
    }
    order.onModeChange(next);
    if (next === "shuffled") {
      // Shuffled siempre genera un orden nuevo: cerrar para mostrarlo.
      onNavigate?.();
    }
  }

  return (
    <nav className="filters" aria-label="Filters & Order">
      {formFilter ? (
        <div className="filters__group">
          <span className="filters__label">Verb tense / form</span>
          <div className="filters__options">
            {[undefined, ...formFilter.options].map((form) => (
              <button
                key={form ?? "all"}
                type="button"
                className="chip"
                aria-pressed={formFilter.selected === form}
                onClick={() => { formFilter.onChange(form); onNavigate?.(); }}
              >
                {form ?? "All"}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {hideFilters ? null : (
        <>
          <div className="filters__group">
            <span className="filters__label">Level</span>
            <div className="filters__options">
              <a
                className="chip"
                aria-current={filter.level === undefined ? "page" : undefined}
                href={createFilterHref(pathname, { category: filter.category })}
                onClick={onNavigate}
              >
                All
              </a>
              {levels.map((level) => (
                <a
                  className="chip"
                  aria-current={filter.level === level ? "page" : undefined}
                  href={createFilterHref(pathname, { ...filter, level })}
                  key={level}
                  onClick={onNavigate}
                >
                  {level}
                </a>
              ))}
            </div>
          </div>
          <div className="filters__group">
            <span className="filters__label">Category</span>
            <div className="filters__options">
              <a
                className="chip"
                aria-current={filter.category === undefined ? "page" : undefined}
                href={createFilterHref(pathname, { level: filter.level })}
                onClick={onNavigate}
              >
                All
              </a>
              {categories.map((category) => (
                <a
                  className="chip"
                  aria-current={filter.category === category ? "page" : undefined}
                  href={createFilterHref(pathname, { ...filter, category })}
                  key={category}
                  onClick={onNavigate}
                >
                  {category}
                </a>
              ))}
            </div>
          </div>
          <a className="btn btn--ghost filters__clear" href={pathname} onClick={onNavigate}>
            Clear filters
          </a>
        </>
      )}
      {order === undefined ? null : (
        <div className="filters__group">
          <span className="filters__label">Order</span>
          <div className="segmented" role="group" aria-label="Order mode">
            <button
              type="button"
              className="segmented__option"
              aria-pressed={order.mode === "shuffled"}
              title={order.mode === "shuffled" ? "Reshuffle cards" : undefined}
              onClick={() => handleOrderSelect("shuffled")}
            >
              <ShuffleIcon />
              Shuffled
            </button>
            <button
              type="button"
              className="segmented__option"
              aria-pressed={order.mode === "ordered"}
              onClick={() => handleOrderSelect("ordered")}
            >
              <OrderedIcon />
              Ordered
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
