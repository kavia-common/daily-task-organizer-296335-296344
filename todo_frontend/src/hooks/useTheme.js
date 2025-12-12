import { useEffect, useState, useCallback } from "react";

/**
 * Key used in localStorage for persisting the theme.
 */
const THEME_STORAGE_KEY = "todo_app_theme";

/**
 * Safely read a value from localStorage.
 * Returns undefined if unavailable or on error.
 */
function readLocalStorage(key) {
  try {
    const v = window.localStorage.getItem(key);
    return typeof v === "string" ? v : undefined;
  } catch (_e) {
    return undefined;
  }
}

/**
 * Safely write a value to localStorage.
 * Silently no-ops if unavailable or on error.
 */
function writeLocalStorage(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch (_e) {
    // no-op
  }
}

/**
 * Apply the data-theme attribute to the document root element (html).
 * Removes the attribute if theme is falsy to ensure clean state.
 */
function applyThemeAttribute(theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (!root) return;
  if (theme) {
    root.setAttribute("data-theme", theme);
  } else {
    root.removeAttribute("data-theme");
  }
}

/**
 * Determine the initial theme:
 * 1) Use stored value if present.
 * 2) Otherwise fall back to 'light'.
 */
function getInitialTheme() {
  const stored = readLocalStorage(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  return "light";
}

// PUBLIC_INTERFACE
export function useTheme() {
  /** Hook to manage light/dark theme with persistence and document attribute updates.
   * Returns:
   *  - theme: 'light' | 'dark'
   *  - toggleTheme: function to toggle between themes
   *
   * Behavior:
   *  - Persists current theme in localStorage under "todo_app_theme"
   *  - Applies/removes data-theme attribute on document.documentElement
   */
  const [theme, setTheme] = useState(getInitialTheme);

  // Apply theme to <html data-theme="..."> and persist to localStorage
  useEffect(() => {
    applyThemeAttribute(theme);
    writeLocalStorage(THEME_STORAGE_KEY, theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  return { theme, toggleTheme };
}

export default useTheme;
