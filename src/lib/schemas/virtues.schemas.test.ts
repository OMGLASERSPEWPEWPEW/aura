// src/lib/schemas/virtues.schemas.test.ts
import { describe, it, expect } from 'vitest';
import {
  virtueIdSchema,
  VirtueScoreSchema,
  MatchVirtues11ResponseSchema,
  PartnerVirtueSchema,
  PartnerVirtuesResultSchema,
  VirtueScoreResultSchema,
  RealmSummarySchema,
  UserVirtues11ResponseSchema,
} from './virtues.schemas';

describe('virtues.schemas', () => {
  describe('virtueIdSchema', () => {
    const validVirtues = [
      'vitality', 'lust', 'play', 'warmth', 'voice',
      'space', 'anchor', 'wit', 'drive', 'curiosity', 'soul',
    ];

    it.each(validVirtues)('should accept %s as a valid virtue ID', (virtueId) => {
      expect(virtueIdSchema.parse(virtueId)).toBe(virtueId);
    });

    it('should reject invalid virtue IDs', () => {
      expect(() => virtueIdSchema.parse('invalid')).toThrow();
      expect(() => virtueIdSchema.parse('energy')).toThrow();
    });
  });

  describe('VirtueScoreSchema', () => {
    it('should accept valid virtue score', () => {
      const score = {
        virtue_id: 'vitality',
        score: 75,
        evidence: 'High energy photos, mentions hiking',
      };
      expect(VirtueScoreSchema.parse(score)).toEqual(score);
    });

    it('should accept score without evidence', () => {
      const score = {
        virtue_id: 'lust',
        score: 50,
      };
      expect(VirtueScoreSchema.parse(score)).toEqual(score);
    });

    it('should reject score below 0', () => {
      const score = {
        virtue_id: 'play',
        score: -5,
      };
      expect(() => VirtueScoreSchema.parse(score)).toThrow();
    });

    it('should reject score above 100', () => {
      const score = {
        virtue_id: 'warmth',
        score: 150,
      };
      expect(() => VirtueScoreSchema.parse(score)).toThrow();
    });

    it('should reject missing virtue_id', () => {
      const score = {
        score: 50,
      };
      expect(() => VirtueScoreSchema.parse(score)).toThrow();
    });
  });

  describe('MatchVirtues11ResponseSchema', () => {
    it('should accept valid response with scores', () => {
      const response = {
        scores: [
          { virtue_id: 'vitality', score: 80 },
          { virtue_id: 'lust', score: 60 },
        ],
      };
      expect(MatchVirtues11ResponseSchema.parse(response)).toEqual(response);
    });

    it('should reject empty scores array', () => {
      const response = {
        scores: [],
      };
      expect(() => MatchVirtues11ResponseSchema.parse(response)).toThrow();
    });

    it('should reject missing scores', () => {
      const response = {};
      expect(() => MatchVirtues11ResponseSchema.parse(response)).toThrow();
    });
  });

  describe('PartnerVirtueSchema', () => {
    it('should accept valid partner virtue', () => {
      const virtue = {
        name: 'Emotional Availability',
        description: 'Able to be present and responsive to emotional needs',
        evidence: 'Based on prompt responses',
        anti_virtue: 'Emotionally distant or avoidant',
      };
      expect(PartnerVirtueSchema.parse(virtue)).toEqual(virtue);
    });

    it('should default evidence and anti_virtue to empty string', () => {
      const virtue = {
        name: 'Intelligence',
        description: 'Intellectually curious and engaging',
      };
      const result = PartnerVirtueSchema.parse(virtue);
      expect(result.evidence).toBe('');
      expect(result.anti_virtue).toBe('');
    });

    it('should reject empty name', () => {
      const virtue = {
        name: '',
        description: 'Some description',
      };
      expect(() => PartnerVirtueSchema.parse(virtue)).toThrow();
    });

    it('should reject empty description', () => {
      const virtue = {
        name: 'Some name',
        description: '',
      };
      expect(() => PartnerVirtueSchema.parse(virtue)).toThrow();
    });
  });

  describe('PartnerVirtuesResultSchema', () => {
    it('should accept valid result with virtues', () => {
      const result = {
        partner_virtues: [
          { name: 'Virtue 1', description: 'Desc 1', evidence: 'Evidence 1', anti_virtue: 'Anti 1' },
          { name: 'Virtue 2', description: 'Desc 2', evidence: 'Evidence 2', anti_virtue: 'Anti 2' },
        ],
      };
      expect(PartnerVirtuesResultSchema.parse(result)).toEqual(result);
    });

    it('should default to empty array', () => {
      const result = {};
      const parsed = PartnerVirtuesResultSchema.parse(result);
      expect(parsed.partner_virtues).toEqual([]);
    });
  });

  describe('VirtueScoreResultSchema', () => {
    it('should accept valid virtue score result', () => {
      const result = {
        virtue_scores: [
          { virtue: 'Integrity', score: 90, evidence: 'Consistent messaging' },
        ],
      };
      expect(VirtueScoreResultSchema.parse(result)).toEqual(result);
    });

    it('should default virtue_scores to empty array', () => {
      const result = {};
      const parsed = VirtueScoreResultSchema.parse(result);
      expect(parsed.virtue_scores).toEqual([]);
    });

    it('should default evidence to empty string', () => {
      const result = {
        virtue_scores: [
          { virtue: 'Honesty', score: 75 },
        ],
      };
      const parsed = VirtueScoreResultSchema.parse(result);
      expect(parsed.virtue_scores[0].evidence).toBe('');
    });
  });

  describe('RealmSummarySchema', () => {
    it('should accept valid realm summary', () => {
      const summary = {
        biological: 'High energy, physically active',
        emotional: 'Warm and open',
        cerebral: 'Intellectually curious',
      };
      expect(RealmSummarySchema.parse(summary)).toEqual(summary);
    });

    it('should default to empty strings', () => {
      const result = RealmSummarySchema.parse({});
      expect(result.biological).toBe('');
      expect(result.emotional).toBe('');
      expect(result.cerebral).toBe('');
    });
  });

  describe('UserVirtues11ResponseSchema', () => {
    it('should accept valid user virtues response', () => {
      const response = {
        scores: [
          { virtue_id: 'vitality', score: 70 },
          { virtue_id: 'warmth', score: 85 },
        ],
        realm_summary: {
          biological: 'Active lifestyle',
          emotional: 'Very warm person',
          cerebral: 'Curious mind',
        },
      };
      expect(UserVirtues11ResponseSchema.parse(response)).toEqual(response);
    });

    it('should reject empty scores', () => {
      const response = {
        scores: [],
        realm_summary: {
          biological: '',
          emotional: '',
          cerebral: '',
        },
      };
      expect(() => UserVirtues11ResponseSchema.parse(response)).toThrow();
    });
  });
});
