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
  onFilterNavigate?: (
    href: string,
    next: Filter,
    event: React.MouseEvent,
  ) => void;
};

export function parseOrderMode(value: string | null | undefined): OrderMode {
  return value === "ordered" ? "ordered" : "shuffled";
}

export function createFilterHref(
  pathname: string,
  filter: Filter,
  order: string | null | undefined = undefined,
): string {
  const searchParams = new URLSearchParams();

  if (filter.category !== undefined) {
    searchParams.set("category", filter.category);
  }
  if (parseOrderMode(order) === "ordered") {
    searchParams.set("order", "ordered");
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
  onFilterNavigate,
}: FiltersContentProps) {
  const categories = [...new Set(cards.map((card) => card.category))];
  const mode = order?.mode;

  function handleFilterClick(
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    next: Filter,
  ) {
    onFilterNavigate?.(href, next, event);
    if (!event.defaultPrevented) {
      onNavigate?.();
    }
  }

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
      {hideFilters ? null : (
        <>
          <div className="filters__group">
            <span className="filters__label">Category</span>
            <div className="filters__options">
              <a
                className="chip"
                aria-current={filter.category === undefined ? "page" : undefined}
                href={createFilterHref(pathname, {}, mode)}
                onClick={(event) =>
                  handleFilterClick(
                    event,
                    createFilterHref(pathname, {}, mode),
                    {},
                  )
                }
              >
                All
              </a>
              {categories.map((category) => (
                <a
                  className="chip"
                  aria-current={filter.category === category ? "page" : undefined}
                  href={createFilterHref(pathname, { category }, mode)}
                  key={category}
                  onClick={(event) =>
                    handleFilterClick(
                      event,
                      createFilterHref(pathname, { category }, mode),
                      { category },
                    )
                  }
                >
                  {category}
                </a>
              ))}
            </div>
          </div>
          <a
            className="btn btn--ghost filters__clear"
            href={createFilterHref(pathname, {}, mode)}
            onClick={(event) => handleFilterClick(event, createFilterHref(pathname, {}, mode), {})}
          >
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
