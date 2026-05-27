export const THEME_STORAGE_KEY = "cet-theme-selection";

export type ThemeSelection = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

const allowedThemes = new Set<ThemeSelection>(["system", "light", "dark"]);

export function getThemeSelectionFromStorage(
  value: string | null | undefined,
): ThemeSelection {
  if (value && allowedThemes.has(value as ThemeSelection)) {
    return value as ThemeSelection;
  }

  return "dark";
}

export function resolveTheme(
  selection: ThemeSelection,
  systemTheme: ResolvedTheme,
): ResolvedTheme {
  if (selection === "system") {
    return systemTheme;
  }

  return selection;
}

export function themeClassName(theme: ResolvedTheme): string {
  return theme === "dark" ? "theme-dark" : "theme-light";
}

export function themeBootScript(): string {
  return `
    (() => {
      const storageKey = "${THEME_STORAGE_KEY}";
      const stored = localStorage.getItem(storageKey);
      const selection = stored === "light" || stored === "dark" || stored === "system"
        ? stored
        : "dark";
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      const resolved = selection === "system" ? systemTheme : selection;
      const root = document.documentElement;
      root.dataset.themeSelection = selection;
      root.dataset.theme = resolved;
      root.classList.remove("theme-light", "theme-dark");
      root.classList.add(resolved === "dark" ? "theme-dark" : "theme-light");
    })();
  `;
}
