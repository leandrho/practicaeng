export type Theme = "light" | "dark";
export type StoredTheme = Theme | "system";

export const THEME_STORAGE_KEY = "practicaeng:theme:v1";

export function getSystemTheme(): Theme {
  if (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return "light";
}

export function getStoredTheme(): StoredTheme {
  try {
    const raw =
      typeof localStorage !== "undefined"
        ? localStorage.getItem(THEME_STORAGE_KEY)
        : null;
    if (raw === "light" || raw === "dark" || raw === "system") {
      return raw;
    }
  } catch {
    // localStorage no disponible (SSR/privado): se trata como "system".
  }
  return "system";
}

export function resolveTheme(
  stored: StoredTheme,
  system: Theme,
): Theme {
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  return system;
}

export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") {
    return;
  }
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
}

export function persistTheme(stored: StoredTheme): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(THEME_STORAGE_KEY, stored);
    }
  } catch {
    // Ignorar cuotas/modo privado: el tema igual se aplica en memoria.
  }
}
