// src/lib/moodboard/themeExtractor.ts
// Extract lifestyle themes from profile data for mood board generation

import { callAnthropicForObject, textContent } from '../api/anthropicClient';
import type { MoodboardThemes, ThemeExtractionInput } from './types';
import { logInference } from '../inference';

// Cost estimate for theme extraction (~500 input tokens, ~200 output tokens)
// Using Claude Sonnet: ~$0.003
const EXTRACTION_COST_USD = 0.003;

/**
 * Prompt for Claude to extract lifestyle themes from profile data
 */
function buildExtractionPrompt(input: ThemeExtractionInput): string {
  const sections: string[] = [];

  if (input.vibesSummary.length > 0) {
    sections.push(`Photo Vibes: ${input.vibesSummary.join(', ')}`);
  }

  if (input.photoDescriptions.length > 0) {
    sections.push(`Photo Descriptions:\n${input.photoDescriptions.map((d) => `- ${d}`).join('\n')}`);
  }

  if (input.promptAnswers.length > 0) {
    sections.push(`Profile Responses:\n${input.promptAnswers.map(a => `- ${a}`).join('\n')}`);
  }

  if (input.emergingArchetype) {
    sections.push(`Personality Archetype: ${input.emergingArchetype}`);
  }

  return `Given this dating profile analysis, extract lifestyle themes for generating a mood board image.

${sections.join('\n\n')}

Return a JSON object with these exact fields:
{
  "activities": ["3-5 specific hobbies/interests they enjoy, e.g., 'hiking', 'cooking Italian food', 'reading sci-fi novels'"],
  "settings": ["2-3 environments/places they'd enjoy, e.g., 'cozy bookshop cafe with warm lighting', 'mountain trail at golden hour'"],
  "aesthetic": "single word for their overall vibe: bohemian, minimalist, rustic, urban, coastal, vintage, modern, earthy, eclectic, classic, sporty, artistic, or similar",
  "energy": "one of: adventurous, cozy, social, introspective"
}

Focus on concrete, visual elements that could be represented in an image. Be specific rather than generic.
Return ONLY the JSON object, no other text.`;
}

/**
 * Validate and normalize extracted themes
 */
function normalizeThemes(raw: Partial<MoodboardThemes>): MoodboardThemes {
  // Normalize energy to one of the allowed values
  const allowedEnergies = ['adventurous', 'cozy', 'social', 'introspective'] as const;
  let energy: MoodboardThemes['energy'] = 'cozy'; // default

  if (raw.energy && allowedEnergies.includes(raw.energy as typeof energy)) {
    energy = raw.energy as typeof energy;
  }

  return {
    activities: Array.isArray(raw.activities) ? raw.activities.slice(0, 5) : ['exploring new places'],
    settings: Array.isArray(raw.settings) ? raw.settings.slice(0, 3) : ['cozy indoor space'],
    aesthetic: typeof raw.aesthetic === 'string' ? raw.aesthetic : 'modern',
    energy,
  };
}

/**
 * Extract lifestyle themes from accumulated profile data using Claude
 *
 * @param input - Theme extraction input derived from AccumulatedProfile
 * @param profileId - Optional profile ID for logging
 * @returns Extracted and normalized themes
 */
export async function extractThemes(
  input: ThemeExtractionInput,
  profileId?: number
): Promise<MoodboardThemes> {
  // Check if we have enough data to extract themes
  const hasData =
    input.vibesSummary.length > 0 ||
    input.photoDescriptions.length > 0 ||
    input.promptAnswers.length > 0 ||
    input.emergingArchetype;

  if (!hasData) {
    console.log('[Moodboard] No data available for theme extraction, using defaults');
    return {
      activities: ['exploring new places', 'spending time with friends'],
      settings: ['cozy cafe with warm lighting', 'scenic outdoor spot'],
      aesthetic: 'modern',
      energy: 'social',
    };
  }

  const prompt = buildExtractionPrompt(input);
  console.log('[Moodboard] Extracting themes from profile data');

  try {
    const rawThemes = await callAnthropicForObject<Partial<MoodboardThemes>>({
      messages: [textContent(prompt)],
      maxTokens: 500,
    }, 'moodboard_theme_extraction');

    // Log inference cost
    logInference({
      inputTokens: 500, // Estimated
      outputTokens: 200, // Estimated
      estimatedCostUsd: EXTRACTION_COST_USD,
      model: 'claude-sonnet-4-5-20250929',
      feature: 'moodboard_theme_extraction',
      page: '/upload',
      profileId,
      success: true,
    });

    const themes = normalizeThemes(rawThemes);
    console.log('[Moodboard] Extracted themes:', themes);
    return themes;
  } catch (error) {
    console.error('[Moodboard] Theme extraction failed:', error);

    // Log failed inference
    logInference({
      inputTokens: 500,
      outputTokens: 0,
      estimatedCostUsd: 0,
      model: 'claude-sonnet-4-5-20250929',
      feature: 'moodboard_theme_extraction',
      page: '/upload',
      profileId,
      success: false,
      errorType: error instanceof Error ? error.message : 'Unknown error',
    });

    // Return sensible defaults on failure
    return {
      activities: ['exploring new places', 'spending time with friends'],
      settings: ['cozy cafe with warm lighting', 'scenic outdoor spot'],
      aesthetic: 'modern',
      energy: 'social',
    };
  }
}
