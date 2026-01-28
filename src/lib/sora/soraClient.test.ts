// src/lib/sora/soraClient.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateVideo, base64ToVideoBlob } from './soraClient';

describe('soraClient', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('generateVideo', () => {
    it('sends correct request to Sora proxy', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          video: 'base64videodata',
          revised_prompt: 'revised prompt',
        }),
      });
      global.fetch = mockFetch;

      await generateVideo('test prompt', { duration: 3, resolution: '1080x1920' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/sora-proxy'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: 'test prompt',
            duration: 3,
            resolution: '1080x1920',
          }),
        })
      );
    });

    it('returns success result with video data', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          video: 'base64videodata',
          revised_prompt: 'revised prompt',
        }),
      });

      const result = await generateVideo('test prompt');

      expect(result.success).toBe(true);
      expect(result.video).toBe('base64videodata');
      expect(result.revised_prompt).toBe('revised prompt');
    });

    it('returns error when API fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({
          error: { message: 'Rate limit exceeded' },
        }),
      });

      const result = await generateVideo('test prompt');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Rate limit exceeded');
    });

    it('returns error when no video in response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          // video field missing
        }),
      });

      const result = await generateVideo('test prompt');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No video data in response');
    });

    it('handles network errors gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await generateVideo('test prompt');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('uses default options when not provided', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          video: 'data',
        }),
      });
      global.fetch = mockFetch;

      await generateVideo('test prompt');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            prompt: 'test prompt',
            duration: 3,
            resolution: '1080x1920',
          }),
        })
      );
    });
  });

  describe('base64ToVideoBlob', () => {
    it('converts base64 string to Blob with correct type', () => {
      // Simple base64 encoded string "test"
      const base64 = 'dGVzdA==';
      const blob = base64ToVideoBlob(base64);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('video/mp4');
    });

    it('uses custom mime type when provided', () => {
      const base64 = 'dGVzdA==';
      const blob = base64ToVideoBlob(base64, 'video/webm');

      expect(blob.type).toBe('video/webm');
    });

    it('creates blob with correct byte data', () => {
      // "Hello" in base64
      const base64 = 'SGVsbG8=';
      const blob = base64ToVideoBlob(base64);

      expect(blob.size).toBe(5);
    });
  });
});
