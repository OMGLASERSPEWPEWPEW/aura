// src/lib/filtering/filterEngine.test.ts
// Unit tests for the filter engine

import { describe, it, expect } from 'vitest';
import type { Profile } from '../db';
import type { FilterPreferences } from './types';
import { DEFAULT_FILTERS } from './types';
import {
  normalizeAppName,
  calculateAverageScore,
  filterByApp,
  filterByScore,
  filterByDate,
  filterByFavorites,
  filterByTags,
  applyAllFilters,
  hasActiveFilters,
  countActiveFilters,
} from './filterEngine';

// Helper to create minimal test profiles
function createTestProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 1,
    name: 'Test Profile',
    timestamp: new Date(),
    analysis: { raw: 'test' },
    thumbnail: '',
    ...overrides,
  };
}

describe('filterEngine', () => {
  describe('normalizeAppName', () => {
    it('should return Hinge for hinge variants', () => {
      expect(normalizeAppName('Hinge')).toBe('Hinge');
      expect(normalizeAppName('hinge')).toBe('Hinge');
      expect(normalizeAppName('HINGE')).toBe('Hinge');
      expect(normalizeAppName('Hinge Dating')).toBe('Hinge');
    });

    it('should return Tinder for tinder variants', () => {
      expect(normalizeAppName('Tinder')).toBe('Tinder');
      expect(normalizeAppName('tinder')).toBe('Tinder');
      expect(normalizeAppName('TINDER')).toBe('Tinder');
    });

    it('should return Bumble for bumble variants', () => {
      expect(normalizeAppName('Bumble')).toBe('Bumble');
      expect(normalizeAppName('bumble')).toBe('Bumble');
      expect(normalizeAppName('Bumble Date')).toBe('Bumble');
    });

    it('should return Other for unknown or undefined', () => {
      expect(normalizeAppName('Coffee Meets Bagel')).toBe('Other');
      expect(normalizeAppName('')).toBe('Other');
      expect(normalizeAppName(undefined)).toBe('Other');
    });
  });

  describe('calculateAverageScore', () => {
    it('should return null for empty or undefined scores', () => {
      expect(calculateAverageScore(undefined)).toBeNull();
      expect(calculateAverageScore([])).toBeNull();
    });

    it('should calculate average correctly', () => {
      const scores = [
        { virtue: 'A', score: 8, evidence: 'test' },
        { virtue: 'B', score: 6, evidence: 'test' },
        { virtue: 'C', score: 10, evidence: 'test' },
      ];
      expect(calculateAverageScore(scores)).toBe(8);
    });

    it('should handle single score', () => {
      const scores = [{ virtue: 'A', score: 7, evidence: 'test' }];
      expect(calculateAverageScore(scores)).toBe(7);
    });
  });

  describe('filterByApp', () => {
    const profiles: Profile[] = [
      createTestProfile({ id: 1, appName: 'Hinge' }),
      createTestProfile({ id: 2, appName: 'Tinder' }),
      createTestProfile({ id: 3, appName: 'Bumble' }),
      createTestProfile({ id: 4, appName: 'Coffee Meets Bagel' }),
      createTestProfile({ id: 5, appName: undefined }),
    ];

    it('should return all profiles when apps array is empty', () => {
      const result = filterByApp(profiles, []);
      expect(result).toHaveLength(5);
    });

    it('should filter by single app', () => {
      const result = filterByApp(profiles, ['Hinge']);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('should filter by multiple apps', () => {
      const result = filterByApp(profiles, ['Hinge', 'Tinder']);
      expect(result).toHaveLength(2);
    });

    it('should include Other for unknown and undefined apps', () => {
      const result = filterByApp(profiles, ['Other']);
      expect(result).toHaveLength(2);
      expect(result.map(p => p.id)).toContain(4);
      expect(result.map(p => p.id)).toContain(5);
    });
  });

  describe('filterByScore', () => {
    const profiles: Profile[] = [
      createTestProfile({
        id: 1,
        virtue_scores: [
          { virtue: 'A', score: 9, evidence: 'test' },
          { virtue: 'B', score: 7, evidence: 'test' },
        ], // avg 8 (high)
      }),
      createTestProfile({
        id: 2,
        virtue_scores: [
          { virtue: 'A', score: 6, evidence: 'test' },
          { virtue: 'B', score: 5, evidence: 'test' },
        ], // avg 5.5 (medium)
      }),
      createTestProfile({
        id: 3,
        virtue_scores: [
          { virtue: 'A', score: 4, evidence: 'test' },
          { virtue: 'B', score: 3, evidence: 'test' },
        ], // avg 3.5 (low)
      }),
      createTestProfile({ id: 4 }), // no scores
    ];

    it('should return all profiles for "all" preset', () => {
      const result = filterByScore(profiles, 'all');
      expect(result).toHaveLength(4);
    });

    it('should filter high scores (7+)', () => {
      const result = filterByScore(profiles, 'high');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('should filter medium scores (5-6.9)', () => {
      const result = filterByScore(profiles, 'medium');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });

    it('should filter low scores (<5)', () => {
      const result = filterByScore(profiles, 'low');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(3);
    });

    it('should exclude profiles without scores when filtering', () => {
      const result = filterByScore(profiles, 'high');
      expect(result.find(p => p.id === 4)).toBeUndefined();
    });
  });

  describe('filterByDate', () => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    const profiles: Profile[] = [
      createTestProfile({ id: 1, timestamp: new Date(now - 1 * day) }), // 1 day ago
      createTestProfile({ id: 2, timestamp: new Date(now - 5 * day) }), // 5 days ago
      createTestProfile({ id: 3, timestamp: new Date(now - 15 * day) }), // 15 days ago
      createTestProfile({ id: 4, timestamp: new Date(now - 45 * day) }), // 45 days ago
    ];

    it('should return all profiles for "all" preset', () => {
      const result = filterByDate(profiles, 'all');
      expect(result).toHaveLength(4);
    });

    it('should filter last 7 days', () => {
      const result = filterByDate(profiles, '7d');
      expect(result).toHaveLength(2);
      expect(result.map(p => p.id)).toContain(1);
      expect(result.map(p => p.id)).toContain(2);
    });

    it('should filter last 30 days', () => {
      const result = filterByDate(profiles, '30d');
      expect(result).toHaveLength(3);
      expect(result.map(p => p.id)).not.toContain(4);
    });

    it('should filter older than 30 days', () => {
      const result = filterByDate(profiles, 'older');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(4);
    });
  });

  describe('filterByFavorites', () => {
    const profiles: Profile[] = [
      createTestProfile({ id: 1, isFavorite: true }),
      createTestProfile({ id: 2, isFavorite: false }),
      createTestProfile({ id: 3, isFavorite: true }),
      createTestProfile({ id: 4 }), // undefined
    ];

    it('should return all profiles when showFavoritesOnly is false', () => {
      const result = filterByFavorites(profiles, false);
      expect(result).toHaveLength(4);
    });

    it('should return only favorited profiles when showFavoritesOnly is true', () => {
      const result = filterByFavorites(profiles, true);
      expect(result).toHaveLength(2);
      expect(result.map(p => p.id)).toEqual([1, 3]);
    });
  });

  describe('filterByTags', () => {
    const profiles: Profile[] = [
      createTestProfile({ id: 1, tags: ['tag-1', 'tag-2'] }),
      createTestProfile({ id: 2, tags: ['tag-2', 'tag-3'] }),
      createTestProfile({ id: 3, tags: ['tag-1'] }),
      createTestProfile({ id: 4, tags: [] }),
      createTestProfile({ id: 5 }), // undefined tags
    ];

    it('should return all profiles when selectedTags is empty', () => {
      const result = filterByTags(profiles, []);
      expect(result).toHaveLength(5);
    });

    it('should filter by single tag', () => {
      const result = filterByTags(profiles, ['tag-1']);
      expect(result).toHaveLength(2);
      expect(result.map(p => p.id)).toEqual([1, 3]);
    });

    it('should use OR logic for multiple tags', () => {
      const result = filterByTags(profiles, ['tag-1', 'tag-3']);
      expect(result).toHaveLength(3); // profiles 1, 2, 3
      expect(result.map(p => p.id)).toContain(1);
      expect(result.map(p => p.id)).toContain(2);
      expect(result.map(p => p.id)).toContain(3);
    });

    it('should exclude profiles with empty or undefined tags', () => {
      const result = filterByTags(profiles, ['tag-1']);
      expect(result.find(p => p.id === 4)).toBeUndefined();
      expect(result.find(p => p.id === 5)).toBeUndefined();
    });
  });

  describe('applyAllFilters', () => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    const profiles: Profile[] = [
      createTestProfile({
        id: 1,
        appName: 'Hinge',
        timestamp: new Date(now - 1 * day),
        virtue_scores: [{ virtue: 'A', score: 8, evidence: 'test' }],
        isFavorite: true,
        tags: ['met-irl'],
      }),
      createTestProfile({
        id: 2,
        appName: 'Tinder',
        timestamp: new Date(now - 5 * day),
        virtue_scores: [{ virtue: 'A', score: 5, evidence: 'test' }],
        isFavorite: false,
        tags: ['date-planned'],
      }),
      createTestProfile({
        id: 3,
        appName: 'Hinge',
        timestamp: new Date(now - 45 * day),
        virtue_scores: [{ virtue: 'A', score: 9, evidence: 'test' }],
        isFavorite: true,
        tags: ['met-irl'],
      }),
    ];

    it('should return all profiles with default filters', () => {
      const result = applyAllFilters(profiles, DEFAULT_FILTERS);
      expect(result).toHaveLength(3);
    });

    it('should apply AND logic for multiple filters', () => {
      const filters: FilterPreferences = {
        selectedApps: ['Hinge'],
        scorePreset: 'high',
        datePreset: '30d',
        sortBy: 'newest',
        showFavoritesOnly: false,
        selectedTags: [],
      };
      const result = applyAllFilters(profiles, filters);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1); // Only Hinge + high score + within 30 days
    });

    it('should filter by favorites and tags together', () => {
      const filters: FilterPreferences = {
        ...DEFAULT_FILTERS,
        showFavoritesOnly: true,
        selectedTags: ['met-irl'],
      };
      const result = applyAllFilters(profiles, filters);
      expect(result).toHaveLength(2); // profiles 1 and 3
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false for default filters', () => {
      expect(hasActiveFilters(DEFAULT_FILTERS)).toBe(false);
    });

    it('should return true when apps filter is active', () => {
      expect(hasActiveFilters({ ...DEFAULT_FILTERS, selectedApps: ['Hinge'] })).toBe(true);
    });

    it('should return true when score filter is active', () => {
      expect(hasActiveFilters({ ...DEFAULT_FILTERS, scorePreset: 'high' })).toBe(true);
    });

    it('should return true when date filter is active', () => {
      expect(hasActiveFilters({ ...DEFAULT_FILTERS, datePreset: '7d' })).toBe(true);
    });

    it('should return true when favorites filter is active', () => {
      expect(hasActiveFilters({ ...DEFAULT_FILTERS, showFavoritesOnly: true })).toBe(true);
    });

    it('should return true when tags filter is active', () => {
      expect(hasActiveFilters({ ...DEFAULT_FILTERS, selectedTags: ['tag-1'] })).toBe(true);
    });

    it('should not consider sortBy as an active filter', () => {
      expect(hasActiveFilters({ ...DEFAULT_FILTERS, sortBy: 'oldest' })).toBe(false);
    });
  });

  describe('countActiveFilters', () => {
    it('should return 0 for default filters', () => {
      expect(countActiveFilters(DEFAULT_FILTERS)).toBe(0);
    });

    it('should count each active filter category', () => {
      expect(countActiveFilters({ ...DEFAULT_FILTERS, selectedApps: ['Hinge'] })).toBe(1);
      expect(countActiveFilters({ ...DEFAULT_FILTERS, selectedApps: ['Hinge'], scorePreset: 'high' })).toBe(2);
      expect(countActiveFilters({
        selectedApps: ['Hinge', 'Tinder'],
        scorePreset: 'high',
        datePreset: '7d',
        sortBy: 'newest',
        showFavoritesOnly: false,
        selectedTags: [],
      })).toBe(3);
    });

    it('should count favorites and tags filters', () => {
      expect(countActiveFilters({
        ...DEFAULT_FILTERS,
        showFavoritesOnly: true,
        selectedTags: ['tag-1'],
      })).toBe(2);
    });

    it('should count all filter types together', () => {
      expect(countActiveFilters({
        selectedApps: ['Hinge'],
        scorePreset: 'high',
        datePreset: '7d',
        sortBy: 'newest',
        showFavoritesOnly: true,
        selectedTags: ['tag-1', 'tag-2'],
      })).toBe(5);
    });
  });
});
