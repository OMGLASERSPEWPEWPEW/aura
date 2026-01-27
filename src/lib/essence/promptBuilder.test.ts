// src/lib/essence/promptBuilder.test.ts
import { describe, it, expect, vi } from 'vitest';
import { buildEssencePrompt } from './promptBuilder';
import type { VirtueScore } from '../virtues/types';

// Mock random to get deterministic results
vi.spyOn(Math, 'random').mockReturnValue(0);

describe('promptBuilder', () => {
  describe('buildEssencePrompt', () => {
    it('builds prompt with high-scoring virtues', () => {
      const scores: VirtueScore[] = [
        { virtue_id: 'curiosity', score: 90 },
        { virtue_id: 'warmth', score: 85 },
        { virtue_id: 'vitality', score: 80 },
      ];

      const prompt = buildEssencePrompt(scores);

      // Should include visual elements from high-scoring virtues
      expect(prompt).toContain('abstract');
      expect(prompt).toContain('NO faces');
      expect(prompt).toContain('NO text');
      expect(prompt).toContain('Square composition');
    });

    it('builds prompt with virtue sentence when provided', () => {
      const scores: VirtueScore[] = [
        { virtue_id: 'curiosity', score: 90 },
        { virtue_id: 'warmth', score: 80 },
      ];
      const virtueSentence = 'A curious explorer with radiant warmth';

      const prompt = buildEssencePrompt(scores, virtueSentence);

      expect(prompt).toContain('Essence to capture');
      expect(prompt).toContain('A curious explorer with radiant warmth');
    });

    it('builds default prompt when scores array is empty', () => {
      const prompt = buildEssencePrompt([]);

      expect(prompt).toContain('abstract');
      expect(prompt).toContain('unique personality');
      expect(prompt).toContain('NO faces');
    });

    it('builds default prompt when scores is null/undefined', () => {
      // @ts-expect-error - Testing runtime null handling
      const prompt = buildEssencePrompt(null);

      expect(prompt).toContain('abstract');
      expect(prompt).toContain('unique personality');
    });

    it('includes color palette based on virtue realms', () => {
      const scores: VirtueScore[] = [
        { virtue_id: 'curiosity', score: 90 }, // cerebral - indigo/violet
        { virtue_id: 'warmth', score: 85 },    // emotional - gold/amber
        { virtue_id: 'vitality', score: 80 },  // biological - coral/rose
      ];

      const prompt = buildEssencePrompt(scores);

      // Should include color guidance
      expect(prompt).toContain('Color palette');
    });

    it('includes visual elements from high virtues', () => {
      const scores: VirtueScore[] = [
        { virtue_id: 'curiosity', score: 90 }, // doorways, winding paths
        { virtue_id: 'warmth', score: 85 },    // glowing orbs, soft rays
        { virtue_id: 'play', score: 80 },      // bubbles, confetti
      ];

      const prompt = buildEssencePrompt(scores);

      expect(prompt).toContain('Visual elements');
    });

    it('includes texture descriptions', () => {
      const scores: VirtueScore[] = [
        { virtue_id: 'wit', score: 85 },
        { virtue_id: 'drive', score: 80 },
      ];

      const prompt = buildEssencePrompt(scores);

      expect(prompt).toContain('Texture');
    });

    it('includes movement/energy descriptions', () => {
      const scores: VirtueScore[] = [
        { virtue_id: 'vitality', score: 85 },
        { virtue_id: 'lust', score: 80 },
      ];

      const prompt = buildEssencePrompt(scores);

      expect(prompt).toContain('Energy and movement');
    });

    it('skips visuals for middle-range scores (near 50)', () => {
      const scores: VirtueScore[] = [
        { virtue_id: 'curiosity', score: 52 }, // Only 2 from middle
        { virtue_id: 'warmth', score: 48 },    // Only 2 from middle
        { virtue_id: 'vitality', score: 50 },  // Exactly middle
      ];

      const prompt = buildEssencePrompt(scores);

      // Should still produce a prompt, just with defaults
      expect(prompt).toContain('abstract');
      expect(prompt.length).toBeGreaterThan(100);
    });

    it('handles low-scoring virtues (below 35)', () => {
      const scores: VirtueScore[] = [
        { virtue_id: 'curiosity', score: 20 },
        { virtue_id: 'warmth', score: 15 },
        { virtue_id: 'vitality', score: 10 },
      ];

      const prompt = buildEssencePrompt(scores);

      // Low scores are still distinctive (far from 50), should include elements
      expect(prompt).toContain('Visual elements');
    });

    it('always includes style requirements', () => {
      const scores: VirtueScore[] = [
        { virtue_id: 'curiosity', score: 70 },
      ];

      const prompt = buildEssencePrompt(scores);

      expect(prompt).toContain('Style requirements');
      expect(prompt).toContain('ABSTRACT');
      expect(prompt).toContain('non-representational');
      expect(prompt).toContain('NO human forms');
      expect(prompt).toContain('Professional digital art');
    });

    it('produces reasonable prompt length', () => {
      const scores: VirtueScore[] = [
        { virtue_id: 'curiosity', score: 90 },
        { virtue_id: 'warmth', score: 85 },
        { virtue_id: 'vitality', score: 80 },
        { virtue_id: 'wit', score: 75 },
        { virtue_id: 'play', score: 70 },
      ];

      const prompt = buildEssencePrompt(scores);

      // DALL-E prompts should be under 4000 chars
      expect(prompt.length).toBeLessThan(4000);
      expect(prompt.length).toBeGreaterThan(200);
    });

    it('handles all 11 virtues', () => {
      const scores: VirtueScore[] = [
        { virtue_id: 'vitality', score: 75 },
        { virtue_id: 'lust', score: 65 },
        { virtue_id: 'play', score: 80 },
        { virtue_id: 'warmth', score: 70 },
        { virtue_id: 'voice', score: 60 },
        { virtue_id: 'space', score: 85 },
        { virtue_id: 'anchor', score: 55 },
        { virtue_id: 'wit', score: 90 },
        { virtue_id: 'drive', score: 72 },
        { virtue_id: 'curiosity', score: 88 },
        { virtue_id: 'soul', score: 68 },
      ];

      const prompt = buildEssencePrompt(scores);

      expect(prompt.length).toBeGreaterThan(200);
      expect(prompt).toContain('abstract');
    });
  });
});
