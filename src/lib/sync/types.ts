// src/lib/sync/types.ts
// Type definitions for Supabase sync

// =============================================
// SUPABASE TABLE TYPES
// =============================================

export interface ServerUserProfile {
  id: string; // UUID
  user_id: string;
  dating_goals: DatingGoalsJSON | null;
  data_exports: DataExportJSON[];
  text_inputs: TextInputJSON[];
  video_analysis: VideoAnalysisMetadataJSON | null; // Metadata only, frames in Storage
  video_frame_paths: string[] | null; // Storage paths for video frames
  manual_entry: ManualEntryJSON;
  synthesis: SynthesisJSON | null;
  insight_feedback: InsightFeedbackJSON[];
  settings: SettingsJSON;
  created_at: string;
  updated_at: string;
}

export interface ServerMatchProfile {
  id: string; // UUID
  user_id: string;
  name: string;
  age: number | null;
  app_name: string | null;
  analysis: unknown; // JSONB - flexible structure
  thumbnail_path: string | null;
  analysis_phase: string | null;
  compatibility: unknown | null;
  zodiac_compatibility: unknown | null;
  date_suggestions: unknown | null;
  virtue_scores: unknown | null;
  aspect_scores: unknown | null;
  created_at: string;
  updated_at: string;
}

export interface ServerCoachingSession {
  id: string; // UUID
  user_id: string;
  match_profile_id: string;
  conversation_image_paths: string[];
  match_analysis: MatchAnalysisJSON;
  suggested_responses: SuggestedResponseJSON[];
  user_actual_response: string | null;
  response_score: number | null;
  score_explanation: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServerMatchChat {
  id: string; // UUID
  user_id: string;
  match_profile_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// =============================================
// JSON SUB-TYPES (for JSONB columns)
// =============================================

interface DatingGoalsJSON {
  type: 'casual' | 'short-term' | 'long-term' | 'marriage' | 'exploring';
  description?: string;
}

interface DataExportJSON {
  source: string;
  rawStats: {
    matches: number;
    conversations: number;
    initiatorRatio: number;
    doubleTextRatio: number;
    avgMessageLength: number;
  };
  uploadedAt: string; // ISO date string
}

interface TextInputJSON {
  content: string;
  label: string;
  addedAt: string; // ISO date string
}

// Video analysis metadata only - frames stored separately in Storage via video_frame_paths
interface VideoAnalysisMetadataJSON {
  thumbnailIndex?: number;
  extractedAt?: string;
  analyzedAt?: string;
}

interface ManualEntryJSON {
  name?: string;
  age?: number;
  occupation?: string;
  location?: string;
  interests?: string[];
  attachmentStyle?: string;
  relationshipHistory?: string;
  zodiac_sign?: string;
  relationshipStyle?: string[];
}

interface SynthesisJSON {
  meta: {
    lastUpdated: string;
    inputsUsed: string[];
  };
  basics: {
    name?: string;
    age?: number;
    occupation?: string;
    location?: string;
  };
  photos: Array<{
    description: string;
    vibe: string;
    subtext: string;
    attractiveness_notes?: string;
  }>;
  psychological_profile: {
    agendas: Array<{
      type: string;
      evidence: string;
      priority: 'primary' | 'secondary';
    }>;
    presentation_tactics: string[];
    predicted_tactics: string[];
    subtext_analysis: {
      sexual_signaling: string;
      power_dynamics: string;
      vulnerability_indicators: string;
      disconnect: string;
    };
    archetype_summary: string;
  };
  dating_strategy: {
    ideal_partner_profile: string;
    what_to_look_for: string[];
    what_to_avoid: string[];
    bio_suggestions: string[];
    opener_style_recommendations: string[];
  };
  behavioral_insights: {
    communication_style: string;
    attachment_patterns: string;
    attachment_confidence?: number;
    growth_areas: string[];
    strengths: string[];
  };
  partner_virtues?: unknown[];
  neurodivergence?: unknown;
  aspect_profile?: unknown;
}

interface InsightFeedbackJSON {
  insightKey: string;
  rating: 'spot_on' | 'mostly' | 'off';
  timestamp: string;
}

interface SettingsJSON {
  autoCompatibility?: boolean;
}

interface MatchAnalysisJSON {
  detected_agenda: string;
  detected_tactics: string[];
  subtext: string;
}

interface SuggestedResponseJSON {
  message: string;
  tactic: string;
  why_it_works: string;
  growth_insight: string;
}

// =============================================
// SYNC STATE TYPES
// =============================================

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

export interface SyncState {
  status: SyncStatus;
  lastSyncAt: Date | null;
  error: string | null;
  pendingChanges: number;
}

export interface SyncResult {
  success: boolean;
  error?: string;
  syncedAt?: Date;
}

// =============================================
// ID MAPPING TYPES
// =============================================

// Maps local Dexie IDs to Supabase UUIDs
export interface IdMap {
  profiles: Map<number, string>; // localId -> serverId
  coachingSessions: Map<number, string>;
  matchChats: Map<number, string>;
}

// =============================================
// IMAGE SYNC TYPES
// =============================================

export interface ImageUploadResult {
  path: string; // Storage path
  url: string;  // Public URL (if bucket is public) or signed URL
}

export interface ImageSyncOptions {
  maxSizeBytes?: number; // Default 1MB
  quality?: number; // 0-1, default 0.8
}
