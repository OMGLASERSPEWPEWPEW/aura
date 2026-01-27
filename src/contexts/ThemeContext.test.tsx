// src/contexts/ThemeContext.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ThemeProvider, useTheme, type ThemePreference } from './ThemeContext';

// Mock db module
vi.mock('../lib/db', () => ({
  db: {
    userIdentity: {
      get: vi.fn(),
      update: vi.fn(),
      add: vi.fn(),
    },
  },
}));

describe('ThemeContext', () => {
  // Store original implementations
  const originalMatchMedia = window.matchMedia;
  const originalLocalStorage = window.localStorage;
  let mockMatchMedia: ReturnType<typeof vi.fn>;
  let mockLocalStorage: Record<string, string>;
  let mockClassList: { add: ReturnType<typeof vi.fn>; remove: ReturnType<typeof vi.fn>; contains: ReturnType<typeof vi.fn> };
  let mockMetaElement: { setAttribute: ReturnType<typeof vi.fn>; getAttribute: ReturnType<typeof vi.fn> };
  let mediaQueryListeners: ((e: MediaQueryListEvent) => void)[];

  beforeEach(() => {
    vi.clearAllMocks();
    mediaQueryListeners = [];

    // Mock localStorage
    mockLocalStorage = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          mockLocalStorage[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete mockLocalStorage[key];
        }),
        clear: vi.fn(() => {
          mockLocalStorage = {};
        }),
      },
      writable: true,
    });

    // Mock matchMedia
    mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false, // Default to light mode
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((_event: string, listener: (e: MediaQueryListEvent) => void) => {
        mediaQueryListeners.push(listener);
      }),
      removeEventListener: vi.fn((_event: string, listener: (e: MediaQueryListEvent) => void) => {
        mediaQueryListeners = mediaQueryListeners.filter(l => l !== listener);
      }),
      dispatchEvent: vi.fn(),
    }));
    window.matchMedia = mockMatchMedia;

    // Mock document.documentElement.classList
    mockClassList = {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn().mockReturnValue(false),
    };
    Object.defineProperty(document.documentElement, 'classList', {
      value: mockClassList,
      writable: true,
    });

    // Mock document.querySelector for meta tag
    mockMetaElement = {
      setAttribute: vi.fn(),
      getAttribute: vi.fn().mockReturnValue('#7c3aed'),
    };
    vi.spyOn(document, 'querySelector').mockImplementation((selector: string) => {
      if (selector === 'meta[name="theme-color"]') {
        return mockMetaElement as unknown as Element;
      }
      return null;
    });
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
    });
    vi.restoreAllMocks();
  });

  // ==================== ThemeProvider ====================
  describe('ThemeProvider', () => {
    it('should provide theme context to children', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      expect(result.current).toBeDefined();
      expect(result.current.theme).toBeDefined();
      expect(result.current.resolvedTheme).toBeDefined();
      expect(result.current.isDark).toBeDefined();
      expect(result.current.setTheme).toBeDefined();
    });

    it('should default to system theme', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      expect(result.current.theme).toBe('system');
    });
  });

  // ==================== useTheme ====================
  describe('useTheme', () => {
    it('should throw when used outside provider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useTheme());
      }).toThrow('useTheme must be used within a ThemeProvider');

      consoleSpy.mockRestore();
    });

    it('should return all theme properties and functions', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      expect(typeof result.current.theme).toBe('string');
      expect(typeof result.current.resolvedTheme).toBe('string');
      expect(typeof result.current.isDark).toBe('boolean');
      expect(typeof result.current.setTheme).toBe('function');
    });
  });

  // ==================== System preference detection ====================
  describe('system preference detection', () => {
    it('should resolve to light when system prefers light', () => {
      mockMatchMedia.mockImplementation(() => ({
        matches: false, // prefers-color-scheme: light
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      expect(result.current.theme).toBe('system');
      expect(result.current.resolvedTheme).toBe('light');
      expect(result.current.isDark).toBe(false);
    });

    it('should resolve to dark when system prefers dark', () => {
      mockMatchMedia.mockImplementation(() => ({
        matches: true, // prefers-color-scheme: dark
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      expect(result.current.theme).toBe('system');
      expect(result.current.resolvedTheme).toBe('dark');
      expect(result.current.isDark).toBe(true);
    });
  });

  // ==================== Dark class application ====================
  describe('dark class application', () => {
    it('should add dark class when theme is dark', async () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      await act(async () => {
        result.current.setTheme('dark');
      });

      expect(mockClassList.add).toHaveBeenCalledWith('dark');
    });

    it('should remove dark class when theme is light', async () => {
      // Start with dark
      mockLocalStorage['aura-theme'] = JSON.stringify('dark');

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      await act(async () => {
        result.current.setTheme('light');
      });

      expect(mockClassList.remove).toHaveBeenCalledWith('dark');
    });
  });

  // ==================== localStorage sync ====================
  describe('localStorage sync', () => {
    it('should persist theme to localStorage', async () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      await act(async () => {
        result.current.setTheme('dark');
      });

      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'aura-theme',
        JSON.stringify('dark')
      );
    });

    it('should load theme from localStorage on mount', () => {
      mockLocalStorage['aura-theme'] = JSON.stringify('dark');

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      expect(result.current.theme).toBe('dark');
    });

    it('should handle invalid localStorage value', () => {
      mockLocalStorage['aura-theme'] = 'invalid-json';

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      // Should fall back to system
      expect(result.current.theme).toBe('system');
    });

    it('should handle unknown theme value in localStorage', () => {
      mockLocalStorage['aura-theme'] = JSON.stringify('unknown-theme');

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      // Should fall back to system
      expect(result.current.theme).toBe('system');
    });
  });

  // ==================== theme-color meta tag ====================
  describe('theme-color meta tag', () => {
    it('should update theme-color to dark when dark mode', async () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      await act(async () => {
        result.current.setTheme('dark');
      });

      expect(mockMetaElement.setAttribute).toHaveBeenCalledWith('content', '#0f172a');
    });

    it('should update theme-color to light when light mode', async () => {
      // Start with dark
      mockLocalStorage['aura-theme'] = JSON.stringify('dark');

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      await act(async () => {
        result.current.setTheme('light');
      });

      expect(mockMetaElement.setAttribute).toHaveBeenCalledWith('content', '#7c3aed');
    });
  });

  // ==================== setTheme ====================
  describe('setTheme', () => {
    it('should update theme to light', async () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      await act(async () => {
        result.current.setTheme('light');
      });

      expect(result.current.theme).toBe('light');
      expect(result.current.resolvedTheme).toBe('light');
      expect(result.current.isDark).toBe(false);
    });

    it('should update theme to dark', async () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      await act(async () => {
        result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');
      expect(result.current.resolvedTheme).toBe('dark');
      expect(result.current.isDark).toBe(true);
    });

    it('should update theme to system', async () => {
      mockLocalStorage['aura-theme'] = JSON.stringify('dark');

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      await act(async () => {
        result.current.setTheme('system');
      });

      expect(result.current.theme).toBe('system');
    });
  });

  // ==================== System preference change listener ====================
  describe('system preference change listener', () => {
    it('should respond to system preference changes when theme is system', async () => {
      let currentListeners: ((e: MediaQueryListEvent) => void)[] = [];

      mockMatchMedia.mockImplementation(() => ({
        matches: false,
        addEventListener: vi.fn((_: string, listener: (e: MediaQueryListEvent) => void) => {
          currentListeners.push(listener);
        }),
        removeEventListener: vi.fn((_: string, listener: (e: MediaQueryListEvent) => void) => {
          currentListeners = currentListeners.filter(l => l !== listener);
        }),
      }));

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      expect(result.current.resolvedTheme).toBe('light');

      // Simulate system preference change to dark
      await act(async () => {
        currentListeners.forEach(listener => {
          listener({ matches: true } as MediaQueryListEvent);
        });
      });

      expect(result.current.resolvedTheme).toBe('dark');
    });

    it('should not respond to system changes when theme is manually set', async () => {
      let currentListeners: ((e: MediaQueryListEvent) => void)[] = [];

      mockMatchMedia.mockImplementation(() => ({
        matches: false,
        addEventListener: vi.fn((_: string, listener: (e: MediaQueryListEvent) => void) => {
          currentListeners.push(listener);
        }),
        removeEventListener: vi.fn((_: string, listener: (e: MediaQueryListEvent) => void) => {
          currentListeners = currentListeners.filter(l => l !== listener);
        }),
      }));

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      // Set to light manually
      await act(async () => {
        result.current.setTheme('light');
      });

      expect(result.current.resolvedTheme).toBe('light');

      // Simulate system preference change to dark - should be ignored
      await act(async () => {
        currentListeners.forEach(listener => {
          listener({ matches: true } as MediaQueryListEvent);
        });
      });

      // Should still be light because we manually set it
      expect(result.current.theme).toBe('light');
      expect(result.current.resolvedTheme).toBe('light');
    });
  });

  // ==================== Theme cycling ====================
  describe('theme cycling', () => {
    it('should cycle through themes correctly', async () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      // Start at system
      expect(result.current.theme).toBe('system');

      // Go to light
      await act(async () => {
        result.current.setTheme('light');
      });
      expect(result.current.theme).toBe('light');

      // Go to dark
      await act(async () => {
        result.current.setTheme('dark');
      });
      expect(result.current.theme).toBe('dark');

      // Back to system
      await act(async () => {
        result.current.setTheme('system');
      });
      expect(result.current.theme).toBe('system');
    });
  });
});
