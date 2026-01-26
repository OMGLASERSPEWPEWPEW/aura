// src/lib/schemas/index.ts
// Re-exports all Zod schemas for AI response validation

// Common primitives
export {
  nullableString,
  nullableNumber,
  stringArray,
  scoreNumber,
  prioritySchema,
  agendaSchema,
  type Agenda,
} from './common.schemas';

// Streaming analysis schemas
export {
  ChunkBasicsResultSchema,
  ChunkImpressionsResultSchema,
  ChunkObservationsResultSchema,
  ChunkFlagsResultSchema,
  PhotoAnalysisStreamingSchema,
  PromptAnalysisStreamingSchema,
  SuggestedOpenerSchema as StreamingSuggestedOpenerSchema,
  type ChunkBasicsResult,
  type ChunkImpressionsResult,
  type ChunkObservationsResult,
  type ChunkFlagsResult,
  type PhotoAnalysisStreaming,
  type PromptAnalysisStreaming,
} from './streaming.schemas';

// Virtues system schemas
export {
  virtueIdSchema,
  VirtueScoreSchema,
  MatchVirtues11ResponseSchema,
  PartnerVirtueSchema,
  PartnerVirtuesResultSchema,
  OldVirtueScoreSchema,
  VirtueScoreResultSchema,
  RealmSummarySchema,
  UserVirtues11ResponseSchema,
  type VirtueId,
  type VirtueScore,
  type MatchVirtues11Response,
  type PartnerVirtue,
  type PartnerVirtuesResult,
  type OldVirtueScore,
  type VirtueScoreResult,
  type RealmSummary,
  type UserVirtues11Response,
} from './virtues.schemas';

// Profile analysis schemas
export {
  ProfileBasicsSchema,
  PhotoAnalysisSchema,
  PromptAnalysisSchema,
  SubtextAnalysisSchema,
  PsychologicalProfileSchema,
  ProfileAnalysisSchema,
  DateIdeaSchema,
  DateIdeasResponseSchema,
  OpenerResponseSchema,
  OpenersResponseSchema,
  SuggestedOpenerSchema,
  type ProfileBasics,
  type PhotoAnalysis,
  type PromptAnalysis,
  type SubtextAnalysis,
  type PsychologicalProfile,
  type ProfileAnalysisResult,
  type DateIdea,
  type DateIdeasResponse,
  type OpenerResponse,
  type OpenersResponse,
  type SuggestedOpener,
} from './profile.schemas';
