// src/lib/filtering/filterEngine.ts
// Filter engine for filtering profiles by app, score, date, favorites, and tags

import type { Profile, PartnerVirtueScore } from '../db';
import type { DatingApp, ScorePreset, DatePreset, FilterPreferences } from './types';
import { SCORE_THRESHOLDS, DATE_THRESHOLDS } from './types';

/**
 * Normalize app name from profile to a DatingApp type.
 * Handles variations like "Hinge Dating", "Tinder", "hinge", etc.
 */
export function normalizeAppName(appName?: string): DatingApp {
  if (!appName) return 'Other';

  const normalized = appName.toLowerCase().trim();

  if (normalized.includes('hinge')) return 'Hinge';
  if (normalized.includes('tinder')) return 'Tinder';
  if (normalized.includes('bumble')) return 'Bumble';

  return 'Other';
}

/**
 * Calculate average virtue score for a profile.
 * Returns null if no virtue scores exist.
 */
export function calculateAverageScore(virtueScores?: PartnerVirtueScore[]): number | null {
  if (!virtueScores || virtueScores.length === 0) return null;

  const sum = virtueScores.reduce((acc, v) => acc + v.score, 0);
  return sum / virtueScores.length;
}

/**
 * Filter profiles by dating app.
 * Empty apps array means no filter (return all).
 */
export function filterByApp(profiles: Profile[], apps: DatingApp[]): Profile[] {
  // No filter if empty array
  if (apps.length === 0) return profiles;

  return profiles.filter((profile) => {
    const normalizedApp = normalizeAppName(profile.appName);
    return apps.includes(normalizedApp);
  });
}

/**
 * Filter profiles by virtue score preset.
 * - high: 7+ average
 * - medium: 5-6.9 average
 * - low: <5 average
 * - all: no filter
 *
 * Profiles without virtue scores are excluded when filtering by score
 * (except for 'all' preset).
 */
export function filterByScore(profiles: Profile[], preset: ScorePreset): Profile[] {
  if (preset === 'all') return profiles;

  return profiles.filter((profile) => {
    const avg = calculateAverageScore(profile.virtue_scores);

    // No score data - exclude from filtered results
    if (avg === null) return false;

    switch (preset) {
      case 'high':
        return avg >= SCORE_THRESHOLDS.high;
      case 'medium':
        return avg >= SCORE_THRESHOLDS.medium && avg < SCORE_THRESHOLDS.high;
      case 'low':
        return avg < SCORE_THRESHOLDS.medium;
      default:
        return true;
    }
  });
}

/**
 * Filter profiles by date preset.
 * - 7d: Created within the last 7 days
 * - 30d: Created within the last 30 days
 * - older: Created more than 30 days ago
 * - all: no filter
 */
export function filterByDate(profiles: Profile[], preset: DatePreset): Profile[] {
  if (preset === 'all') return profiles;

  const now = Date.now();

  return profiles.filter((profile) => {
    const timestamp = new Date(profile.timestamp).getTime();
    const age = now - timestamp;

    switch (preset) {
      case '7d':
        return age <= DATE_THRESHOLDS['7d'];
      case '30d':
        return age <= DATE_THRESHOLDS['30d'];
      case 'older':
        return age > DATE_THRESHOLDS['30d'];
      default:
        return true;
    }
  });
}

/**
 * Filter profiles by favorite status.
 * Only returns favorited profiles if showFavoritesOnly is true.
 */
export function filterByFavorites(profiles: Profile[], showFavoritesOnly: boolean): Profile[] {
  if (!showFavoritesOnly) return profiles;

  return profiles.filter((profile) => profile.isFavorite === true);
}

/**
 * Filter profiles by tags.
 * Uses OR logic - shows profiles that have ANY of the selected tags.
 * Empty selectedTags array means no filter (return all).
 */
export function filterByTags(profiles: Profile[], selectedTags: string[]): Profile[] {
  if (selectedTags.length === 0) return profiles;

  return profiles.filter((profile) => {
    // If profile has no tags, exclude when filtering by tags
    if (!profile.tags || profile.tags.length === 0) return false;

    // OR logic: return true if profile has ANY of the selected tags
    return selectedTags.some((tagId) => profile.tags?.includes(tagId));
  });
}

/**
 * Apply all filters to profiles with AND logic.
 * Each filter is applied in sequence, narrowing down the results.
 *
 * Note: Does NOT apply sorting. Use sortProfiles() for that.
 */
export function applyAllFilters(profiles: Profile[], filters: FilterPreferences): Profile[] {
  let result = profiles;

  // Apply favorites filter first (most restrictive when active)
  result = filterByFavorites(result, filters.showFavoritesOnly);

  // Apply tags filter
  result = filterByTags(result, filters.selectedTags);

  // Apply app filter
  result = filterByApp(result, filters.selectedApps);

  // Apply score filter
  result = filterByScore(result, filters.scorePreset);

  // Apply date filter
  result = filterByDate(result, filters.datePreset);

  return result;
}

/**
 * Check if any filters are active (not at default values).
 * Does not consider sortBy since that's always set.
 */
export function hasActiveFilters(filters: FilterPreferences): boolean {
  return (
    filters.selectedApps.length > 0 ||
    filters.scorePreset !== 'all' ||
    filters.datePreset !== 'all' ||
    filters.showFavoritesOnly === true ||
    filters.selectedTags.length > 0
  );
}

/**
 * Count the number of active filter categories.
 * Used for badge display on filter button.
 */
export function countActiveFilters(filters: FilterPreferences): number {
  let count = 0;

  if (filters.selectedApps.length > 0) count++;
  if (filters.scorePreset !== 'all') count++;
  if (filters.datePreset !== 'all') count++;
  if (filters.showFavoritesOnly) count++;
  if (filters.selectedTags.length > 0) count++;

  return count;
}
