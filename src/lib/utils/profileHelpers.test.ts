// src/lib/utils/profileHelpers.test.ts
import { describe, it, expect } from 'vitest';
import {
  parseProfileAnalysis,
  extractAnalysisFields,
  getMatchZodiacSign,
  getMatchLocation,
  getMatchInterests,
  getProfileContextForOpeners,
} from './profileHelpers';
import type { Profile, AnalysisData, ProfileAnalysis } from '../db';

describe('profileHelpers', () => {
  // ==================== parseProfileAnalysis ====================
  describe('parseProfileAnalysis', () => {
    it('should return empty object for null/undefined input', () => {
      expect(parseProfileAnalysis(null as unknown as AnalysisData)).toEqual({});
      expect(parseProfileAnalysis(undefined as unknown as AnalysisData)).toEqual({});
    });

    it('should return ProfileAnalysis as-is when properly structured', () => {
      const analysis: ProfileAnalysis = {
        basics: { name: 'Jane', age: 28, location: 'NYC' },
        photos: [{ description: 'beach photo', vibe: 'adventurous' }],
        psychological_profile: { archetype_summary: 'Adventurer' },
      };
      expect(parseProfileAnalysis(analysis)).toEqual(analysis);
    });

    it('should parse raw string wrapped in markdown code blocks', () => {
      const rawAnalysis = {
        raw: '```json\n{"basics": {"name": "Test"}}\n```',
      };
      const result = parseProfileAnalysis(rawAnalysis);
      expect(result).toEqual({ basics: { name: 'Test' } });
    });

    it('should return raw object if JSON parsing fails', () => {
      const rawAnalysis = {
        raw: 'invalid json { not parseable',
      };
      const result = parseProfileAnalysis(rawAnalysis);
      expect(result).toEqual(rawAnalysis);
    });
  });

  // ==================== extractAnalysisFields ====================
  describe('extractAnalysisFields', () => {
    it('should extract fields from ProfileAnalysis format', () => {
      const analysis: ProfileAnalysis = {
        basics: { name: 'Jane', age: 28 },
        photos: [{ description: 'photo1', vibe: 'chill' }],
        prompts: [{ question: 'Q1', answer: 'A1', analysis: 'Analysis1' }],
        psychological_profile: {
          archetype_summary: 'The Explorer',
          subtext_analysis: { vulnerability_indicators: 'open' },
        },
        recommended_openers: [
          { type: 'match_opener', message: 'Hey!', tactic: 'friendly', why_it_works: 'casual' },
        ],
        overall_analysis: { summary: 'Good match', green_flags: ['smart'], red_flags: [] },
      };

      const result = extractAnalysisFields(analysis);
      expect(result.basics).toEqual({ name: 'Jane', age: 28 });
      expect(result.photos).toHaveLength(1);
      expect(result.prompts).toHaveLength(1);
      expect(result.psych.archetype_summary).toBe('The Explorer');
      expect(result.openers).toHaveLength(1);
      expect(result.overall.summary).toBe('Good match');
    });

    it('should provide safe fallbacks for missing fields', () => {
      const analysis = {} as AnalysisData;
      const result = extractAnalysisFields(analysis);

      expect(result.basics).toEqual({});
      expect(result.photos).toEqual([]);
      expect(result.prompts).toEqual([]);
      expect(result.psych).toEqual({});
      expect(result.subtext).toEqual({});
      expect(result.openers).toEqual([]);
      expect(result.overall).toEqual({});
    });

    it('should handle LegacyAnalysis format', () => {
      const legacy = {
        overall_analysis: {
          summary: 'Legacy summary',
          green_flags: ['flag1'],
          red_flags: ['flag2'],
        },
      };
      const result = extractAnalysisFields(legacy);
      // Legacy format doesn't have basics, photos, etc.
      expect(result.basics).toEqual({});
      expect(result.overall.summary).toBe('Legacy summary');
    });

    it('should handle raw string error case', () => {
      const rawAnalysis = {
        raw: '{"basics": {"name": "FromRaw"}}',
      };
      const result = extractAnalysisFields(rawAnalysis);
      expect(result.basics.name).toBe('FromRaw');
    });
  });

  // ==================== getMatchZodiacSign ====================
  describe('getMatchZodiacSign', () => {
    it('should extract zodiac sign from profile analysis', () => {
      const profile: Profile = {
        id: 1,
        name: 'Jane',
        timestamp: new Date(),
        thumbnail: '',
        analysis: {
          basics: { zodiac_sign: 'Scorpio' },
        },
      };
      expect(getMatchZodiacSign(profile)).toBe('Scorpio');
    });

    it('should return undefined when zodiac sign is missing', () => {
      const profile: Profile = {
        id: 1,
        name: 'Jane',
        timestamp: new Date(),
        thumbnail: '',
        analysis: {
          basics: { name: 'Jane' },
        },
      };
      expect(getMatchZodiacSign(profile)).toBeUndefined();
    });

    it('should return undefined when basics is missing', () => {
      const profile: Profile = {
        id: 1,
        name: 'Jane',
        timestamp: new Date(),
        thumbnail: '',
        analysis: {},
      };
      expect(getMatchZodiacSign(profile)).toBeUndefined();
    });
  });

  // ==================== getMatchLocation ====================
  describe('getMatchLocation', () => {
    it('should extract location from profile analysis', () => {
      const profile: Profile = {
        id: 1,
        name: 'Jane',
        timestamp: new Date(),
        thumbnail: '',
        analysis: {
          basics: { location: 'San Francisco, CA' },
        },
      };
      expect(getMatchLocation(profile)).toBe('San Francisco, CA');
    });

    it('should return undefined when location is missing', () => {
      const profile: Profile = {
        id: 1,
        name: 'Jane',
        timestamp: new Date(),
        thumbnail: '',
        analysis: {
          basics: { name: 'Jane' },
        },
      };
      expect(getMatchLocation(profile)).toBeUndefined();
    });

    it('should return undefined when basics is missing', () => {
      const profile: Profile = {
        id: 1,
        name: 'Jane',
        timestamp: new Date(),
        thumbnail: '',
        analysis: {},
      };
      expect(getMatchLocation(profile)).toBeUndefined();
    });
  });

  // ==================== getMatchInterests ====================
  describe('getMatchInterests', () => {
    it('should extract interests from photo vibes', () => {
      const profile: Profile = {
        id: 1,
        name: 'Jane',
        timestamp: new Date(),
        thumbnail: '',
        analysis: {
          photos: [
            { vibe: 'adventurous', description: 'hiking' },
            { vibe: 'artistic', description: 'painting' },
            { vibe: 'sporty', description: 'tennis' },
          ],
        },
      };
      const interests = getMatchInterests(profile);
      expect(interests).toEqual(['adventurous', 'artistic', 'sporty']);
    });

    it('should return empty array when photos is missing', () => {
      const profile: Profile = {
        id: 1,
        name: 'Jane',
        timestamp: new Date(),
        thumbnail: '',
        analysis: {},
      };
      expect(getMatchInterests(profile)).toEqual([]);
    });
  });

  // ==================== getProfileContextForOpeners ====================
  describe('getProfileContextForOpeners', () => {
    it('should build complete context for opener regeneration', () => {
      const profile: Profile = {
        id: 1,
        name: 'Jane',
        timestamp: new Date(),
        thumbnail: '',
        analysis: {
          basics: { name: 'Jane Doe' },
          psychological_profile: {
            archetype_summary: 'The Free Spirit',
            subtext_analysis: {
              vulnerability_indicators: 'seeks genuine connection',
            },
          },
        },
      };

      const context = getProfileContextForOpeners(profile);
      expect(context.name).toBe('Jane Doe');
      expect(context.archetype_summary).toBe('The Free Spirit');
      expect(context.vulnerability_indicators).toBe('seeks genuine connection');
    });

    it('should use profile.name as fallback when basics.name is missing', () => {
      const profile: Profile = {
        id: 1,
        name: 'FallbackName',
        timestamp: new Date(),
        thumbnail: '',
        analysis: {
          basics: {},
        },
      };

      const context = getProfileContextForOpeners(profile);
      expect(context.name).toBe('FallbackName');
      expect(context.archetype_summary).toBe('');
      expect(context.vulnerability_indicators).toBe('');
    });
  });
});
