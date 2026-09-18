import type { HintId } from "../../domain/hints";

type HintGalleryProps = {
  hintId: HintId;
};

function hintVariant(hintId: HintId): string {
  if (hintId.startsWith("fallback:")) {
    return hintId.slice("fallback:".length);
  }

  return hintId;
}

export function HintGallery({ hintId }: HintGalleryProps) {
  const variant = hintVariant(hintId);

  return (
    <figure className="visual-hint" data-hint={variant} role="img" aria-label="Pista visual animada">
      <div className="visual-hint__motion" aria-hidden="true">
        <svg viewBox="0 0 160 96" focusable="false">
          <path className="visual-hint__path" d="M20 69C43 25 64 87 84 42s31-8 56-29" />
          <circle className="visual-hint__orb visual-hint__orb--one" cx="38" cy="55" r="9" />
          <circle className="visual-hint__orb visual-hint__orb--two" cx="83" cy="42" r="6" />
          <rect className="visual-hint__frame" x="111" y="23" width="27" height="50" rx="13.5" />
        </svg>
      </div>
    </figure>
  );
}
