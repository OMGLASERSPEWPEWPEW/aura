// src/lib/virtues/index.ts
// Barrel exports for the Virtues System
//
// This module exports both:
// 1. The NEW 11 Virtues System (primary, use for new code)
// 2. The LEGACY 23 Aspects System (deprecated, kept for migration)

// =============================================================================
// PRIMARY EXPORTS: 11 Virtues System (new code should use these)
// =============================================================================

// Types
export type {
  RealmType,
  DeltaCategory,
  CompatibilityVerdict,
  VirtueDefinition,
  VirtueScore,
  RealmSummary,
  UserVirtueProfile,
  VirtueCompatibility,
  MatchVirtueCompatibility,
  RealmConfig,
} from './types';

// Data and functions from virtues.ts
export {
  REALMS,
  VIRTUES,
  getVirtueById,
  getVirtuesByRealm,
  getRealmConfig,
  calculateVerdict,
  getVerdictEmoji,
  getVerdictLabel,
  getVerdictColors,
  calculateVirtueCompatibility,
  calculateMatchCompatibility,
  getOverallVerdictSummary,
  buildVirtuesPromptText,
} from './virtues';

// =============================================================================
// LEGACY EXPORTS: 23 Aspects System (deprecated, for migration only)
// =============================================================================

// Legacy types
export type {
  LegacyRealmType,
  AspectDefinition,
  AspectScore,
  LegacyRealmSummary,
  UserAspectProfile,
  AspectCompatibilityInsight,
  MatchAspectScores,
  LegacyRealmConfig,
} from './types';

// Legacy data and functions from aspects.ts
// Note: REALMS and getRealmConfig are exported from virtues.ts above (new system)
// Legacy versions are available as LEGACY_REALMS and getLegacyRealmConfig
export {
  LEGACY_REALMS,
  ASPECTS,
  getAspectById,
  getAspectsByRealm,
  getLegacyRealmConfig,
  buildAspectsPromptText,
} from './aspects';

// =============================================================================
// MIGRATION EXPORTS
// =============================================================================

export {
  UNMAPPED_ASPECTS,
  migrateAspectProfileToVirtues,
  migrateAspectScoresToVirtues,
  canMigrateAspectProfile,
  canMigrateAspectScores,
  getMigrationStatus,
} from './migration';
