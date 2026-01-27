// src/lib/utils/thumbnailUtils.ts
// Utilities for handling thumbnail storage as Blobs instead of base64 strings
// This reduces IndexedDB storage by ~33%

import { useState, useEffect } from 'react';

/**
 * Converts a base64 data URL to a Blob
 * @param base64 - Base64 encoded data URL (e.g., "data:image/jpeg;base64,...")
 * @returns Blob object
 */
export function base64ToBlob(base64: string): Blob {
  // Handle data URL format (data:image/jpeg;base64,...)
  const parts = base64.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const data = parts.length > 1 ? parts[1] : parts[0];

  const byteCharacters = atob(data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Converts a Blob to a base64 data URL
 * @param blob - Blob object
 * @returns Promise resolving to base64 data URL
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Checks if a value is a Blob
 * Uses multiple detection methods for robustness across different contexts
 * (IndexedDB deserialization can break instanceof in some cases)
 */
export function isBlob(value: unknown): value is Blob {
  if (!value) return false;

  // Primary check: instanceof (works in most cases)
  if (value instanceof Blob) return true;

  // Fallback: duck typing for Blob-like objects from IndexedDB
  // This handles cases where prototype chain is broken after deserialization
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    // Check for Blob's characteristic properties
    return (
      typeof obj.size === 'number' &&
      typeof obj.type === 'string' &&
      typeof obj.slice === 'function' &&
      typeof obj.arrayBuffer === 'function'
    );
  }

  return false;
}

/**
 * Checks if a value is a base64 data URL
 */
export function isBase64DataUrl(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('data:');
}

/**
 * Type for thumbnail that can be either base64 string or Blob
 */
export type ThumbnailValue = string | Blob;

/**
 * React hook for safely managing Object URLs from Blob thumbnails
 *
 * This hook:
 * 1. Creates an Object URL if the thumbnail is a Blob
 * 2. Returns the string directly if it's a base64 data URL
 * 3. Properly revokes Object URLs on cleanup to prevent memory leaks
 *
 * @param thumbnail - Either a base64 string or Blob, or undefined
 * @returns URL string suitable for img src, or null if no thumbnail
 *
 * @example
 * ```tsx
 * function ProfileCard({ profile }) {
 *   const thumbnailUrl = useThumbnailUrl(profile.thumbnail);
 *   return thumbnailUrl ? <img src={thumbnailUrl} /> : <Placeholder />;
 * }
 * ```
 */
export function useThumbnailUrl(thumbnail: ThumbnailValue | undefined | null): string | null {
  // Initialize synchronously for strings to avoid flash of placeholder
  // Only use null initial value for Blobs which need async Object URL creation
  const getInitialUrl = (): string | null => {
    if (!thumbnail) return null;
    if (typeof thumbnail === 'string') return thumbnail;
    return null; // Blobs will be handled in useEffect
  };

  const [url, setUrl] = useState<string | null>(getInitialUrl);

  useEffect(() => {
    if (!thumbnail) {
      setUrl(null);
      return;
    }

    // If it's a base64 string, use it directly
    // (Also set here for when thumbnail prop changes)
    if (typeof thumbnail === 'string') {
      setUrl(thumbnail);
      return;
    }

    // If it's a Blob (or Blob-like from IndexedDB), create an Object URL
    if (isBlob(thumbnail)) {
      const objectUrl = URL.createObjectURL(thumbnail as Blob);
      setUrl(objectUrl);

      // Cleanup: revoke the Object URL when the component unmounts
      // or when the thumbnail changes
      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }

    // Unknown type, return null
    setUrl(null);
  }, [thumbnail]);

  return url;
}

/**
 * Converts a thumbnail to Blob if it's a base64 string
 * Returns the Blob unchanged if already a Blob
 * Returns undefined if no thumbnail
 */
export function thumbnailToBlob(thumbnail: ThumbnailValue | undefined | null): Blob | undefined {
  if (!thumbnail) {
    return undefined;
  }

  if (isBlob(thumbnail)) {
    return thumbnail as Blob;
  }

  if (isBase64DataUrl(thumbnail)) {
    return base64ToBlob(thumbnail);
  }

  return undefined;
}

/**
 * Converts a thumbnail to base64 if it's a Blob
 * Returns the string unchanged if already a string
 * Returns undefined if no thumbnail
 */
export async function thumbnailToBase64(
  thumbnail: ThumbnailValue | undefined | null
): Promise<string | undefined> {
  if (!thumbnail) {
    return undefined;
  }

  if (typeof thumbnail === 'string') {
    return thumbnail;
  }

  if (isBlob(thumbnail)) {
    return blobToBase64(thumbnail as Blob);
  }

  return undefined;
}
