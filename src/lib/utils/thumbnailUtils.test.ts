// src/lib/utils/thumbnailUtils.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  base64ToBlob,
  blobToBase64,
  isBlob,
  isBase64DataUrl,
  useThumbnailUrl,
  thumbnailToBlob,
  thumbnailToBase64,
} from './thumbnailUtils';

// Sample base64 PNG (1x1 red pixel)
const SAMPLE_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

// Sample base64 JPEG
const SAMPLE_JPEG_BASE64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

// Raw base64 without data URL prefix
const RAW_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

describe('thumbnailUtils', () => {
  describe('base64ToBlob', () => {
    it('should convert a base64 data URL to a Blob', () => {
      const blob = base64ToBlob(SAMPLE_BASE64);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/png');
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should handle JPEG base64 data URLs', () => {
      const blob = base64ToBlob(SAMPLE_JPEG_BASE64);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/jpeg');
    });

    it('should handle raw base64 without data URL prefix', () => {
      const blob = base64ToBlob(RAW_BASE64);

      expect(blob).toBeInstanceOf(Blob);
      // Defaults to image/jpeg when no mime type specified
      expect(blob.type).toBe('image/jpeg');
    });

    it('should produce smaller blob than base64 string', () => {
      const blob = base64ToBlob(SAMPLE_BASE64);
      const base64DataLength = SAMPLE_BASE64.length;

      // Blob should be smaller than the base64 string (roughly 33% smaller)
      // base64 encoding overhead is approximately 33%
      expect(blob.size).toBeLessThan(base64DataLength);
    });
  });

  describe('blobToBase64', () => {
    it('should convert a Blob back to base64 data URL', async () => {
      const originalBlob = new Blob(['test'], { type: 'text/plain' });
      const base64 = await blobToBase64(originalBlob);

      expect(base64).toMatch(/^data:text\/plain;base64,/);
    });

    it('should preserve image data through round-trip conversion', async () => {
      const blob = base64ToBlob(SAMPLE_BASE64);
      const roundTripped = await blobToBase64(blob);

      // The round-tripped base64 should be a valid data URL
      expect(roundTripped).toMatch(/^data:image\/png;base64,/);
      expect(roundTripped.length).toBeGreaterThan(0);
    });

    it('should handle empty blobs', async () => {
      const emptyBlob = new Blob([], { type: 'image/png' });
      const base64 = await blobToBase64(emptyBlob);

      expect(base64).toBe('data:image/png;base64,');
    });
  });

  describe('isBlob', () => {
    it('should return true for Blob instances', () => {
      const blob = new Blob(['test']);
      expect(isBlob(blob)).toBe(true);
    });

    it('should return false for strings', () => {
      expect(isBlob('test')).toBe(false);
      expect(isBlob(SAMPLE_BASE64)).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(isBlob(null)).toBe(false);
      expect(isBlob(undefined)).toBe(false);
    });

    it('should return false for other types', () => {
      expect(isBlob(123)).toBe(false);
      expect(isBlob({})).toBe(false);
      expect(isBlob([])).toBe(false);
    });
  });

  describe('isBase64DataUrl', () => {
    it('should return true for data URLs', () => {
      expect(isBase64DataUrl(SAMPLE_BASE64)).toBe(true);
      expect(isBase64DataUrl(SAMPLE_JPEG_BASE64)).toBe(true);
      expect(isBase64DataUrl('data:text/plain;base64,SGVsbG8=')).toBe(true);
    });

    it('should return false for raw base64 strings', () => {
      expect(isBase64DataUrl(RAW_BASE64)).toBe(false);
    });

    it('should return false for regular strings', () => {
      expect(isBase64DataUrl('hello world')).toBe(false);
      expect(isBase64DataUrl('')).toBe(false);
    });

    it('should return false for non-strings', () => {
      expect(isBase64DataUrl(null)).toBe(false);
      expect(isBase64DataUrl(undefined)).toBe(false);
      expect(isBase64DataUrl(123)).toBe(false);
      expect(isBase64DataUrl(new Blob())).toBe(false);
    });
  });

  describe('thumbnailToBlob', () => {
    it('should convert base64 string to Blob', () => {
      const blob = thumbnailToBlob(SAMPLE_BASE64);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob?.type).toBe('image/png');
    });

    it('should return Blob unchanged if already a Blob', () => {
      const originalBlob = new Blob(['test'], { type: 'image/jpeg' });
      const result = thumbnailToBlob(originalBlob);

      expect(result).toBe(originalBlob);
    });

    it('should return undefined for null/undefined', () => {
      expect(thumbnailToBlob(null)).toBeUndefined();
      expect(thumbnailToBlob(undefined)).toBeUndefined();
    });

    it('should return undefined for non-data-URL strings', () => {
      expect(thumbnailToBlob('hello')).toBeUndefined();
    });
  });

  describe('thumbnailToBase64', () => {
    it('should return string unchanged if already a string', async () => {
      const result = await thumbnailToBase64(SAMPLE_BASE64);
      expect(result).toBe(SAMPLE_BASE64);
    });

    it('should convert Blob to base64', async () => {
      const blob = new Blob(['test'], { type: 'text/plain' });
      const result = await thumbnailToBase64(blob);

      expect(result).toMatch(/^data:text\/plain;base64,/);
    });

    it('should return undefined for null/undefined', async () => {
      expect(await thumbnailToBase64(null)).toBeUndefined();
      expect(await thumbnailToBase64(undefined)).toBeUndefined();
    });
  });

  describe('useThumbnailUrl', () => {
    let revokedUrls: string[] = [];
    let originalCreateObjectURL: typeof URL.createObjectURL;
    let originalRevokeObjectURL: typeof URL.revokeObjectURL;

    beforeEach(() => {
      revokedUrls = [];
      originalCreateObjectURL = URL.createObjectURL;
      originalRevokeObjectURL = URL.revokeObjectURL;

      // Mock URL.createObjectURL
      URL.createObjectURL = vi.fn((blob: Blob) => `blob:mock-url-${blob.size}`);

      // Mock URL.revokeObjectURL to track calls
      URL.revokeObjectURL = vi.fn((url: string) => {
        revokedUrls.push(url);
      });
    });

    afterEach(() => {
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
    });

    it('should return null for undefined thumbnail', () => {
      const { result } = renderHook(() => useThumbnailUrl(undefined));
      expect(result.current).toBeNull();
    });

    it('should return null for null thumbnail', () => {
      const { result } = renderHook(() => useThumbnailUrl(null));
      expect(result.current).toBeNull();
    });

    it('should return base64 string directly', async () => {
      const { result } = renderHook(() => useThumbnailUrl(SAMPLE_BASE64));

      await waitFor(() => {
        expect(result.current).toBe(SAMPLE_BASE64);
      });
    });

    it('should create Object URL for Blob', async () => {
      const blob = new Blob(['test'], { type: 'image/jpeg' });
      const { result } = renderHook(() => useThumbnailUrl(blob));

      await waitFor(() => {
        expect(result.current).toMatch(/^blob:mock-url-/);
      });
      expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    });

    it('should revoke Object URL on unmount', async () => {
      const blob = new Blob(['test'], { type: 'image/jpeg' });
      const { result, unmount } = renderHook(() => useThumbnailUrl(blob));

      await waitFor(() => {
        expect(result.current).toMatch(/^blob:mock-url-/);
      });

      const objectUrl = result.current;
      unmount();

      expect(revokedUrls).toContain(objectUrl);
    });

    it('should revoke old Object URL when thumbnail changes', async () => {
      // Use different sizes to ensure different mock URLs
      const blob1 = new Blob(['small'], { type: 'image/jpeg' }); // 5 bytes
      const blob2 = new Blob(['much larger content'], { type: 'image/jpeg' }); // 19 bytes

      const { result, rerender } = renderHook(
        ({ thumbnail }) => useThumbnailUrl(thumbnail),
        { initialProps: { thumbnail: blob1 as Blob | string } }
      );

      await waitFor(() => {
        expect(result.current).toMatch(/^blob:mock-url-/);
      });

      const firstUrl = result.current;

      rerender({ thumbnail: blob2 });

      await waitFor(() => {
        expect(result.current).not.toBe(firstUrl);
      });

      expect(revokedUrls).toContain(firstUrl);
    });

    it('should not revoke URL when switching from string to string', async () => {
      const { result, rerender } = renderHook(
        ({ thumbnail }) => useThumbnailUrl(thumbnail),
        { initialProps: { thumbnail: SAMPLE_BASE64 } }
      );

      await waitFor(() => {
        expect(result.current).toBe(SAMPLE_BASE64);
      });

      rerender({ thumbnail: SAMPLE_JPEG_BASE64 });

      await waitFor(() => {
        expect(result.current).toBe(SAMPLE_JPEG_BASE64);
      });

      // No blob URLs should have been created or revoked
      expect(URL.createObjectURL).not.toHaveBeenCalled();
      expect(revokedUrls).toHaveLength(0);
    });
  });
});
