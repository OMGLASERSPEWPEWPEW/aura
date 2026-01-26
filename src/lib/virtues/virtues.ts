// src/lib/virtues/virtues.ts
// The 11 Virtues of Love - data definitions and helper functions

import type {
  VirtueDefinition,
  RealmConfig,
  RealmType,
  CompatibilityVerdict,
  DeltaCategory,
  VirtueScore,
  UserVirtueProfile,
  VirtueCompatibility,
  MatchVirtueCompatibility,
} from './types';

// =============================================================================
// REALM CONFIGURATIONS
// =============================================================================

/**
 * The three realms that organize the 11 virtues
 */
export const REALMS: RealmConfig[] = [
  {
    id: 'biological',
    name: 'Biological Realm',
    subtitle: 'Chemistry - Binary needs, low tolerance for mismatch',
    colorClass: 'text-rose-600',
    bgClass: 'bg-rose-50',
    borderClass: 'border-rose-200',
    icon: 'Heart',
  },
  {
    id: 'emotional',
    name: 'Emotional Realm',
    subtitle: 'Connection - How you fight and bond',
    colorClass: 'text-amber-600',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
    icon: 'Users',
  },
  {
    id: 'cerebral',
    name: 'Cerebral Realm',
    subtitle: 'Mind - Long-term conversation potential',
    colorClass: 'text-indigo-600',
    bgClass: 'bg-indigo-50',
    borderClass: 'border-indigo-200',
    icon: 'Brain',
  },
];

// =============================================================================
// THE 11 VIRTUES
// =============================================================================

/**
 * The 11 Virtues of Love - organized by realm
 */
export const VIRTUES: VirtueDefinition[] = [
  // === BIOLOGICAL REALM (Chemistry) ===
  {
    id: 'vitality',
    name: 'Vitality',
    realm: 'biological',
    lowLabel: 'Restorative',
    highLabel: 'High Voltage',
    description: 'Energy levels and lifestyle pace',
    deltaCategory: 'low',
  },
  {
    id: 'lust',
    name: 'Lust',
    realm: 'biological',
    lowLabel: 'Reserved',
    highLabel: 'Voracious',
    description: 'Physical intimacy needs and expression',
    deltaCategory: 'low',
  },
  {
    id: 'play',
    name: 'Play',
    realm: 'biological',
    lowLabel: 'Serious',
    highLabel: 'Absurd',
    description: 'Silliness tolerance and playfulness',
    deltaCategory: 'medium_magic',
  },

  // === EMOTIONAL REALM (Connection) ===
  {
    id: 'warmth',
    name: 'Warmth',
    realm: 'emotional',
    lowLabel: 'Cool',
    highLabel: 'Radiant',
    description: 'Emotional expression and affection style',
    deltaCategory: 'medium_dangerous',
  },
  {
    id: 'voice',
    name: 'Voice',
    realm: 'emotional',
    lowLabel: 'Diplomatic',
    highLabel: 'Blunt',
    description: 'Communication directness',
    deltaCategory: 'low',
  },
  {
    id: 'space',
    name: 'Space',
    realm: 'emotional',
    lowLabel: 'Merged',
    highLabel: 'Autonomous',
    description: 'Independence vs togetherness needs',
    deltaCategory: 'medium_dangerous',
    critical: true, // The anxious/avoidant predictor
  },
  {
    id: 'anchor',
    name: 'Anchor',
    realm: 'emotional',
    lowLabel: 'Fluid',
    highLabel: 'Structured',
    description: 'Need for order vs spontaneity',
    deltaCategory: 'medium_magic',
  },

  // === CEREBRAL REALM (Mind) ===
  {
    id: 'wit',
    name: 'Wit',
    realm: 'cerebral',
    lowLabel: 'Earnest',
    highLabel: 'Intellectual',
    description: 'Banter and debate style',
    deltaCategory: 'low',
  },
  {
    id: 'drive',
    name: 'Drive',
    realm: 'cerebral',
    lowLabel: 'Content',
    highLabel: 'Relentless',
    description: 'Ambition and achievement orientation',
    deltaCategory: 'flexible',
  },
  {
    id: 'curiosity',
    name: 'Curiosity',
    realm: 'cerebral',
    lowLabel: 'Traditional',
    highLabel: 'Explorer',
    description: 'Novelty seeking and openness',
    deltaCategory: 'low',
  },
  {
    id: 'soul',
    name: 'Soul',
    realm: 'cerebral',
    lowLabel: 'Pragmatic',
    highLabel: 'Idealist',
    description: 'Meaning, spirituality, and values depth',
    deltaCategory: 'flexible',
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get virtue by ID
 */
export function getVirtueById(id: string): VirtueDefinition | undefined {
  return VIRTUES.find(v => v.id === id);
}

/**
 * Get all virtues in a realm
 */
export function getVirtuesByRealm(realm: RealmType): VirtueDefinition[] {
  return VIRTUES.filter(v => v.realm === realm);
}

/**
 * Get realm config by ID
 */
export function getRealmConfig(realmId: RealmType): RealmConfig | undefined {
  return REALMS.find(r => r.id === realmId);
}

/**
 * Calculate the compatibility verdict based on delta and category
 */
export function calculateVerdict(
  delta: number,
  category: DeltaCategory
): CompatibilityVerdict {
  switch (category) {
    case 'low':
      // Must be close: <20 sympatico, 20-34 friction, 35+ danger
      return delta < 20 ? 'sympatico' : delta < 35 ? 'friction' : 'danger';

    case 'medium_dangerous':
      // Dangerous gap: <15 sympatico, 15-29 friction, 30+ danger
      return delta < 15 ? 'sympatico' : delta < 30 ? 'friction' : 'danger';

    case 'medium_magic':
      // Complementary: <10 TOO similar (friction), 10-39 good (sympatico), 40+ danger
      return delta < 10 ? 'friction' : delta < 40 ? 'sympatico' : 'danger';

    case 'flexible':
      // More tolerance: <40 sympatico, 40+ friction (never truly "danger")
      return delta < 40 ? 'sympatico' : 'friction';
  }
}

/**
 * Get emoji for verdict (for display)
 */
export function getVerdictEmoji(verdict: CompatibilityVerdict): string {
  switch (verdict) {
    case 'sympatico': return '';  // Green checkmark handled in UI
    case 'friction': return '';   // Warning handled in UI
    case 'danger': return '';     // Alert handled in UI
  }
}

/**
 * Get human-readable label for verdict
 */
export function getVerdictLabel(verdict: CompatibilityVerdict): string {
  switch (verdict) {
    case 'sympatico': return 'Sympatico';
    case 'friction': return 'Friction';
    case 'danger': return 'Danger Zone';
  }
}

/**
 * Get Tailwind color classes for verdict
 */
export function getVerdictColors(verdict: CompatibilityVerdict): {
  text: string;
  bg: string;
  border: string;
} {
  switch (verdict) {
    case 'sympatico':
      return {
        text: 'text-emerald-600',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
      };
    case 'friction':
      return {
        text: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
      };
    case 'danger':
      return {
        text: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200',
      };
  }
}

/**
 * Calculate compatibility for a single virtue
 */
export function calculateVirtueCompatibility(
  virtue: VirtueDefinition,
  userScore: number,
  matchScore: number,
  matchEvidence?: string
): VirtueCompatibility {
  const delta = Math.abs(userScore - matchScore);
  const verdict = calculateVerdict(delta, virtue.deltaCategory);

  // Generate contextual note based on verdict and virtue
  let note = '';

  if (verdict === 'sympatico') {
    if (virtue.deltaCategory === 'medium_magic' && delta >= 10) {
      note = `Complementary balance - differences here can be healthy.`;
    } else {
      note = `Well aligned on ${virtue.name.toLowerCase()}.`;
    }
  } else if (verdict === 'friction') {
    if (virtue.deltaCategory === 'medium_magic' && delta < 10) {
      note = `Very similar - some complementary difference can help.`;
    } else {
      note = `Some tension on ${virtue.name.toLowerCase()} - discuss expectations.`;
    }
  } else if (verdict === 'danger') {
    if (virtue.critical) {
      note = `CRITICAL: High ${virtue.name} mismatch often predicts anxious/avoidant dynamics.`;
    } else {
      note = `Significant gap on ${virtue.name.toLowerCase()} - this needs attention.`;
    }
  }

  return {
    virtue_id: virtue.id,
    virtue_name: virtue.name,
    user_score: userScore,
    match_score: matchScore,
    delta,
    verdict,
    note: matchEvidence || note,
  };
}

/**
 * Calculate full match compatibility from user profile and match scores
 */
export function calculateMatchCompatibility(
  userProfile: UserVirtueProfile,
  matchScores: VirtueScore[]
): MatchVirtueCompatibility {
  const compatibility: VirtueCompatibility[] = [];
  const realmTotals: Record<RealmType, { score: number; count: number }> = {
    biological: { score: 0, count: 0 },
    emotional: { score: 0, count: 0 },
    cerebral: { score: 0, count: 0 },
  };

  let dangerCount = 0;
  let frictionCount = 0;
  let sympaticoCount = 0;
  const criticalIssues: string[] = [];

  // Calculate compatibility for each virtue
  for (const virtue of VIRTUES) {
    const userScoreEntry = userProfile.scores.find(s => s.virtue_id === virtue.id);
    const matchScoreEntry = matchScores.find(s => s.virtue_id === virtue.id);

    const userScore = userScoreEntry?.score ?? 50; // Default to middle if missing
    const matchScore = matchScoreEntry?.score ?? 50;

    const compat = calculateVirtueCompatibility(
      virtue,
      userScore,
      matchScore,
      matchScoreEntry?.evidence
    );

    compatibility.push(compat);

    // Update realm totals (convert delta to compatibility score: lower delta = higher score)
    const compatScore = Math.max(0, 100 - compat.delta * 2);
    realmTotals[virtue.realm].score += compatScore;
    realmTotals[virtue.realm].count += 1;

    // Count verdicts
    switch (compat.verdict) {
      case 'sympatico':
        sympaticoCount++;
        break;
      case 'friction':
        frictionCount++;
        break;
      case 'danger':
        dangerCount++;
        // Add to critical issues
        if (virtue.critical) {
          const userLabel = userScore > 50 ? virtue.highLabel : virtue.lowLabel;
          const matchLabel = matchScore > 50 ? virtue.highLabel : virtue.lowLabel;
          criticalIssues.push(
            `${virtue.name} mismatch: You lean ${userLabel} (${userScore}), they lean ${matchLabel} (${matchScore}).`
          );
        } else {
          criticalIssues.push(`${virtue.name}: Delta of ${compat.delta} indicates significant mismatch.`);
        }
        break;
    }
  }

  // Calculate realm scores
  const realmScores = {
    biological: realmTotals.biological.count > 0
      ? Math.round(realmTotals.biological.score / realmTotals.biological.count)
      : 50,
    emotional: realmTotals.emotional.count > 0
      ? Math.round(realmTotals.emotional.score / realmTotals.emotional.count)
      : 50,
    cerebral: realmTotals.cerebral.count > 0
      ? Math.round(realmTotals.cerebral.score / realmTotals.cerebral.count)
      : 50,
  };

  // Calculate overall score (weighted average with penalty for dangers)
  const baseScore = (realmScores.biological + realmScores.emotional + realmScores.cerebral) / 3;
  const dangerPenalty = dangerCount * 10; // Each danger drops score by 10
  const overallScore = Math.max(0, Math.round(baseScore - dangerPenalty));

  return {
    scores: matchScores,
    compatibility,
    realm_scores: realmScores,
    overall_score: overallScore,
    danger_count: dangerCount,
    friction_count: frictionCount,
    sympatico_count: sympaticoCount,
    critical_issues: criticalIssues,
  };
}

/**
 * Get a human-readable overall verdict summary
 */
export function getOverallVerdictSummary(compatibility: MatchVirtueCompatibility): string {
  const { danger_count, friction_count, sympatico_count, overall_score } = compatibility;

  if (danger_count >= 3) {
    return 'Significant compatibility challenges detected. Proceed with awareness.';
  }
  if (danger_count >= 1) {
    return `${danger_count} critical area${danger_count > 1 ? 's' : ''} need${danger_count === 1 ? 's' : ''} discussion before proceeding.`;
  }
  if (friction_count >= 4) {
    return 'Several areas of friction - communication will be key.';
  }
  if (sympatico_count >= 8) {
    return 'Strong alignment across most virtues. High compatibility potential.';
  }
  if (overall_score >= 75) {
    return 'Good compatibility with manageable differences.';
  }
  if (overall_score >= 50) {
    return 'Mixed signals - some alignment, some friction.';
  }
  return 'Challenging compatibility profile. Consider if core values align.';
}

/**
 * Build prompt text for AI scoring (lists all virtues)
 */
export function buildVirtuesPromptText(): string {
  const lines: string[] = [];

  for (const realm of REALMS) {
    lines.push(`\n## ${realm.name} (${realm.subtitle})\n`);
    const realmVirtues = getVirtuesByRealm(realm.id);
    for (const virtue of realmVirtues) {
      lines.push(`### ${virtue.name}${virtue.critical ? ' [CRITICAL]' : ''}`);
      lines.push(`- Spectrum: ${virtue.lowLabel} (0) <-> ${virtue.highLabel} (100)`);
      lines.push(`- Description: ${virtue.description}`);
      lines.push(`- Delta Tolerance: ${virtue.deltaCategory}`);
      lines.push('');
    }
  }

  return lines.join('\n');
}
