// src/lib/virtues/virtues.test.ts
// Tests for the 11 Virtues of Love system
import { describe, it, expect } from 'vitest';
import {
  VIRTUES,
  REALMS,
  getVirtueById,
  getVirtuesByRealm,
  getRealmConfig,
  calculateVerdict,
  calculateVirtueCompatibility,
  calculateMatchCompatibility,
  getVerdictLabel,
  getVerdictColors,
  getOverallVerdictSummary,
  buildVirtuesPromptText,
} from './virtues';
import type { UserVirtueProfile, VirtueScore } from './types';

describe('virtues', () => {
  // ==================== Constants Validation ====================
  describe('VIRTUES constant', () => {
    it('should have exactly 11 virtues', () => {
      expect(VIRTUES).toHaveLength(11);
    });

    it('should have 3 biological virtues', () => {
      const biologicalVirtues = VIRTUES.filter((v) => v.realm === 'biological');
      expect(biologicalVirtues).toHaveLength(3);
    });

    it('should have 4 emotional virtues', () => {
      const emotionalVirtues = VIRTUES.filter((v) => v.realm === 'emotional');
      expect(emotionalVirtues).toHaveLength(4);
    });

    it('should have 4 cerebral virtues', () => {
      const cerebralVirtues = VIRTUES.filter((v) => v.realm === 'cerebral');
      expect(cerebralVirtues).toHaveLength(4);
    });

    it('should have unique IDs for all virtues', () => {
      const ids = VIRTUES.map((v) => v.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(VIRTUES.length);
    });

    it('should have Space marked as critical', () => {
      const space = VIRTUES.find((v) => v.id === 'space');
      expect(space?.critical).toBe(true);
    });

    it('should only have Space marked as critical', () => {
      const criticalVirtues = VIRTUES.filter((v) => v.critical);
      expect(criticalVirtues).toHaveLength(1);
      expect(criticalVirtues[0].id).toBe('space');
    });
  });

  describe('REALMS constant', () => {
    it('should have 3 realms', () => {
      expect(REALMS).toHaveLength(3);
    });

    it('should include biological, emotional, and cerebral', () => {
      const realmIds = REALMS.map((r) => r.id);
      expect(realmIds).toContain('biological');
      expect(realmIds).toContain('emotional');
      expect(realmIds).toContain('cerebral');
    });

    it('should have color classes for each realm', () => {
      REALMS.forEach((realm) => {
        expect(realm.colorClass).toContain('text-');
        expect(realm.bgClass).toContain('bg-');
        expect(realm.borderClass).toContain('border-');
      });
    });
  });

  // ==================== getVirtueById ====================
  describe('getVirtueById', () => {
    it('should find existing virtue by ID', () => {
      const vitality = getVirtueById('vitality');

      expect(vitality).toBeDefined();
      expect(vitality?.name).toBe('Vitality');
      expect(vitality?.realm).toBe('biological');
    });

    it('should return undefined for invalid ID', () => {
      const result = getVirtueById('nonexistent');
      expect(result).toBeUndefined();
    });

    it('should be case sensitive', () => {
      const upperCase = getVirtueById('VITALITY');
      const lowerCase = getVirtueById('vitality');

      expect(upperCase).toBeUndefined();
      expect(lowerCase).toBeDefined();
    });

    it('should find virtues from each realm', () => {
      // Biological
      expect(getVirtueById('lust')?.realm).toBe('biological');
      // Emotional
      expect(getVirtueById('warmth')?.realm).toBe('emotional');
      // Cerebral
      expect(getVirtueById('wit')?.realm).toBe('cerebral');
    });
  });

  // ==================== getVirtuesByRealm ====================
  describe('getVirtuesByRealm', () => {
    it('should return 3 virtues for biological realm', () => {
      const virtues = getVirtuesByRealm('biological');
      expect(virtues).toHaveLength(3);
      virtues.forEach((v) => expect(v.realm).toBe('biological'));
    });

    it('should return 4 virtues for emotional realm', () => {
      const virtues = getVirtuesByRealm('emotional');
      expect(virtues).toHaveLength(4);
      virtues.forEach((v) => expect(v.realm).toBe('emotional'));
    });

    it('should return 4 virtues for cerebral realm', () => {
      const virtues = getVirtuesByRealm('cerebral');
      expect(virtues).toHaveLength(4);
      virtues.forEach((v) => expect(v.realm).toBe('cerebral'));
    });

    it('should return correct biological virtues', () => {
      const virtues = getVirtuesByRealm('biological');
      const ids = virtues.map((v) => v.id);

      expect(ids).toContain('vitality');
      expect(ids).toContain('lust');
      expect(ids).toContain('play');
    });

    it('should return correct emotional virtues', () => {
      const virtues = getVirtuesByRealm('emotional');
      const ids = virtues.map((v) => v.id);

      expect(ids).toContain('warmth');
      expect(ids).toContain('voice');
      expect(ids).toContain('space');
      expect(ids).toContain('anchor');
    });

    it('should return correct cerebral virtues', () => {
      const virtues = getVirtuesByRealm('cerebral');
      const ids = virtues.map((v) => v.id);

      expect(ids).toContain('wit');
      expect(ids).toContain('drive');
      expect(ids).toContain('curiosity');
      expect(ids).toContain('soul');
    });
  });

  // ==================== getRealmConfig ====================
  describe('getRealmConfig', () => {
    it('should find biological realm config', () => {
      const config = getRealmConfig('biological');

      expect(config).toBeDefined();
      expect(config?.name).toBe('Biological Realm');
      expect(config?.subtitle).toContain('Chemistry');
    });

    it('should find emotional realm config', () => {
      const config = getRealmConfig('emotional');

      expect(config).toBeDefined();
      expect(config?.name).toBe('Emotional Realm');
      expect(config?.subtitle).toContain('Connection');
    });

    it('should find cerebral realm config', () => {
      const config = getRealmConfig('cerebral');

      expect(config).toBeDefined();
      expect(config?.name).toBe('Cerebral Realm');
      expect(config?.subtitle).toContain('Mind');
    });

    it('should return undefined for invalid realm', () => {
      // @ts-expect-error - testing invalid input
      const result = getRealmConfig('invalid');
      expect(result).toBeUndefined();
    });
  });

  // ==================== calculateVerdict ====================
  describe('calculateVerdict', () => {
    describe('low delta category', () => {
      it('should return sympatico for delta < 20', () => {
        expect(calculateVerdict(0, 'low')).toBe('sympatico');
        expect(calculateVerdict(10, 'low')).toBe('sympatico');
        expect(calculateVerdict(19, 'low')).toBe('sympatico');
      });

      it('should return friction for delta 20-34', () => {
        expect(calculateVerdict(20, 'low')).toBe('friction');
        expect(calculateVerdict(25, 'low')).toBe('friction');
        expect(calculateVerdict(34, 'low')).toBe('friction');
      });

      it('should return danger for delta >= 35', () => {
        expect(calculateVerdict(35, 'low')).toBe('danger');
        expect(calculateVerdict(50, 'low')).toBe('danger');
        expect(calculateVerdict(100, 'low')).toBe('danger');
      });
    });

    describe('medium_dangerous delta category', () => {
      it('should return sympatico for delta < 15', () => {
        expect(calculateVerdict(0, 'medium_dangerous')).toBe('sympatico');
        expect(calculateVerdict(10, 'medium_dangerous')).toBe('sympatico');
        expect(calculateVerdict(14, 'medium_dangerous')).toBe('sympatico');
      });

      it('should return friction for delta 15-29', () => {
        expect(calculateVerdict(15, 'medium_dangerous')).toBe('friction');
        expect(calculateVerdict(20, 'medium_dangerous')).toBe('friction');
        expect(calculateVerdict(29, 'medium_dangerous')).toBe('friction');
      });

      it('should return danger for delta >= 30', () => {
        expect(calculateVerdict(30, 'medium_dangerous')).toBe('danger');
        expect(calculateVerdict(50, 'medium_dangerous')).toBe('danger');
        expect(calculateVerdict(100, 'medium_dangerous')).toBe('danger');
      });
    });

    describe('medium_magic delta category (complementary)', () => {
      it('should return friction for delta < 10 (too similar)', () => {
        expect(calculateVerdict(0, 'medium_magic')).toBe('friction');
        expect(calculateVerdict(5, 'medium_magic')).toBe('friction');
        expect(calculateVerdict(9, 'medium_magic')).toBe('friction');
      });

      it('should return sympatico for delta 10-39 (healthy difference)', () => {
        expect(calculateVerdict(10, 'medium_magic')).toBe('sympatico');
        expect(calculateVerdict(25, 'medium_magic')).toBe('sympatico');
        expect(calculateVerdict(39, 'medium_magic')).toBe('sympatico');
      });

      it('should return danger for delta >= 40', () => {
        expect(calculateVerdict(40, 'medium_magic')).toBe('danger');
        expect(calculateVerdict(60, 'medium_magic')).toBe('danger');
        expect(calculateVerdict(100, 'medium_magic')).toBe('danger');
      });
    });

    describe('flexible delta category', () => {
      it('should return sympatico for delta < 40', () => {
        expect(calculateVerdict(0, 'flexible')).toBe('sympatico');
        expect(calculateVerdict(20, 'flexible')).toBe('sympatico');
        expect(calculateVerdict(39, 'flexible')).toBe('sympatico');
      });

      it('should return friction for delta >= 40 (never danger)', () => {
        expect(calculateVerdict(40, 'flexible')).toBe('friction');
        expect(calculateVerdict(60, 'flexible')).toBe('friction');
        expect(calculateVerdict(100, 'flexible')).toBe('friction');
      });

      it('should never return danger', () => {
        // Even at maximum delta, flexible virtues only cause friction
        expect(calculateVerdict(100, 'flexible')).not.toBe('danger');
      });
    });
  });

  // ==================== calculateVirtueCompatibility ====================
  describe('calculateVirtueCompatibility', () => {
    it('should calculate delta correctly', () => {
      const vitality = getVirtueById('vitality')!;
      const result = calculateVirtueCompatibility(vitality, 70, 30);

      expect(result.delta).toBe(40);
      expect(result.user_score).toBe(70);
      expect(result.match_score).toBe(30);
    });

    it('should handle same scores (delta = 0)', () => {
      const vitality = getVirtueById('vitality')!;
      const result = calculateVirtueCompatibility(vitality, 50, 50);

      expect(result.delta).toBe(0);
      expect(result.verdict).toBe('sympatico');
    });

    it('should use match evidence when provided', () => {
      const vitality = getVirtueById('vitality')!;
      const evidence = 'They mentioned running marathons';
      const result = calculateVirtueCompatibility(vitality, 50, 80, evidence);

      expect(result.note).toBe(evidence);
    });

    it('should generate contextual note for sympatico verdict', () => {
      const vitality = getVirtueById('vitality')!;
      const result = calculateVirtueCompatibility(vitality, 50, 55);

      expect(result.verdict).toBe('sympatico');
      expect(result.note).toContain('aligned');
    });

    it('should generate contextual note for friction verdict', () => {
      const vitality = getVirtueById('vitality')!;
      const result = calculateVirtueCompatibility(vitality, 50, 75);

      expect(result.verdict).toBe('friction');
      expect(result.note).toContain('tension');
    });

    it('should generate contextual note for danger verdict', () => {
      const vitality = getVirtueById('vitality')!;
      const result = calculateVirtueCompatibility(vitality, 10, 90);

      expect(result.verdict).toBe('danger');
      expect(result.note).toContain('gap');
    });

    it('should generate CRITICAL note for Space virtue in danger', () => {
      const space = getVirtueById('space')!;
      const result = calculateVirtueCompatibility(space, 10, 60);

      expect(space.critical).toBe(true);
      expect(result.verdict).toBe('danger');
      expect(result.note).toContain('CRITICAL');
      expect(result.note).toContain('anxious/avoidant');
    });

    it('should handle medium_magic correctly for Play virtue', () => {
      const play = getVirtueById('play')!;
      expect(play.deltaCategory).toBe('medium_magic');

      // Too similar = friction
      const tooSimilar = calculateVirtueCompatibility(play, 50, 55);
      expect(tooSimilar.verdict).toBe('friction');
      expect(tooSimilar.note).toContain('similar');

      // Healthy difference = sympatico
      const healthy = calculateVirtueCompatibility(play, 30, 55);
      expect(healthy.verdict).toBe('sympatico');
      expect(healthy.note).toContain('Complementary');
    });
  });

  // ==================== calculateMatchCompatibility ====================
  describe('calculateMatchCompatibility', () => {
    const createUserProfile = (scores: Array<{ id: string; score: number }>): UserVirtueProfile => ({
      scores: scores.map((s) => ({ virtue_id: s.id, score: s.score })),
      realm_summary: { biological: '', emotional: '', cerebral: '' },
      lastUpdated: new Date(),
    });

    const createMatchScores = (scores: Array<{ id: string; score: number }>): VirtueScore[] =>
      scores.map((s) => ({ virtue_id: s.id, score: s.score }));

    it('should calculate compatibility for all 11 virtues', () => {
      const userProfile = createUserProfile(VIRTUES.map((v) => ({ id: v.id, score: 50 })));
      const matchScores = createMatchScores(VIRTUES.map((v) => ({ id: v.id, score: 50 })));

      const result = calculateMatchCompatibility(userProfile, matchScores);

      expect(result.compatibility).toHaveLength(11);
    });

    it('should count verdicts correctly for perfect match', () => {
      const userProfile = createUserProfile(VIRTUES.map((v) => ({ id: v.id, score: 50 })));
      const matchScores = createMatchScores(VIRTUES.map((v) => ({ id: v.id, score: 50 })));

      const result = calculateMatchCompatibility(userProfile, matchScores);

      // Note: medium_magic virtues (play, anchor) with delta=0 get friction, not sympatico
      expect(result.danger_count).toBe(0);
      expect(result.sympatico_count + result.friction_count).toBe(11);
    });

    it('should apply danger penalty to overall score', () => {
      const userProfile = createUserProfile(VIRTUES.map((v) => ({ id: v.id, score: 10 })));
      const matchScores = createMatchScores(VIRTUES.map((v) => ({ id: v.id, score: 90 })));

      const result = calculateMatchCompatibility(userProfile, matchScores);

      // Large deltas should produce danger verdicts and lower score
      expect(result.danger_count).toBeGreaterThan(0);
      expect(result.overall_score).toBeLessThan(50);
    });

    it('should calculate realm scores', () => {
      const userProfile = createUserProfile(VIRTUES.map((v) => ({ id: v.id, score: 50 })));
      const matchScores = createMatchScores(VIRTUES.map((v) => ({ id: v.id, score: 50 })));

      const result = calculateMatchCompatibility(userProfile, matchScores);

      expect(result.realm_scores.biological).toBeDefined();
      expect(result.realm_scores.emotional).toBeDefined();
      expect(result.realm_scores.cerebral).toBeDefined();
    });

    it('should add critical issues for danger verdicts', () => {
      // Create large mismatch on Space (critical virtue)
      const userProfile = createUserProfile([{ id: 'space', score: 10 }]);
      const matchScores = createMatchScores([{ id: 'space', score: 80 }]);

      const result = calculateMatchCompatibility(userProfile, matchScores);

      expect(result.critical_issues.length).toBeGreaterThan(0);
      expect(result.critical_issues[0]).toContain('Space');
    });

    it('should default to 50 for missing scores', () => {
      const userProfile = createUserProfile([{ id: 'vitality', score: 50 }]);
      const matchScores = createMatchScores([{ id: 'vitality', score: 50 }]);

      const result = calculateMatchCompatibility(userProfile, matchScores);

      // Should still calculate all 11 virtues using default of 50
      expect(result.compatibility).toHaveLength(11);
    });

    it('should include match scores in result', () => {
      const matchScores = createMatchScores([{ id: 'vitality', score: 75 }]);
      const userProfile = createUserProfile([{ id: 'vitality', score: 50 }]);

      const result = calculateMatchCompatibility(userProfile, matchScores);

      expect(result.scores).toBe(matchScores);
    });
  });

  // ==================== getVerdictLabel ====================
  describe('getVerdictLabel', () => {
    it('should return correct labels', () => {
      expect(getVerdictLabel('sympatico')).toBe('Sympatico');
      expect(getVerdictLabel('friction')).toBe('Friction');
      expect(getVerdictLabel('danger')).toBe('Danger Zone');
    });
  });

  // ==================== getVerdictColors ====================
  describe('getVerdictColors', () => {
    it('should return emerald colors for sympatico', () => {
      const colors = getVerdictColors('sympatico');
      expect(colors.text).toContain('emerald');
      expect(colors.bg).toContain('emerald');
      expect(colors.border).toContain('emerald');
    });

    it('should return amber colors for friction', () => {
      const colors = getVerdictColors('friction');
      expect(colors.text).toContain('amber');
      expect(colors.bg).toContain('amber');
      expect(colors.border).toContain('amber');
    });

    it('should return red colors for danger', () => {
      const colors = getVerdictColors('danger');
      expect(colors.text).toContain('red');
      expect(colors.bg).toContain('red');
      expect(colors.border).toContain('red');
    });
  });

  // ==================== getOverallVerdictSummary ====================
  describe('getOverallVerdictSummary', () => {
    const createCompatibility = (
      overrides: Partial<{
        danger_count: number;
        friction_count: number;
        sympatico_count: number;
        overall_score: number;
      }>
    ) => ({
      scores: [],
      compatibility: [],
      realm_scores: { biological: 50, emotional: 50, cerebral: 50 },
      overall_score: overrides.overall_score ?? 50,
      danger_count: overrides.danger_count ?? 0,
      friction_count: overrides.friction_count ?? 0,
      sympatico_count: overrides.sympatico_count ?? 0,
      critical_issues: [],
    });

    it('should warn about significant challenges with 3+ dangers', () => {
      const compat = createCompatibility({ danger_count: 3 });
      const summary = getOverallVerdictSummary(compat);

      expect(summary).toContain('Significant compatibility challenges');
    });

    it('should warn about critical areas with 1-2 dangers', () => {
      const compat = createCompatibility({ danger_count: 1 });
      const summary = getOverallVerdictSummary(compat);

      expect(summary).toContain('critical area');
      expect(summary).toContain('needs discussion');
    });

    it('should mention communication for 4+ friction areas', () => {
      const compat = createCompatibility({ friction_count: 4 });
      const summary = getOverallVerdictSummary(compat);

      expect(summary).toContain('friction');
      expect(summary).toContain('communication');
    });

    it('should celebrate strong alignment with 8+ sympatico', () => {
      const compat = createCompatibility({ sympatico_count: 8 });
      const summary = getOverallVerdictSummary(compat);

      expect(summary).toContain('Strong alignment');
      expect(summary).toContain('High compatibility');
    });

    it('should note good compatibility for score >= 75', () => {
      const compat = createCompatibility({ overall_score: 80 });
      const summary = getOverallVerdictSummary(compat);

      expect(summary).toContain('Good compatibility');
    });

    it('should note mixed signals for score 50-74', () => {
      const compat = createCompatibility({ overall_score: 60 });
      const summary = getOverallVerdictSummary(compat);

      expect(summary).toContain('Mixed signals');
    });

    it('should note challenging profile for score < 50', () => {
      const compat = createCompatibility({ overall_score: 40 });
      const summary = getOverallVerdictSummary(compat);

      expect(summary).toContain('Challenging');
    });
  });

  // ==================== buildVirtuesPromptText ====================
  describe('buildVirtuesPromptText', () => {
    it('should include all 11 virtues', () => {
      const text = buildVirtuesPromptText();

      VIRTUES.forEach((virtue) => {
        expect(text).toContain(virtue.name);
      });
    });

    it('should have proper formatting with realm headers', () => {
      const text = buildVirtuesPromptText();

      expect(text).toContain('## Biological Realm');
      expect(text).toContain('## Emotional Realm');
      expect(text).toContain('## Cerebral Realm');
    });

    it('should include spectrum labels', () => {
      const text = buildVirtuesPromptText();

      expect(text).toContain('Spectrum:');
      expect(text).toContain('Restorative');
      expect(text).toContain('High Voltage');
    });

    it('should include delta tolerance information', () => {
      const text = buildVirtuesPromptText();

      expect(text).toContain('Delta Tolerance:');
      expect(text).toContain('low');
      expect(text).toContain('flexible');
    });

    it('should mark Space as CRITICAL', () => {
      const text = buildVirtuesPromptText();

      expect(text).toContain('Space [CRITICAL]');
    });

    it('should return non-empty string', () => {
      const text = buildVirtuesPromptText();

      expect(text.length).toBeGreaterThan(0);
      expect(typeof text).toBe('string');
    });
  });
});
