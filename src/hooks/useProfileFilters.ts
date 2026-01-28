// src/hooks/useProfileFilters.ts
// Hook for managing profile filter state with localStorage persistence

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { DatingApp, ScorePreset, DatePreset, SortOption, FilterPreferences } from '../lib/filtering/types';
import { DEFAULT_FILTERS } from '../lib/filtering/types';
import { loadFilterPreferences, saveFilterPreferences } from '../lib/filtering/persistence';
import { hasActiveFilters as checkHasActiveFilters, countActiveFilters } from '../lib/filtering/filterEngine';

interface UseProfileFiltersReturn {
  /** Current filter preferences */
  filters: FilterPreferences;

  /** Update selected apps filter */
  updateAppFilter: (apps: DatingApp[]) => void;

  /** Toggle a single app in the filter */
  toggleApp: (app: DatingApp) => void;

  /** Update score preset filter */
  updateScorePreset: (preset: ScorePreset) => void;

  /** Update date preset filter */
  updateDatePreset: (preset: DatePreset) => void;

  /** Update sort option */
  updateSort: (sort: SortOption) => void;

  /** Toggle favorites-only filter */
  toggleFavoritesOnly: () => void;

  /** Set favorites-only filter directly */
  setFavoritesOnly: (showFavoritesOnly: boolean) => void;

  /** Toggle a tag in the selected tags filter */
  toggleTagFilter: (tagId: string) => void;

  /** Set selected tags directly */
  setSelectedTags: (tagIds: string[]) => void;

  /** Clear all tag filters */
  clearTagFilters: () => void;

  /** Reset all filters to defaults */
  resetFilters: () => void;

  /** Whether any filters are active (not at default values) */
  hasActiveFilters: boolean;

  /** Number of active filter categories (for badge display) */
  activeFilterCount: number;
}

/**
 * Hook for managing profile filter state.
 * Persists to localStorage for cross-session persistence.
 */
export function useProfileFilters(): UseProfileFiltersReturn {
  // Initialize from localStorage
  const [filters, setFilters] = useState<FilterPreferences>(() => {
    return loadFilterPreferences();
  });

  // Persist to localStorage when filters change
  useEffect(() => {
    saveFilterPreferences(filters);
  }, [filters]);

  const updateAppFilter = useCallback((apps: DatingApp[]) => {
    setFilters((prev) => ({
      ...prev,
      selectedApps: apps,
    }));
  }, []);

  const toggleApp = useCallback((app: DatingApp) => {
    setFilters((prev) => {
      const isSelected = prev.selectedApps.includes(app);
      return {
        ...prev,
        selectedApps: isSelected
          ? prev.selectedApps.filter((a) => a !== app)
          : [...prev.selectedApps, app],
      };
    });
  }, []);

  const updateScorePreset = useCallback((preset: ScorePreset) => {
    setFilters((prev) => ({
      ...prev,
      scorePreset: preset,
    }));
  }, []);

  const updateDatePreset = useCallback((preset: DatePreset) => {
    setFilters((prev) => ({
      ...prev,
      datePreset: preset,
    }));
  }, []);

  const updateSort = useCallback((sort: SortOption) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: sort,
    }));
  }, []);

  // Phase C: Favorites
  const toggleFavoritesOnly = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      showFavoritesOnly: !prev.showFavoritesOnly,
    }));
  }, []);

  const setFavoritesOnly = useCallback((showFavoritesOnly: boolean) => {
    setFilters((prev) => ({
      ...prev,
      showFavoritesOnly,
    }));
  }, []);

  // Phase C: Tags
  const toggleTagFilter = useCallback((tagId: string) => {
    setFilters((prev) => {
      const isSelected = prev.selectedTags.includes(tagId);
      return {
        ...prev,
        selectedTags: isSelected
          ? prev.selectedTags.filter((id) => id !== tagId)
          : [...prev.selectedTags, tagId],
      };
    });
  }, []);

  const setSelectedTags = useCallback((tagIds: string[]) => {
    setFilters((prev) => ({
      ...prev,
      selectedTags: tagIds,
    }));
  }, []);

  const clearTagFilters = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      selectedTags: [],
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return checkHasActiveFilters(filters);
  }, [filters]);

  const activeFilterCount = useMemo(() => {
    return countActiveFilters(filters);
  }, [filters]);

  return {
    filters,
    updateAppFilter,
    toggleApp,
    updateScorePreset,
    updateDatePreset,
    updateSort,
    toggleFavoritesOnly,
    setFavoritesOnly,
    toggleTagFilter,
    setSelectedTags,
    clearTagFilters,
    resetFilters,
    hasActiveFilters,
    activeFilterCount,
  };
}
