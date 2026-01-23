// src/lib/virtues/types.ts
// Type definitions for the 23 Aspects Virtue System

/**
 * The three realms that organize the 23 aspects
 */
export type RealmType = 'vitality' | 'connection' | 'structure';

/**
 * Definition of a single aspect in the 23 Aspects system
 */
export interface AspectDefinition {
  id: string;                  // e.g., "vigor", "adventure"
  name: string;                // e.g., "Vigor", "Adventure"
  realm: RealmType;
  description: string;         // What this virtue represents
  woundItMasks: string;        // The underlying wound/fear
  matchConsiderations: string; // How to consider this in matching
}

/**
 * A scored aspect for a user's profile
 */
export interface AspectScore {
  aspect_id: string;   // References AspectDefinition.id
  score: number;       // 0-100
  evidence?: string;   // What in the profile supports this score
}

/**
 * Realm-level summary for display
 */
export interface RealmSummary {
  vitality: string;    // Summary of vitality realm
  connection: string;  // Summary of connection realm
  structure: string;   // Summary of structure realm
}

/**
 * User's aspect profile (stored in UserSynthesis)
 */
export interface UserAspectProfile {
  scores: AspectScore[];
  dominant_aspects: string[];     // Top 5-7 aspect IDs
  shadow_aspects: string[];       // Lowest 3-5 aspect IDs (growth areas)
  realm_summary: RealmSummary;
  lastUpdated: Date;
}

/**
 * Compatibility insight between user and match on a specific aspect
 */
export interface AspectCompatibilityInsight {
  aspect: string;      // Aspect name
  aspect_id: string;   // Aspect ID
  note: string;        // Explanation of compatibility
}

/**
 * Match's aspect scores with compatibility analysis (stored in Profile)
 */
export interface MatchAspectScores {
  scores: AspectScore[];
  compatibility_insights: {
    strong_matches: AspectCompatibilityInsight[];     // Both high
    complementary: AspectCompatibilityInsight[];      // One fills other's gap
    potential_friction: AspectCompatibilityInsight[]; // Opposing values
  };
  overall_realm_compatibility: {
    vitality: number;    // 0-100
    connection: number;  // 0-100
    structure: number;   // 0-100
  };
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
}
