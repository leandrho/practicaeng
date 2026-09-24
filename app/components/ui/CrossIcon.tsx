type CrossIconProps = {
  className?: string;
};

/**
 * Icono de error: círculo rojo con cruz blanca. Decorativo
 * (el texto del feedback ya lo anuncia).
 */
export function CrossIcon({ className = "" }: CrossIconProps) {
  return (
    <svg
      className={`feedback-icon feedback-icon--incorrect ${className}`.trim()}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="10" fill="#dc2626" />
      <path
        d="M9 9l6 6"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M15 9l-6 6"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
