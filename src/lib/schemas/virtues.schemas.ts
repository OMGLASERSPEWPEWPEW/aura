// src/lib/schemas/virtues.schemas.ts
// Zod schemas for the 11 Virtues system AI responses

import { z } from 'zod';
import { scoreNumber } from './common.schemas';

/**
 * The 11 virtue IDs that are valid
 */
export const virtueIdSchema = z.enum([
  'vitality',
  'lust',
  'play',
  'warmth',
  'voice',
  'space',
  'anchor',
  'wit',
  'drive',
  'curiosity',
  'soul',
]);

export type VirtueId = z.infer<typeof virtueIdSchema>;

/**
 * Schema for a single virtue score from AI
 */
export const VirtueScoreSchema = z.object({
  virtue_id: z.string(), // Allow any string, we validate known IDs separately
  score: scoreNumber,
  evidence: z.string().optional(),
});

export type VirtueScore = z.infer<typeof VirtueScoreSchema>;

/**
 * Schema for the AI response when scoring a match's 11 virtues
 */
export const MatchVirtues11ResponseSchema = z.object({
  scores: z.array(VirtueScoreSchema).min(1, 'At least one virtue score is required'),
});

export type MatchVirtues11Response = z.infer<typeof MatchVirtues11ResponseSchema>;

/**
 * Schema for a single partner virtue (what the user wants in a partner)
 * Matches db.ts PartnerVirtue interface
 */
export const PartnerVirtueSchema = z.object({
  name: z.string().min(1, 'Virtue name is required'),
  description: z.string().min(1, 'Virtue description is required'),
  evidence: z.string().default(''),
  anti_virtue: z.string().default(''),
});

export type PartnerVirtue = z.infer<typeof PartnerVirtueSchema>;

/**
 * Schema for the AI response when extracting partner virtues
 */
export const PartnerVirtuesResultSchema = z.object({
  partner_virtues: z.array(PartnerVirtueSchema).default([]),
});

export type PartnerVirtuesResult = z.infer<typeof PartnerVirtuesResultSchema>;

/**
 * Schema for the old virtue scoring (name-based)
 * Matches db.ts VirtueScore interface
 */
export const OldVirtueScoreSchema = z.object({
  virtue: z.string(),
  score: z.number(),
  evidence: z.string().default(''),
});

export type OldVirtueScore = z.infer<typeof OldVirtueScoreSchema>;

/**
 * Schema for the AI response when scoring a match against partner virtues
 * (Old 5-virtue scoring system)
 */
export const VirtueScoreResultSchema = z.object({
  virtue_scores: z.array(OldVirtueScoreSchema).default([]),
});

export type VirtueScoreResult = z.infer<typeof VirtueScoreResultSchema>;

/**
 * Schema for realm summary text
 */
export const RealmSummarySchema = z.object({
  biological: z.string().default(''),
  emotional: z.string().default(''),
  cerebral: z.string().default(''),
});

export type RealmSummary = z.infer<typeof RealmSummarySchema>;

/**
 * Schema for user's 11 Virtues profile from AI extraction
 */
export const UserVirtues11ResponseSchema = z.object({
  scores: z.array(VirtueScoreSchema).min(1, 'At least one virtue score is required'),
  realm_summary: RealmSummarySchema,
});

export type UserVirtues11Response = z.infer<typeof UserVirtues11ResponseSchema>;
