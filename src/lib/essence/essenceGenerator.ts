// src/lib/essence/essenceGenerator.ts
// Generate essence identity (virtue sentence + AI image) for a profile

import { db, type Profile } from '../db';
import { generateVirtueSentence } from './virtueSentence';
import { buildEssencePrompt } from './promptBuilder';
import { generateImage, base64ToImageBlob } from './dalleClient';
import { logInference } from '../inference';

// Cost estimate for DALL-E 3 standard quality 1024x1024
const DALLE_COST_USD = 0.04;

export interface EssenceGenerationResult {
  success: boolean;
  virtueSentence?: string;
  essenceImage?: Blob;
  essencePrompt?: string;
  error?: string;
}

/**
 * Generate the virtue sentence for a profile from its 11 Virtues scores
 * This is free (derived from existing data) and runs synchronously
 *
 * @param profile - The profile with virtues_11 data
 * @returns The generated virtue sentence
 */
export function generateProfileVirtueSentence(profile: Profile): string | undefined {
  if (!profile.virtues_11?.scores || profile.virtues_11.scores.length === 0) {
    console.log('[Essence] No virtue scores available for profile', profile.id);
    return undefined;
  }

  return generateVirtueSentence(profile.virtues_11.scores);
}

/**
 * Generate the essence image for a profile
 * This calls DALL-E 3 and costs ~$0.04 per image
 *
 * @param profile - The profile with virtues_11 and optionally virtueSentence
 * @returns Result with the generated image blob
 */
export async function generateProfileEssenceImage(
  profile: Profile
): Promise<EssenceGenerationResult> {
  if (!profile.virtues_11?.scores || profile.virtues_11.scores.length === 0) {
    return {
      success: false,
      error: 'No virtue scores available',
    };
  }

  // Build the prompt
  const virtueSentence = profile.virtueSentence || generateProfileVirtueSentence(profile);
  const prompt = buildEssencePrompt(profile.virtues_11.scores, virtueSentence);

  console.log('[Essence] Generating image for profile', profile.id);

  // Call DALL-E
  const result = await generateImage(prompt, {
    size: '1024x1024',
    quality: 'standard',
  });

  // Log the inference for cost tracking
  logInference({
    inputTokens: 0, // N/A for image generation
    outputTokens: 0,
    estimatedCostUsd: result.success ? DALLE_COST_USD : 0,
    model: 'dall-e-3',
    feature: 'essence_image_generation',
    page: '/profile-detail',
    profileId: profile.id,
    success: result.success,
    errorType: result.error,
  });

  if (!result.success || !result.image) {
    return {
      success: false,
      error: result.error || 'Image generation failed',
    };
  }

  // Convert base64 to Blob
  const imageBlob = base64ToImageBlob(result.image);

  return {
    success: true,
    virtueSentence,
    essenceImage: imageBlob,
    essencePrompt: prompt,
  };
}

/**
 * Generate and save virtue sentence to a profile
 * This is fast and free - can be called during analysis consolidation
 *
 * @param profileId - The profile ID to update
 * @returns The generated virtue sentence, or undefined if generation failed
 */
export async function generateAndSaveVirtueSentence(
  profileId: number
): Promise<string | undefined> {
  const profile = await db.profiles.get(profileId);
  if (!profile) {
    console.error('[Essence] Profile not found:', profileId);
    return undefined;
  }

  const virtueSentence = generateProfileVirtueSentence(profile);
  if (!virtueSentence) {
    return undefined;
  }

  // Save to profile
  await db.profiles.update(profileId, { virtueSentence });
  console.log('[Essence] Saved virtue sentence for profile', profileId);

  return virtueSentence;
}

/**
 * Generate and save essence image to a profile (background operation)
 * This is async and costs money - should run after analysis completes
 *
 * @param profileId - The profile ID to update
 * @param retries - Number of retries on failure (default 1)
 * @returns Result indicating success/failure
 */
export async function generateAndSaveEssenceImage(
  profileId: number,
  retries = 1
): Promise<EssenceGenerationResult> {
  const profile = await db.profiles.get(profileId);
  if (!profile) {
    return {
      success: false,
      error: 'Profile not found',
    };
  }

  // Check if essence image already exists to prevent redundant generation
  if (profile.essenceImage) {
    console.log('[Essence] Image already exists, skipping generation');
    return {
      success: true,
      virtueSentence: profile.virtueSentence,
      essenceImage: profile.essenceImage,
      essencePrompt: profile.essencePrompt,
    };
  }

  // Generate with retry logic
  let lastError: string | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      console.log(`[Essence] Retry attempt ${attempt} for profile ${profileId}`);
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const result = await generateProfileEssenceImage(profile);

    if (result.success && result.essenceImage) {
      console.log('[Essence] Got image blob, size:', result.essenceImage.size, 'bytes');

      // Save to profile
      await db.profiles.update(profileId, {
        virtueSentence: result.virtueSentence,
        essenceImage: result.essenceImage,
        essencePrompt: result.essencePrompt,
      });

      // Verify save
      const savedProfile = await db.profiles.get(profileId);
      console.log('[Essence] Saved essence image for profile', profileId);
      console.log('[Essence] Verified essenceImage in DB:', !!savedProfile?.essenceImage, savedProfile?.essenceImage instanceof Blob);

      return result;
    }

    lastError = result.error;
  }

  return {
    success: false,
    error: lastError || 'Generation failed after retries',
  };
}

/**
 * Generate full essence (virtue sentence + image) for a profile
 * Virtue sentence is generated first (fast, free), then image (async, costs money)
 *
 * @param profileId - The profile ID
 * @param skipImage - If true, only generate virtue sentence (for cost savings)
 */
export async function generateFullEssence(
  profileId: number,
  skipImage = false
): Promise<EssenceGenerationResult> {
  // First, generate and save virtue sentence (fast, free)
  const virtueSentence = await generateAndSaveVirtueSentence(profileId);

  if (!virtueSentence) {
    return {
      success: false,
      error: 'Could not generate virtue sentence - no virtue scores available',
    };
  }

  if (skipImage) {
    return {
      success: true,
      virtueSentence,
    };
  }

  // Then generate essence image (slower, costs money)
  const result = await generateAndSaveEssenceImage(profileId);

  return {
    ...result,
    virtueSentence,
  };
}
