import type { Filter, Filterable } from "../../src/application/filterCards";

type FiltersProps = {
  cards: readonly Filterable[];
  filter: Filter;
  pathname: string;
};

function createFilterHref(pathname: string, filter: Filter): string {
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

export function Filters({ cards, filter, pathname }: FiltersProps) {
  const levels = [...new Set(cards.map((card) => card.level))];
  const categories = [...new Set(cards.map((card) => card.category))];

  return (
    <nav className="filters" aria-label="Filtros">
      <div className="filters__group">
        <span>Nivel</span>
        <div className="filters__options">
          <a
            aria-current={filter.level === undefined ? "page" : undefined}
            href={createFilterHref(pathname, { category: filter.category })}
          >
            Todos
          </a>
          {levels.map((level) => (
            <a
              aria-current={filter.level === level ? "page" : undefined}
              href={createFilterHref(pathname, { ...filter, level })}
              key={level}
            >
              {level}
            </a>
          ))}
        </div>
      </div>
      <div className="filters__group">
        <span>Categoría</span>
        <div className="filters__options">
          <a
            aria-current={filter.category === undefined ? "page" : undefined}
            href={createFilterHref(pathname, { level: filter.level })}
          >
            Todas
          </a>
          {categories.map((category) => (
            <a
              aria-current={filter.category === category ? "page" : undefined}
              href={createFilterHref(pathname, { ...filter, category })}
              key={category}
            >
              {category}
            </a>
          ))}
        </div>
      </div>
      <a className="filters__clear" href={pathname}>
        Limpiar filtros
      </a>
    </nav>
  );
}
