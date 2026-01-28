// src/lib/sampleProfile.ts
// Pre-loaded demo profile to show users how Aura works
// Can be deleted by user after exploring

import type { Profile, ProfileAnalysis } from './db';

const SAMPLE_ANALYSIS: ProfileAnalysis = {
  meta: {
    app_name: 'Hinge',
    best_photo_index: 0,
  },
  basics: {
    name: 'Demo Alex',
    age: 28,
    location: 'San Francisco, CA',
    job: 'Product Designer',
    zodiac_sign: 'Sagittarius',
  },
  photos: [
    {
      description: 'Smiling at a coffee shop with warm lighting',
      vibe: 'Approachable and creative',
      subtext: 'Values aesthetics and genuine connection',
    },
    {
      description: 'Hiking in nature with friends',
      vibe: 'Adventurous and social',
      subtext: 'Enjoys meaningful experiences over material things',
    },
  ],
  prompts: [
    {
      question: 'A life goal of mine',
      answer: 'To build something meaningful and travel to 30 countries before 35',
      analysis: 'Shows ambition balanced with adventure. The specificity of "30 countries" suggests they set concrete goals rather than vague dreams.',
    },
    {
      question: 'The way to win me over',
      answer: 'Deep conversations over good coffee, bonus points if you can make me laugh',
      analysis: 'Values intellectual connection and humor. The coffee reference aligns with their profile photos.',
    },
  ],
  psychological_profile: {
    agendas: [
      {
        type: 'Seeking meaningful partnership',
        evidence: 'Life goals focused on building something, emphasis on deep conversations',
        priority: 'primary',
      },
      {
        type: 'Validating lifestyle compatibility',
        evidence: 'Travel goals and adventure photos suggest they want someone who matches their energy',
        priority: 'secondary',
      },
    ],
    presentation_tactics: [
      'Authentic vulnerability through specific goals',
      'Lifestyle showcase without bragging',
      'Humor as a filter for compatibility',
    ],
    predicted_tactics: [
      'Will likely test your conversational depth early',
      'May bring up travel plans to gauge your adventurousness',
      'Uses humor to deflect if conversations get too intense too fast',
    ],
    subtext_analysis: {
      sexual_signaling: 'Subtle - focused on emotional connection first',
      power_dynamics: 'Balanced - wants an equal partner, not someone to impress',
      vulnerability_indicators: 'Moderate openness - willing to share goals but guards deeper insecurities',
      disconnect: 'Minor gap between adventure image and desire for stability ("build something meaningful")',
    },
    archetype_summary: 'The Grounded Adventurer - balances wanderlust with the desire to create lasting impact. Values depth over breadth in relationships.',
  },
  overall_analysis: {
    summary: 'A well-rounded profile showing genuine personality. Clear about what they want without being demanding. Good potential for someone seeking meaningful connection with shared adventure.',
    green_flags: [
      'Specific life goals show intentionality',
      'Balance of ambition and presence',
      'Values humor and deep connection equally',
      'Social photos suggest healthy relationships',
    ],
    red_flags: [
      'Travel goals may mean frequent absence',
      '"Build something meaningful" is vague - could mean career, family, or project',
      'May prioritize experiences over settling down near-term',
    ],
  },
};

export const SAMPLE_PROFILE: Omit<Profile, 'id'> = {
  name: 'Demo Alex',
  age: 28,
  appName: 'Hinge',
  timestamp: new Date(),
  analysis: SAMPLE_ANALYSIS,
  thumbnail: '', // Will be a placeholder
  analysisPhase: 'complete',
  virtueSentence: 'A grounded adventurer who seeks deep connection while building something meaningful.',
};

/**
 * Creates a sample profile in the database for onboarding
 * Returns the profile ID if created, or null if it already exists
 */
export async function createSampleProfile(): Promise<number | null> {
  const { db } = await import('./db');

  // Check if sample profile already exists (by name)
  const existing = await db.profiles.where('name').equals('Demo Alex').first();
  if (existing) {
    return null; // Already exists
  }

  // Add the sample profile
  const id = await db.profiles.add({
    ...SAMPLE_PROFILE,
    timestamp: new Date(), // Fresh timestamp
  } as Profile);

  return id;
}

/**
 * Checks if the sample profile exists
 */
export async function hasSampleProfile(): Promise<boolean> {
  const { db } = await import('./db');
  const count = await db.profiles.where('name').equals('Demo Alex').count();
  return count > 0;
}

/**
 * Deletes the sample profile
 */
export async function deleteSampleProfile(): Promise<void> {
  const { db } = await import('./db');
  await db.profiles.where('name').equals('Demo Alex').delete();
}
