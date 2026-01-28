// src/hooks/useFilteredProfiles.ts
// Hook that orchestrates search + filters + sort for profile list

import { useMemo } from 'react';
import type { Profile } from '../lib/db';
import { searchProfiles } from '../lib/filtering/searchEngine';
import { applyAllFilters } from '../lib/filtering/filterEngine';
import { sortProfiles } from '../lib/filtering/sortEngine';
import { useProfileSearch } from './useProfileSearch';
import { useProfileFilters } from './useProfileFilters';

interface UseFilteredProfilesReturn {
  /** Final filtered and sorted profiles */
  filteredProfiles: Profile[];

  /** Total count of profiles (before any filtering) */
  totalCount: number;

  /** Count after filtering (for "showing X of Y" display) */
  filteredCount: number;

  /** Search state and methods */
  search: {
    searchText: string;
    debouncedSearchText: string;
    setSearchText: (text: string) => void;
    clearSearch: () => void;
    isSearching: boolean;
  };

  /** Filter state and methods */
  filters: ReturnType<typeof useProfileFilters>;

  /** Combined check: is any filtering/searching active? */
  isFiltering: boolean;

  /** Are there no results after filtering? */
  hasNoResults: boolean;
}

/**
 * Hook that combines search and filters to produce a filtered, sorted profile list.
 *
 * Processing order:
 * 1. Search by text (name matching)
 * 2. Apply filters (app, score, date) with AND logic
 * 3. Sort by selected option
 *
 * @param profiles - Raw profile list from database
 * @param debounceMs - Debounce delay for search (default: 300ms)
 */
export function useFilteredProfiles(
  profiles: Profile[],
  debounceMs = 300
): UseFilteredProfilesReturn {
  // Search hook
  const {
    searchText,
    debouncedSearchText,
    setSearchText,
    clearSearch,
    isSearching,
  } = useProfileSearch(debounceMs);

  // Filters hook
  const filterState = useProfileFilters();

  // Combine search + filters + sort
  const filteredProfiles = useMemo(() => {
    // Step 1: Search by text
    let result = searchProfiles(profiles, debouncedSearchText);

    // Step 2: Apply filters
    result = applyAllFilters(result, filterState.filters);

    // Step 3: Sort
    result = sortProfiles(result, filterState.filters.sortBy);

    return result;
  }, [profiles, debouncedSearchText, filterState.filters]);

  // Computed values
  const totalCount = profiles.length;
  const filteredCount = filteredProfiles.length;

  const isFiltering = useMemo(() => {
    return debouncedSearchText.trim().length > 0 || filterState.hasActiveFilters;
  }, [debouncedSearchText, filterState.hasActiveFilters]);

  const hasNoResults = isFiltering && filteredCount === 0;

  return {
    filteredProfiles,
    totalCount,
    filteredCount,
    search: {
      searchText,
      debouncedSearchText,
      setSearchText,
      clearSearch,
      isSearching,
    },
    filters: filterState,
    isFiltering,
    hasNoResults,
  };
}
