// src/lib/schemas/streaming.schemas.test.ts
import { describe, it, expect } from 'vitest';
import {
  ChunkBasicsResultSchema,
  ChunkImpressionsResultSchema,
  ChunkObservationsResultSchema,
  ChunkFlagsResultSchema,
  PhotoAnalysisStreamingSchema,
  PromptAnalysisStreamingSchema,
} from './streaming.schemas';

describe('streaming.schemas', () => {
  describe('ChunkBasicsResultSchema', () => {
    it('should accept valid basics with all fields', () => {
      const basics = {
        name: 'Sarah',
        age: 28,
        location: 'New York',
        job: 'Designer',
        app: 'Hinge',
        thumbnailIndex: 2,
      };
      expect(ChunkBasicsResultSchema.parse(basics)).toEqual(basics);
    });

    it('should accept basics with null fields', () => {
      const basics = {
        name: null,
        age: null,
        location: null,
        job: null,
        app: null,
        thumbnailIndex: 0,
      };
      const result = ChunkBasicsResultSchema.parse(basics);
      expect(result.name).toBeNull();
      expect(result.age).toBeNull();
    });

    it('should default thumbnailIndex to 0', () => {
      const basics = {
        name: 'Test',
      };
      const result = ChunkBasicsResultSchema.parse(basics);
      expect(result.thumbnailIndex).toBe(0);
    });

    it('should reject negative thumbnailIndex', () => {
      const basics = {
        name: 'Test',
        thumbnailIndex: -1,
      };
      expect(() => ChunkBasicsResultSchema.parse(basics)).toThrow();
    });
  });

  describe('ChunkImpressionsResultSchema', () => {
    it('should accept valid impressions', () => {
      const impressions = {
        vibes: ['fun', 'adventurous', 'creative'],
        firstImpressions: ['outgoing', 'energetic'],
        emergingArchetype: 'The Creative Explorer',
        archetypeConfidence: 75,
      };
      expect(ChunkImpressionsResultSchema.parse(impressions)).toEqual(impressions);
    });

    it('should default arrays to empty and confidence to 0', () => {
      const impressions = {};
      const result = ChunkImpressionsResultSchema.parse(impressions);
      expect(result.vibes).toEqual([]);
      expect(result.firstImpressions).toEqual([]);
      expect(result.archetypeConfidence).toBe(0);
    });

    it('should reject confidence over 100', () => {
      const impressions = {
        archetypeConfidence: 150,
      };
      expect(() => ChunkImpressionsResultSchema.parse(impressions)).toThrow();
    });
  });

  describe('PhotoAnalysisStreamingSchema', () => {
    it('should accept valid photo analysis', () => {
      const photo = {
        description: 'Beach sunset photo',
        vibe: 'relaxed',
        subtext: 'Values leisure and natural beauty',
      };
      expect(PhotoAnalysisStreamingSchema.parse(photo)).toEqual(photo);
    });

    it('should default to empty strings', () => {
      const result = PhotoAnalysisStreamingSchema.parse({});
      expect(result.description).toBe('');
      expect(result.vibe).toBe('');
      expect(result.subtext).toBe('');
    });
  });

  describe('PromptAnalysisStreamingSchema', () => {
    it('should accept valid prompt analysis with opener', () => {
      const prompt = {
        question: 'My most controversial opinion is...',
        answer: 'Pineapple belongs on pizza',
        analysis: 'Shows playful personality',
        suggested_opener: {
          message: 'Team pineapple! What other food controversies do you stand by?',
          tactic: 'shared stance',
          why_it_works: 'Creates immediate bonding over shared preference',
        },
      };
      expect(PromptAnalysisStreamingSchema.parse(prompt)).toEqual(prompt);
    });

    it('should accept prompt without opener', () => {
      const prompt = {
        question: 'A fact about me',
        answer: 'I can juggle',
        analysis: 'Unique skill',
      };
      const result = PromptAnalysisStreamingSchema.parse(prompt);
      expect(result.suggested_opener).toBeUndefined();
    });
  });

  describe('ChunkObservationsResultSchema', () => {
    it('should accept valid observations', () => {
      const observations = {
        photos: [
          { description: 'Photo 1', vibe: 'happy', subtext: 'Joyful' },
        ],
        prompts: [
          { question: 'Q1', answer: 'A1', analysis: 'Analysis 1' },
        ],
        signals: ['outgoing', 'social'],
      };
      expect(ChunkObservationsResultSchema.parse(observations)).toEqual(observations);
    });

    it('should default all arrays to empty', () => {
      const result = ChunkObservationsResultSchema.parse({});
      expect(result.photos).toEqual([]);
      expect(result.prompts).toEqual([]);
      expect(result.signals).toEqual([]);
    });
  });

  describe('ChunkFlagsResultSchema', () => {
    it('should accept valid flags', () => {
      const flags = {
        redFlags: ['inconsistent stories'],
        greenFlags: ['genuine smile', 'good photos with friends'],
        agendas: [
          { type: 'connection', evidence: 'Vulnerable prompt answers', priority: 'primary' as const },
        ],
        presentationTactics: ['humor', 'self-deprecation'],
        predictedTactics: ['will use wit to deflect'],
        archetypeRefinement: 'The Witty Intellectual',
        finalConfidence: 85,
      };
      expect(ChunkFlagsResultSchema.parse(flags)).toEqual(flags);
    });

    it('should default all fields appropriately', () => {
      const result = ChunkFlagsResultSchema.parse({});
      expect(result.redFlags).toEqual([]);
      expect(result.greenFlags).toEqual([]);
      expect(result.agendas).toEqual([]);
      expect(result.presentationTactics).toEqual([]);
      expect(result.predictedTactics).toEqual([]);
      expect(result.archetypeRefinement).toBe('');
      expect(result.finalConfidence).toBe(0);
    });
  });
});
