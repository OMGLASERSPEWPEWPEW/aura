// src/lib/moodboard/types.test.ts
import { describe, it, expect } from 'vitest';
import { extractThemeInput } from './types';
import type { AccumulatedProfile } from '../streaming/types';

describe('types', () => {
  describe('extractThemeInput', () => {
    it('extracts all relevant fields from accumulated profile', () => {
      const profile: AccumulatedProfile = {
        identity: {
          name: 'Test',
          age: 25,
          location: 'NYC',
          job: 'Engineer',
          app: 'Hinge',
        },
        photos: {
          thumbnailIndex: 0,
          analyses: [
            { description: 'hiking in mountains', vibe: 'adventurous', subtext: 'loves outdoors' },
            { description: 'cooking in kitchen', vibe: 'homey', subtext: 'enjoys creating' },
          ],
          vibesSummary: ['adventurous', 'creative', 'warm'],
        },
        prompts: {
          found: [
            { question: 'My ideal weekend', answer: 'Hiking then cooking a nice dinner', analysis: 'balanced' },
            { question: 'Best travel story', answer: 'Backpacking through Europe', analysis: 'explorer' },
          ],
        },
        psychological: {
          emergingArchetype: 'The Explorer',
          confidenceLevel: 75,
          signals: [],
          agendas: [],
          presentationTactics: [],
          predictedTactics: [],
        },
        earlyWarnings: { redFlags: [], greenFlags: [] },
        meta: {
          chunksProcessed: 3,
          totalChunks: 4,
          phase: 'quick',
          startedAt: new Date(),
          lastUpdatedAt: new Date(),
        },
      };

      const input = extractThemeInput(profile);

      expect(input.vibesSummary).toEqual(['adventurous', 'creative', 'warm']);
      expect(input.photoDescriptions).toEqual(['hiking in mountains', 'cooking in kitchen']);
      expect(input.promptAnswers).toEqual([
        'Hiking then cooking a nice dinner',
        'Backpacking through Europe',
      ]);
      expect(input.emergingArchetype).toBe('The Explorer');
    });

    it('handles empty profile data gracefully', () => {
      const profile: AccumulatedProfile = {
        identity: {
          name: null,
          age: null,
          location: null,
          job: null,
          app: null,
        },
        photos: {
          thumbnailIndex: 0,
          analyses: [],
          vibesSummary: [],
        },
        prompts: {
          found: [],
        },
        psychological: {
          emergingArchetype: null,
          confidenceLevel: 0,
          signals: [],
          agendas: [],
          presentationTactics: [],
          predictedTactics: [],
        },
        earlyWarnings: { redFlags: [], greenFlags: [] },
        meta: {
          chunksProcessed: 0,
          totalChunks: 4,
          phase: 'quick',
          startedAt: new Date(),
          lastUpdatedAt: new Date(),
        },
      };

      const input = extractThemeInput(profile);

      expect(input.vibesSummary).toEqual([]);
      expect(input.photoDescriptions).toEqual([]);
      expect(input.promptAnswers).toEqual([]);
      expect(input.emergingArchetype).toBeNull();
    });

    it('extracts descriptions from all photo analyses', () => {
      const profile: AccumulatedProfile = {
        identity: { name: 'Test', age: 25, location: null, job: null, app: null },
        photos: {
          thumbnailIndex: 0,
          analyses: [
            { description: 'photo 1 desc', vibe: 'vibe1', subtext: 'sub1' },
            { description: 'photo 2 desc', vibe: 'vibe2', subtext: 'sub2' },
            { description: 'photo 3 desc', vibe: 'vibe3', subtext: 'sub3' },
            { description: 'photo 4 desc', vibe: 'vibe4', subtext: 'sub4' },
          ],
          vibesSummary: ['vibe1', 'vibe2', 'vibe3', 'vibe4'],
        },
        prompts: { found: [] },
        psychological: {
          emergingArchetype: null,
          confidenceLevel: 0,
          signals: [],
          agendas: [],
          presentationTactics: [],
          predictedTactics: [],
        },
        earlyWarnings: { redFlags: [], greenFlags: [] },
        meta: {
          chunksProcessed: 1,
          totalChunks: 4,
          phase: 'quick',
          startedAt: new Date(),
          lastUpdatedAt: new Date(),
        },
      };

      const input = extractThemeInput(profile);

      expect(input.photoDescriptions).toHaveLength(4);
      expect(input.photoDescriptions).toContain('photo 1 desc');
      expect(input.photoDescriptions).toContain('photo 4 desc');
    });
  });
});
