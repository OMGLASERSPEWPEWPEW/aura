// src/hooks/useProfileSearch.ts
// Hook for managing profile search state with debouncing and session persistence

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { SEARCH_STORAGE_KEY } from '../lib/filtering/types';

interface UseProfileSearchReturn {
  /** Current search text (controlled input value) */
  searchText: string;
  /** Debounced search text (use for actual filtering) */
  debouncedSearchText: string;
  /** Update search text */
  setSearchText: (text: string) => void;
  /** Clear search and reset to empty */
  clearSearch: () => void;
  /** True while waiting for debounce to complete */
  isSearching: boolean;
}

/**
 * Hook for managing profile search with debouncing.
 * Persists search to sessionStorage (clears on tab close).
 *
 * @param debounceMs - Debounce delay in milliseconds (default: 300ms)
 */
export function useProfileSearch(debounceMs = 300): UseProfileSearchReturn {
  // Initialize from sessionStorage if available
  const getInitialSearch = (): string => {
    if (typeof window === 'undefined') return '';
    try {
      return sessionStorage.getItem(SEARCH_STORAGE_KEY) || '';
    } catch {
      // sessionStorage not available (private browsing, etc.)
      return '';
    }
  };

  const [searchText, setSearchTextState] = useState<string>(getInitialSearch);
  const [debouncedSearchText, setDebouncedSearchText] = useState<string>(getInitialSearch);

  // Ref to track timeout for cleanup
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist to sessionStorage when searchText changes
  useEffect(() => {
    try {
      if (searchText) {
        sessionStorage.setItem(SEARCH_STORAGE_KEY, searchText);
      } else {
        sessionStorage.removeItem(SEARCH_STORAGE_KEY);
      }
    } catch {
      // sessionStorage not available
    }
  }, [searchText]);

  // Debounce the search text
  // Note: The setState inside setTimeout is in a callback, not synchronous in the effect body
  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for debounce
    timeoutRef.current = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, debounceMs);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [searchText, debounceMs]);

  // Compute isSearching from the difference between current and debounced text
  // This avoids needing a separate state variable that requires synchronous setState
  const isSearching = useMemo(() => {
    return searchText !== debouncedSearchText;
  }, [searchText, debouncedSearchText]);

  const setSearchText = useCallback((text: string) => {
    setSearchTextState(text);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTextState('');
    setDebouncedSearchText('');
    try {
      sessionStorage.removeItem(SEARCH_STORAGE_KEY);
    } catch {
      // sessionStorage not available
    }
  }, []);

  return {
    searchText,
    debouncedSearchText,
    setSearchText,
    clearSearch,
    isSearching,
  };
}
