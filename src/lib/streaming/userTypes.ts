// src/lib/streaming/userTypes.ts
// Types for streaming user profile analysis

import type { StreamingPhase } from './types';

// User-specific accumulated profile (self-reflection focused)
export interface AccumulatedUserProfile {
  identity: {
    name: string | null;
    age: number | null;
    location: string | null;
    occupation: string | null;
  };
  photos: {
    thumbnailIndex: number;
    analyses: Array<{
      description: string;
      vibe: string;
      subtext: string;
      attractiveness_notes?: string;
    }>;
    vibesSummary: string[];
  };
  psychological: {
    archetype: string | null;
    confidenceLevel: number; // 0-100
    agendas: Array<{
      type: string;
      evidence: string;
      priority: 'primary' | 'secondary';
    }>;
    presentationTactics: string[];
    predictedTactics: string[];
    subtextAnalysis: {
      sexual_signaling: string;
      power_dynamics: string;
      vulnerability_indicators: string;
      disconnect: string;
    };
  };
  behavioral: {
    communicationStyle: string | null;
    attachmentPatterns: string | null;
    attachmentConfidence: number; // 0-100
    strengths: string[];
    growthAreas: string[];
  };
  dating: {
    idealPartnerProfile: string | null;
    whatToLookFor: string[];
    whatToAvoid: string[];
    bioSuggestions: string[];
    openerStyleRecommendations: string[];
  };
  meta: {
    chunksProcessed: number;
    totalChunks: number;
    phase: 'quick' | 'deep' | 'complete';
    startedAt: Date;
    lastUpdatedAt: Date;
  };
}

// User chunk-specific result types
export interface UserChunkBasicsResult {
  name: string | null;
  age: number | null;
  location: string | null;
  occupation: string | null;
  thumbnailIndex: number;
  initialVibes: string[];
}

export interface UserChunkImpressionsResult {
  vibes: string[];
  archetype: string | null;
  archetypeConfidence: number;
  initialStrengths: string[];
  communicationHints: string[];
}

export interface UserChunkObservationsResult {
  photos: Array<{
    description: string;
    vibe: string;
    subtext: string;
    attractiveness_notes?: string;
  }>;
  signals: string[];
  presentationTactics: string[];
  subtextAnalysis: {
    sexual_signaling: string;
    power_dynamics: string;
    vulnerability_indicators: string;
    disconnect: string;
  };
}

export interface UserChunkSynthesisResult {
  communicationStyle: string;
  attachmentPatterns: string;
  attachmentConfidence: number; // 0-100 (only show if >40%)
  strengths: string[];
  growthAreas: string[];
  idealPartnerProfile: string;
  whatToLookFor: string[];
  whatToAvoid: string[];
  bioSuggestions: string[];
  openerStyleRecommendations: string[];
  agendas: Array<{
    type: string;
    evidence: string;
    priority: 'primary' | 'secondary';
  }>;
  predictedTactics: string[];
  archetypeRefinement: string;
  finalConfidence: number;
}

// User streaming analysis state
export interface UserStreamingAnalysisState {
  phase: StreamingPhase;
  profile: AccumulatedUserProfile;
  frames: string[][];
  allFrames: string[];
  currentChunk: number;
  totalChunks: number;
  error: string | null;
  chunkLatencies: number[];
  thumbnailFrame: string | null;
}

// Helper to create initial accumulated user profile
export function createInitialAccumulatedUserProfile(): AccumulatedUserProfile {
  return {
    identity: {
      name: null,
      age: null,
      location: null,
      occupation: null,
    },
    photos: {
      thumbnailIndex: 0,
      analyses: [],
      vibesSummary: [],
    },
    psychological: {
      archetype: null,
      confidenceLevel: 0,
      agendas: [],
      presentationTactics: [],
      predictedTactics: [],
      subtextAnalysis: {
        sexual_signaling: '',
        power_dynamics: '',
        vulnerability_indicators: '',
        disconnect: '',
      },
    },
    behavioral: {
      communicationStyle: null,
      attachmentPatterns: null,
      attachmentConfidence: 0,
      strengths: [],
      growthAreas: [],
    },
    dating: {
      idealPartnerProfile: null,
      whatToLookFor: [],
      whatToAvoid: [],
      bioSuggestions: [],
      openerStyleRecommendations: [],
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

// Merge strategies for accumulated user profile
export function mergeUserChunkBasics(
  profile: AccumulatedUserProfile,
  basics: UserChunkBasicsResult
): AccumulatedUserProfile {
  return {
    ...profile,
    identity: {
      name: profile.identity.name ?? basics.name,
      age: profile.identity.age ?? basics.age,
      location: profile.identity.location ?? basics.location,
      occupation: profile.identity.occupation ?? basics.occupation,
    },
    photos: {
      ...profile.photos,
      thumbnailIndex: profile.photos.thumbnailIndex || basics.thumbnailIndex,
      vibesSummary: [...profile.photos.vibesSummary, ...basics.initialVibes],
    },
    meta: {
      ...profile.meta,
      chunksProcessed: profile.meta.chunksProcessed + 1,
      lastUpdatedAt: new Date(),
    },
  };
}

export function mergeUserChunkImpressions(
  profile: AccumulatedUserProfile,
  impressions: UserChunkImpressionsResult
): AccumulatedUserProfile {
  return {
    ...profile,
    photos: {
      ...profile.photos,
      vibesSummary: [...profile.photos.vibesSummary, ...impressions.vibes],
    },
    psychological: {
      ...profile.psychological,
      archetype: impressions.archetype ?? profile.psychological.archetype,
      confidenceLevel: Math.max(profile.psychological.confidenceLevel, impressions.archetypeConfidence),
    },
    behavioral: {
      ...profile.behavioral,
      strengths: [...profile.behavioral.strengths, ...impressions.initialStrengths],
      communicationStyle: impressions.communicationHints.join('. ') || profile.behavioral.communicationStyle,
    },
    meta: {
      ...profile.meta,
      chunksProcessed: profile.meta.chunksProcessed + 1,
      lastUpdatedAt: new Date(),
    },
  };
}

export function mergeUserChunkObservations(
  profile: AccumulatedUserProfile,
  observations: UserChunkObservationsResult
): AccumulatedUserProfile {
  return {
    ...profile,
    photos: {
      ...profile.photos,
      analyses: [...profile.photos.analyses, ...observations.photos],
    },
    psychological: {
      ...profile.psychological,
      presentationTactics: [...profile.psychological.presentationTactics, ...observations.presentationTactics],
      subtextAnalysis: {
        sexual_signaling: observations.subtextAnalysis.sexual_signaling || profile.psychological.subtextAnalysis.sexual_signaling,
        power_dynamics: observations.subtextAnalysis.power_dynamics || profile.psychological.subtextAnalysis.power_dynamics,
        vulnerability_indicators: observations.subtextAnalysis.vulnerability_indicators || profile.psychological.subtextAnalysis.vulnerability_indicators,
        disconnect: observations.subtextAnalysis.disconnect || profile.psychological.subtextAnalysis.disconnect,
      },
    },
    meta: {
      ...profile.meta,
      chunksProcessed: profile.meta.chunksProcessed + 1,
      lastUpdatedAt: new Date(),
    },
  };
}

export function mergeUserChunkSynthesis(
  profile: AccumulatedUserProfile,
  synthesis: UserChunkSynthesisResult
): AccumulatedUserProfile {
  // Deduplicate arrays
  const existingStrengths = new Set(profile.behavioral.strengths);
  const existingGrowth = new Set(profile.behavioral.growthAreas);

  synthesis.strengths.forEach(s => existingStrengths.add(s));
  synthesis.growthAreas.forEach(g => existingGrowth.add(g));

  return {
    ...profile,
    psychological: {
      ...profile.psychological,
      archetype: synthesis.archetypeRefinement || profile.psychological.archetype,
      confidenceLevel: Math.max(profile.psychological.confidenceLevel, synthesis.finalConfidence),
      agendas: synthesis.agendas.length > 0 ? synthesis.agendas : profile.psychological.agendas,
      predictedTactics: synthesis.predictedTactics.length > 0
        ? synthesis.predictedTactics
        : profile.psychological.predictedTactics,
    },
    behavioral: {
      ...profile.behavioral,
      communicationStyle: synthesis.communicationStyle || profile.behavioral.communicationStyle,
      attachmentPatterns: synthesis.attachmentPatterns || profile.behavioral.attachmentPatterns,
      attachmentConfidence: synthesis.attachmentConfidence,
      strengths: Array.from(existingStrengths),
      growthAreas: Array.from(existingGrowth),
    },
    dating: {
      idealPartnerProfile: synthesis.idealPartnerProfile || profile.dating.idealPartnerProfile,
      whatToLookFor: synthesis.whatToLookFor.length > 0 ? synthesis.whatToLookFor : profile.dating.whatToLookFor,
      whatToAvoid: synthesis.whatToAvoid.length > 0 ? synthesis.whatToAvoid : profile.dating.whatToAvoid,
      bioSuggestions: synthesis.bioSuggestions.length > 0 ? synthesis.bioSuggestions : profile.dating.bioSuggestions,
      openerStyleRecommendations: synthesis.openerStyleRecommendations.length > 0
        ? synthesis.openerStyleRecommendations
        : profile.dating.openerStyleRecommendations,
    },
    meta: {
      ...profile.meta,
      chunksProcessed: profile.meta.chunksProcessed + 1,
      lastUpdatedAt: new Date(),
    },
  };
}
