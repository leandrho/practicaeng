type HintIconProps = {
  className?: string;
};

/**
 * Icono de pista/ayuda (lamparita amarilla).
 * Usa `currentColor`: el amarillo lo define `.btn--hint` vía `--hint-icon`.
 */
export function HintIcon({ className = "" }: HintIconProps) {
  return (
    <svg
      className={`hint-icon ${className}`.trim()}
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
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.4 1 2.3h6c0-.9.4-1.8 1-2.3A7 7 0 0 0 12 2z" />
    </svg>
  );
}
