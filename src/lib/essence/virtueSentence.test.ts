// src/lib/essence/virtueSentence.test.ts
import { describe, it, expect } from 'vitest';
import {
  generateVirtueSentence,
  getTopVirtues,
} from './virtueSentence';
import type { VirtueScore } from '../virtues/types';

describe('virtueSentence', () => {
  describe('getTopVirtues', () => {
    it('returns top 3 most distinctive virtues by distance from 50', () => {
      const scores: VirtueScore[] = [
        { virtue_id: 'curiosity', score: 90 },   // 40 from middle
        { virtue_id: 'warmth', score: 80 },      // 30 from middle
        { virtue_id: 'space', score: 20 },       // 30 from middle
        { virtue_id: 'vitality', score: 55 },    // 5 from middle
        { virtue_id: 'wit', score: 50 },         // 0 from middle
      ];

      const top = getTopVirtues(scores, 3);

      expect(top).toHaveLength(3);
      expect(top[0].virtue_id).toBe('curiosity'); // 40 from middle
      // warmth and space both 30 from middle, order depends on sort stability
      expect(['warmth', 'space']).toContain(top[1].virtue_id);
      expect(['warmth', 'space']).toContain(top[2].virtue_id);
    });

    it('returns fewer than requested if not enough scores', () => {
      const scores: VirtueScore[] = [
        { virtue_id: 'curiosity', score: 90 },
        { virtue_id: 'warmth', score: 80 },
      ];

      const top = getTopVirtues(scores, 5);

      expect(top).toHaveLength(2);
    });

    it('handles empty array', () => {
      const top = getTopVirtues([], 3);
      expect(top).toHaveLength(0);
    });
  });

  describe('generateVirtueSentence', () => {
    it('generates sentence with archetype for high-scoring virtues', () => {
      const scores: VirtueScore[] = [
        { virtue_id: 'curiosity', score: 85 },   // Explorer archetype
        { virtue_id: 'warmth', score: 78 },      // Radiant warmth
        { virtue_id: 'space', score: 72 },       // Autonomous spirit
      ];

      const sentence = generateVirtueSentence(scores);

      // Should mention curiosity/explorer and other traits
      expect(sentence).toMatch(/explorer/i);
      expect(sentence.length).toBeGreaterThan(10);
      expect(sentence.length).toBeLessThan(100);
    });

    it('generates sentence for low-scoring virtues', () => {
      const scores: VirtueScore[] = [
        { virtue_id: 'vitality', score: 20 },    // Restorative
        { virtue_id: 'warmth', score: 25 },      // Cool
        { virtue_id: 'space', score: 30 },       // Merged
      ];

      const sentence = generateVirtueSentence(scores);

      expect(sentence).toMatch(/restorative|cool|deep connection/i);
      expect(sentence.length).toBeGreaterThan(10);
    });

    it('handles empty scores array', () => {
      const sentence = generateVirtueSentence([]);
      expect(sentence).toBe('A unique individual');
    });

    it('handles null/undefined gracefully', () => {
      // @ts-expect-error - Testing runtime null handling
      const sentence = generateVirtueSentence(null);
      expect(sentence).toBe('A unique individual');
    });

    it('starts with "A" or "An" appropriately', () => {
      const scores: VirtueScore[] = [
        { virtue_id: 'curiosity', score: 85 },
        { virtue_id: 'warmth', score: 70 },
        { virtue_id: 'drive', score: 60 },
      ];

      const sentence = generateVirtueSentence(scores);

      expect(sentence).toMatch(/^A[n]?\s/);
    });

    it('generates varied sentences for different virtue combinations', () => {
      const highWit: VirtueScore[] = [
        { virtue_id: 'wit', score: 90 },
        { virtue_id: 'drive', score: 85 },
        { virtue_id: 'lust', score: 75 },
      ];

      const highPlay: VirtueScore[] = [
        { virtue_id: 'play', score: 90 },
        { virtue_id: 'vitality', score: 85 },
        { virtue_id: 'warmth', score: 70 },
      ];

      const witSentence = generateVirtueSentence(highWit);
      const playSentence = generateVirtueSentence(highPlay);

      expect(witSentence).not.toBe(playSentence);
    });

    it('produces sentences under 100 characters', () => {
      // Full complement of scores
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

      const sentence = generateVirtueSentence(scores);

      expect(sentence.length).toBeLessThan(100);
    });
  });
});
