// src/lib/utils/userContext.ts
// Shared utility for building user context for AI calls

import type { UserIdentity } from '../db';
import type { UserContextForMatch } from '../ai';

/**
 * Build user context for personalized match analysis.
 * Extracts relevant information from user's synthesis for AI calls.
 */
export function buildUserContextForMatch(
  userIdentity: UserIdentity | undefined
): UserContextForMatch | undefined {
  if (!userIdentity?.synthesis) return undefined;

  const synthesis = userIdentity.synthesis;

  return {
    goal_type: userIdentity.datingGoals?.type,
    archetype_summary: synthesis.psychological_profile?.archetype_summary,
    communication_style: synthesis.behavioral_insights?.communication_style,
    what_to_look_for: synthesis.dating_strategy?.what_to_look_for,
    what_to_avoid: synthesis.dating_strategy?.what_to_avoid,
    opener_style_recommendations: synthesis.dating_strategy?.opener_style_recommendations,
    location: userIdentity.manualEntry?.location,
    relationship_style: userIdentity.manualEntry?.relationshipStyle,
  };
}

/**
 * Check if user has a complete profile with synthesis
 */
export function hasUserProfile(userIdentity: UserIdentity | undefined): boolean {
  return userIdentity?.synthesis !== undefined;
}

/**
 * Get user's zodiac sign from manual entry
 */
export function getUserZodiacSign(userIdentity: UserIdentity | undefined): string | undefined {
  return userIdentity?.manualEntry?.zodiac_sign;
}

/**
 * Get user's location from manual entry
 */
export function getUserLocation(userIdentity: UserIdentity | undefined): string | undefined {
  return userIdentity?.manualEntry?.location;
}

/**
 * Get user's interests from manual entry
 */
export function getUserInterests(userIdentity: UserIdentity | undefined): string[] | undefined {
  return userIdentity?.manualEntry?.interests;
}

/**
 * Get user's dating goal type
 */
export function getUserDatingGoal(userIdentity: UserIdentity | undefined): string | undefined {
  return userIdentity?.datingGoals?.type;
}

/**
 * Get user's archetype summary from synthesis
 */
export function getUserArchetype(userIdentity: UserIdentity | undefined): string | undefined {
  return userIdentity?.synthesis?.psychological_profile?.archetype_summary;
}
