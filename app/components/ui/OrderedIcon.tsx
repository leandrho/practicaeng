type OrderedIconProps = {
  className?: string;
};

/**
 * Icono de orden (lista numerada).
 * Usa `currentColor`: hereda el color del botón que lo contiene.
 */
export function OrderedIcon({ className = "" }: OrderedIconProps) {
  return (
    <svg
      className={`ordered-icon ${className}`.trim()}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M10 6h11" />
      <path d="M10 12h11" />
      <path d="M10 18h11" />
      <path d="M4 6h1v4" />
      <path d="M4 10h2" />
      <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
    </svg>
  );
}
