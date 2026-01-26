// src/lib/virtues/migration.ts
// Migration helpers from 23 Aspects to 11 Virtues

import type {
  UserAspectProfile,
  UserVirtueProfile,
  VirtueScore,
  MatchAspectScores,
  MatchVirtueCompatibility,
} from './types';
import { VIRTUES, calculateMatchCompatibility } from './virtues';

// =============================================================================
// ASPECT TO VIRTUE MAPPING
// =============================================================================

/**
 * Maps old 23 Aspect IDs to new 11 Virtue IDs.
 * Some aspects map directly, some are averaged, some are dropped.
 */
const ASPECT_TO_VIRTUE_MAP: Record<string, { virtueId: string; weight: number }[]> = {
  // BIOLOGICAL REALM mappings
  vigor: [{ virtueId: 'vitality', weight: 1.0 }],
  adventure: [{ virtueId: 'vitality', weight: 0.5 }, { virtueId: 'curiosity', weight: 0.5 }],
  play: [{ virtueId: 'play', weight: 1.0 }],
  sensuality: [{ virtueId: 'lust', weight: 1.0 }],
  presence: [{ virtueId: 'warmth', weight: 0.5 }, { virtueId: 'anchor', weight: 0.5 }],
  spontaneity: [{ virtueId: 'anchor', weight: -1.0 }], // Inverse mapping - high spontaneity = low anchor
  grit: [{ virtueId: 'drive', weight: 0.7 }, { virtueId: 'vitality', weight: 0.3 }],

  // CONNECTION REALM mappings
  devotion: [{ virtueId: 'warmth', weight: 0.5 }, { virtueId: 'space', weight: -0.5 }], // High devotion = low space
  autonomy: [{ virtueId: 'space', weight: 1.0 }],
  empathy: [{ virtueId: 'warmth', weight: 0.7 }, { virtueId: 'soul', weight: 0.3 }],
  directness: [{ virtueId: 'voice', weight: 1.0 }],
  wit: [{ virtueId: 'wit', weight: 1.0 }],
  vulnerability: [{ virtueId: 'warmth', weight: 0.8 }, { virtueId: 'voice', weight: 0.2 }],
  grace: [{ virtueId: 'voice', weight: -0.3 }, { virtueId: 'warmth', weight: 0.3 }], // Grace = diplomatic
  tribe: [{ virtueId: 'space', weight: -0.5 }], // High tribe = lower space needs

  // STRUCTURE REALM mappings
  sanctuary: [{ virtueId: 'anchor', weight: 0.5 }],
  curiosity: [{ virtueId: 'curiosity', weight: 1.0 }],
  aesthetic: [{ virtueId: 'curiosity', weight: 0.3 }, { virtueId: 'soul', weight: 0.3 }],
  ambition: [{ virtueId: 'drive', weight: 1.0 }],
  order: [{ virtueId: 'anchor', weight: 1.0 }],
  protection: [{ virtueId: 'anchor', weight: 0.3 }],
  tradition: [{ virtueId: 'curiosity', weight: -0.5 }, { virtueId: 'soul', weight: 0.3 }], // Tradition = less exploration
  purpose: [{ virtueId: 'soul', weight: 1.0 }, { virtueId: 'drive', weight: 0.3 }],
};

/**
 * Aspects that don't map well to the new system (will be averaged into related virtues)
 */
export const UNMAPPED_ASPECTS = [
  'presence',   // Partially mapped to warmth/anchor
  'grace',      // Partially mapped to voice (inverse)
  'tribe',      // Partially mapped to space (inverse)
  'sanctuary',  // Partially mapped to anchor
  'aesthetic',  // Partially mapped to curiosity/soul
  'protection', // Partially mapped to anchor
  'tradition',  // Partially mapped to curiosity (inverse) / soul
];

// =============================================================================
// MIGRATION FUNCTIONS
// =============================================================================

/**
 * Migrate a user's old 23 Aspects profile to the new 11 Virtues profile.
 * Uses weighted averaging based on the mapping table.
 */
export function migrateAspectProfileToVirtues(
  aspectProfile: UserAspectProfile
): UserVirtueProfile {
  // Initialize accumulators for each virtue
  const virtueAccumulators: Record<string, { sum: number; weight: number }> = {};
  for (const virtue of VIRTUES) {
    virtueAccumulators[virtue.id] = { sum: 0, weight: 0 };
  }

  // Process each aspect score
  for (const aspectScore of aspectProfile.scores) {
    const mappings = ASPECT_TO_VIRTUE_MAP[aspectScore.aspect_id];
    if (!mappings) continue;

    for (const mapping of mappings) {
      const { virtueId, weight } = mapping;
      if (!virtueAccumulators[virtueId]) continue;

      // Handle inverse mappings (negative weight)
      const effectiveScore = weight < 0
        ? 100 - aspectScore.score // Invert the score
        : aspectScore.score;
      const effectiveWeight = Math.abs(weight);

      virtueAccumulators[virtueId].sum += effectiveScore * effectiveWeight;
      virtueAccumulators[virtueId].weight += effectiveWeight;
    }
  }

  // Convert accumulators to virtue scores
  const virtueScores: VirtueScore[] = VIRTUES.map(virtue => {
    const acc = virtueAccumulators[virtue.id];
    const score = acc.weight > 0
      ? Math.round(acc.sum / acc.weight)
      : 50; // Default to middle if no data

    // Find related aspects for evidence
    const relatedAspects = Object.entries(ASPECT_TO_VIRTUE_MAP)
      .filter(([_, mappings]) => mappings.some(m => m.virtueId === virtue.id))
      .map(([aspectId]) => aspectId);

    return {
      virtue_id: virtue.id,
      score,
      evidence: acc.weight > 0
        ? `Migrated from: ${relatedAspects.join(', ')}`
        : 'Insufficient data - defaulted to neutral',
    };
  });

  // Migrate realm summaries
  const realmSummary = {
    biological: aspectProfile.realm_summary?.vitality || 'Migrated from Vitality realm',
    emotional: aspectProfile.realm_summary?.connection || 'Migrated from Connection realm',
    cerebral: aspectProfile.realm_summary?.structure || 'Migrated from Structure realm',
  };

  return {
    scores: virtueScores,
    realm_summary: realmSummary,
    lastUpdated: new Date(),
  };
}

/**
 * Migrate match's old 23 Aspects scores to new 11 Virtues compatibility.
 * Requires the user's virtue profile for comparison.
 */
export function migrateAspectScoresToVirtues(
  aspectScores: MatchAspectScores,
  userVirtueProfile: UserVirtueProfile
): MatchVirtueCompatibility {
  // Convert aspect scores to virtue scores using same logic
  const virtueAccumulators: Record<string, { sum: number; weight: number; evidence: string[] }> = {};
  for (const virtue of VIRTUES) {
    virtueAccumulators[virtue.id] = { sum: 0, weight: 0, evidence: [] };
  }

  // Process each aspect score
  for (const aspectScore of aspectScores.scores) {
    const mappings = ASPECT_TO_VIRTUE_MAP[aspectScore.aspect_id];
    if (!mappings) continue;

    for (const mapping of mappings) {
      const { virtueId, weight } = mapping;
      if (!virtueAccumulators[virtueId]) continue;

      const effectiveScore = weight < 0
        ? 100 - aspectScore.score
        : aspectScore.score;
      const effectiveWeight = Math.abs(weight);

      virtueAccumulators[virtueId].sum += effectiveScore * effectiveWeight;
      virtueAccumulators[virtueId].weight += effectiveWeight;

      if (aspectScore.evidence) {
        virtueAccumulators[virtueId].evidence.push(aspectScore.evidence);
      }
    }
  }

  // Convert to virtue scores
  const matchVirtueScores: VirtueScore[] = VIRTUES.map(virtue => {
    const acc = virtueAccumulators[virtue.id];
    const score = acc.weight > 0
      ? Math.round(acc.sum / acc.weight)
      : 50;

    return {
      virtue_id: virtue.id,
      score,
      evidence: acc.evidence.length > 0
        ? acc.evidence[0] // Use first piece of evidence
        : undefined,
    };
  });

  // Calculate full compatibility using the virtues system
  return calculateMatchCompatibility(userVirtueProfile, matchVirtueScores);
}

/**
 * Check if an aspect profile can be migrated (has enough data)
 */
export function canMigrateAspectProfile(aspectProfile: UserAspectProfile | undefined): boolean {
  if (!aspectProfile?.scores) return false;
  // Need at least 10 aspects scored for meaningful migration
  return aspectProfile.scores.length >= 10;
}

/**
 * Check if aspect scores can be migrated
 */
export function canMigrateAspectScores(aspectScores: MatchAspectScores | undefined): boolean {
  if (!aspectScores?.scores) return false;
  return aspectScores.scores.length >= 10;
}

/**
 * Get migration status message
 */
export function getMigrationStatus(
  hasNewVirtueProfile: boolean,
  hasOldAspectProfile: boolean
): { status: 'current' | 'migrateable' | 'none'; message: string } {
  if (hasNewVirtueProfile) {
    return {
      status: 'current',
      message: 'Using 11 Virtues system',
    };
  }
  if (hasOldAspectProfile) {
    return {
      status: 'migrateable',
      message: 'Can migrate from 23 Aspects to 11 Virtues',
    };
  }
  return {
    status: 'none',
    message: 'No virtue profile available',
  };
}
