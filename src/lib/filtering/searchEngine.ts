// src/lib/filtering/searchEngine.ts
// Search engine for filtering profiles by text queries

import type { Profile } from '../db';
import type { SearchQuery, SearchField } from './types';
import { extractAnalysisFields } from '../utils/profileHelpers';

/**
 * Check if a profile matches a search query.
 * Performs case-insensitive matching against specified fields.
 */
export function matchesSearchQuery(profile: Profile, query: SearchQuery): boolean {
  // Empty query matches everything
  if (!query.text.trim()) {
    return true;
  }

  const searchText = query.text.toLowerCase().trim();

  // Check each specified field
  for (const field of query.fields) {
    if (matchesField(profile, field, searchText)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a specific field in the profile matches the search text.
 */
function matchesField(profile: Profile, field: SearchField, searchText: string): boolean {
  switch (field) {
    case 'name':
      return profile.name.toLowerCase().includes(searchText);

    case 'basics': {
      const { basics } = extractAnalysisFields(profile.analysis);
      const searchableBasics = [
        basics.location,
        basics.job,
        basics.school,
        basics.hometown,
      ].filter(Boolean);
      return searchableBasics.some((value) => value!.toLowerCase().includes(searchText));
    }

    case 'summary': {
      const { overall } = extractAnalysisFields(profile.analysis);
      return overall.summary?.toLowerCase().includes(searchText) ?? false;
    }

    case 'tags':
      // Tags not implemented yet (Phase C)
      // Will search against user-defined tags
      return false;

    default:
      return false;
  }
}

/**
 * Filter an array of profiles by a search query.
 * Returns profiles that match the query, maintaining original order.
 */
export function filterProfilesBySearch(profiles: Profile[], query: SearchQuery): Profile[] {
  // Empty query returns all profiles
  if (!query.text.trim()) {
    return profiles;
  }

  return profiles.filter((profile) => matchesSearchQuery(profile, query));
}

/**
 * Simple text-based search (convenience wrapper).
 * Searches name field by default.
 */
export function searchProfiles(profiles: Profile[], searchText: string): Profile[] {
  return filterProfilesBySearch(profiles, {
    text: searchText,
    fields: ['name'],
  });
}
