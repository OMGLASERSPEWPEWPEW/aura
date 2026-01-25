// src/lib/streaming/types.ts
// Types for streaming profile analysis

// Re-export frame quality types for convenience
export type { FrameQualityScore } from '../frameQuality';

export type AnalysisPhase = 'quick' | 'deep' | 'complete';

export interface PhotoAnalysisStreaming {
  description: string;
  vibe: string;
  subtext: string;
}

export interface PromptAnalysisStreaming {
  question: string;
  answer: string;
  analysis: string;
  suggested_opener?: {
    message: string;
    tactic: string;
    why_it_works: string;
  };
}

export interface AccumulatedProfile {
  identity: {
    name: string | null;
    age: number | null;
    location: string | null;
    job: string | null;
    app: string | null;
  };
  photos: {
    thumbnailIndex: number;
    analyses: PhotoAnalysisStreaming[];
    vibesSummary: string[];
  };
  prompts: {
    found: PromptAnalysisStreaming[];
  };
  psychological: {
    emergingArchetype: string | null;
    confidenceLevel: number; // 0-100, increases with each chunk
    signals: string[];
    agendas: Array<{
      type: string;
      evidence: string;
      priority: 'primary' | 'secondary';
    }>;
    presentationTactics: string[];
    predictedTactics: string[];
  };
  earlyWarnings: {
    redFlags: string[];
    greenFlags: string[];
  };
  meta: {
    chunksProcessed: number;
    totalChunks: number;
    phase: AnalysisPhase;
    startedAt: Date;
    lastUpdatedAt: Date;
  };
}

// Chunk-specific result types
export interface ChunkBasicsResult {
  name: string | null;
  age: number | null;
  location: string | null;
  job: string | null;
  app: string | null;
  thumbnailIndex: number;
}

export interface ChunkImpressionsResult {
  vibes: string[];
  firstImpressions: string[];
  emergingArchetype: string | null;
  archetypeConfidence: number;
}

export interface ChunkObservationsResult {
  photos: PhotoAnalysisStreaming[];
  prompts: PromptAnalysisStreaming[];
  signals: string[];
}

export interface ChunkFlagsResult {
  redFlags: string[];
  greenFlags: string[];
  agendas: Array<{
    type: string;
    evidence: string;
    priority: 'primary' | 'secondary';
  }>;
  presentationTactics: string[];
  predictedTactics: string[];
  archetypeRefinement: string;
  finalConfidence: number;
}

// Streaming analysis state
export type StreamingPhase =
  | 'idle'
  | 'extracting'
  | 'chunk-1'
  | 'chunk-2'
  | 'chunk-3'
  | 'chunk-4'
  | 'consolidating'
  | 'complete'
  | 'aborted'
  | 'error';

export interface StreamingAnalysisState {
  phase: StreamingPhase;
  profile: AccumulatedProfile;
  currentChunk: number;
  totalChunks: number;
  error: string | null;
  canAbort: boolean;
  hasMinimumViableProfile: boolean; // True after chunk 1 (has name/age/thumbnail)
  savedProfileId: number | null;
}

// Helper to create initial accumulated profile
export function createInitialAccumulatedProfile(): AccumulatedProfile {
  return {
    identity: {
      name: null,
      age: null,
      location: null,
      job: null,
      app: null,
    },
    photos: {
      thumbnailIndex: 0,
      analyses: [],
      vibesSummary: [],
    },
    prompts: {
      found: [],
    },
    psychological: {
      emergingArchetype: null,
      confidenceLevel: 0,
      signals: [],
      agendas: [],
      presentationTactics: [],
      predictedTactics: [],
    },
    earlyWarnings: {
      redFlags: [],
      greenFlags: [],
    },
    meta: {
      chunksProcessed: 0,
      totalChunks: 4,
      phase: 'quick',
      startedAt: new Date(),
      lastUpdatedAt: new Date(),
    },
  };
}

// Merge strategies for accumulated profile
export function mergeChunkBasics(
  profile: AccumulatedProfile,
  basics: ChunkBasicsResult
): AccumulatedProfile {
  return {
    ...profile,
    identity: {
      // First-value-wins for identity fields
      name: profile.identity.name ?? basics.name,
      age: profile.identity.age ?? basics.age,
      location: profile.identity.location ?? basics.location,
      job: profile.identity.job ?? basics.job,
      app: profile.identity.app ?? basics.app,
    },
    photos: {
      ...profile.photos,
      thumbnailIndex: profile.photos.thumbnailIndex || basics.thumbnailIndex,
    },
    meta: {
      ...profile.meta,
      chunksProcessed: profile.meta.chunksProcessed + 1,
      lastUpdatedAt: new Date(),
    },
  };
}

export function mergeChunkImpressions(
  profile: AccumulatedProfile,
  impressions: ChunkImpressionsResult
): AccumulatedProfile {
  return {
    ...profile,
    photos: {
      ...profile.photos,
      // Accumulate vibes (concat arrays)
      vibesSummary: [...profile.photos.vibesSummary, ...impressions.vibes],
    },
    psychological: {
      ...profile.psychological,
      // Latest-value-wins for archetype (refines with more data)
      emergingArchetype: impressions.emergingArchetype ?? profile.psychological.emergingArchetype,
      confidenceLevel: Math.max(profile.psychological.confidenceLevel, impressions.archetypeConfidence),
      signals: [...profile.psychological.signals, ...impressions.firstImpressions],
    },
    meta: {
      ...profile.meta,
      chunksProcessed: profile.meta.chunksProcessed + 1,
      lastUpdatedAt: new Date(),
    },
  };
}

export function mergeChunkObservations(
  profile: AccumulatedProfile,
  observations: ChunkObservationsResult
): AccumulatedProfile {
  return {
    ...profile,
    photos: {
      ...profile.photos,
      // Accumulate photo analyses
      analyses: [...profile.photos.analyses, ...observations.photos],
    },
    prompts: {
      // Accumulate prompts
      found: [...profile.prompts.found, ...observations.prompts],
    },
    psychological: {
      ...profile.psychological,
      // Accumulate signals
      signals: [...profile.psychological.signals, ...observations.signals],
    },
    meta: {
      ...profile.meta,
      chunksProcessed: profile.meta.chunksProcessed + 1,
      lastUpdatedAt: new Date(),
    },
  };
}

export function mergeChunkFlags(
  profile: AccumulatedProfile,
  flags: ChunkFlagsResult
): AccumulatedProfile {
  // For flags, use highest-risk-wins strategy - once detected, persist
  const existingRedFlags = new Set(profile.earlyWarnings.redFlags);
  const existingGreenFlags = new Set(profile.earlyWarnings.greenFlags);

  // Add new flags without duplicates
  flags.redFlags.forEach((f) => existingRedFlags.add(f));
  flags.greenFlags.forEach((f) => existingGreenFlags.add(f));

  return {
    ...profile,
    psychological: {
      ...profile.psychological,
      // Update with final values
      emergingArchetype: flags.archetypeRefinement || profile.psychological.emergingArchetype,
      confidenceLevel: Math.max(profile.psychological.confidenceLevel, flags.finalConfidence),
      agendas: flags.agendas.length > 0 ? flags.agendas : profile.psychological.agendas,
      presentationTactics: flags.presentationTactics.length > 0
        ? flags.presentationTactics
        : profile.psychological.presentationTactics,
      predictedTactics: flags.predictedTactics.length > 0
        ? flags.predictedTactics
        : profile.psychological.predictedTactics,
    },
    earlyWarnings: {
      redFlags: Array.from(existingRedFlags),
      greenFlags: Array.from(existingGreenFlags),
    },
    meta: {
      ...profile.meta,
      chunksProcessed: profile.meta.chunksProcessed + 1,
      lastUpdatedAt: new Date(),
    },
  };
}
