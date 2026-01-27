// src/lib/moodboard/moodboardGenerator.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateMoodboardFromInput,
  generateMoodboardFromProfile,
  generateDefaultMoodboard,
} from './moodboardGenerator';
import type { ThemeExtractionInput, MoodboardThemes } from './types';
import type { AccumulatedProfile } from '../streaming/types';

// Mock dependencies
vi.mock('./themeExtractor', () => ({
  extractThemes: vi.fn(),
}));

vi.mock('../essence/dalleClient', () => ({
  generateImage: vi.fn(),
  base64ToImageBlob: vi.fn((base64: string) => new Blob([base64], { type: 'image/png' })),
}));

vi.mock('../inference', () => ({
  logInference: vi.fn(),
}));

vi.mock('../db', () => ({
  db: {
    profiles: {
      update: vi.fn(),
      get: vi.fn(),
    },
  },
}));

import { extractThemes } from './themeExtractor';
import { generateImage, base64ToImageBlob } from '../essence/dalleClient';

describe('moodboardGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateMoodboardFromInput', () => {
    it('generates moodboard successfully', async () => {
      const mockThemes: MoodboardThemes = {
        activities: ['hiking', 'photography'],
        settings: ['mountain trail'],
        aesthetic: 'adventurous',
        energy: 'adventurous',
      };

      vi.mocked(extractThemes).mockResolvedValue(mockThemes);
      vi.mocked(generateImage).mockResolvedValue({
        success: true,
        image: 'base64ImageData',
        revised_prompt: 'revised prompt',
      });

      const input: ThemeExtractionInput = {
        vibesSummary: ['outdoorsy'],
        photoDescriptions: ['hiking photo'],
        promptAnswers: ['I love nature'],
        emergingArchetype: 'Explorer',
      };

      const result = await generateMoodboardFromInput(input, 123);

      expect(result.success).toBe(true);
      expect(result.moodboardImage).toBeInstanceOf(Blob);
      expect(result.moodboardPrompt).toBeDefined();
      expect(result.themes).toEqual(mockThemes);
    });

    it('handles theme extraction failure', async () => {
      vi.mocked(extractThemes).mockRejectedValue(new Error('Extraction failed'));

      const input: ThemeExtractionInput = {
        vibesSummary: ['test'],
        photoDescriptions: ['test'],
        promptAnswers: [],
        emergingArchetype: null,
      };

      const result = await generateMoodboardFromInput(input, 123);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Theme extraction failed');
    });

    it('handles image generation failure', async () => {
      const mockThemes: MoodboardThemes = {
        activities: ['reading'],
        settings: ['library'],
        aesthetic: 'cozy',
        energy: 'introspective',
      };

      vi.mocked(extractThemes).mockResolvedValue(mockThemes);
      vi.mocked(generateImage).mockResolvedValue({
        success: false,
        error: 'DALL-E error',
      });

      const input: ThemeExtractionInput = {
        vibesSummary: ['bookish'],
        photoDescriptions: ['reading'],
        promptAnswers: [],
        emergingArchetype: null,
      };

      const result = await generateMoodboardFromInput(input, 123);

      expect(result.success).toBe(false);
      expect(result.error).toBe('DALL-E error');
      expect(result.themes).toEqual(mockThemes); // Themes should still be returned
    });

    it('handles missing image data in response', async () => {
      const mockThemes: MoodboardThemes = {
        activities: ['yoga'],
        settings: ['studio'],
        aesthetic: 'minimal',
        energy: 'introspective',
      };

      vi.mocked(extractThemes).mockResolvedValue(mockThemes);
      vi.mocked(generateImage).mockResolvedValue({
        success: true,
        // No image field
      });

      const input: ThemeExtractionInput = {
        vibesSummary: ['peaceful'],
        photoDescriptions: ['yoga'],
        promptAnswers: [],
        emergingArchetype: null,
      };

      const result = await generateMoodboardFromInput(input, 123);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Image generation failed');
    });
  });

  describe('generateMoodboardFromProfile', () => {
    it('extracts theme input from accumulated profile', async () => {
      const mockThemes: MoodboardThemes = {
        activities: ['cooking'],
        settings: ['kitchen'],
        aesthetic: 'homey',
        energy: 'cozy',
      };

      vi.mocked(extractThemes).mockResolvedValue(mockThemes);
      vi.mocked(generateImage).mockResolvedValue({
        success: true,
        image: 'base64Data',
      });

      const profile: AccumulatedProfile = {
        identity: { name: 'Test', age: 25, location: null, job: null, app: null },
        photos: {
          thumbnailIndex: 0,
          analyses: [{ description: 'cooking', vibe: 'homey', subtext: 'enjoys food' }],
          vibesSummary: ['warm'],
        },
        prompts: {
          found: [{ question: 'Q', answer: 'I love cooking', analysis: 'foodie' }],
        },
        psychological: {
          emergingArchetype: 'The Nurturer',
          confidenceLevel: 70,
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

      const result = await generateMoodboardFromProfile(profile, 456);

      expect(extractThemes).toHaveBeenCalledWith(
        expect.objectContaining({
          vibesSummary: ['warm'],
          photoDescriptions: ['cooking'],
          promptAnswers: ['I love cooking'],
          emergingArchetype: 'The Nurturer',
        }),
        456
      );
      expect(result.success).toBe(true);
    });
  });

  describe('generateDefaultMoodboard', () => {
    it('generates moodboard with default prompt', async () => {
      vi.mocked(generateImage).mockResolvedValue({
        success: true,
        image: 'defaultBase64Data',
      });

      const result = await generateDefaultMoodboard(789);

      expect(result.success).toBe(true);
      expect(result.moodboardImage).toBeInstanceOf(Blob);
      expect(result.moodboardPrompt).toBeDefined();
      expect(result.moodboardPrompt).toContain('warm');
    });

    it('handles failure gracefully', async () => {
      vi.mocked(generateImage).mockResolvedValue({
        success: false,
        error: 'Default generation failed',
      });

      const result = await generateDefaultMoodboard();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Default generation failed');
    });
  });
});
