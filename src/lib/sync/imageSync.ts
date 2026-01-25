// src/lib/sync/imageSync.ts
// Handles image upload/download to Supabase Storage

import { supabase } from '../supabase';
import type { ImageUploadResult, ImageSyncOptions } from './types';

const BUCKET_NAME = 'user-images';
const DEFAULT_MAX_SIZE = 1024 * 1024; // 1MB
const DEFAULT_QUALITY = 0.8;

/**
 * Converts a base64 image string to a Blob
 */
function base64ToBlob(base64: string): Blob {
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
 * Resizes an image if it exceeds the max size
 * Returns a Promise that resolves to a Blob
 */
async function resizeImageIfNeeded(
  blob: Blob,
  maxSizeBytes: number,
  quality: number
): Promise<Blob> {
  if (blob.size <= maxSizeBytes) {
    return blob;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calculate new dimensions (reduce by 10% each iteration)
      let width = img.width;
      let height = img.height;
      let currentQuality = quality;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Iteratively reduce size until under limit
      const tryResize = () => {
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (resultBlob) => {
            if (!resultBlob) {
              reject(new Error('Failed to create blob'));
              return;
            }

            if (resultBlob.size <= maxSizeBytes || currentQuality < 0.3) {
              resolve(resultBlob);
            } else {
              // Reduce dimensions by 10% and quality slightly
              width = Math.floor(width * 0.9);
              height = Math.floor(height * 0.9);
              currentQuality = Math.max(0.3, currentQuality - 0.1);
              tryResize();
            }
          },
          'image/jpeg',
          currentQuality
        );
      };

      tryResize();
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Uploads a base64 image to Supabase Storage
 * @param userId - The user's Supabase ID
 * @param base64 - The base64 encoded image
 * @param path - The path within the user's folder (e.g., 'thumbnails/abc123.jpg')
 * @param options - Optional resize/quality settings
 */
export async function uploadImage(
  userId: string,
  base64: string,
  path: string,
  options: ImageSyncOptions = {}
): Promise<ImageUploadResult> {
  const { maxSizeBytes = DEFAULT_MAX_SIZE, quality = DEFAULT_QUALITY } = options;

  // Convert base64 to blob
  let blob = base64ToBlob(base64);

  // Resize if needed
  blob = await resizeImageIfNeeded(blob, maxSizeBytes, quality);

  // Full path: {userId}/{path}
  const fullPath = `${userId}/${path}`;

  // Upload to Storage
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fullPath, blob, {
      contentType: 'image/jpeg',
      upsert: true, // Overwrite if exists
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // Get signed URL (valid for 1 year since bucket is private)
  const { data: urlData } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(fullPath, 60 * 60 * 24 * 365); // 1 year

  return {
    path: fullPath,
    url: urlData?.signedUrl || '',
  };
}

/**
 * Downloads an image from Supabase Storage and returns as base64
 * @param path - The full storage path (including userId)
 */
export async function downloadImage(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .download(path);

  if (error) {
    throw new Error(`Failed to download image: ${error.message}`);
  }

  // Convert blob to base64
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(data);
  });
}

/**
 * Gets a signed URL for an image in Storage
 * @param path - The full storage path (including userId)
 * @param expiresIn - Seconds until URL expires (default 1 hour)
 */
export async function getSignedUrl(
  path: string,
  expiresIn: number = 60 * 60
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw new Error(`Failed to get signed URL: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * Deletes an image from Supabase Storage
 * @param path - The full storage path (including userId)
 */
export async function deleteImage(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([path]);

  if (error) {
    throw new Error(`Failed to delete image: ${error.message}`);
  }
}

/**
 * Uploads multiple images in parallel
 * @param userId - The user's Supabase ID
 * @param images - Array of { base64, path } objects
 * @param options - Optional resize/quality settings
 */
export async function uploadImages(
  userId: string,
  images: Array<{ base64: string; path: string }>,
  options: ImageSyncOptions = {}
): Promise<ImageUploadResult[]> {
  const results = await Promise.all(
    images.map(({ base64, path }) => uploadImage(userId, base64, path, options))
  );
  return results;
}

/**
 * Checks if an image path is a Storage path (vs base64)
 */
export function isStoragePath(value: string): boolean {
  // Storage paths look like: userId/thumbnails/xxx.jpg
  // Base64 starts with 'data:' or is just raw base64
  return !value.startsWith('data:') && value.includes('/');
}

/**
 * Gets image as base64, handling both Storage paths and existing base64
 * @param value - Either a Storage path or base64 string
 */
export async function getImageAsBase64(value: string): Promise<string> {
  if (!isStoragePath(value)) {
    // Already base64
    return value;
  }
  // Download from Storage
  return downloadImage(value);
}
