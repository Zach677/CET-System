import { useEffect, useState } from "react";
import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";

import {
  getThemeSelectionFromStorage,
  resolveTheme,
  THEME_STORAGE_KEY,
  type ThemeSelection,
} from "~/lib/theme";

const options: Array<{ value: ThemeSelection; label: string }> = [
  { value: "system", label: "系统" },
  { value: "light", label: "浅色" },
  { value: "dark", label: "暗黑" },
];

export function ThemeToggle() {
  const [selection, setSelection] = useState<ThemeSelection>("system");

  useEffect(() => {
    const stored = getThemeSelectionFromStorage(
      window.localStorage.getItem(THEME_STORAGE_KEY),
    );
    setSelection(stored);
  }, []);

  function applySelection(nextSelection: ThemeSelection) {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    const resolved = resolveTheme(nextSelection, systemTheme);
    const root = document.documentElement;

    root.dataset.themeSelection = nextSelection;
    root.dataset.theme = resolved;
    root.classList.remove("theme-light", "theme-dark");
    root.classList.add(resolved === "dark" ? "theme-dark" : "theme-light");
    window.localStorage.setItem(THEME_STORAGE_KEY, nextSelection);
    setSelection(nextSelection);
  }

  return (
    <ToggleGroup
      className="theme-toggle"
      aria-label="主题切换"
      value={[selection]}
      onValueChange={(value) => {
        const nextSelection = value.at(-1) as ThemeSelection | undefined;
        if (nextSelection) {
          applySelection(nextSelection);
        }
      }}
    >
      {options.map((option) => (
        <Toggle
          key={option.value}
          value={option.value}
          aria-label={`切换到${option.label}主题`}
        >
          {option.label}
        </Toggle>
      ))}
    </ToggleGroup>
  );
}
