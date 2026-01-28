// src/lib/filtering/types.ts
// Type definitions for profile search and filtering

/**
 * Fields that can be searched within a profile.
 * - name: Profile name (primary search field)
 * - basics: Location, job, school, hometown
 * - summary: Overall analysis summary
 * - tags: Future use for user-defined tags
 */
export type SearchField = 'name' | 'basics' | 'summary' | 'tags';

/**
 * Search query configuration.
 * Contains the search text and which fields to search.
 */
export interface SearchQuery {
  text: string;
  fields: SearchField[];
}

/**
 * Default search fields to use when not specified.
 * For Phase A, we primarily search by name.
 */
export const DEFAULT_SEARCH_FIELDS: SearchField[] = ['name'];

/**
 * Session storage key for persisting search state.
 */
export const SEARCH_STORAGE_KEY = 'aura-profile-search';

// ============================================
// Phase B: Filter & Sort Types
// ============================================

/**
 * Dating apps supported for filtering.
 * Matches the appName field format from profile analysis.
 */
export type DatingApp = 'Hinge' | 'Tinder' | 'Bumble' | 'Other';

/**
 * Predefined score ranges for filtering by virtue score average.
 * - all: No filter
 * - high: 7+ average
 * - medium: 5-6.9 average
 * - low: <5 average
 */
export type ScorePreset = 'all' | 'high' | 'medium' | 'low';

/**
 * Predefined date ranges for filtering by profile timestamp.
 * - all: No filter
 * - 7d: Last 7 days
 * - 30d: Last 30 days
 * - older: More than 30 days ago
 */
export type DatePreset = 'all' | '7d' | '30d' | 'older';

/**
 * Sort options for profile ordering.
 * - newest/oldest: By timestamp
 * - highest/lowest: By virtue score average
 * - name-asc/name-desc: Alphabetical by name
 */
export type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest' | 'name-asc' | 'name-desc';

// ============================================
// Phase C: Tags & Favorites Types
// ============================================

/**
 * Available colors for tag chips.
 * Each maps to Tailwind color classes.
 */
export type TagColor = 'blue' | 'green' | 'red' | 'purple' | 'amber' | 'slate';

/**
 * Tag definition stored in UserIdentity.settings.
 */
export interface TagDefinition {
  /** Unique identifier (UUID) */
  id: string;
  /** Display name (e.g., "Met IRL") */
  name: string;
  /** Color for the tag chip */
  color: TagColor;
  /** Timestamp when created */
  createdAt: number;
}

/**
 * Suggested common tags that appear as quick-add options.
 * These are system-provided suggestions, not stored tags.
 */
export const SUGGESTED_TAGS = [
  'Met IRL',
  'Date Planned',
  'Second Date',
  'Pass',
  'Maybe Later',
  'Great Convo',
  'Red Flags',
  'Friends Only',
] as const;

/**
 * Default colors for suggested tags (used when creating from suggestions).
 */
export const SUGGESTED_TAG_COLORS: Record<string, TagColor> = {
  'Met IRL': 'green',
  'Date Planned': 'blue',
  'Second Date': 'purple',
  'Pass': 'red',
  'Maybe Later': 'amber',
  'Great Convo': 'green',
  'Red Flags': 'red',
  'Friends Only': 'slate',
};

/**
 * Complete filter preferences stored and applied to profiles.
 */
export interface FilterPreferences {
  /** Selected dating apps (empty array = all apps) */
  selectedApps: DatingApp[];
  /** Score range filter */
  scorePreset: ScorePreset;
  /** Date range filter */
  datePreset: DatePreset;
  /** Sort order */
  sortBy: SortOption;
  /** Show only favorited profiles */
  showFavoritesOnly: boolean;
  /** Selected tag IDs for filtering (OR logic - show profiles with ANY selected tag) */
  selectedTags: string[];
}

/**
 * Default filter preferences (no filters active, newest first).
 */
export const DEFAULT_FILTERS: FilterPreferences = {
  selectedApps: [],
  scorePreset: 'all',
  datePreset: 'all',
  sortBy: 'newest',
  showFavoritesOnly: false,
  selectedTags: [],
};

/**
 * Local storage key for persisting filter preferences.
 */
export const FILTER_STORAGE_KEY = 'aura:filter:preferences';

/**
 * Score thresholds for score preset filtering.
 */
export const SCORE_THRESHOLDS = {
  high: 7,    // 7+ is high
  medium: 5,  // 5-6.9 is medium
  // Below 5 is low
} as const;

/**
 * Date thresholds in milliseconds for date preset filtering.
 */
export const DATE_THRESHOLDS = {
  '7d': 7 * 24 * 60 * 60 * 1000,   // 7 days
  '30d': 30 * 24 * 60 * 60 * 1000, // 30 days
} as const;
