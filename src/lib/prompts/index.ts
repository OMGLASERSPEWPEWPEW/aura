// src/lib/prompts/index.ts
// Re-exports all prompts for backward compatibility
// Prefer importing from specific modules for better tree-shaking

// Analysis prompts (streaming chunks and full analysis)
export {
  CHUNK_1_BASICS_PROMPT,
  CHUNK_2_IMPRESSIONS_PROMPT,
  CHUNK_3_OBSERVATIONS_PROMPT,
  CHUNK_4_FLAGS_PROMPT,
  PROFILE_ANALYSIS_PROMPT,
  PROFILE_BASICS_PROMPT,
  PROFILE_DEEP_PROMPT,
  USER_CONTEXT_FOR_MATCH,
} from './analysis';

// User self-analysis prompts
export {
  USER_CHUNK_1_BASICS_PROMPT,
  USER_CHUNK_2_IMPRESSIONS_PROMPT,
  USER_CHUNK_3_OBSERVATIONS_PROMPT,
  USER_CHUNK_4_SYNTHESIS_PROMPT,
  USER_SELF_ANALYSIS_PROMPT,
  USER_CONTEXT_PROMPT,
} from './userAnalysis';

// Conversation coaching prompts
export {
  CONVERSATION_COACH_PROMPT,
  SCORE_RESPONSE_PROMPT,
  DATE_ASK_PROMPT,
  REGENERATE_OPENERS_PROMPT,
  REGENERATE_PROMPT_OPENER_PROMPT,
  ASK_ABOUT_MATCH_PROMPT,
  DATE_IDEAS_PROMPT,
} from './coach';

// 11 Virtues system prompts
export {
  USER_VIRTUES_11_PROMPT,
  MATCH_VIRTUES_11_PROMPT,
  ZODIAC_COMPATIBILITY_PROMPT,
} from './virtues';

// Legacy prompts (deprecated, for backward compatibility)
export {
  USER_ASPECTS_PROMPT,
  MATCH_ASPECTS_PROMPT,
  PARTNER_VIRTUES_PROMPT,
  VIRTUE_SCORING_PROMPT,
} from './legacy';

// Miscellaneous prompts
export {
  NEURODIVERGENCE_ANALYSIS_PROMPT,
} from './misc';
