// src/lib/virtues/aspects.ts
// The 23 Aspects data - based on virtue_system.md

import type { AspectDefinition, RealmConfig } from './types';

/**
 * Realm configurations for display
 */
export const REALMS: RealmConfig[] = [
  {
    id: 'vitality',
    name: 'Realm of Vitality',
    subtitle: 'Body & Action - How they move through the world',
    colorClass: 'text-orange-600',
    bgClass: 'bg-orange-50',
    borderClass: 'border-orange-200',
  },
  {
    id: 'connection',
    name: 'Realm of Connection',
    subtitle: 'Heart & Spirit - How they bond with others',
    colorClass: 'text-rose-600',
    bgClass: 'bg-rose-50',
    borderClass: 'border-rose-200',
  },
  {
    id: 'structure',
    name: 'Realm of Structure',
    subtitle: 'Mind & Environment - How they organize reality',
    colorClass: 'text-indigo-600',
    bgClass: 'bg-indigo-50',
    borderClass: 'border-indigo-200',
  },
];

/**
 * The 23 Aspects - organized by realm
 */
export const ASPECTS: AspectDefinition[] = [
  // ===== REALM I: VITALITY (7 aspects) =====
  {
    id: 'vigor',
    name: 'Vigor',
    realm: 'vitality',
    description: 'Physical energy, fitness, and an active lifestyle',
    woundItMasks: 'Fear of weakness or decay; need for agency',
    matchConsiderations: 'Needs someone who values movement and physical activity',
  },
  {
    id: 'adventure',
    name: 'Adventure',
    realm: 'vitality',
    description: 'Novelty seeking, risk-taking, and exploration',
    woundItMasks: 'Boredom, fear of stagnation',
    matchConsiderations: 'Needs a co-pilot for adventures or a grounded anchor',
  },
  {
    id: 'play',
    name: 'Play',
    realm: 'vitality',
    description: 'Silliness, embracing weirdness, and spontaneous fun',
    woundItMasks: 'Fear of judgment, rigid perfectionism',
    matchConsiderations: 'High Play matches well with High Wit',
  },
  {
    id: 'sensuality',
    name: 'Sensuality',
    realm: 'vitality',
    description: 'Tactile appreciation, physical touch, and bodily pleasure',
    woundItMasks: 'Touch starvation, body insecurity',
    matchConsiderations: 'High Sensuality requires someone comfortable with intimacy',
  },
  {
    id: 'presence',
    name: 'Presence',
    realm: 'vitality',
    description: 'Being in the moment, mindfulness, and undivided attention',
    woundItMasks: 'Anxiety, overthinking, dissociation',
    matchConsiderations: 'Needs a partner who is not addicted to chaos',
  },
  {
    id: 'spontaneity',
    name: 'Spontaneity',
    realm: 'vitality',
    description: 'Flexibility, ability to pivot plans, and embrace the unexpected',
    woundItMasks: 'Fear of control, trapped feeling',
    matchConsiderations: 'Can clash with High Order; may need complementary balance',
  },
  {
    id: 'grit',
    name: 'Grit',
    realm: 'vitality',
    description: 'Resilience, doing the hard work, and persistence',
    woundItMasks: 'Fear of failure, need for competence',
    matchConsiderations: 'Respects other High Grit people; values earned achievement',
  },

  // ===== REALM II: CONNECTION (8 aspects) =====
  {
    id: 'devotion',
    name: 'Devotion',
    realm: 'connection',
    description: 'Loyalty, commitment, and monogamous orientation',
    woundItMasks: 'Fear of abandonment',
    matchConsiderations: 'Essential alignment - High Devotion cannot date Low Devotion',
  },
  {
    id: 'autonomy',
    name: 'Autonomy',
    realm: 'connection',
    description: 'Independence, self-reliance, and maintaining identity',
    woundItMasks: 'Fear of engulfment, loss of self',
    matchConsiderations: 'Needs a partner who respects boundaries (High Grace)',
  },
  {
    id: 'empathy',
    name: 'Empathy',
    realm: 'connection',
    description: 'Emotional literacy, reading the room, and understanding others',
    woundItMasks: 'Hyper-vigilance from reading others to stay safe',
    matchConsiderations: 'High Empathy needs reciprocity and emotional attunement',
  },
  {
    id: 'directness',
    name: 'Directness',
    realm: 'connection',
    description: 'Clarity in communication, saying what you mean',
    woundItMasks: 'Fear of manipulation or confusion',
    matchConsiderations: 'High Directness needs High Wit or High Grit partners',
  },
  {
    id: 'wit',
    name: 'Wit',
    realm: 'connection',
    description: 'Verbal intelligence, banter, and intellectual humor',
    woundItMasks: 'Using humor as a shield; intellectualizing pain',
    matchConsiderations: 'Needs intellectual stimulation and word play',
  },
  {
    id: 'vulnerability',
    name: 'Vulnerability',
    realm: 'connection',
    description: 'Emotional openness, willingness to be seen',
    woundItMasks: 'Shame, fear of being too much',
    matchConsiderations: 'Requires High Protection/Safety from partner',
  },
  {
    id: 'grace',
    name: 'Grace',
    realm: 'connection',
    description: 'Social poise, politeness, and consistent courtesy',
    woundItMasks: 'Fear of conflict, social anxiety, need for approval',
    matchConsiderations: 'High Grace rejects chaos and inconsistency',
  },
  {
    id: 'tribe',
    name: 'Tribe',
    realm: 'connection',
    description: 'Community orientation, valuing friend groups and social bonds',
    woundItMasks: 'Loneliness, isolation',
    matchConsiderations: 'Needs a partner who values social integration',
  },

  // ===== REALM III: STRUCTURE (8 aspects) =====
  {
    id: 'sanctuary',
    name: 'Sanctuary',
    realm: 'structure',
    description: 'Home environment, creating a safe and comfortable space',
    woundItMasks: 'The world is dangerous/exhausting; need for a fortress',
    matchConsiderations: 'High Sanctuary prioritizes the home space',
  },
  {
    id: 'curiosity',
    name: 'Curiosity',
    realm: 'structure',
    description: 'Intellectual hunger, love of learning and exploration',
    woundItMasks: 'Fear of inadequacy or stupidity',
    matchConsiderations: 'High Curiosity needs a High Curiosity partner',
  },
  {
    id: 'aesthetic',
    name: 'Aesthetic',
    realm: 'structure',
    description: 'Appreciation of beauty, design, and visual harmony',
    woundItMasks: 'Sensitivity to ugliness and disorder',
    matchConsiderations: 'High Aesthetic cannot date someone with bad taste',
  },
  {
    id: 'ambition',
    name: 'Ambition',
    realm: 'structure',
    description: 'Drive, career focus, and desire for achievement',
    woundItMasks: 'Need for status/validation to feel worthy',
    matchConsiderations: 'High Ambition needs a partner who supports the mission',
  },
  {
    id: 'order',
    name: 'Order',
    realm: 'structure',
    description: 'Routine, consistency, and structured living',
    woundItMasks: 'Anxiety about chaos; need for control',
    matchConsiderations: 'High Order clashes with High Spontaneity',
  },
  {
    id: 'protection',
    name: 'Protection',
    realm: 'structure',
    description: 'Safety consciousness, risk awareness, and caution',
    woundItMasks: 'Past trauma, physical fragility',
    matchConsiderations: 'High Protection needs High Trust/Grace from partner',
  },
  {
    id: 'tradition',
    name: 'Tradition',
    realm: 'structure',
    description: 'Valuing history, heritage, and established ways',
    woundItMasks: 'Fear of rapid change and modernity',
    matchConsiderations: 'Maps well to High Aesthetic; values continuity',
  },
  {
    id: 'purpose',
    name: 'Purpose',
    realm: 'structure',
    description: 'Meaning, mission, and significance in life',
    woundItMasks: 'Existential dread; fear of being useless',
    matchConsiderations: 'The ultimate connector - Shared Purpose is the strongest bond',
  },
];

/**
 * Get aspect by ID
 */
export function getAspectById(id: string): AspectDefinition | undefined {
  return ASPECTS.find(a => a.id === id);
}

/**
 * Get all aspects in a realm
 */
export function getAspectsByRealm(realm: 'vitality' | 'connection' | 'structure'): AspectDefinition[] {
  return ASPECTS.filter(a => a.realm === realm);
}

/**
 * Get realm config by ID
 */
export function getRealmConfig(realmId: 'vitality' | 'connection' | 'structure'): RealmConfig | undefined {
  return REALMS.find(r => r.id === realmId);
}

/**
 * Build the aspects prompt text (for use in AI prompts)
 */
export function buildAspectsPromptText(): string {
  const lines: string[] = [];

  for (const realm of REALMS) {
    lines.push(`\n## ${realm.name} (${realm.subtitle})\n`);
    const realmAspects = getAspectsByRealm(realm.id);
    for (const aspect of realmAspects) {
      lines.push(`### ${aspect.name}`);
      lines.push(`- Description: ${aspect.description}`);
      lines.push(`- Wound it masks: ${aspect.woundItMasks}`);
      lines.push(`- Match considerations: ${aspect.matchConsiderations}`);
      lines.push('');
    }
  }

  return lines.join('\n');
}
