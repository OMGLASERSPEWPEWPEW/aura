// src/lib/essence/virtueSentence.ts
// Generate one-line personality summaries from 11 Virtues scores

import type { MatchVirtueCompatibility, VirtueScore } from '../virtues/types';
import { getVirtueById } from '../virtues/virtues';

/**
 * Virtue adjectives/descriptors for sentence generation
 * Maps virtue ID to descriptive words based on score
 */
const VIRTUE_DESCRIPTORS: Record<string, { low: string; high: string; archetype?: string }> = {
  // Biological Realm
  vitality: {
    low: 'restorative soul',
    high: 'high-voltage energy',
    archetype: 'dynamo',
  },
  lust: {
    low: 'reserved sensibility',
    high: 'voracious passion',
    archetype: 'flame',
  },
  play: {
    low: 'grounded seriousness',
    high: 'absurd playfulness',
    archetype: 'jester',
  },

  // Emotional Realm
  warmth: {
    low: 'cool composure',
    high: 'radiant warmth',
    archetype: 'beacon',
  },
  voice: {
    low: 'diplomatic grace',
    high: 'bold directness',
    archetype: 'truth-teller',
  },
  space: {
    low: 'deep connection',
    high: 'autonomous spirit',
    archetype: 'wanderer',
  },
  anchor: {
    low: 'fluid spontaneity',
    high: 'structured certainty',
    archetype: 'architect',
  },

  // Cerebral Realm
  wit: {
    low: 'earnest sincerity',
    high: 'sharp intellect',
    archetype: 'sage',
  },
  drive: {
    low: 'peaceful contentment',
    high: 'relentless ambition',
    archetype: 'achiever',
  },
  curiosity: {
    low: 'grounded tradition',
    high: 'boundless curiosity',
    archetype: 'explorer',
  },
  soul: {
    low: 'pragmatic clarity',
    high: 'idealist vision',
    archetype: 'dreamer',
  },
};

/**
 * Get the top N virtues by score from a virtue scores array
 */
export function getTopVirtues(scores: VirtueScore[], count: number = 3): VirtueScore[] {
  return [...scores]
    .sort((a, b) => Math.abs(b.score - 50) - Math.abs(a.score - 50)) // Sort by distance from middle (most distinctive)
    .slice(0, count);
}

/**
 * Get a descriptor for a virtue based on its score
 */
function getVirtueDescriptor(virtueId: string, score: number): string {
  const descriptors = VIRTUE_DESCRIPTORS[virtueId];
  if (!descriptors) return '';

  // Scores closer to extremes get the full descriptor
  if (score >= 70) return descriptors.high;
  if (score <= 30) return descriptors.low;

  // Middle scores get a softer version
  const virtue = getVirtueById(virtueId);
  if (!virtue) return '';

  if (score > 50) {
    return `${virtue.highLabel.toLowerCase()} tendencies`;
  } else {
    return `${virtue.lowLabel.toLowerCase()} tendencies`;
  }
}

/**
 * Get the archetype for the most prominent virtue
 */
function getPrimaryArchetype(topVirtue: VirtueScore): string | null {
  const descriptors = VIRTUE_DESCRIPTORS[topVirtue.virtue_id];
  if (!descriptors?.archetype) return null;

  // Only use archetype if the score is distinctive (far from middle)
  const distance = Math.abs(topVirtue.score - 50);
  return distance >= 20 ? descriptors.archetype : null;
}

/**
 * Generate a virtue sentence from 11 Virtues scores
 *
 * Example outputs:
 * - "A curious explorer with radiant warmth and autonomous spirit"
 * - "An intellectual achiever with sharp wit and voracious energy"
 * - "An absurd spirit with high voltage and radiant kindness"
 *
 * @param scores - The virtue scores array from virtues_11.scores
 * @returns A one-line personality summary
 */
export function generateVirtueSentence(scores: VirtueScore[]): string {
  if (!scores || scores.length === 0) {
    return 'A unique individual';
  }

  // Get top 3 most distinctive virtues
  const topVirtues = getTopVirtues(scores, 3);

  if (topVirtues.length === 0) {
    return 'A balanced individual';
  }

  // Build the sentence
  const primaryVirtue = topVirtues[0];
  const archetype = getPrimaryArchetype(primaryVirtue);
  const primaryDescriptor = getVirtueDescriptor(primaryVirtue.virtue_id, primaryVirtue.score);

  // Determine opener based on whether the first word starts with a vowel
  const startsWithVowel = /^[aeiou]/i.test(archetype || primaryDescriptor);
  const opener = startsWithVowel ? 'An' : 'A';

  // If we have an archetype, use "A curious explorer" format
  if (archetype) {
    const parts: string[] = [];

    // Add secondary virtue as adjective
    if (topVirtues.length >= 2) {
      const secondaryDescriptor = getVirtueDescriptor(topVirtues[1].virtue_id, topVirtues[1].score);
      parts.push(secondaryDescriptor);
    }

    // Add tertiary virtue
    if (topVirtues.length >= 3) {
      const tertiaryDescriptor = getVirtueDescriptor(topVirtues[2].virtue_id, topVirtues[2].score);
      parts.push(tertiaryDescriptor);
    }

    // Construct sentence: "A curious explorer with radiant warmth and autonomous spirit"
    const archetypeOpener = /^[aeiou]/i.test(archetype) ? 'An' : 'A';

    if (parts.length === 2) {
      return `${archetypeOpener} ${primaryDescriptor.split(' ')[0]} ${archetype} with ${parts[0]} and ${parts[1]}`;
    } else if (parts.length === 1) {
      return `${archetypeOpener} ${primaryDescriptor.split(' ')[0]} ${archetype} with ${parts[0]}`;
    } else {
      return `${archetypeOpener} ${primaryDescriptor} ${archetype}`;
    }
  }

  // Fallback: no archetype, just list descriptors
  const parts = topVirtues.map(v => getVirtueDescriptor(v.virtue_id, v.score)).filter(Boolean);

  if (parts.length === 3) {
    return `${opener} soul of ${parts[0]}, ${parts[1]}, and ${parts[2]}`;
  } else if (parts.length === 2) {
    return `${opener} soul of ${parts[0]} and ${parts[1]}`;
  } else if (parts.length === 1) {
    return `${opener} soul of ${parts[0]}`;
  }

  return 'A unique individual';
}

/**
 * Generate virtue sentence from MatchVirtueCompatibility object
 */
export function generateVirtueSentenceFromCompatibility(
  compatibility: MatchVirtueCompatibility
): string {
  return generateVirtueSentence(compatibility.scores);
}
