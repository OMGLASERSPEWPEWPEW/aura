// src/lib/sora/soraGenerator.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateProfileSoraVideo, generateAndSaveSoraVideo } from './soraGenerator';
import type { Profile } from '../db';
import * as soraClient from './soraClient';
import * as db from '../db';

// Mock the modules
vi.mock('./soraClient', () => ({
  generateVideo: vi.fn(),
  base64ToVideoBlob: vi.fn(),
}));

vi.mock('../db', () => ({
  db: {
    profiles: {
      get: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('../inference', () => ({
  logInference: vi.fn(),
}));

describe('soraGenerator', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('generateProfileSoraVideo', () => {
    it('returns error when no virtue scores available', async () => {
      const profile = {
        id: 1,
        name: 'Test',
        timestamp: new Date(),
        analysis: {},
        thumbnail: '',
      } as Profile;

      const result = await generateProfileSoraVideo(profile);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No virtue scores available');
    });

    it('returns error when virtue scores is empty', async () => {
      const profile = {
        id: 1,
        name: 'Test',
        timestamp: new Date(),
        analysis: {},
        thumbnail: '',
        virtues_11: { scores: [] },
      } as unknown as Profile;

      const result = await generateProfileSoraVideo(profile);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No virtue scores available');
    });

    it('generates video successfully with valid profile', async () => {
      const mockBlob = new Blob(['video'], { type: 'video/mp4' });

      vi.mocked(soraClient.generateVideo).mockResolvedValue({
        success: true,
        video: 'base64videodata',
        revised_prompt: 'revised',
      });
      vi.mocked(soraClient.base64ToVideoBlob).mockReturnValue(mockBlob);

      const profile = {
        id: 1,
        name: 'Test',
        timestamp: new Date(),
        analysis: {},
        thumbnail: '',
        virtues_11: {
          scores: [
            { virtue_id: 'warmth', score: 85, confidence: 70, evidence: 'warm' },
          ],
        },
        virtueSentence: 'A warm soul',
      } as unknown as Profile;

      const result = await generateProfileSoraVideo(profile);

      expect(result.success).toBe(true);
      expect(result.soraVideo).toBe(mockBlob);
      expect(result.soraPrompt).toContain('3-second looping');
    });

    it('handles API failure gracefully', async () => {
      vi.mocked(soraClient.generateVideo).mockResolvedValue({
        success: false,
        error: 'Rate limit exceeded',
      });

      const profile = {
        id: 1,
        name: 'Test',
        timestamp: new Date(),
        analysis: {},
        thumbnail: '',
        virtues_11: {
          scores: [
            { virtue_id: 'warmth', score: 85, confidence: 70, evidence: 'warm' },
          ],
        },
      } as unknown as Profile;

      const result = await generateProfileSoraVideo(profile);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Rate limit exceeded');
    });
  });

  describe('generateAndSaveSoraVideo', () => {
    it('returns error when profile not found', async () => {
      vi.mocked(db.db.profiles.get).mockResolvedValue(undefined);

      const result = await generateAndSaveSoraVideo(999);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Profile not found');
    });

    it('returns existing video if already generated', async () => {
      const existingBlob = new Blob(['existing'], { type: 'video/mp4' });
      vi.mocked(db.db.profiles.get).mockResolvedValue({
        id: 1,
        name: 'Test',
        timestamp: new Date(),
        analysis: {},
        thumbnail: '',
        soraVideo: existingBlob,
        soraPrompt: 'existing prompt',
      } as Profile);

      const result = await generateAndSaveSoraVideo(1);

      expect(result.success).toBe(true);
      expect(result.soraVideo).toBe(existingBlob);
      expect(result.soraPrompt).toBe('existing prompt');
      // Should not call generateVideo
      expect(soraClient.generateVideo).not.toHaveBeenCalled();
    });

    it('saves video to database on success', async () => {
      const mockBlob = new Blob(['video'], { type: 'video/mp4' });

      vi.mocked(db.db.profiles.get)
        .mockResolvedValueOnce({
          id: 1,
          name: 'Test',
          timestamp: new Date(),
          analysis: {},
          thumbnail: '',
          virtues_11: {
            scores: [
              { virtue_id: 'warmth', score: 85, confidence: 70, evidence: 'warm' },
            ],
          },
        } as unknown as Profile)
        .mockResolvedValueOnce({
          id: 1,
          name: 'Test',
          timestamp: new Date(),
          analysis: {},
          thumbnail: '',
        } as Profile)
        .mockResolvedValueOnce({
          id: 1,
          name: 'Test',
          timestamp: new Date(),
          analysis: {},
          thumbnail: '',
          soraVideo: mockBlob,
        } as unknown as Profile);

      vi.mocked(soraClient.generateVideo).mockResolvedValue({
        success: true,
        video: 'base64data',
      });
      vi.mocked(soraClient.base64ToVideoBlob).mockReturnValue(mockBlob);
      vi.mocked(db.db.profiles.update).mockResolvedValue(1);

      const result = await generateAndSaveSoraVideo(1);

      expect(result.success).toBe(true);
      expect(db.db.profiles.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          soraVideo: mockBlob,
          soraPrompt: expect.any(String),
        })
      );
    });

    it('retries on failure', async () => {
      vi.mocked(db.db.profiles.get).mockResolvedValue({
        id: 1,
        name: 'Test',
        timestamp: new Date(),
        analysis: {},
        thumbnail: '',
        virtues_11: {
          scores: [
            { virtue_id: 'warmth', score: 85, confidence: 70, evidence: 'warm' },
          ],
        },
      } as unknown as Profile);

      vi.mocked(soraClient.generateVideo)
        .mockResolvedValueOnce({ success: false, error: 'Temporary error' })
        .mockResolvedValueOnce({ success: false, error: 'Still failing' });

      const result = await generateAndSaveSoraVideo(1, 1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Still failing');
      // Called twice (initial + 1 retry)
      expect(soraClient.generateVideo).toHaveBeenCalledTimes(2);
    });
  });
});
