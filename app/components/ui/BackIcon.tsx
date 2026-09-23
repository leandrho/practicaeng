type BackIconProps = {
  className?: string;
};

/**
 * Icono de regreso (chevron en círculo).
 * Usa `currentColor`: hereda el color del enlace que lo contiene.
 */
export function BackIcon({ className = "" }: BackIconProps) {
  return (
    <svg
      className={`back-icon ${className}`.trim()}
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
      <circle cx="12" cy="12" r="10" />
      <path d="m14 16-4-4 4-4" />
    </svg>
  );
}
