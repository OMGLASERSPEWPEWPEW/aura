// src/lib/filtering/sortEngine.test.ts
// Unit tests for the sort engine

import { describe, it, expect } from 'vitest';
import type { Profile } from '../db';
import { sortProfiles, getSortLabel } from './sortEngine';

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

describe('sortEngine', () => {
  describe('sortProfiles', () => {
    describe('by timestamp', () => {
      const profiles: Profile[] = [
        createTestProfile({ id: 1, timestamp: new Date('2024-01-15') }),
        createTestProfile({ id: 2, timestamp: new Date('2024-01-20') }),
        createTestProfile({ id: 3, timestamp: new Date('2024-01-10') }),
      ];

      it('should sort newest first', () => {
        const result = sortProfiles(profiles, 'newest');
        expect(result.map(p => p.id)).toEqual([2, 1, 3]);
      });

      it('should sort oldest first', () => {
        const result = sortProfiles(profiles, 'oldest');
        expect(result.map(p => p.id)).toEqual([3, 1, 2]);
      });

      it('should not mutate original array', () => {
        const original = [...profiles];
        sortProfiles(profiles, 'newest');
        expect(profiles.map(p => p.id)).toEqual(original.map(p => p.id));
      });
    });

    describe('by score', () => {
      const profiles: Profile[] = [
        createTestProfile({
          id: 1,
          virtue_scores: [
            { virtue: 'A', score: 5, evidence: 'test' },
            { virtue: 'B', score: 5, evidence: 'test' },
          ], // avg 5
        }),
        createTestProfile({
          id: 2,
          virtue_scores: [
            { virtue: 'A', score: 9, evidence: 'test' },
            { virtue: 'B', score: 7, evidence: 'test' },
          ], // avg 8
        }),
        createTestProfile({ id: 3 }), // no scores
        createTestProfile({
          id: 4,
          virtue_scores: [
            { virtue: 'A', score: 3, evidence: 'test' },
            { virtue: 'B', score: 3, evidence: 'test' },
          ], // avg 3
        }),
      ];

      it('should sort highest score first', () => {
        const result = sortProfiles(profiles, 'highest');
        // Profiles with scores should be sorted by score, no-score pushed to end
        expect(result[0].id).toBe(2); // score 8
        expect(result[1].id).toBe(1); // score 5
        expect(result[2].id).toBe(4); // score 3
        expect(result[3].id).toBe(3); // no score
      });

      it('should sort lowest score first', () => {
        const result = sortProfiles(profiles, 'lowest');
        expect(result[0].id).toBe(4); // score 3
        expect(result[1].id).toBe(1); // score 5
        expect(result[2].id).toBe(2); // score 8
        expect(result[3].id).toBe(3); // no score
      });

      it('should push profiles without scores to the end', () => {
        const result = sortProfiles(profiles, 'highest');
        expect(result[result.length - 1].id).toBe(3);
      });
    });

    describe('by name', () => {
      const profiles: Profile[] = [
        createTestProfile({ id: 1, name: 'Zara' }),
        createTestProfile({ id: 2, name: 'Alice' }),
        createTestProfile({ id: 3, name: 'bob' }), // lowercase
        createTestProfile({ id: 4, name: 'Charlie' }),
      ];

      it('should sort A-Z (case insensitive)', () => {
        const result = sortProfiles(profiles, 'name-asc');
        expect(result.map(p => p.name)).toEqual(['Alice', 'bob', 'Charlie', 'Zara']);
      });

      it('should sort Z-A (case insensitive)', () => {
        const result = sortProfiles(profiles, 'name-desc');
        expect(result.map(p => p.name)).toEqual(['Zara', 'Charlie', 'bob', 'Alice']);
      });
    });

    it('should default to newest for unknown sort option', () => {
      const profiles: Profile[] = [
        createTestProfile({ id: 1, timestamp: new Date('2024-01-15') }),
        createTestProfile({ id: 2, timestamp: new Date('2024-01-20') }),
      ];
      // @ts-expect-error - testing invalid input
      const result = sortProfiles(profiles, 'invalid-option');
      expect(result.map(p => p.id)).toEqual([2, 1]); // newest first
    });
  });

  describe('getSortLabel', () => {
    it('should return correct labels', () => {
      expect(getSortLabel('newest')).toBe('Newest First');
      expect(getSortLabel('oldest')).toBe('Oldest First');
      expect(getSortLabel('highest')).toBe('Highest Score');
      expect(getSortLabel('lowest')).toBe('Lowest Score');
      expect(getSortLabel('name-asc')).toBe('Name A-Z');
      expect(getSortLabel('name-desc')).toBe('Name Z-A');
    });

    it('should default to Newest First for unknown option', () => {
      // @ts-expect-error - testing invalid input
      expect(getSortLabel('invalid')).toBe('Newest First');
    });
  });
});
