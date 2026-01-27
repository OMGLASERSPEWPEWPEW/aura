// src/lib/essence/essenceGenerator.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateProfileVirtueSentence,
  generateProfileEssenceImage,
  generateAndSaveVirtueSentence,
  generateAndSaveEssenceImage,
  generateFullEssence,
} from './essenceGenerator';
import type { Profile } from '../db';
import type { MatchVirtueCompatibility, VirtueScore } from '../virtues/types';

// Mock dependencies
vi.mock('../db', () => ({
  db: {
    profiles: {
      get: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('./dalleClient', () => ({
  generateImage: vi.fn(),
  base64ToImageBlob: vi.fn(),
}));

vi.mock('../inference', () => ({
  logInference: vi.fn(),
}));

// Import mocked modules
import { db } from '../db';
import { generateImage, base64ToImageBlob } from './dalleClient';
import { logInference } from '../inference';

// Suppress console output during tests
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

describe('essenceGenerator', () => {
  const mockVirtueScores: VirtueScore[] = [
    { virtue_id: 'curiosity', score: 85 },
    { virtue_id: 'warmth', score: 78 },
    { virtue_id: 'space', score: 72 },
  ];

  const mockVirtues11: MatchVirtueCompatibility = {
    scores: mockVirtueScores,
    compatibility: [],
    realm_scores: { biological: 70, emotional: 75, cerebral: 80 },
    overall_score: 75,
    danger_count: 0,
    friction_count: 1,
    sympatico_count: 10,
    critical_issues: [],
  };

  const mockProfile: Profile = {
    id: 1,
    name: 'Test User',
    age: 28,
    appName: 'Hinge',
    timestamp: new Date(),
    thumbnail: 'base64thumbnail',
    analysis: {
      basics: { name: 'Test User', age: 28 },
      personality: { summary: 'A curious person' },
    },
    analysisPhase: 'complete',
    virtues_11: mockVirtues11,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateProfileVirtueSentence', () => {
    it('generates sentence from profile virtues_11', () => {
      const sentence = generateProfileVirtueSentence(mockProfile);

      expect(sentence).toBeDefined();
      expect(typeof sentence).toBe('string');
      expect(sentence!.length).toBeGreaterThan(10);
    });

    it('returns undefined when virtues_11 is missing', () => {
      const profileWithoutVirtues = { ...mockProfile, virtues_11: undefined };

      const sentence = generateProfileVirtueSentence(profileWithoutVirtues);

      expect(sentence).toBeUndefined();
    });

    it('returns undefined when virtues_11.scores is empty', () => {
      const profileWithEmptyScores = {
        ...mockProfile,
        virtues_11: { ...mockVirtues11, scores: [] },
      };

      const sentence = generateProfileVirtueSentence(profileWithEmptyScores);

      expect(sentence).toBeUndefined();
    });
  });

  describe('generateProfileEssenceImage', () => {
    it('returns error when profile has no virtues_11', async () => {
      const profileWithoutVirtues = { ...mockProfile, virtues_11: undefined };

      const result = await generateProfileEssenceImage(profileWithoutVirtues);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No virtue scores available');
    });

    it('returns error when virtues_11.scores is empty', async () => {
      const profileWithEmptyScores = {
        ...mockProfile,
        virtues_11: { ...mockVirtues11, scores: [] },
      };

      const result = await generateProfileEssenceImage(profileWithEmptyScores);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No virtue scores available');
    });

    it('calls generateImage with built prompt', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      vi.mocked(generateImage).mockResolvedValueOnce({
        success: true,
        image: 'base64imagedata',
        revised_prompt: 'Revised prompt',
      });
      vi.mocked(base64ToImageBlob).mockReturnValueOnce(mockBlob);

      const result = await generateProfileEssenceImage(mockProfile);

      expect(generateImage).toHaveBeenCalledWith(
        expect.any(String),
        { size: '1024x1024', quality: 'standard' }
      );
      expect(result.success).toBe(true);
      expect(result.essenceImage).toBe(mockBlob);
    });

    it('logs inference on success', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      vi.mocked(generateImage).mockResolvedValueOnce({
        success: true,
        image: 'base64imagedata',
      });
      vi.mocked(base64ToImageBlob).mockReturnValueOnce(mockBlob);

      await generateProfileEssenceImage(mockProfile);

      expect(logInference).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'dall-e-3',
          feature: 'essence_image_generation',
          success: true,
        })
      );
    });

    it('logs inference on failure', async () => {
      vi.mocked(generateImage).mockResolvedValueOnce({
        success: false,
        error: 'Generation failed',
      });

      await generateProfileEssenceImage(mockProfile);

      expect(logInference).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errorType: 'Generation failed',
        })
      );
    });

    it('returns error when generateImage fails', async () => {
      vi.mocked(generateImage).mockResolvedValueOnce({
        success: false,
        error: 'Content policy violation',
      });

      const result = await generateProfileEssenceImage(mockProfile);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Content policy violation');
    });

    it('uses existing virtueSentence if present', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      vi.mocked(generateImage).mockResolvedValueOnce({
        success: true,
        image: 'base64imagedata',
      });
      vi.mocked(base64ToImageBlob).mockReturnValueOnce(mockBlob);

      const profileWithSentence = {
        ...mockProfile,
        virtueSentence: 'Pre-existing virtue sentence',
      };

      const result = await generateProfileEssenceImage(profileWithSentence);

      expect(result.virtueSentence).toBe('Pre-existing virtue sentence');
    });
  });

  describe('generateAndSaveVirtueSentence', () => {
    it('generates and saves virtue sentence to profile', async () => {
      vi.mocked(db.profiles.get).mockResolvedValueOnce(mockProfile);
      vi.mocked(db.profiles.update).mockResolvedValueOnce(1);

      const result = await generateAndSaveVirtueSentence(1);

      expect(result).toBeDefined();
      expect(db.profiles.update).toHaveBeenCalledWith(1, {
        virtueSentence: expect.any(String),
      });
    });

    it('returns undefined when profile not found', async () => {
      vi.mocked(db.profiles.get).mockResolvedValueOnce(undefined);

      const result = await generateAndSaveVirtueSentence(999);

      expect(result).toBeUndefined();
    });

    it('returns undefined when no virtues_11', async () => {
      vi.mocked(db.profiles.get).mockResolvedValueOnce({
        ...mockProfile,
        virtues_11: undefined,
      });

      const result = await generateAndSaveVirtueSentence(1);

      expect(result).toBeUndefined();
      expect(db.profiles.update).not.toHaveBeenCalled();
    });
  });

  describe('generateAndSaveEssenceImage', () => {
    it('generates and saves essence image to profile', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      vi.mocked(db.profiles.get).mockResolvedValue(mockProfile);
      vi.mocked(db.profiles.update).mockResolvedValueOnce(1);
      vi.mocked(generateImage).mockResolvedValueOnce({
        success: true,
        image: 'base64imagedata',
      });
      vi.mocked(base64ToImageBlob).mockReturnValueOnce(mockBlob);

      const result = await generateAndSaveEssenceImage(1);

      expect(result.success).toBe(true);
      expect(db.profiles.update).toHaveBeenCalledWith(1, {
        virtueSentence: expect.any(String),
        essenceImage: mockBlob,
        essencePrompt: expect.any(String),
      });
    });

    it('returns error when profile not found', async () => {
      vi.mocked(db.profiles.get).mockResolvedValueOnce(undefined);

      const result = await generateAndSaveEssenceImage(999);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Profile not found');
    });

    it('retries on failure', async () => {
      vi.mocked(db.profiles.get).mockResolvedValue(mockProfile);
      vi.mocked(generateImage)
        .mockResolvedValueOnce({ success: false, error: 'First attempt failed' })
        .mockResolvedValueOnce({
          success: true,
          image: 'base64imagedata',
        });
      vi.mocked(base64ToImageBlob).mockReturnValueOnce(
        new Blob(['test'], { type: 'image/png' })
      );
      vi.mocked(db.profiles.update).mockResolvedValueOnce(1);

      // Use fast timer for retry delay
      vi.useFakeTimers();
      const resultPromise = generateAndSaveEssenceImage(1, 1);

      // Fast-forward past retry delay
      await vi.advanceTimersByTimeAsync(2100);

      const result = await resultPromise;
      vi.useRealTimers();

      expect(generateImage).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(true);
    }, 10000);

    it('returns error after all retries exhausted', async () => {
      vi.mocked(db.profiles.get).mockResolvedValue(mockProfile);
      vi.mocked(generateImage).mockResolvedValue({
        success: false,
        error: 'Persistent error',
      });

      vi.useFakeTimers();
      const resultPromise = generateAndSaveEssenceImage(1, 1);

      await vi.advanceTimersByTimeAsync(3000);

      const result = await resultPromise;
      vi.useRealTimers();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Persistent error');
    }, 10000);

    it('verifies save by re-fetching profile', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      vi.mocked(db.profiles.get).mockResolvedValue(mockProfile);
      vi.mocked(db.profiles.update).mockResolvedValueOnce(1);
      vi.mocked(generateImage).mockResolvedValueOnce({
        success: true,
        image: 'base64imagedata',
      });
      vi.mocked(base64ToImageBlob).mockReturnValueOnce(mockBlob);

      await generateAndSaveEssenceImage(1);

      // Should call get twice: once at start, once to verify
      expect(db.profiles.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('generateFullEssence', () => {
    it('generates virtue sentence first, then image', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      vi.mocked(db.profiles.get).mockResolvedValue(mockProfile);
      vi.mocked(db.profiles.update).mockResolvedValue(1);
      vi.mocked(generateImage).mockResolvedValueOnce({
        success: true,
        image: 'base64imagedata',
      });
      vi.mocked(base64ToImageBlob).mockReturnValueOnce(mockBlob);

      const result = await generateFullEssence(1);

      expect(result.success).toBe(true);
      expect(result.virtueSentence).toBeDefined();
      expect(result.essenceImage).toBeDefined();
    });

    it('skips image generation when skipImage is true', async () => {
      vi.mocked(db.profiles.get).mockResolvedValueOnce(mockProfile);
      vi.mocked(db.profiles.update).mockResolvedValueOnce(1);

      const result = await generateFullEssence(1, true);

      expect(result.success).toBe(true);
      expect(result.virtueSentence).toBeDefined();
      expect(result.essenceImage).toBeUndefined();
      expect(generateImage).not.toHaveBeenCalled();
    });

    it('returns error if virtue sentence generation fails', async () => {
      vi.mocked(db.profiles.get).mockResolvedValueOnce({
        ...mockProfile,
        virtues_11: undefined,
      });

      const result = await generateFullEssence(1);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Could not generate virtue sentence');
    });

    it('returns partial success if image generation fails', async () => {
      vi.mocked(db.profiles.get).mockResolvedValue(mockProfile);
      vi.mocked(db.profiles.update).mockResolvedValue(1);
      vi.mocked(generateImage).mockResolvedValue({
        success: false,
        error: 'Image generation failed',
      });

      const result = await generateFullEssence(1);

      expect(result.success).toBe(false);
      expect(result.virtueSentence).toBeDefined();
      expect(result.error).toBe('Image generation failed');
    });
  });
});
