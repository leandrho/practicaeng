import type { Filter, Filterable } from "../../src/application/filterCards";

export type FiltersContentProps = {
  cards: readonly Filterable[];
  filter: Filter;
  pathname: string;
  onNavigate?: () => void;
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

export function FiltersContent({ cards, filter, pathname, onNavigate }: FiltersContentProps) {
  const levels = [...new Set(cards.map((card) => card.level))];
  const categories = [...new Set(cards.map((card) => card.category))];

  return (
    <nav className="filters" aria-label="Filtros">
      <div className="filters__group">
        <span className="filters__label">Nivel</span>
        <div className="filters__options">
          <a
            className="chip"
            aria-current={filter.level === undefined ? "page" : undefined}
            href={createFilterHref(pathname, { category: filter.category })}
            onClick={onNavigate}
          >
            Todos
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
        <span className="filters__label">Categoría</span>
        <div className="filters__options">
          <a
            className="chip"
            aria-current={filter.category === undefined ? "page" : undefined}
            href={createFilterHref(pathname, { level: filter.level })}
            onClick={onNavigate}
          >
            Todas
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
        Limpiar filtros
      </a>
    </nav>
  );
}
