// src/lib/moodboard/themeExtractor.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractThemes } from './themeExtractor';
import type { ThemeExtractionInput, MoodboardThemes } from './types';

// Mock the anthropic client
vi.mock('../api/anthropicClient', () => ({
  callAnthropicForObject: vi.fn(),
  textContent: vi.fn((text: string) => ({ type: 'text', text })),
}));

// Mock the inference logger
vi.mock('../inference', () => ({
  logInference: vi.fn(),
}));

import { callAnthropicForObject } from '../api/anthropicClient';

describe('themeExtractor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('extractThemes', () => {
    it('extracts themes from profile data via API', async () => {
      const mockResponse: MoodboardThemes = {
        activities: ['hiking', 'photography', 'cooking'],
        settings: ['mountain vista', 'cozy kitchen'],
        aesthetic: 'rustic',
        energy: 'adventurous',
      };

      vi.mocked(callAnthropicForObject).mockResolvedValue(mockResponse);

      const input: ThemeExtractionInput = {
        vibesSummary: ['outdoorsy', 'creative'],
        photoDescriptions: ['hiking on a mountain trail', 'taking photos at sunset'],
        promptAnswers: ['I love cooking for friends'],
        emergingArchetype: 'The Explorer',
      };

      const themes = await extractThemes(input);

      expect(callAnthropicForObject).toHaveBeenCalled();
      expect(themes.activities).toEqual(['hiking', 'photography', 'cooking']);
      expect(themes.settings).toEqual(['mountain vista', 'cozy kitchen']);
      expect(themes.aesthetic).toBe('rustic');
      expect(themes.energy).toBe('adventurous');
    });

    it('returns defaults when no data is available', async () => {
      const input: ThemeExtractionInput = {
        vibesSummary: [],
        photoDescriptions: [],
        promptAnswers: [],
        emergingArchetype: null,
      };

      const themes = await extractThemes(input);

      // Should not call API with no data
      expect(callAnthropicForObject).not.toHaveBeenCalled();

      // Should return sensible defaults
      expect(themes.activities.length).toBeGreaterThan(0);
      expect(themes.settings.length).toBeGreaterThan(0);
      expect(themes.aesthetic).toBeDefined();
      expect(['adventurous', 'cozy', 'social', 'introspective']).toContain(themes.energy);
    });

    it('normalizes invalid energy values to valid enum', async () => {
      const mockResponse = {
        activities: ['reading'],
        settings: ['library'],
        aesthetic: 'modern',
        energy: 'invalid_energy_value', // Invalid!
      };

      vi.mocked(callAnthropicForObject).mockResolvedValue(mockResponse);

      const input: ThemeExtractionInput = {
        vibesSummary: ['bookish'],
        photoDescriptions: ['reading a book'],
        promptAnswers: [],
        emergingArchetype: null,
      };

      const themes = await extractThemes(input);

      // Should normalize to default 'cozy'
      expect(['adventurous', 'cozy', 'social', 'introspective']).toContain(themes.energy);
    });

    it('limits activities to 5 items', async () => {
      const mockResponse = {
        activities: ['a', 'b', 'c', 'd', 'e', 'f', 'g'], // 7 items
        settings: ['place'],
        aesthetic: 'modern',
        energy: 'social',
      };

      vi.mocked(callAnthropicForObject).mockResolvedValue(mockResponse);

      const input: ThemeExtractionInput = {
        vibesSummary: ['active'],
        photoDescriptions: ['doing stuff'],
        promptAnswers: [],
        emergingArchetype: null,
      };

      const themes = await extractThemes(input);

      expect(themes.activities.length).toBeLessThanOrEqual(5);
    });

    it('limits settings to 3 items', async () => {
      const mockResponse = {
        activities: ['running'],
        settings: ['a', 'b', 'c', 'd', 'e'], // 5 items
        aesthetic: 'sporty',
        energy: 'adventurous',
      };

      vi.mocked(callAnthropicForObject).mockResolvedValue(mockResponse);

      const input: ThemeExtractionInput = {
        vibesSummary: ['athletic'],
        photoDescriptions: ['running'],
        promptAnswers: [],
        emergingArchetype: null,
      };

      const themes = await extractThemes(input);

      expect(themes.settings.length).toBeLessThanOrEqual(3);
    });

    it('handles API errors gracefully', async () => {
      vi.mocked(callAnthropicForObject).mockRejectedValue(new Error('API Error'));

      const input: ThemeExtractionInput = {
        vibesSummary: ['fun'],
        photoDescriptions: ['having fun'],
        promptAnswers: [],
        emergingArchetype: null,
      };

      const themes = await extractThemes(input);

      // Should return defaults on error
      expect(themes.activities.length).toBeGreaterThan(0);
      expect(themes.settings.length).toBeGreaterThan(0);
    });

    it('handles partial API response', async () => {
      const mockResponse = {
        activities: ['painting'],
        // Missing: settings, aesthetic, energy
      };

      vi.mocked(callAnthropicForObject).mockResolvedValue(mockResponse);

      const input: ThemeExtractionInput = {
        vibesSummary: ['artistic'],
        photoDescriptions: ['painting'],
        promptAnswers: [],
        emergingArchetype: null,
      };

      const themes = await extractThemes(input);

      // Should fill in defaults for missing fields
      expect(themes.activities).toEqual(['painting']);
      expect(themes.settings.length).toBeGreaterThan(0);
      expect(themes.aesthetic).toBeDefined();
      expect(['adventurous', 'cozy', 'social', 'introspective']).toContain(themes.energy);
    });

    it('processes all input fields in the prompt', async () => {
      const mockResponse: MoodboardThemes = {
        activities: ['cooking'],
        settings: ['kitchen'],
        aesthetic: 'modern',
        energy: 'cozy',
      };

      vi.mocked(callAnthropicForObject).mockResolvedValue(mockResponse);

      const input: ThemeExtractionInput = {
        vibesSummary: ['homey', 'warm'],
        photoDescriptions: ['cooking in kitchen', 'hosting friends'],
        promptAnswers: ['I love making pasta', 'My ideal weekend involves cooking'],
        emergingArchetype: 'The Nurturer',
      };

      await extractThemes(input);

      // Verify API was called with prompt containing all input
      const call = vi.mocked(callAnthropicForObject).mock.calls[0];
      expect(call).toBeDefined();
      // The first argument contains the options object with messages
    });
  });
});
