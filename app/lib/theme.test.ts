import { describe, expect, it } from "vitest";

import {
  getThemeSelectionFromStorage,
  resolveTheme,
  themeClassName,
} from "~/lib/theme";

describe("theme helpers", () => {
  it("prefers explicit user choice over system theme", () => {
    expect(resolveTheme("light", "dark")).toBe("light");
    expect(resolveTheme("dark", "light")).toBe("dark");
  });

  it("falls back to system theme when choice is system", () => {
    expect(resolveTheme("system", "dark")).toBe("dark");
    expect(resolveTheme("system", "light")).toBe("light");
  });

  it("maps theme to stable html class names", () => {
    expect(themeClassName("light")).toBe("theme-light");
    expect(themeClassName("dark")).toBe("theme-dark");
  });

  it("ignores invalid storage values", () => {
    expect(getThemeSelectionFromStorage("dark")).toBe("dark");
    expect(getThemeSelectionFromStorage("nope")).toBe("dark");
    expect(getThemeSelectionFromStorage(null)).toBe("dark");
  });
});
