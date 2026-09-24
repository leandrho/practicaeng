type CheckIconProps = {
  className?: string;
};

/**
 * Icono de acierto: círculo verde con tilde blanca. Decorativo
 * (el texto del feedback ya lo anuncia).
 */
export function CheckIcon({ className = "" }: CheckIconProps) {
  return (
    <svg
      className={`feedback-icon feedback-icon--correct ${className}`.trim()}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="10" fill="#16a34a" />
      <path
        d="M8 12.5l2.5 2.5L16 9.5"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
