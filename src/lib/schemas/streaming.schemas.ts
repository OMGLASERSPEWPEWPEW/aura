// src/lib/schemas/streaming.schemas.ts
// Zod schemas for streaming analysis chunk results

import { z } from 'zod';
import { nullableString, nullableNumber, stringArray, agendaSchema } from './common.schemas';

/**
 * Schema for Chunk 1 result - basic profile info
 */
export const ChunkBasicsResultSchema = z.object({
  name: nullableString,
  age: nullableNumber,
  location: nullableString,
  job: nullableString,
  app: nullableString,
  thumbnailIndex: z.number().int().min(0).default(0),
});

export type ChunkBasicsResult = z.infer<typeof ChunkBasicsResultSchema>;

/**
 * Schema for Chunk 2 result - first impressions and vibes
 */
export const ChunkImpressionsResultSchema = z.object({
  vibes: stringArray,
  firstImpressions: stringArray,
  emergingArchetype: nullableString,
  archetypeConfidence: z.number().min(0).max(100).default(0),
});

export type ChunkImpressionsResult = z.infer<typeof ChunkImpressionsResultSchema>;

/**
 * Schema for photo analysis within observations
 */
export const PhotoAnalysisStreamingSchema = z.object({
  description: z.string().default(''),
  vibe: z.string().default(''),
  subtext: z.string().default(''),
});

export type PhotoAnalysisStreaming = z.infer<typeof PhotoAnalysisStreamingSchema>;

/**
 * Schema for suggested opener within prompts
 */
export const SuggestedOpenerSchema = z.object({
  message: z.string(),
  tactic: z.string(),
  why_it_works: z.string(),
});

/**
 * Schema for prompt analysis within observations
 */
export const PromptAnalysisStreamingSchema = z.object({
  question: z.string().default(''),
  answer: z.string().default(''),
  analysis: z.string().default(''),
  suggested_opener: SuggestedOpenerSchema.optional(),
});

export type PromptAnalysisStreaming = z.infer<typeof PromptAnalysisStreamingSchema>;

/**
 * Schema for Chunk 3 result - detailed observations
 */
export const ChunkObservationsResultSchema = z.object({
  photos: z.array(PhotoAnalysisStreamingSchema).default([]),
  prompts: z.array(PromptAnalysisStreamingSchema).default([]),
  signals: stringArray,
});

export type ChunkObservationsResult = z.infer<typeof ChunkObservationsResultSchema>;

/**
 * Schema for Chunk 4 result - flags and final analysis
 */
export const ChunkFlagsResultSchema = z.object({
  redFlags: stringArray,
  greenFlags: stringArray,
  agendas: z.array(agendaSchema).default([]),
  presentationTactics: stringArray,
  predictedTactics: stringArray,
  archetypeRefinement: z.string().default(''),
  finalConfidence: z.number().min(0).max(100).default(0),
});

export type ChunkFlagsResult = z.infer<typeof ChunkFlagsResultSchema>;
