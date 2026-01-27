// src/lib/moodboard/moodboardGenerator.ts
// Orchestrate mood board generation: theme extraction -> prompt building -> DALL-E image

import { db } from '../db';
import { generateImage, base64ToImageBlob } from '../essence/dalleClient';
import { logInference } from '../inference';
import { extractThemes } from './themeExtractor';
import { buildMoodboardPrompt, buildDefaultMoodboardPrompt } from './promptBuilder';
import type { MoodboardGenerationResult, MoodboardThemes, ThemeExtractionInput } from './types';
import { extractThemeInput } from './types';
import type { AccumulatedProfile } from '../streaming/types';

// Cost estimate for DALL-E 3 standard quality 1024x1024
const DALLE_COST_USD = 0.04;

/**
 * Generate a mood board image from accumulated profile data
 *
 * This function:
 * 1. Extracts lifestyle themes using Claude
 * 2. Builds a DALL-E prompt from the themes
 * 3. Generates the image via DALL-E 3
 *
 * @param input - Theme extraction input from AccumulatedProfile
 * @param profileId - Profile ID for logging
 * @returns Result with the generated image blob
 */
export async function generateMoodboardFromInput(
  input: ThemeExtractionInput,
  profileId?: number
): Promise<MoodboardGenerationResult> {
  console.log('[Moodboard] Starting mood board generation for profile', profileId);

  // Step 1: Extract themes from profile data
  let themes: MoodboardThemes;
  try {
    themes = await extractThemes(input, profileId);
  } catch (error) {
    console.error('[Moodboard] Theme extraction failed:', error);
    return {
      success: false,
      error: `Theme extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }

  // Step 2: Build the DALL-E prompt
  const prompt = buildMoodboardPrompt(themes);
  console.log('[Moodboard] Generated prompt:', prompt.substring(0, 200) + '...');

  // Step 3: Generate the image
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
    feature: 'moodboard_image_generation',
    page: '/upload',
    profileId,
    success: result.success,
    errorType: result.error,
  });

  if (!result.success || !result.image) {
    return {
      success: false,
      themes,
      error: result.error || 'Image generation failed',
    };
  }

  // Convert base64 to Blob
  const imageBlob = base64ToImageBlob(result.image);

  return {
    success: true,
    moodboardImage: imageBlob,
    moodboardPrompt: prompt,
    themes,
  };
}

/**
 * Generate mood board from an AccumulatedProfile (convenience wrapper)
 *
 * @param profile - The accumulated profile from streaming analysis
 * @param profileId - Profile ID for logging
 * @returns Result with the generated image blob
 */
export async function generateMoodboardFromProfile(
  profile: AccumulatedProfile,
  profileId?: number
): Promise<MoodboardGenerationResult> {
  const input = extractThemeInput(profile);
  return generateMoodboardFromInput(input, profileId);
}

/**
 * Generate and save mood board image to a profile
 *
 * @param profileId - The profile ID to update
 * @param profile - The accumulated profile data
 * @param retries - Number of retries on failure (default 1)
 * @returns Result indicating success/failure
 */
export async function generateAndSaveMoodboard(
  profileId: number,
  profile: AccumulatedProfile,
  retries = 1
): Promise<MoodboardGenerationResult> {
  console.log('[Moodboard] Generating and saving mood board for profile', profileId);

  let lastError: string | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      console.log(`[Moodboard] Retry attempt ${attempt} for profile ${profileId}`);
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const result = await generateMoodboardFromProfile(profile, profileId);

    if (result.success && result.moodboardImage) {
      console.log('[Moodboard] Got image blob, size:', result.moodboardImage.size, 'bytes');

      // Save to profile
      await db.profiles.update(profileId, {
        moodboardImage: result.moodboardImage,
        moodboardPrompt: result.moodboardPrompt,
      });

      // Verify save
      const savedProfile = await db.profiles.get(profileId);
      console.log('[Moodboard] Saved mood board image for profile', profileId);
      console.log('[Moodboard] Verified moodboardImage in DB:', !!savedProfile?.moodboardImage, savedProfile?.moodboardImage instanceof Blob);

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
 * Generate a mood board with default themes (when profile data is insufficient)
 *
 * @param profileId - Profile ID for logging
 * @returns Result with the generated image blob
 */
export async function generateDefaultMoodboard(
  profileId?: number
): Promise<MoodboardGenerationResult> {
  console.log('[Moodboard] Generating default mood board');

  const prompt = buildDefaultMoodboardPrompt();

  const result = await generateImage(prompt, {
    size: '1024x1024',
    quality: 'standard',
  });

  // Log the inference
  logInference({
    inputTokens: 0,
    outputTokens: 0,
    estimatedCostUsd: result.success ? DALLE_COST_USD : 0,
    model: 'dall-e-3',
    feature: 'moodboard_image_generation',
    page: '/upload',
    profileId,
    success: result.success,
    errorType: result.error,
  });

  if (!result.success || !result.image) {
    return {
      success: false,
      error: result.error || 'Image generation failed',
    };
  }

  const imageBlob = base64ToImageBlob(result.image);

  return {
    success: true,
    moodboardImage: imageBlob,
    moodboardPrompt: prompt,
  };
}
