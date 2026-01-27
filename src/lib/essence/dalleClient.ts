// src/lib/essence/dalleClient.ts
// Client for calling DALL-E 3 via Supabase Edge Function

import { supabase } from '../supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface DalleGenerationResult {
  success: boolean;
  image?: string; // base64 encoded PNG
  revised_prompt?: string;
  error?: string;
}

/**
 * Generate an image using DALL-E 3 via the Supabase Edge Function
 *
 * @param prompt - The image generation prompt
 * @param options - Optional generation settings
 * @returns Result with base64 image data or error
 */
export async function generateImage(
  prompt: string,
  options: {
    size?: '1024x1024' | '1792x1024' | '1024x1792';
    quality?: 'standard' | 'hd';
  } = {}
): Promise<DalleGenerationResult> {
  const { size = '1024x1024', quality = 'standard' } = options;

  // Get current session for auth token
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    console.error('[DALL-E Client] No auth session:', sessionError?.message);
    return {
      success: false,
      error: 'Authentication required for image generation',
    };
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/dalle-proxy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        size,
        quality,
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      console.error('[DALL-E Client] Generation failed:', data.error);
      return {
        success: false,
        error: data.error?.message || 'Image generation failed',
      };
    }

    return {
      success: true,
      image: data.image,
      revised_prompt: data.revised_prompt,
    };
  } catch (error) {
    console.error('[DALL-E Client] Request failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Convert a base64 image string to a Blob for storage
 */
export function base64ToImageBlob(base64: string, mimeType = 'image/png'): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}
