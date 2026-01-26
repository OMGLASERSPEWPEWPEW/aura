// src/lib/schemas/profile.schemas.ts
// Zod schemas for profile analysis AI responses

import { z } from 'zod';
import { nullableString, nullableNumber, stringArray, agendaSchema } from './common.schemas';

/**
 * Schema for profile basics
 */
export const ProfileBasicsSchema = z.object({
  name: nullableString,
  age: nullableNumber,
  location: nullableString,
  job: nullableString,
  app: nullableString,
});

export type ProfileBasics = z.infer<typeof ProfileBasicsSchema>;

/**
 * Schema for photo analysis
 */
export const PhotoAnalysisSchema = z.object({
  description: z.string().default(''),
  vibe: z.string().default(''),
  subtext: z.string().default(''),
});

export type PhotoAnalysis = z.infer<typeof PhotoAnalysisSchema>;

/**
 * Schema for suggested opener
 */
export const SuggestedOpenerSchema = z.object({
  message: z.string(),
  tactic: z.string(),
  why_it_works: z.string(),
});

export type SuggestedOpener = z.infer<typeof SuggestedOpenerSchema>;

/**
 * Schema for prompt analysis
 */
export const PromptAnalysisSchema = z.object({
  question: z.string().default(''),
  answer: z.string().default(''),
  analysis: z.string().default(''),
  suggested_opener: SuggestedOpenerSchema.optional(),
});

export type PromptAnalysis = z.infer<typeof PromptAnalysisSchema>;

/**
 * Schema for subtext analysis
 */
export const SubtextAnalysisSchema = z.object({
  sexual_signaling: nullableString,
  power_dynamics: nullableString,
  vulnerability_indicators: nullableString,
  disconnect: nullableString,
});

export type SubtextAnalysis = z.infer<typeof SubtextAnalysisSchema>;

/**
 * Schema for psychological profile
 */
export const PsychologicalProfileSchema = z.object({
  archetype_summary: nullableString,
  agendas: z.array(agendaSchema).default([]),
  presentation_tactics: stringArray,
  predicted_tactics: stringArray,
  subtext_analysis: SubtextAnalysisSchema.optional(),
});

export type PsychologicalProfile = z.infer<typeof PsychologicalProfileSchema>;

/**
 * Schema for the full profile analysis response from AI
 */
export const ProfileAnalysisSchema = z.object({
  basics: ProfileBasicsSchema.optional(),
  photos: z.array(PhotoAnalysisSchema).default([]),
  prompts: z.array(PromptAnalysisSchema).default([]),
  psychological_profile: PsychologicalProfileSchema.optional(),
  red_flags: stringArray,
  green_flags: stringArray,
  summary: nullableString,
});

export type ProfileAnalysisResult = z.infer<typeof ProfileAnalysisSchema>;

/**
 * Schema for date idea response
 */
export const DateIdeaSchema = z.object({
  title: z.string(),
  description: z.string(),
  why_it_works: z.string(),
  vibe: z.string().optional(),
  budget: z.string().optional(),
});

export type DateIdea = z.infer<typeof DateIdeaSchema>;

/**
 * Schema for date ideas response from AI
 */
export const DateIdeasResponseSchema = z.object({
  date_ideas: z.array(DateIdeaSchema).default([]),
});

export type DateIdeasResponse = z.infer<typeof DateIdeasResponseSchema>;

/**
 * Schema for opener response
 */
export const OpenerResponseSchema = z.object({
  message: z.string(),
  tactic: z.string(),
  why_it_works: z.string(),
  tone: z.string().optional(),
});

export type OpenerResponse = z.infer<typeof OpenerResponseSchema>;

/**
 * Schema for multiple openers response from AI
 */
export const OpenersResponseSchema = z.object({
  openers: z.array(OpenerResponseSchema).default([]),
});

export type OpenersResponse = z.infer<typeof OpenersResponseSchema>;
