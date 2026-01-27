// src/lib/moodboard/types.ts
// Types for mood board image generation

import type { AccumulatedProfile } from '../streaming/types';

/**
 * Themes extracted from profile content for mood board generation
 */
export interface MoodboardThemes {
  /** 3-5 specific hobbies/interests (e.g., "hiking", "cooking Italian food") */
  activities: string[];
  /** 2-3 environments they'd enjoy (e.g., "cozy bookshop cafe", "mountain trail at golden hour") */
  settings: string[];
  /** Single word for their vibe (e.g., "bohemian", "minimalist", "adventurous") */
  aesthetic: string;
  /** Overall energy: adventurous | cozy | social | introspective */
  energy: 'adventurous' | 'cozy' | 'social' | 'introspective';
}

/**
 * Result of mood board generation process
 */
export interface MoodboardGenerationResult {
  success: boolean;
  moodboardImage?: Blob;
  moodboardPrompt?: string;
  themes?: MoodboardThemes;
  error?: string;
}

/**
 * Input data for theme extraction (subset of AccumulatedProfile relevant for mood board)
 */
export interface ThemeExtractionInput {
  /** 2-4 word vibe tags from photo analysis */
  vibesSummary: string[];
  /** Activity/setting descriptions from each photo */
  photoDescriptions: string[];
  /** Stated interests from profile prompts */
  promptAnswers: string[];
  /** Emerging personality archetype */
  emergingArchetype: string | null;
}

/**
 * Extract theme extraction input from an AccumulatedProfile
 */
export function extractThemeInput(profile: AccumulatedProfile): ThemeExtractionInput {
  return {
    vibesSummary: profile.photos.vibesSummary,
    photoDescriptions: profile.photos.analyses.map(a => a.description),
    promptAnswers: profile.prompts.found.map(p => p.answer),
    emergingArchetype: profile.psychological.emergingArchetype,
  };
}
