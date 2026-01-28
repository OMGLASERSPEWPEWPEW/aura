// src/hooks/useProfileSearch.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProfileSearch } from './useProfileSearch';
import { SEARCH_STORAGE_KEY } from '../lib/filtering/types';

describe('useProfileSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Clear sessionStorage before each test
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('should initialize with empty search text', () => {
    const { result } = renderHook(() => useProfileSearch());

    expect(result.current.searchText).toBe('');
    expect(result.current.debouncedSearchText).toBe('');
    expect(result.current.isSearching).toBe(false);
  });

  it('should initialize with value from sessionStorage if present', () => {
    sessionStorage.setItem(SEARCH_STORAGE_KEY, 'cached search');
    const { result } = renderHook(() => useProfileSearch());

    expect(result.current.searchText).toBe('cached search');
    expect(result.current.debouncedSearchText).toBe('cached search');
  });

  it('should update searchText immediately on setSearchText', () => {
    const { result } = renderHook(() => useProfileSearch());

    act(() => {
      result.current.setSearchText('hello');
    });

    expect(result.current.searchText).toBe('hello');
    expect(result.current.isSearching).toBe(true);
  });

  it('should debounce debouncedSearchText with default 300ms delay', () => {
    const { result } = renderHook(() => useProfileSearch());

    act(() => {
      result.current.setSearchText('test');
    });

    // Before debounce completes
    expect(result.current.searchText).toBe('test');
    expect(result.current.debouncedSearchText).toBe('');
    expect(result.current.isSearching).toBe(true);

    // Advance time but not enough
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current.debouncedSearchText).toBe('');
    expect(result.current.isSearching).toBe(true);

    // Complete the debounce
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.debouncedSearchText).toBe('test');
    expect(result.current.isSearching).toBe(false);
  });

  it('should use custom debounce delay when provided', () => {
    const { result } = renderHook(() => useProfileSearch(500));

    act(() => {
      result.current.setSearchText('custom');
    });

    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(result.current.debouncedSearchText).toBe('');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.debouncedSearchText).toBe('custom');
  });

  it('should reset debounce timer on rapid typing', () => {
    const { result } = renderHook(() => useProfileSearch());

    act(() => {
      result.current.setSearchText('a');
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    act(() => {
      result.current.setSearchText('ab');
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    act(() => {
      result.current.setSearchText('abc');
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Still waiting for debounce
    expect(result.current.debouncedSearchText).toBe('');

    // Complete debounce from last keystroke
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.debouncedSearchText).toBe('abc');
  });

  it('should clear search on clearSearch', () => {
    const { result } = renderHook(() => useProfileSearch());

    // Set some search text
    act(() => {
      result.current.setSearchText('hello');
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.searchText).toBe('hello');
    expect(result.current.debouncedSearchText).toBe('hello');

    // Clear it
    act(() => {
      result.current.clearSearch();
    });

    expect(result.current.searchText).toBe('');
    expect(result.current.debouncedSearchText).toBe('');
    expect(result.current.isSearching).toBe(false);
  });

  it('should persist search to sessionStorage', () => {
    const { result } = renderHook(() => useProfileSearch());

    act(() => {
      result.current.setSearchText('persisted');
    });

    expect(sessionStorage.getItem(SEARCH_STORAGE_KEY)).toBe('persisted');
  });

  it('should remove from sessionStorage when search is cleared', () => {
    const { result } = renderHook(() => useProfileSearch());

    act(() => {
      result.current.setSearchText('temp');
    });
    expect(sessionStorage.getItem(SEARCH_STORAGE_KEY)).toBe('temp');

    act(() => {
      result.current.clearSearch();
    });
    expect(sessionStorage.getItem(SEARCH_STORAGE_KEY)).toBeNull();
  });

  it('should remove from sessionStorage when search becomes empty string', () => {
    const { result } = renderHook(() => useProfileSearch());

    act(() => {
      result.current.setSearchText('something');
    });
    expect(sessionStorage.getItem(SEARCH_STORAGE_KEY)).toBe('something');

    act(() => {
      result.current.setSearchText('');
    });
    expect(sessionStorage.getItem(SEARCH_STORAGE_KEY)).toBeNull();
  });

  it('should handle special characters in search text', () => {
    const { result } = renderHook(() => useProfileSearch());

    act(() => {
      result.current.setSearchText('Jane "The Rock" Doe');
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.debouncedSearchText).toBe('Jane "The Rock" Doe');
  });
});
