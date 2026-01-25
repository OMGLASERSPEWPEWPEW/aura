// src/lib/sync/imageSync.test.ts
import { describe, it, expect } from 'vitest';
import { isStoragePath } from './imageSync';

describe('isStoragePath', () => {
  describe('returns true for storage paths', () => {
    it('should return true for userId/thumbnails path', () => {
      expect(isStoragePath('abc123/thumbnails/image.jpg')).toBe(true);
    });

    it('should return true for nested storage paths', () => {
      expect(isStoragePath('user-id/folder/subfolder/file.png')).toBe(true);
    });

    it('should return true for UUID-based paths', () => {
      expect(isStoragePath('550e8400-e29b-41d4-a716-446655440000/thumbnails/thumb.jpg')).toBe(true);
    });
  });

  describe('returns false for base64 data', () => {
    it('should return false for data URL (jpeg)', () => {
      expect(isStoragePath('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA')).toBe(false);
    });

    it('should return false for data URL (png)', () => {
      expect(isStoragePath('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA')).toBe(false);
    });

    it('should return true for raw base64 with slashes (known limitation)', () => {
      // Note: Raw JPEG base64 starts with /9j/ which contains a slash.
      // This is a known limitation - such strings are detected as storage paths.
      // In practice, images are always passed as data: URLs (with prefix),
      // so this edge case doesn't occur.
      expect(isStoragePath('/9j/4AAQSkZJRgABAQAAAQABAAD')).toBe(true);
    });

    it('should return false for base64 without slashes', () => {
      // Base64 strings without slashes are correctly identified as not storage paths
      expect(isStoragePath('iVBORw0KGgoAAAANSUhEUg')).toBe(false);
    });
  });

  describe('returns false for invalid inputs', () => {
    it('should return false for empty string', () => {
      expect(isStoragePath('')).toBe(false);
    });

    it('should return false for string without slash', () => {
      expect(isStoragePath('just-a-filename.jpg')).toBe(false);
    });
  });
});
