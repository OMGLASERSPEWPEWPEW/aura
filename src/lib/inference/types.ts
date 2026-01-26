// src/lib/inference/types.ts
// Type definitions for AI inference tracking

/**
 * Features that trigger AI inference calls.
 * Maps to operation names in the API client.
 */
export type InferenceFeature =
  | 'profile_analysis_chunk1'
  | 'profile_analysis_chunk2'
  | 'profile_analysis_chunk3'
  | 'profile_analysis_chunk4'
  | 'profile_analysis_consolidation'
  | 'user_synthesis'
  | 'compatibility_scoring'
  | 'date_ideas'
  | 'opener_suggestions'
  | 'ask_about_match'
  | 'conversation_coaching'
  | 'zodiac_compatibility'
  | 'unknown';

/**
 * Human-readable labels for each feature (for UI display).
 * Uses empowering language per UX guidelines.
 */
export const FEATURE_LABELS: Record<InferenceFeature, string> = {
  profile_analysis_chunk1: 'Profile Analysis',
  profile_analysis_chunk2: 'Profile Analysis',
  profile_analysis_chunk3: 'Profile Analysis',
  profile_analysis_chunk4: 'Profile Analysis',
  profile_analysis_consolidation: 'Profile Analysis',
  user_synthesis: 'Personal Insights',
  compatibility_scoring: 'Compatibility Score',
  date_ideas: 'Date Ideas',
  opener_suggestions: 'Conversation Openers',
  ask_about_match: 'Match Q&A',
  conversation_coaching: 'Conversation Coaching',
  zodiac_compatibility: 'Zodiac Compatibility',
  unknown: 'AI Analysis',
};

/**
 * Value descriptions for each feature (for value pairing in UI).
 */
export const FEATURE_VALUE_DESCRIPTIONS: Record<InferenceFeature, string> = {
  profile_analysis_chunk1: 'Psychological profile extracted',
  profile_analysis_chunk2: 'Interests & lifestyle analyzed',
  profile_analysis_chunk3: 'Communication style identified',
  profile_analysis_chunk4: 'Complete profile synthesis',
  profile_analysis_consolidation: 'Full analysis consolidated',
  user_synthesis: 'Personal dating strategy updated',
  compatibility_scoring: 'Compatibility assessment generated',
  date_ideas: 'Personalized date suggestions created',
  opener_suggestions: 'Conversation starters generated',
  ask_about_match: 'Match question answered',
  conversation_coaching: 'Response suggestions provided',
  zodiac_compatibility: 'Zodiac insights generated',
  unknown: 'AI insights generated',
};

/**
 * A single inference record stored in IndexedDB.
 * Tracks token usage, costs, and context for each API call.
 */
export interface InferenceRecord {
  id?: number;                   // Auto-increment primary key
  timestamp: Date;               // When the inference occurred

  // Token tracking
  inputTokens: number;           // Tokens sent to API
  outputTokens: number;          // Tokens received from API

  // Cost estimation
  estimatedCostUsd: number;      // Calculated USD cost
  model: string;                 // Model used (e.g., "claude-sonnet-4-20250514")

  // Context
  feature: InferenceFeature;     // Which feature triggered this
  page: string;                  // Page path (e.g., "/upload", "/profile/42")

  // User context (for multi-user future)
  userId?: string;               // Supabase user ID (if logged in)

  // Optional metadata
  profileId?: number;            // If analyzing a specific match profile
  success: boolean;              // Did the call succeed?
  errorType?: string;            // If failed, what type of error

  // Sync fields (Phase 2)
  serverId?: string;             // UUID from Supabase inference_history table
}

/**
 * Parameters for logging an inference.
 */
export interface LogInferenceParams {
  inputTokens: number;
  outputTokens: number;
  model: string;
  feature: InferenceFeature;
  page: string;
  success: boolean;
  errorType?: string;
  profileId?: number;
}

/**
 * Aggregated usage stats for display.
 */
export interface UsageStats {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
}

/**
 * Usage breakdown by feature.
 */
export interface FeatureUsage {
  feature: InferenceFeature;
  label: string;
  valueDescription: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  callCount: number;
  percentage: number;  // Percentage of total cost
}

/**
 * Time period for usage queries.
 */
export type UsagePeriod = 'session' | 'today' | 'week' | 'month' | 'all';
