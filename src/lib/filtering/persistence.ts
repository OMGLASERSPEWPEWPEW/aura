// src/lib/filtering/persistence.ts
// Persistence layer for filter preferences using localStorage

import type { FilterPreferences } from './types';
import { DEFAULT_FILTERS, FILTER_STORAGE_KEY } from './types';

/**
 * Load filter preferences from localStorage.
 * Returns default filters if no stored preferences or parsing fails.
 */
export function loadFilterPreferences(): FilterPreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_FILTERS;
  }

  try {
    const stored = localStorage.getItem(FILTER_STORAGE_KEY);
    if (!stored) {
      return DEFAULT_FILTERS;
    }

    const parsed = JSON.parse(stored) as Partial<FilterPreferences>;

    // Validate and merge with defaults to handle partial/invalid data
    return {
      selectedApps: Array.isArray(parsed.selectedApps)
        ? parsed.selectedApps
        : DEFAULT_FILTERS.selectedApps,
      scorePreset: isValidScorePreset(parsed.scorePreset)
        ? parsed.scorePreset
        : DEFAULT_FILTERS.scorePreset,
      datePreset: isValidDatePreset(parsed.datePreset)
        ? parsed.datePreset
        : DEFAULT_FILTERS.datePreset,
      sortBy: isValidSortOption(parsed.sortBy)
        ? parsed.sortBy
        : DEFAULT_FILTERS.sortBy,
      // Phase C: Favorites and Tags
      showFavoritesOnly: typeof parsed.showFavoritesOnly === 'boolean'
        ? parsed.showFavoritesOnly
        : DEFAULT_FILTERS.showFavoritesOnly,
      selectedTags: Array.isArray(parsed.selectedTags)
        ? parsed.selectedTags.filter((t): t is string => typeof t === 'string')
        : DEFAULT_FILTERS.selectedTags,
    };
  } catch {
    // localStorage not available or parsing failed
    return DEFAULT_FILTERS;
  }
}

/**
 * Save filter preferences to localStorage.
 * Silently fails if localStorage is not available.
 */
export function saveFilterPreferences(preferences: FilterPreferences): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // localStorage not available or quota exceeded
    console.warn('Failed to save filter preferences to localStorage');
  }
}

/**
 * Clear filter preferences from localStorage.
 */
export function clearFilterPreferences(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(FILTER_STORAGE_KEY);
  } catch {
    // localStorage not available
  }
}

// Type guards for validation

function isValidScorePreset(value: unknown): value is FilterPreferences['scorePreset'] {
  return value === 'all' || value === 'high' || value === 'medium' || value === 'low';
}

function isValidDatePreset(value: unknown): value is FilterPreferences['datePreset'] {
  return value === 'all' || value === '7d' || value === '30d' || value === 'older';
}

function isValidSortOption(value: unknown): value is FilterPreferences['sortBy'] {
  return (
    value === 'newest' ||
    value === 'oldest' ||
    value === 'highest' ||
    value === 'lowest' ||
    value === 'name-asc' ||
    value === 'name-desc'
  );
}
