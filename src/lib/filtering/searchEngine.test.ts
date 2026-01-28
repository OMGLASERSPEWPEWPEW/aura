// src/lib/filtering/searchEngine.test.ts
import { describe, it, expect } from 'vitest';
import {
  matchesSearchQuery,
  filterProfilesBySearch,
  searchProfiles,
} from './searchEngine';
import type { Profile } from '../db';

// Helper to create mock profiles
function createMockProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 1,
    name: 'Test User',
    timestamp: new Date(),
    thumbnail: '',
    analysis: {},
    ...overrides,
  };
}

describe('searchEngine', () => {
  // ==================== matchesSearchQuery ====================
  describe('matchesSearchQuery', () => {
    it('should match empty query to any profile', () => {
      const profile = createMockProfile({ name: 'Jane Doe' });
      expect(matchesSearchQuery(profile, { text: '', fields: ['name'] })).toBe(true);
      expect(matchesSearchQuery(profile, { text: '   ', fields: ['name'] })).toBe(true);
    });

    it('should match profile name case-insensitively', () => {
      const profile = createMockProfile({ name: 'Jane Doe' });

      expect(matchesSearchQuery(profile, { text: 'jane', fields: ['name'] })).toBe(true);
      expect(matchesSearchQuery(profile, { text: 'JANE', fields: ['name'] })).toBe(true);
      expect(matchesSearchQuery(profile, { text: 'Jane', fields: ['name'] })).toBe(true);
      expect(matchesSearchQuery(profile, { text: 'doe', fields: ['name'] })).toBe(true);
      expect(matchesSearchQuery(profile, { text: 'ane do', fields: ['name'] })).toBe(true);
    });

    it('should not match when name does not contain search text', () => {
      const profile = createMockProfile({ name: 'Jane Doe' });

      expect(matchesSearchQuery(profile, { text: 'john', fields: ['name'] })).toBe(false);
      expect(matchesSearchQuery(profile, { text: 'xyz', fields: ['name'] })).toBe(false);
    });

    it('should match against basics fields when specified', () => {
      const profile = createMockProfile({
        name: 'Jane',
        analysis: {
          basics: {
            location: 'New York',
            job: 'Software Engineer',
            school: 'MIT',
            hometown: 'Boston',
          },
        },
      });

      expect(matchesSearchQuery(profile, { text: 'new york', fields: ['basics'] })).toBe(true);
      expect(matchesSearchQuery(profile, { text: 'engineer', fields: ['basics'] })).toBe(true);
      expect(matchesSearchQuery(profile, { text: 'mit', fields: ['basics'] })).toBe(true);
      expect(matchesSearchQuery(profile, { text: 'boston', fields: ['basics'] })).toBe(true);
    });

    it('should match against summary when specified', () => {
      const profile = createMockProfile({
        name: 'Jane',
        analysis: {
          overall_analysis: {
            summary: 'A passionate traveler who loves adventure',
          },
        },
      });

      expect(matchesSearchQuery(profile, { text: 'traveler', fields: ['summary'] })).toBe(true);
      expect(matchesSearchQuery(profile, { text: 'adventure', fields: ['summary'] })).toBe(true);
      expect(matchesSearchQuery(profile, { text: 'cooking', fields: ['summary'] })).toBe(false);
    });

    it('should match if any specified field matches', () => {
      const profile = createMockProfile({
        name: 'Jane',
        analysis: {
          basics: { location: 'Los Angeles' },
        },
      });

      // Name doesn't match but basics does
      expect(matchesSearchQuery(profile, { text: 'angeles', fields: ['name', 'basics'] })).toBe(
        true
      );
      // Name matches
      expect(matchesSearchQuery(profile, { text: 'jane', fields: ['name', 'basics'] })).toBe(true);
    });

    it('should handle profiles with missing analysis data gracefully', () => {
      const profile = createMockProfile({
        name: 'Jane',
        analysis: {},
      });

      expect(matchesSearchQuery(profile, { text: 'test', fields: ['basics'] })).toBe(false);
      expect(matchesSearchQuery(profile, { text: 'test', fields: ['summary'] })).toBe(false);
    });

    it('should return false for tags field (not implemented yet)', () => {
      const profile = createMockProfile({ name: 'Jane' });
      expect(matchesSearchQuery(profile, { text: 'favorite', fields: ['tags'] })).toBe(false);
    });
  });

  // ==================== filterProfilesBySearch ====================
  describe('filterProfilesBySearch', () => {
    const profiles = [
      createMockProfile({ id: 1, name: 'Alice Smith' }),
      createMockProfile({ id: 2, name: 'Bob Johnson' }),
      createMockProfile({ id: 3, name: 'Charlie Brown' }),
      createMockProfile({ id: 4, name: 'Alice Johnson' }),
    ];

    it('should return all profiles for empty search text', () => {
      const result = filterProfilesBySearch(profiles, { text: '', fields: ['name'] });
      expect(result).toHaveLength(4);
    });

    it('should filter profiles matching the search text', () => {
      const result = filterProfilesBySearch(profiles, { text: 'alice', fields: ['name'] });
      expect(result).toHaveLength(2);
      expect(result.map((p) => p.id)).toEqual([1, 4]);
    });

    it('should filter profiles by partial name match', () => {
      const result = filterProfilesBySearch(profiles, { text: 'john', fields: ['name'] });
      expect(result).toHaveLength(2);
      expect(result.map((p) => p.name)).toEqual(['Bob Johnson', 'Alice Johnson']);
    });

    it('should return empty array when no profiles match', () => {
      const result = filterProfilesBySearch(profiles, { text: 'xyz', fields: ['name'] });
      expect(result).toHaveLength(0);
    });

    it('should maintain original order of matching profiles', () => {
      const result = filterProfilesBySearch(profiles, { text: 'o', fields: ['name'] });
      // Alice, Bob, Charlie, Alice all contain 'o' in some form
      expect(result.map((p) => p.id)).toEqual([2, 3, 4]); // Bob Johnson, Charlie Brown, Alice Johnson
    });
  });

  // ==================== searchProfiles (convenience wrapper) ====================
  describe('searchProfiles', () => {
    const profiles = [
      createMockProfile({ id: 1, name: 'Emma Watson' }),
      createMockProfile({ id: 2, name: 'Emma Stone' }),
      createMockProfile({ id: 3, name: 'Jennifer Lawrence' }),
    ];

    it('should search by name by default', () => {
      const result = searchProfiles(profiles, 'emma');
      expect(result).toHaveLength(2);
      expect(result.map((p) => p.name)).toEqual(['Emma Watson', 'Emma Stone']);
    });

    it('should return all profiles for empty search', () => {
      const result = searchProfiles(profiles, '');
      expect(result).toHaveLength(3);
    });

    it('should handle whitespace-only search', () => {
      const result = searchProfiles(profiles, '   ');
      expect(result).toHaveLength(3);
    });
  });
});
