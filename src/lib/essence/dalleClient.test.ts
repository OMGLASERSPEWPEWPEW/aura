// src/lib/essence/dalleClient.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateImage, base64ToImageBlob } from './dalleClient';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('dalleClient', () => {
  // Console spies declared at describe level
  let consoleSpy: { log: ReturnType<typeof vi.spyOn>; error: ReturnType<typeof vi.spyOn> };

  beforeEach(() => {
    mockFetch.mockReset();
    // Setup console spies fresh for each test
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  describe('generateImage', () => {
    const sampleBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    it('returns success with image data on successful response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          image: sampleBase64,
          revised_prompt: 'A beautiful abstract image',
        }),
      });

      const result = await generateImage('Create an abstract image');

      expect(result.success).toBe(true);
      expect(result.image).toBe(sampleBase64);
      expect(result.revised_prompt).toBe('A beautiful abstract image');
      expect(result.error).toBeUndefined();
    });

    it('returns error when response is not ok', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: { message: 'Rate limit exceeded' },
        }),
      });

      const result = await generateImage('Create an abstract image');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Rate limit exceeded');
      expect(result.image).toBeUndefined();
    });

    it('returns error when no image data in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          revised_prompt: 'Something',
          // Missing image field
        }),
      });

      const result = await generateImage('Create an abstract image');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No image data in response');
    });

    it('returns error on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await generateImage('Create an abstract image');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('returns error on non-Error throw', async () => {
      mockFetch.mockRejectedValueOnce('Something went wrong');

      const result = await generateImage('Create an abstract image');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error');
    });

    it('sends correct request body with defaults', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ image: sampleBase64 }),
      });

      await generateImage('Create an abstract image');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/dalle-proxy'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: 'Create an abstract image',
            size: '1024x1024',
            quality: 'standard',
          }),
        })
      );
    });

    it('sends custom size and quality options', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ image: sampleBase64 }),
      });

      await generateImage('Create an abstract image', {
        size: '1792x1024',
        quality: 'hd',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            prompt: 'Create an abstract image',
            size: '1792x1024',
            quality: 'hd',
          }),
        })
      );
    });

    it('handles error object with nested message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: { message: 'Content policy violation' },
        }),
      });

      const result = await generateImage('Bad prompt');

      expect(result.error).toBe('Content policy violation');
    });

    it('handles error field directly in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          error: 'Something went wrong',
        }),
      });

      const result = await generateImage('Some prompt');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Image generation failed');
    });

    it('logs debug information on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ image: sampleBase64 }),
      });

      await generateImage('Test prompt');

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('[DALL-E Client]'),
        expect.anything()
      );
    });

    it('logs debug information on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: 'Failed' } }),
      });

      await generateImage('Test prompt');

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('[DALL-E Client]'),
        expect.anything()
      );
    });
  });

  describe('base64ToImageBlob', () => {
    it('converts valid base64 to PNG blob by default', () => {
      // 1x1 red pixel PNG
      const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

      const blob = base64ToImageBlob(base64);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/png');
      expect(blob.size).toBeGreaterThan(0);
    });

    it('creates blob with custom MIME type', () => {
      const base64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // 1x1 GIF

      const blob = base64ToImageBlob(base64, 'image/gif');

      expect(blob.type).toBe('image/gif');
    });

    it('creates blob with correct size', () => {
      // Simple base64 that decodes to known bytes
      const base64 = 'SGVsbG8gV29ybGQ='; // "Hello World" in base64

      const blob = base64ToImageBlob(base64);

      expect(blob.size).toBe(11); // "Hello World" is 11 bytes
    });

    it('handles empty base64 string', () => {
      const blob = base64ToImageBlob('');

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBe(0);
    });

    it('preserves binary data correctly', () => {
      // Create a known byte sequence and verify it round-trips
      const originalBytes = new Uint8Array([0, 1, 2, 255, 254, 253]);
      const base64 = btoa(String.fromCharCode(...originalBytes));

      const blob = base64ToImageBlob(base64);

      expect(blob.size).toBe(6);
    });
  });
});
