// src/lib/inference/featureMapper.ts
// Map operation names to InferenceFeature types

import type { InferenceFeature } from './types';

/**
 * Map of operation names (from API calls) to InferenceFeature enum values.
 * Keep in sync with operation names used in ai.ts and other AI functions.
 */
const OPERATION_TO_FEATURE: Record<string, InferenceFeature> = {
  // Profile analysis chunks
  'analyzeChunk1': 'profile_analysis_chunk1',
  'analyzeChunk2': 'profile_analysis_chunk2',
  'analyzeChunk3': 'profile_analysis_chunk3',
  'analyzeChunk4': 'profile_analysis_chunk4',
  'analyzeProfileChunk1': 'profile_analysis_chunk1',
  'analyzeProfileChunk2': 'profile_analysis_chunk2',
  'analyzeProfileChunk3': 'profile_analysis_chunk3',
  'analyzeProfileChunk4': 'profile_analysis_chunk4',

  // Profile consolidation
  'consolidateProfile': 'profile_analysis_consolidation',
  'consolidateAnalysis': 'profile_analysis_consolidation',

  // User synthesis
  'generateUserSynthesis': 'user_synthesis',
  'synthesizeUser': 'user_synthesis',
  'userSynthesis': 'user_synthesis',

  // Compatibility scoring
  'calculateCompatibility': 'compatibility_scoring',
  'scoreCompatibility': 'compatibility_scoring',
  'compatibilityScoring': 'compatibility_scoring',

  // Date ideas
  'generateDateIdeas': 'date_ideas',
  'dateIdeas': 'date_ideas',

  // Opener suggestions
  'generateOpeners': 'opener_suggestions',
  'openerSuggestions': 'opener_suggestions',
  'refreshOpener': 'opener_suggestions',

  // Ask about match
  'askAboutMatch': 'ask_about_match',
  'matchQuestion': 'ask_about_match',

  // Conversation coaching
  'coachConversation': 'conversation_coaching',
  'conversationCoaching': 'conversation_coaching',
  'analyzeConversation': 'conversation_coaching',

  // Zodiac compatibility
  'analyzeZodiacCompatibility': 'zodiac_compatibility',
  'zodiacCompatibility': 'zodiac_compatibility',
};

/**
 * Infer the feature type from an operation name.
 *
 * @param operationName - The operation name passed to the API client
 * @returns The corresponding InferenceFeature, or 'unknown' if not found
 *
 * @example
 * ```typescript
 * inferFeatureFromOperation('analyzeChunk1'); // 'profile_analysis_chunk1'
 * inferFeatureFromOperation('generateDateIdeas'); // 'date_ideas'
 * inferFeatureFromOperation('someUnknownOp'); // 'unknown'
 * ```
 */
export function inferFeatureFromOperation(operationName?: string): InferenceFeature {
  if (!operationName) {
    return 'unknown';
  }

  const feature = OPERATION_TO_FEATURE[operationName];

  if (!feature) {
    console.warn(`[InferenceTracker] Unknown operation name: ${operationName}`);
    return 'unknown';
  }

  return feature;
}

/**
 * Get the current page path for context logging.
 * Safe to call in browser environment.
 */
export function getCurrentPage(): string {
  if (typeof window === 'undefined') {
    return '/unknown';
  }
  return window.location.pathname;
}

/**
 * Extract profile ID from the current page path if applicable.
 *
 * @returns Profile ID if on a profile page, undefined otherwise
 */
export function getProfileIdFromPage(): number | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const path = window.location.pathname;

  // Match /profile/:id pattern
  const profileMatch = path.match(/\/profile\/(\d+)/);
  if (profileMatch) {
    return parseInt(profileMatch[1], 10);
  }

  return undefined;
}
