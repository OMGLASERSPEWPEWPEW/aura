// src/lib/filtering/sortEngine.ts
// Sort engine for ordering profiles by various criteria

import type { Profile } from '../db';
import type { SortOption } from './types';
import { calculateAverageScore } from './filterEngine';

/**
 * Compare function for sorting profiles by timestamp (newest first).
 */
function compareByNewest(a: Profile, b: Profile): number {
  const aTime = new Date(a.timestamp).getTime();
  const bTime = new Date(b.timestamp).getTime();
  return bTime - aTime; // Descending (newest first)
}

/**
 * Compare function for sorting profiles by timestamp (oldest first).
 */
function compareByOldest(a: Profile, b: Profile): number {
  const aTime = new Date(a.timestamp).getTime();
  const bTime = new Date(b.timestamp).getTime();
  return aTime - bTime; // Ascending (oldest first)
}

/**
 * Compare function for sorting profiles by virtue score (highest first).
 * Profiles without scores are sorted to the end.
 */
function compareByHighestScore(a: Profile, b: Profile): number {
  const aScore = calculateAverageScore(a.virtue_scores);
  const bScore = calculateAverageScore(b.virtue_scores);

  // Handle null scores - push them to the end
  if (aScore === null && bScore === null) return 0;
  if (aScore === null) return 1;  // a goes after b
  if (bScore === null) return -1; // a goes before b

  return bScore - aScore; // Descending (highest first)
}

/**
 * Compare function for sorting profiles by virtue score (lowest first).
 * Profiles without scores are sorted to the end.
 */
function compareByLowestScore(a: Profile, b: Profile): number {
  const aScore = calculateAverageScore(a.virtue_scores);
  const bScore = calculateAverageScore(b.virtue_scores);

  // Handle null scores - push them to the end
  if (aScore === null && bScore === null) return 0;
  if (aScore === null) return 1;  // a goes after b
  if (bScore === null) return -1; // a goes before b

  return aScore - bScore; // Ascending (lowest first)
}

/**
 * Compare function for sorting profiles alphabetically by name (A-Z).
 */
function compareByNameAsc(a: Profile, b: Profile): number {
  const aName = a.name.toLowerCase();
  const bName = b.name.toLowerCase();
  return aName.localeCompare(bName);
}

/**
 * Compare function for sorting profiles alphabetically by name (Z-A).
 */
function compareByNameDesc(a: Profile, b: Profile): number {
  const aName = a.name.toLowerCase();
  const bName = b.name.toLowerCase();
  return bName.localeCompare(aName);
}

/**
 * Sort profiles by the specified sort option.
 * Returns a new sorted array (does not mutate input).
 */
export function sortProfiles(profiles: Profile[], sortOption: SortOption): Profile[] {
  // Create a copy to avoid mutating the input
  const sorted = [...profiles];

  switch (sortOption) {
    case 'newest':
      sorted.sort(compareByNewest);
      break;
    case 'oldest':
      sorted.sort(compareByOldest);
      break;
    case 'highest':
      sorted.sort(compareByHighestScore);
      break;
    case 'lowest':
      sorted.sort(compareByLowestScore);
      break;
    case 'name-asc':
      sorted.sort(compareByNameAsc);
      break;
    case 'name-desc':
      sorted.sort(compareByNameDesc);
      break;
    default:
      // Default to newest if unknown option
      sorted.sort(compareByNewest);
  }

  return sorted;
}

/**
 * Get human-readable label for a sort option.
 */
export function getSortLabel(sortOption: SortOption): string {
  switch (sortOption) {
    case 'newest':
      return 'Newest First';
    case 'oldest':
      return 'Oldest First';
    case 'highest':
      return 'Highest Score';
    case 'lowest':
      return 'Lowest Score';
    case 'name-asc':
      return 'Name A-Z';
    case 'name-desc':
      return 'Name Z-A';
    default:
      return 'Newest First';
  }
}
