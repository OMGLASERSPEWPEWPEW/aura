// src/lib/sora/promptBuilder.test.ts
import { describe, it, expect } from 'vitest';
import { buildSoraPrompt } from './promptBuilder';
import type { VirtueScore } from '../virtues/types';

describe('buildSoraPrompt', () => {
  describe('with valid virtue scores', () => {
    it('builds prompt with high virtue scores', () => {
      const scores: VirtueScore[] = [
        { virtue_id: 'curiosity', score: 85, confidence: 70, evidence: 'explores many topics' },
        { virtue_id: 'warmth', score: 90, confidence: 75, evidence: 'very welcoming' },
        { virtue_id: 'wit', score: 80, confidence: 65, evidence: 'clever humor' },
      ];

      const prompt = buildSoraPrompt(scores);

      expect(prompt).toContain('3-second looping abstract motion portrait');
      expect(prompt).toContain('Motion characteristics');
      expect(prompt).toContain('Color palette');
      expect(prompt).toContain('ABSTRACT');
      expect(prompt).toContain('NO faces');
      expect(prompt).toContain('Seamless loop');
      expect(prompt).toContain('1080x1920');
    });

    it('builds prompt with low virtue scores', () => {
      const scores: VirtueScore[] = [
        { virtue_id: 'vitality', score: 20, confidence: 60, evidence: 'calm energy' },
        { virtue_id: 'drive', score: 25, confidence: 55, evidence: 'relaxed pace' },
      ];

      const prompt = buildSoraPrompt(scores);

      expect(prompt).toContain('Motion characteristics');
      // Low scores should still produce valid prompt
      expect(prompt).toContain('3-second looping abstract motion portrait');
    });

    it('includes virtue sentence when provided', () => {
      const scores: VirtueScore[] = [
        { virtue_id: 'warmth', score: 85, confidence: 70, evidence: 'welcoming' },
      ];

      const prompt = buildSoraPrompt(scores, 'A radiant explorer with curious depth');

      expect(prompt).toContain('Essence to capture');
      expect(prompt).toContain('A radiant explorer with curious depth');
    });

    it('handles all virtue types', () => {
      // Test biological, emotional, and cerebral virtues
      const scores: VirtueScore[] = [
        { virtue_id: 'vitality', score: 80, confidence: 70, evidence: 'high energy' },
        { virtue_id: 'lust', score: 75, confidence: 65, evidence: 'passionate' },
        { virtue_id: 'play', score: 85, confidence: 75, evidence: 'playful' },
        { virtue_id: 'warmth', score: 90, confidence: 80, evidence: 'warm' },
        { virtue_id: 'voice', score: 70, confidence: 60, evidence: 'expressive' },
        { virtue_id: 'space', score: 65, confidence: 55, evidence: 'independent' },
        { virtue_id: 'anchor', score: 80, confidence: 70, evidence: 'stable' },
        { virtue_id: 'wit', score: 85, confidence: 75, evidence: 'clever' },
        { virtue_id: 'drive', score: 75, confidence: 65, evidence: 'ambitious' },
        { virtue_id: 'curiosity', score: 90, confidence: 80, evidence: 'curious' },
        { virtue_id: 'soul', score: 70, confidence: 60, evidence: 'spiritual' },
      ];

      const prompt = buildSoraPrompt(scores);

      expect(prompt).toContain('3-second looping abstract motion portrait');
      expect(prompt.length).toBeGreaterThan(200);
    });
  });

  describe('with missing or invalid scores', () => {
    it('returns default prompt for empty scores array', () => {
      const prompt = buildSoraPrompt([]);

      expect(prompt).toContain('3-second looping abstract motion portrait');
      expect(prompt).toContain('Gentle flowing energy');
      expect(prompt).toContain('Seamless loop');
    });

    it('returns default prompt for undefined scores', () => {
      const prompt = buildSoraPrompt(undefined as unknown as VirtueScore[]);

      expect(prompt).toContain('3-second looping abstract motion portrait');
      expect(prompt).toContain('balanced movements');
    });

    it('handles scores with mid-range values (no distinctive motion)', () => {
      // Mid-range scores (31-69) don't contribute distinctive motion
      const scores: VirtueScore[] = [
        { virtue_id: 'warmth', score: 50, confidence: 60, evidence: 'average' },
        { virtue_id: 'wit', score: 55, confidence: 55, evidence: 'moderate' },
      ];

      const prompt = buildSoraPrompt(scores);

      // Should still produce valid prompt even with mid-range scores
      expect(prompt).toContain('3-second looping abstract motion portrait');
      expect(prompt).toContain('Color palette');
    });
  });

  describe('prompt quality', () => {
    it('includes all required style directives', () => {
      const scores: VirtueScore[] = [
        { virtue_id: 'curiosity', score: 85, confidence: 70, evidence: 'curious' },
      ];

      const prompt = buildSoraPrompt(scores);

      // Check for required directives per PRD
      expect(prompt).toContain('ABSTRACT');
      expect(prompt).toContain('non-representational');
      expect(prompt).toContain('NO faces');
      expect(prompt).toContain('NO text');
      expect(prompt).toContain('NO human forms');
      expect(prompt).toContain('Cinematic');
      expect(prompt).toContain('Seamless loop');
      expect(prompt).toContain('Portrait orientation');
      expect(prompt).toContain('60fps');
    });

    it('generates deterministic structure', () => {
      const scores: VirtueScore[] = [
        { virtue_id: 'warmth', score: 85, confidence: 70, evidence: 'warm' },
      ];

      const prompt1 = buildSoraPrompt(scores);
      const prompt2 = buildSoraPrompt(scores);

      // Structure should be the same (content may vary due to random element selection)
      expect(prompt1.includes('Motion characteristics')).toBe(true);
      expect(prompt2.includes('Motion characteristics')).toBe(true);
      expect(prompt1.includes('Color palette')).toBe(true);
      expect(prompt2.includes('Color palette')).toBe(true);
    });
  });
});
