// src/lib/sora/soraClient.ts
// Client for calling OpenAI Sora via Supabase Edge Function

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface SoraGenerationResult {
  success: boolean;
  video?: string; // base64 encoded MP4
  revised_prompt?: string;
  error?: string;
}

export interface SoraGenerationOptions {
  duration?: number; // seconds (default 3)
  resolution?: '1080x1920' | '1920x1080'; // portrait or landscape
}

/**
 * Generate a video using OpenAI Sora via the Supabase Edge Function
 *
 * @param prompt - The video generation prompt
 * @param options - Optional generation settings
 * @returns Result with base64 video data or error
 */
export async function generateVideo(
  prompt: string,
  options: SoraGenerationOptions = {}
): Promise<SoraGenerationResult> {
  const { duration = 3, resolution = '1080x1920' } = options;

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/sora-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        duration,
        resolution,
      }),
    });

    console.log('[Sora Client] Response status:', response.status);
    const data = await response.json();
    console.log('[Sora Client] Response data keys:', Object.keys(data));
    console.log('[Sora Client] Has video:', !!data.video, 'Video length:', data.video?.length || 0);

    if (!response.ok || data.error) {
      console.error('[Sora Client] Generation failed:', data.error);
      return {
        success: false,
        error: data.error?.message || 'Video generation failed',
      };
    }

    if (!data.video) {
      console.error('[Sora Client] No video data in successful response');
      return {
        success: false,
        error: 'No video data in response',
      };
    }

    console.log('[Sora Client] Success! Video size:', data.video.length, 'chars');
    return {
      success: true,
      video: data.video,
      revised_prompt: data.revised_prompt,
    };
  } catch (error) {
    console.error('[Sora Client] Request failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Convert a base64 video string to a Blob for storage
 */
export function base64ToVideoBlob(base64: string, mimeType = 'video/mp4'): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}
