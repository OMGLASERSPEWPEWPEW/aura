// src/lib/virtues/types.ts
// Type definitions for the 11 Virtues System

/**
 * The three realms that organize the 11 virtues
 */
export type RealmType = 'biological' | 'emotional' | 'cerebral';

/**
 * Delta category determines how mismatches should be evaluated
 */
export type DeltaCategory = 'low' | 'medium_dangerous' | 'medium_magic' | 'flexible';

/**
 * Compatibility verdict for a single virtue comparison
 */
export type CompatibilityVerdict = 'sympatico' | 'friction' | 'danger';

/**
 * Definition of a single virtue in the 11 Virtues system
 */
export interface VirtueDefinition {
  id: string;                  // e.g., "vitality", "lust", "play"
  name: string;                // e.g., "Vitality", "Lust", "Play"
  realm: RealmType;
  lowLabel: string;            // Left end of spectrum, e.g., "Restorative"
  highLabel: string;           // Right end of spectrum, e.g., "High Voltage"
  description: string;         // What this virtue represents
  deltaCategory: DeltaCategory;
  critical?: boolean;          // true for Space - the anxious/avoidant predictor
}

/**
 * A scored virtue (0-100 scale)
 */
export interface VirtueScore {
  virtue_id: string;   // References VirtueDefinition.id
  score: number;       // 0-100
  evidence?: string;   // What in the profile supports this score
}

/**
 * Realm-level summary for display
 */
export interface RealmSummary {
  biological: string;  // Summary of biological realm
  emotional: string;   // Summary of emotional realm
  cerebral: string;    // Summary of cerebral realm
}

/**
 * User's virtue profile (stored in UserSynthesis)
 */
export interface UserVirtueProfile {
  scores: VirtueScore[];
  realm_summary: RealmSummary;
  lastUpdated: Date;
}

/**
 * Compatibility result for a single virtue comparison
 */
export interface VirtueCompatibility {
  virtue_id: string;
  virtue_name: string;
  user_score: number;
  match_score: number;
  delta: number;
  verdict: CompatibilityVerdict;
  note?: string;       // Explanation of the compatibility
}

/**
 * Match's complete virtue compatibility analysis (stored in Profile)
 */
export interface MatchVirtueCompatibility {
  scores: VirtueScore[];                    // Match's raw scores
  compatibility: VirtueCompatibility[];     // Comparison with user
  realm_scores: {
    biological: number;  // 0-100 average compatibility
    emotional: number;
    cerebral: number;
  };
  overall_score: number;    // 0-100 weighted score
  danger_count: number;     // Number of 'danger' verdicts
  friction_count: number;   // Number of 'friction' verdicts
  sympatico_count: number;  // Number of 'sympatico' verdicts
  critical_issues: string[];// e.g., ["Space mismatch: You need autonomy, they need merger"]
}

/**
 * Realm display configuration
 */
export interface RealmConfig {
  id: RealmType;
  name: string;
  subtitle: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  icon: string; // Lucide icon name
}

// =============================================================================
// LEGACY TYPES (kept for backwards compatibility and migration)
// =============================================================================

/**
 * @deprecated Use RealmType from 11 Virtues system
 * Legacy realm types from 23 Aspects system
 */
export type LegacyRealmType = 'vitality' | 'connection' | 'structure';

/**
 * @deprecated Use VirtueDefinition from 11 Virtues system
 * Definition of a single aspect in the old 23 Aspects system
 */
export interface AspectDefinition {
  id: string;
  name: string;
  realm: LegacyRealmType;
  description: string;
  woundItMasks: string;
  matchConsiderations: string;
}

/**
 * @deprecated Use VirtueScore from 11 Virtues system
 * A scored aspect from the old 23 Aspects system
 */
export interface AspectScore {
  aspect_id: string;
  score: number;
  evidence?: string;
}

/**
 * @deprecated Use RealmSummary from 11 Virtues system
 * Legacy realm summary
 */
export interface LegacyRealmSummary {
  vitality: string;
  connection: string;
  structure: string;
}

/**
 * @deprecated Use UserVirtueProfile from 11 Virtues system
 * User's aspect profile from the old 23 Aspects system
 */
export interface UserAspectProfile {
  scores: AspectScore[];
  dominant_aspects: string[];
  shadow_aspects: string[];
  realm_summary: LegacyRealmSummary;
  lastUpdated: Date;
}

/**
 * @deprecated Use VirtueCompatibility from 11 Virtues system
 * Compatibility insight from the old 23 Aspects system
 */
export interface AspectCompatibilityInsight {
  aspect: string;
  aspect_id: string;
  note: string;
}

/**
 * @deprecated Use MatchVirtueCompatibility from 11 Virtues system
 * Match's aspect scores from the old 23 Aspects system
 */
export interface MatchAspectScores {
  scores: AspectScore[];
  compatibility_insights: {
    strong_matches: AspectCompatibilityInsight[];
    complementary: AspectCompatibilityInsight[];
    potential_friction: AspectCompatibilityInsight[];
  };
  overall_realm_compatibility: {
    vitality: number;
    connection: number;
    structure: number;
  };
}

/**
 * @deprecated Legacy realm config for 23 Aspects
 */
export interface LegacyRealmConfig {
  id: LegacyRealmType;
  name: string;
  subtitle: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}
