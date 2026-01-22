// src/lib/utils/profileHelpers.ts
// Shared utilities for profile data transformation and extraction

import type {
  Profile,
  AnalysisData,
  ProfileBasics,
  PhotoAnalysis,
  PromptAnalysis,
  PsychologicalProfile,
  SubtextAnalysis,
  RecommendedOpener,
} from '../db';

/**
 * Extracted fields from profile analysis for easy consumption
 */
export interface ExtractedAnalysisFields {
  basics: ProfileBasics;
  photos: PhotoAnalysis[];
  prompts: PromptAnalysis[];
  psych: PsychologicalProfile;
  subtext: SubtextAnalysis;
  openers: RecommendedOpener[];
  overall: {
    summary?: string;
    green_flags?: string[];
    red_flags?: string[];
  };
}

/**
 * Parse and normalize profile analysis data.
 * Handles the "raw" error case where JSON wasn't parsed properly.
 */
export function parseProfileAnalysis(analysis: AnalysisData): AnalysisData {
  if (!analysis) return {};

  // Handle the "raw" error case - try to clean and parse
  if ('raw' in analysis && typeof analysis.raw === 'string') {
    try {
      const clean = analysis.raw.replace(/```json\n?|```/g, '').trim();
      return JSON.parse(clean);
    } catch {
      // If parsing still fails, return the raw object
      return analysis;
    }
  }

  return analysis;
}

/**
 * Extract all analysis fields with safe fallbacks.
 * Centralizes the extraction logic from ProfileDetail.tsx.
 */
export function extractAnalysisFields(analysis: AnalysisData): ExtractedAnalysisFields {
  const parsed = parseProfileAnalysis(analysis);

  // Type guard to check if parsed has the new format fields
  const hasBasics = 'basics' in parsed;
  const hasPhotos = 'photos' in parsed;
  const hasPrompts = 'prompts' in parsed;
  const hasPsych = 'psychological_profile' in parsed;
  const hasOpeners = 'recommended_openers' in parsed;
  const hasOverall = 'overall_analysis' in parsed;

  const basics = hasBasics ? (parsed.basics as ProfileBasics) || {} : {};
  const photos = hasPhotos ? (parsed.photos as PhotoAnalysis[]) || [] : [];
  const prompts = hasPrompts ? (parsed.prompts as PromptAnalysis[]) || [] : [];
  const psych = hasPsych ? (parsed.psychological_profile as PsychologicalProfile) || {} : {};
  const openers = hasOpeners ? (parsed.recommended_openers as RecommendedOpener[]) || [] : [];
  const overall = hasOverall
    ? (parsed.overall_analysis as { summary?: string; green_flags?: string[]; red_flags?: string[] }) || {}
    : {};

  return {
    basics,
    photos,
    prompts,
    psych,
    subtext: psych.subtext_analysis || {},
    openers,
    overall,
  };
}

/**
 * Get match's zodiac sign from profile analysis
 */
export function getMatchZodiacSign(profile: Profile): string | undefined {
  const analysis = parseProfileAnalysis(profile.analysis);
  if ('basics' in analysis && analysis.basics) {
    return (analysis.basics as ProfileBasics).zodiac_sign;
  }
  return undefined;
}

/**
 * Get match's location from profile analysis
 */
export function getMatchLocation(profile: Profile): string | undefined {
  const analysis = parseProfileAnalysis(profile.analysis);
  if ('basics' in analysis && analysis.basics) {
    return (analysis.basics as ProfileBasics).location;
  }
  return undefined;
}

/**
 * Get match's interests from photo vibes
 */
export function getMatchInterests(profile: Profile): string[] {
  const analysis = parseProfileAnalysis(profile.analysis);
  if ('photos' in analysis && Array.isArray(analysis.photos)) {
    return (analysis.photos as PhotoAnalysis[])
      .map((p) => p.vibe)
      .filter((v): v is string => !!v);
  }
  return [];
}

/**
 * Get profile context for opener regeneration
 */
export function getProfileContextForOpeners(profile: Profile): {
  name: string;
  archetype_summary: string;
  vulnerability_indicators: string;
} {
  const { basics, psych } = extractAnalysisFields(profile.analysis);

  return {
    name: basics.name || profile.name,
    archetype_summary: psych.archetype_summary || '',
    vulnerability_indicators: psych.subtext_analysis?.vulnerability_indicators || '',
  };
}
