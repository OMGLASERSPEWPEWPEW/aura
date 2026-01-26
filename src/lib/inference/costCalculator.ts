// src/lib/inference/costCalculator.ts
// Calculate USD costs from token usage

/**
 * Anthropic pricing per million tokens (as of 2026).
 * Source: https://www.anthropic.com/pricing
 */
interface ModelPricing {
  inputPerMillion: number;   // USD per 1M input tokens
  outputPerMillion: number;  // USD per 1M output tokens
}

const ANTHROPIC_PRICING: Record<string, ModelPricing> = {
  // Claude Sonnet 4 (current model)
  'claude-sonnet-4-20250514': {
    inputPerMillion: 3.0,
    outputPerMillion: 15.0,
  },
  // Claude 3.5 Sonnet (legacy, in case of fallback)
  'claude-3-5-sonnet-20241022': {
    inputPerMillion: 3.0,
    outputPerMillion: 15.0,
  },
  // Claude Opus 4.5 (premium model)
  'claude-opus-4-5-20251101': {
    inputPerMillion: 15.0,
    outputPerMillion: 75.0,
  },
  // Default fallback pricing (Sonnet-tier)
  'default': {
    inputPerMillion: 3.0,
    outputPerMillion: 15.0,
  },
};

/**
 * Calculate the estimated USD cost for a given token usage.
 *
 * @param inputTokens - Number of input tokens sent to API
 * @param outputTokens - Number of output tokens received from API
 * @param model - The model identifier (e.g., "claude-sonnet-4-20250514")
 * @returns Estimated cost in USD
 *
 * @example
 * ```typescript
 * const cost = calculateCost(5000, 2000, 'claude-sonnet-4-20250514');
 * // cost = (5000/1M * $3) + (2000/1M * $15) = $0.015 + $0.030 = $0.045
 * ```
 */
export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  model: string
): number {
  const pricing = ANTHROPIC_PRICING[model] || ANTHROPIC_PRICING['default'];

  const inputCost = (inputTokens / 1_000_000) * pricing.inputPerMillion;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPerMillion;

  // Round to 6 decimal places for precision
  return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000;
}

/**
 * Format a USD cost for display.
 * Uses UX guidelines: "≈ $X.XX invested" for empowering language.
 *
 * @param costUsd - Cost in USD
 * @param includePrefix - Whether to include the "≈" prefix
 * @returns Formatted string (e.g., "≈ $0.05")
 */
export function formatCost(costUsd: number, includePrefix = true): string {
  // Handle zero specially
  if (costUsd === 0) {
    return includePrefix ? '≈ $0.00' : '$0.00';
  }

  // For very small costs, show more precision
  if (costUsd < 0.01) {
    const formatted = costUsd < 0.001
      ? `$${costUsd.toFixed(4)}`
      : `$${costUsd.toFixed(3)}`;
    return includePrefix ? `≈ ${formatted}` : formatted;
  }

  // Standard 2 decimal places
  const formatted = `$${costUsd.toFixed(2)}`;
  return includePrefix ? `≈ ${formatted}` : formatted;
}

/**
 * Format token count for display.
 *
 * @param tokens - Number of tokens
 * @returns Formatted string (e.g., "45.3K", "1.2M")
 */
export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}K`;
  }
  return tokens.toLocaleString();
}

/**
 * Get estimated cost per feature (average costs for planning/display).
 * Based on real usage data from PRD.
 */
export const ESTIMATED_COSTS_PER_FEATURE: Record<string, number> = {
  profile_analysis_chunk1: 0.032,
  profile_analysis_chunk2: 0.037,
  profile_analysis_chunk3: 0.039,
  profile_analysis_chunk4: 0.041,
  profile_analysis_consolidation: 0.062,
  user_synthesis: 0.089,
  compatibility_scoring: 0.022,
  date_ideas: 0.016,
  opener_suggestions: 0.019,
  ask_about_match: 0.011,
  conversation_coaching: 0.024,
  zodiac_compatibility: 0.008,
};

/**
 * Get the estimated total cost for a full profile analysis.
 */
export const FULL_PROFILE_ANALYSIS_COST =
  ESTIMATED_COSTS_PER_FEATURE.profile_analysis_chunk1 +
  ESTIMATED_COSTS_PER_FEATURE.profile_analysis_chunk2 +
  ESTIMATED_COSTS_PER_FEATURE.profile_analysis_chunk3 +
  ESTIMATED_COSTS_PER_FEATURE.profile_analysis_chunk4 +
  ESTIMATED_COSTS_PER_FEATURE.profile_analysis_consolidation;
// ≈ $0.211 per full profile
