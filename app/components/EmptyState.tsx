import { Button } from "./ui/Button";

type EmptyStateProps = {
  clearFiltersPath: string;
};

/**
 * Estado vacío de filtros. El texto es invariante pedagógica
 * (verificado por tests): solo cambia el envoltorio visual.
 */
export function EmptyState({ clearFiltersPath }: EmptyStateProps) {
  return (
    <section className="empty-state">
      <svg
        aria-hidden="true"
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="14" rx="2" />
        <path d="M3 9h18M8 21h8" />
      </svg>
      <p>No hay tarjetas con estos filtros.</p>
      <form action={clearFiltersPath}>
        <Button className="btn btn--primary" type="submit">
          Limpiar filtros
        </Button>
      </form>
    </section>
  );
}
