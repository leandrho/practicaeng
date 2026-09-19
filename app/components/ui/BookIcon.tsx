type BookIconProps = {
  className?: string;
};

/**
 * Icono de libro abierto (ayuda de contexto, cyan).
 * Usa `currentColor`: el cyan lo define `.btn--context` vía `--context-icon`.
 */
export function BookIcon({ className = "" }: BookIconProps) {
  return (
    <svg
      className={`book-icon ${className}`.trim()}
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
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
