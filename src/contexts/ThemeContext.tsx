// src/contexts/ThemeContext.tsx
// Theme context for dark mode support with system preference detection

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { db } from '../lib/db';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  /** User's theme preference ('system', 'light', or 'dark') */
  theme: ThemePreference;
  /** Actual resolved theme after applying system preference */
  resolvedTheme: ResolvedTheme;
  /** Convenience boolean for dark mode */
  isDark: boolean;
  /** Update theme preference */
  setTheme: (theme: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'aura-theme';
const LIGHT_THEME_COLOR = '#7c3aed'; // violet-600
const DARK_THEME_COLOR = '#0f172a';  // slate-900

/**
 * Get the system color scheme preference
 */
function getSystemPreference(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Resolve theme preference to actual theme
 */
function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === 'system') {
    return getSystemPreference();
  }
  return preference;
}

/**
 * Apply theme to document
 */
function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');

  if (resolved === 'dark') {
    root.classList.add('dark');
    if (themeColorMeta) themeColorMeta.setAttribute('content', DARK_THEME_COLOR);
  } else {
    root.classList.remove('dark');
    if (themeColorMeta) themeColorMeta.setAttribute('content', LIGHT_THEME_COLOR);
  }
}

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Theme provider component. Wrap your app with this to enable dark mode.
 *
 * Features:
 * - System preference detection
 * - Manual override (light/dark/system)
 * - Persists to localStorage (for flash prevention) and IndexedDB (for sync)
 * - Updates PWA theme-color meta tag
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  // Initialize from localStorage (set by inline script for flash prevention)
  const [theme, setThemeState] = useState<ThemePreference>(() => {
    if (typeof window === 'undefined') return 'system';
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed === 'system' || parsed === 'light' || parsed === 'dark') {
          return parsed;
        }
      }
    } catch {
      // Invalid stored value, use default
    }
    return 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveTheme(theme));
  const isDark = resolvedTheme === 'dark';

  // Apply theme whenever it changes
  useEffect(() => {
    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, [theme]);

  // Listen for system preference changes when theme is 'system'
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      const resolved = e.matches ? 'dark' : 'light';
      setResolvedTheme(resolved);
      applyTheme(resolved);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Load from IndexedDB on mount (may override localStorage if user has synced data)
  useEffect(() => {
    async function loadFromDb() {
      try {
        const identity = await db.userIdentity.get(1);
        const dbTheme = identity?.settings?.theme;
        // Validate the theme value before using it
        if (dbTheme === 'system' || dbTheme === 'light' || dbTheme === 'dark') {
          if (dbTheme !== theme) {
            const resolved = resolveTheme(dbTheme);
            setThemeState(dbTheme);
            setResolvedTheme(resolved);
            applyTheme(resolved);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dbTheme));
          }
        }
      } catch {
        // IndexedDB not available or no data, use localStorage value
      }
    }
    loadFromDb();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update theme with persistence
  const setTheme = useCallback(async (newTheme: ThemePreference) => {
    setThemeState(newTheme);

    // Persist to localStorage immediately (for flash prevention)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTheme));

    // Persist to IndexedDB (for sync)
    try {
      const identity = await db.userIdentity.get(1);
      if (identity) {
        await db.userIdentity.update(1, {
          settings: {
            autoCompatibility: identity.settings?.autoCompatibility ?? true,
            theme: newTheme,
          },
          lastUpdated: new Date(),
        });
      } else {
        // Create userIdentity if it doesn't exist
        await db.userIdentity.add({
          id: 1,
          settings: { autoCompatibility: true, theme: newTheme },
          dataExports: [],
          textInputs: [],
          photos: [],
          manualEntry: {},
          lastUpdated: new Date(),
        });
      }
    } catch {
      // IndexedDB not available, localStorage is sufficient
    }
  }, []);

  const value: ThemeContextType = {
    theme,
    resolvedTheme,
    isDark,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme state and controls
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { theme, isDark, setTheme } = useTheme();
 *
 *   return (
 *     <button onClick={() => setTheme(isDark ? 'light' : 'dark')}>
 *       Toggle Theme
 *     </button>
 *   );
 * }
 * ```
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
