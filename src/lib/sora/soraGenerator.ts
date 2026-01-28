// src/lib/sora/soraGenerator.ts
// Generate motion portrait (looping video) for a profile via OpenAI Sora

import { db, type Profile } from '../db';
import { buildSoraPrompt } from './promptBuilder';
import { generateVideo, base64ToVideoBlob } from './soraClient';
import { logInference } from '../inference';

// Cost estimate for Sora 3-second video at 1080x1920
const SORA_COST_USD = 0.30;

export interface SoraGenerationResult {
  success: boolean;
  soraVideo?: Blob;
  soraPrompt?: string;
  error?: string;
}

/**
 * Generate the Sora motion video for a profile
 * This calls OpenAI Sora API and costs ~$0.30 per video
 *
 * @param profile - The profile with virtues_11 and optionally virtueSentence
 * @returns Result with the generated video blob
 */
export async function generateProfileSoraVideo(
  profile: Profile
): Promise<SoraGenerationResult> {
  if (!profile.virtues_11?.scores || profile.virtues_11.scores.length === 0) {
    return {
      success: false,
      error: 'No virtue scores available',
    };
  }

  // Build the prompt
  const prompt = buildSoraPrompt(profile.virtues_11.scores, profile.virtueSentence);

  console.log('[Sora] Generating video for profile', profile.id);
  console.log('[Sora] Prompt preview:', prompt.substring(0, 200) + '...');

  // Call Sora
  const result = await generateVideo(prompt, {
    duration: 3,
    resolution: '1080x1920', // Portrait for mobile
  });

  // Log the inference for cost tracking
  logInference({
    inputTokens: 0, // N/A for video generation
    outputTokens: 0,
    estimatedCostUsd: result.success ? SORA_COST_USD : 0,
    model: 'sora-1.0',
    feature: 'sora_motion_generation',
    page: '/profile-detail',
    profileId: profile.id,
    success: result.success,
    errorType: result.error,
  });

  if (!result.success || !result.video) {
    return {
      success: false,
      error: result.error || 'Video generation failed',
    };
  }

  // Convert base64 to Blob
  const videoBlob = base64ToVideoBlob(result.video);

  return {
    success: true,
    soraVideo: videoBlob,
    soraPrompt: prompt,
  };
}

/**
 * Generate and save Sora motion video to a profile (user-triggered operation)
 * This is async and costs money (~$0.30) - requires explicit user action
 *
 * @param profileId - The profile ID to update
 * @param retries - Number of retries on failure (default 1)
 * @returns Result indicating success/failure
 */
export async function generateAndSaveSoraVideo(
  profileId: number,
  retries = 1
): Promise<SoraGenerationResult> {
  const profile = await db.profiles.get(profileId);
  if (!profile) {
    return {
      success: false,
      error: 'Profile not found',
    };
  }

  // Check if Sora video already exists to prevent redundant generation
  if (profile.soraVideo) {
    console.log('[Sora] Video already exists, skipping generation');
    return {
      success: true,
      soraVideo: profile.soraVideo,
      soraPrompt: profile.soraPrompt,
    };
  }

  // Generate with retry logic
  let lastError: string | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      console.log(`[Sora] Retry attempt ${attempt} for profile ${profileId}`);
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, attempt - 1)));
    }

    const result = await generateProfileSoraVideo(profile);

    if (result.success && result.soraVideo) {
      console.log('[Sora] Got video blob, size:', result.soraVideo.size, 'bytes');

      // Re-fetch profile to get latest state (other fields may have changed)
      const currentProfile = await db.profiles.get(profileId);

      // Save to profile, defensively preserving other Blob fields
      await db.profiles.update(profileId, {
        soraVideo: result.soraVideo,
        soraPrompt: result.soraPrompt,
        // Preserve other image fields if they exist in current profile
        ...(currentProfile?.essenceImage
          ? { essenceImage: currentProfile.essenceImage, essencePrompt: currentProfile.essencePrompt }
          : {}),
        ...(currentProfile?.moodboardImage
          ? { moodboardImage: currentProfile.moodboardImage, moodboardPrompt: currentProfile.moodboardPrompt }
          : {}),
      });

      // Verify save
      const savedProfile = await db.profiles.get(profileId);
      console.log('[Sora] Saved video for profile', profileId);
      console.log('[Sora] Verified soraVideo in DB:', !!savedProfile?.soraVideo, savedProfile?.soraVideo instanceof Blob);

      return result;
    }

    lastError = result.error;
  }

  return {
    success: false,
    error: lastError || 'Generation failed after retries',
  };
}
