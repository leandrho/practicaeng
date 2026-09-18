"use client";

import { useCallback, useEffect, useState } from "react";
import {
  applyTheme,
  getStoredTheme,
  getSystemTheme,
  persistTheme,
  resolveTheme,
  type Theme,
} from "../../src/infrastructure/ui/theme";
import { Button } from "./ui/Button";

function SunIcon() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

/**
 * Toggle claro/oscuro. Isla Client mínima:
 * - Primera visita sin valor guardado → respeta `prefers-color-scheme`.
 * - Toggle manual → persiste `practicaeng:theme:v1` y fija `data-theme`.
 *
 * Hidratación: el primer render es idéntico en servidor y cliente
 * (estado inicial fijo "light" + ambos iconos siempre en el DOM).
 * La visibilidad del icono la decide CSS vía `data-theme` —que el script
 * anti-flash ya fijó antes del paint—, así que nunca hay icono erróneo
 * ni mismatch. El estado solo maneja `aria-label` y el toggle.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = getStoredTheme();
    const applyStored = () =>
      setTheme((prev) => {
        const next = resolveTheme(stored, getSystemTheme());
        applyTheme(next);
        return prev === next ? prev : next;
      });
    applyStored();

    if (stored !== "system") {
      return;
    }
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const next: Theme = media.matches ? "dark" : "light";
      applyTheme(next);
      setTheme(next);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      persistTheme(next);
      applyTheme(next);
      return next;
    });
  }, []);

  const label =
    theme === "dark" ? "Switch to light theme" : "Switch to dark theme";

  return (
    <Button
      className="theme-toggle"
      onClick={toggle}
      aria-label={label}
      title={label}
    >
      <span className="theme-toggle__icon theme-toggle__icon--sun" aria-hidden="true">
        <SunIcon />
      </span>
      <span className="theme-toggle__icon theme-toggle__icon--moon" aria-hidden="true">
        <MoonIcon />
      </span>
    </Button>
  );
}
