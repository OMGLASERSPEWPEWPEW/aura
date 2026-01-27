// src/lib/moodboard/promptBuilder.test.ts
import { describe, it, expect } from 'vitest';
import { buildMoodboardPrompt, buildDefaultMoodboardPrompt } from './promptBuilder';
import type { MoodboardThemes } from './types';

describe('promptBuilder', () => {
  describe('buildMoodboardPrompt', () => {
    it('builds prompt with all theme fields', () => {
      const themes: MoodboardThemes = {
        activities: ['hiking', 'cooking Italian food', 'reading sci-fi novels'],
        settings: ['cozy bookshop cafe', 'mountain trail at golden hour'],
        aesthetic: 'bohemian',
        energy: 'adventurous',
      };

      const prompt = buildMoodboardPrompt(themes);

      expect(prompt).toContain('hiking');
      expect(prompt).toContain('cooking Italian food');
      expect(prompt).toContain('cozy bookshop cafe');
      expect(prompt).toContain('bohemian');
      expect(prompt).toContain('adventurous');
    });

    it('includes critical requirements for DALL-E', () => {
      const themes: MoodboardThemes = {
        activities: ['yoga', 'painting'],
        settings: ['art studio'],
        aesthetic: 'minimalist',
        energy: 'introspective',
      };

      const prompt = buildMoodboardPrompt(themes);

      expect(prompt).toContain('NO people');
      expect(prompt).toContain('NO text');
      expect(prompt).toContain('Square composition');
      expect(prompt).toContain('1:1');
    });

    it('applies adventurous energy style', () => {
      const themes: MoodboardThemes = {
        activities: ['rock climbing'],
        settings: ['mountain peak'],
        aesthetic: 'rugged',
        energy: 'adventurous',
      };

      const prompt = buildMoodboardPrompt(themes);

      expect(prompt).toContain('dynamic');
      expect(prompt).toContain('golden hour');
    });

    it('applies cozy energy style', () => {
      const themes: MoodboardThemes = {
        activities: ['reading', 'tea'],
        settings: ['cozy living room'],
        aesthetic: 'cottage',
        energy: 'cozy',
      };

      const prompt = buildMoodboardPrompt(themes);

      expect(prompt).toContain('warm');
      expect(prompt).toContain('intimate');
      expect(prompt).toContain('soft lighting');
    });

    it('applies social energy style', () => {
      const themes: MoodboardThemes = {
        activities: ['hosting dinner parties', 'group sports'],
        settings: ['rooftop bar'],
        aesthetic: 'urban',
        energy: 'social',
      };

      const prompt = buildMoodboardPrompt(themes);

      expect(prompt).toContain('vibrant');
      expect(prompt).toContain('welcoming');
    });

    it('applies introspective energy style', () => {
      const themes: MoodboardThemes = {
        activities: ['meditation', 'journaling'],
        settings: ['quiet garden'],
        aesthetic: 'zen',
        energy: 'introspective',
      };

      const prompt = buildMoodboardPrompt(themes);

      expect(prompt).toContain('serene');
      expect(prompt).toContain('contemplative');
    });

    it('handles empty activities array', () => {
      const themes: MoodboardThemes = {
        activities: [],
        settings: ['beach at sunset'],
        aesthetic: 'coastal',
        energy: 'cozy',
      };

      const prompt = buildMoodboardPrompt(themes);

      expect(prompt).toContain('relaxing');
      expect(prompt.length).toBeGreaterThan(100);
    });

    it('handles empty settings array', () => {
      const themes: MoodboardThemes = {
        activities: ['surfing', 'photography'],
        settings: [],
        aesthetic: 'coastal',
        energy: 'adventurous',
      };

      const prompt = buildMoodboardPrompt(themes);

      expect(prompt).toContain('surfing');
      expect(prompt).toContain('comfortable');
    });

    it('limits activities to 4 items', () => {
      const themes: MoodboardThemes = {
        activities: ['one', 'two', 'three', 'four', 'five', 'six'],
        settings: ['place'],
        aesthetic: 'modern',
        energy: 'social',
      };

      const prompt = buildMoodboardPrompt(themes);

      expect(prompt).toContain('one');
      expect(prompt).toContain('four');
      expect(prompt).not.toContain('five');
      expect(prompt).not.toContain('six');
    });

    it('limits settings to 2 items', () => {
      const themes: MoodboardThemes = {
        activities: ['running'],
        settings: ['park', 'gym', 'track'],
        aesthetic: 'athletic',
        energy: 'adventurous',
      };

      const prompt = buildMoodboardPrompt(themes);

      expect(prompt).toContain('park');
      expect(prompt).toContain('gym');
      // Third setting should be excluded
    });

    it('produces reasonable prompt length', () => {
      const themes: MoodboardThemes = {
        activities: ['hiking', 'cooking', 'reading', 'traveling', 'photography'],
        settings: ['mountain cabin', 'city rooftop', 'beach house'],
        aesthetic: 'eclectic',
        energy: 'adventurous',
      };

      const prompt = buildMoodboardPrompt(themes);

      // DALL-E prompts should be under 4000 chars
      expect(prompt.length).toBeLessThan(4000);
      expect(prompt.length).toBeGreaterThan(200);
    });
  });

  describe('buildDefaultMoodboardPrompt', () => {
    it('builds a reasonable default prompt', () => {
      const prompt = buildDefaultMoodboardPrompt();

      expect(prompt.length).toBeGreaterThan(100);
      expect(prompt).toContain('NO people');
      expect(prompt).toContain('NO text');
      expect(prompt).toContain('Square composition');
    });

    it('includes warm, inviting elements', () => {
      const prompt = buildDefaultMoodboardPrompt();

      expect(prompt).toContain('warm');
      expect(prompt).toContain('inviting');
    });

    it('includes lifestyle elements', () => {
      const prompt = buildDefaultMoodboardPrompt();

      // Should mention common lifestyle elements
      expect(prompt).toMatch(/plant|book|coffee|tea|light/i);
    });
  });
});
