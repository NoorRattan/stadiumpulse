import {
  createContext,
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

function initialTheme(): Theme {
  try {
    const stored = window.localStorage.getItem("stadiumpulse-theme");
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
  return "dark";
}

export function ThemeProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  const setTheme = useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme);
    try {
      window.localStorage.setItem("stadiumpulse-theme", nextTheme);
    } catch {
      // The in-memory preference remains usable when persistence is blocked.
    }
  }, []);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
    const themeColor = window
      .getComputedStyle(document.documentElement)
      .getPropertyValue("--background")
      .trim();
    if (themeColor) {
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", themeColor);
    }
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme(theme === "dark" ? "light" : "dark"),
    }),
    [setTheme, theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
