// src/lib/filtering/persistence.test.ts
// Unit tests for filter persistence

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DEFAULT_FILTERS, FILTER_STORAGE_KEY } from './types';
import {
  loadFilterPreferences,
  saveFilterPreferences,
  clearFilterPreferences,
} from './persistence';

describe('persistence', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('loadFilterPreferences', () => {
    it('should return default filters when localStorage is empty', () => {
      const result = loadFilterPreferences();
      expect(result).toEqual(DEFAULT_FILTERS);
    });

    it('should return stored preferences when valid', () => {
      const stored = {
        selectedApps: ['Hinge', 'Tinder'],
        scorePreset: 'high',
        datePreset: '7d',
        sortBy: 'oldest',
        showFavoritesOnly: true,
        selectedTags: ['tag-1', 'tag-2'],
      };
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(stored));

      const result = loadFilterPreferences();
      expect(result).toEqual(stored);
    });

    it('should merge with defaults for partial data (legacy format without Phase C fields)', () => {
      // Simulates loading data from before Phase C was implemented
      const stored = {
        selectedApps: ['Hinge'],
        scorePreset: 'high',
        datePreset: '7d',
        sortBy: 'oldest',
        // Missing showFavoritesOnly and selectedTags
      };
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(stored));

      const result = loadFilterPreferences();
      expect(result.selectedApps).toEqual(['Hinge']);
      expect(result.scorePreset).toBe('high');
      expect(result.datePreset).toBe('7d');
      expect(result.sortBy).toBe('oldest');
      // Should add defaults for Phase C fields
      expect(result.showFavoritesOnly).toBe(false);
      expect(result.selectedTags).toEqual([]);
    });

    it('should merge with defaults for minimal partial data', () => {
      const stored = {
        selectedApps: ['Hinge'],
        // Missing other fields
      };
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(stored));

      const result = loadFilterPreferences();
      expect(result.selectedApps).toEqual(['Hinge']);
      expect(result.scorePreset).toBe('all');
      expect(result.datePreset).toBe('all');
      expect(result.sortBy).toBe('newest');
      expect(result.showFavoritesOnly).toBe(false);
      expect(result.selectedTags).toEqual([]);
    });

    it('should return defaults for invalid JSON', () => {
      localStorage.setItem(FILTER_STORAGE_KEY, 'not valid json');

      const result = loadFilterPreferences();
      expect(result).toEqual(DEFAULT_FILTERS);
    });

    it('should return defaults for invalid scorePreset', () => {
      const stored = {
        selectedApps: [],
        scorePreset: 'invalid',
        datePreset: 'all',
        sortBy: 'newest',
        showFavoritesOnly: false,
        selectedTags: [],
      };
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(stored));

      const result = loadFilterPreferences();
      expect(result.scorePreset).toBe('all');
    });

    it('should return defaults for invalid datePreset', () => {
      const stored = {
        selectedApps: [],
        scorePreset: 'all',
        datePreset: 'invalid',
        sortBy: 'newest',
        showFavoritesOnly: false,
        selectedTags: [],
      };
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(stored));

      const result = loadFilterPreferences();
      expect(result.datePreset).toBe('all');
    });

    it('should return defaults for invalid sortBy', () => {
      const stored = {
        selectedApps: [],
        scorePreset: 'all',
        datePreset: 'all',
        sortBy: 'invalid',
        showFavoritesOnly: false,
        selectedTags: [],
      };
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(stored));

      const result = loadFilterPreferences();
      expect(result.sortBy).toBe('newest');
    });

    it('should handle invalid showFavoritesOnly value', () => {
      const stored = {
        selectedApps: [],
        scorePreset: 'all',
        datePreset: 'all',
        sortBy: 'newest',
        showFavoritesOnly: 'not-a-boolean',
        selectedTags: [],
      };
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(stored));

      const result = loadFilterPreferences();
      expect(result.showFavoritesOnly).toBe(false);
    });

    it('should handle invalid selectedTags value', () => {
      const stored = {
        selectedApps: [],
        scorePreset: 'all',
        datePreset: 'all',
        sortBy: 'newest',
        showFavoritesOnly: false,
        selectedTags: 'not-an-array',
      };
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(stored));

      const result = loadFilterPreferences();
      expect(result.selectedTags).toEqual([]);
    });

    it('should filter non-string values from selectedTags', () => {
      const stored = {
        selectedApps: [],
        scorePreset: 'all',
        datePreset: 'all',
        sortBy: 'newest',
        showFavoritesOnly: false,
        selectedTags: ['valid-tag', 123, null, 'another-tag', { invalid: true }],
      };
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(stored));

      const result = loadFilterPreferences();
      expect(result.selectedTags).toEqual(['valid-tag', 'another-tag']);
    });
  });

  describe('saveFilterPreferences', () => {
    it('should save preferences to localStorage', () => {
      const preferences = {
        selectedApps: ['Hinge'] as const,
        scorePreset: 'high' as const,
        datePreset: '7d' as const,
        sortBy: 'oldest' as const,
        showFavoritesOnly: true,
        selectedTags: ['tag-1'],
      };

      saveFilterPreferences(preferences);

      const stored = localStorage.getItem(FILTER_STORAGE_KEY);
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored!)).toEqual(preferences);
    });

    it('should overwrite existing preferences', () => {
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(DEFAULT_FILTERS));

      const newPreferences = {
        ...DEFAULT_FILTERS,
        selectedApps: ['Bumble'] as ('Hinge' | 'Tinder' | 'Bumble' | 'Other')[],
      };
      saveFilterPreferences(newPreferences);

      const stored = JSON.parse(localStorage.getItem(FILTER_STORAGE_KEY)!);
      expect(stored.selectedApps).toEqual(['Bumble']);
    });
  });

  describe('clearFilterPreferences', () => {
    it('should remove preferences from localStorage', () => {
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(DEFAULT_FILTERS));

      clearFilterPreferences();

      expect(localStorage.getItem(FILTER_STORAGE_KEY)).toBeNull();
    });

    it('should not throw when key does not exist', () => {
      expect(() => clearFilterPreferences()).not.toThrow();
    });
  });
});
