// src/lib/db.ts
import Dexie, { type EntityTable } from 'dexie';
import type { UserAspectProfile, MatchAspectScores, UserVirtueProfile, MatchVirtueCompatibility } from './virtues/types';
import { migrateAspectProfileToVirtues, canMigrateAspectProfile, canMigrateAspectScores } from './virtues/migration';
import { base64ToBlob } from './utils/thumbnailUtils';

// --- Profile Analysis Types ---

interface ProfileBasics {
  name?: string;
  age?: number;
  location?: string;
  job?: string;
  school?: string;
  hometown?: string;
  zodiac_sign?: string;
}

interface PhotoAnalysis {
  description?: string;
  vibe?: string;
  subtext?: string;
  attractiveness_notes?: string;
}

interface PromptAnalysis {
  question: string;
  answer: string;
  analysis: string;
  suggested_opener?: {
    message: string;
    tactic: string;
    why_it_works: string;
  };
}

interface SubtextAnalysis {
  sexual_signaling?: string;
  power_dynamics?: string;
  vulnerability_indicators?: string;
  disconnect?: string;
}

interface Agenda {
  type: string;
  evidence: string;
  priority: 'primary' | 'secondary';
}

interface PsychologicalProfile {
  agendas?: Agenda[];
  presentation_tactics?: string[];
  predicted_tactics?: string[];
  subtext_analysis?: SubtextAnalysis;
  archetype_summary?: string;
}

// Transactional/Financial Motivation Indicators
interface TransactionalIndicators {
  likelihood: 'none' | 'low' | 'moderate' | 'high';
  confidence: number;  // 1-10
  signals: string[];   // What in the profile suggests this
  context: string;     // Nuanced explanation
  ethical_note: string; // Reminder that sugar relationships can be consensual
}

interface RelationshipStyleInference {
  likely_preference: string; // monogamous | enm | polyamorous | open | unclear
  confidence: number;  // 1-10
  signals: string[];   // Profile elements suggesting this
  note: string;        // Nuanced explanation
}

interface RecommendedOpener {
  type: 'like_comment' | 'match_opener';
  message: string;
  tactic: string;
  why_it_works: string;
}

// Legacy analysis format (for old data)
interface LegacyAnalysis {
  overall_analysis?: {
    summary?: string;
    green_flags?: string[];
    red_flags?: string[];
  };
}

// New structured analysis format
interface ProfileAnalysis {
  meta?: {
    app_name?: string;
    best_photo_index?: number;
  };
  basics?: ProfileBasics;
  photos?: PhotoAnalysis[];
  prompts?: PromptAnalysis[];
  psychological_profile?: PsychologicalProfile;
  recommended_openers?: RecommendedOpener[];
  compatibility?: ProfileCompatibility;
  transactional_indicators?: TransactionalIndicators;
  relationship_style_inference?: RelationshipStyleInference;
  // Legacy fallback fields
  overall_analysis?: {
    summary?: string;
    green_flags?: string[];
    red_flags?: string[];
  };
}

// Analysis can be new format, legacy format, or raw string (error case)
type AnalysisData = ProfileAnalysis | LegacyAnalysis | { raw: string };

interface ProfileCompatibility {
  score: number;           // 1-10
  summary: string;         // "Strong match for long-term"
  strengths: string[];     // Why this works for YOU
  concerns: string[];      // Red flags for YOUR psychology
  goal_alignment: string;  // How they match your dating goal
}

interface DateSuggestion {
  name: string;
  type: string;            // "coffee", "dinner", "activity"
  location: string;
  why_good_fit: string;
  weather_appropriate?: boolean;
  weather_note?: string;      // "Perfect for the sunny 72F forecast"
  event_tie_in?: string;      // "Coincides with Jazz in the Park"
}

interface DateSuggestions {
  ideas: DateSuggestion[];
  searched_at: Date;
  target_date?: Date;
  weather_forecast?: { temp_high: number; temp_low: number; condition: string };
  local_events?: string[];
}

interface ZodiacCompatibility {
  user_sign: string;
  match_sign: string;
  overall_score: number;  // 1-10
  summary: string;
  strengths: string[];
  challenges: string[];
  advice: string;
}

// --- Partner Virtues (Greek Philosophy / Eudaimonia-based) ---

interface PartnerVirtue {
  name: string;           // e.g., "Intellectual Curiosity"
  description: string;    // Why this matters for YOU
  evidence: string;       // What in your profile suggests this
  anti_virtue: string;    // What the opposite looks like (red flag)
}

interface VirtueScore {
  virtue: string;         // Name of the virtue
  score: number;          // 1-10
  evidence: string;       // What in their profile suggests this score
}

// --- Neurodivergence Insights ---

interface NeurodivergentTrait {
  condition: string;           // e.g., "ADHD", "Autism Spectrum", "Dyslexia"
  likelihood: 'low' | 'moderate' | 'notable' | 'significant';
  confidence: number;          // 1-10 how confident based on available data
  indicators: string[];        // What in their profile suggests this
  dating_implications: string; // How this might show up in dating/relationships
  strengths: string[];         // Positive aspects of this trait in relationships
}

interface NeurodivergenceAnalysis {
  summary: string;                    // Overall summary
  traits: NeurodivergentTrait[];      // Individual trait analyses
  communication_tips: string[];       // Tips for partners
  self_awareness_notes: string;       // Helpful self-awareness insights
  disclaimer: string;                 // Important disclaimer about this not being a diagnosis
}

// --- Coaching Session Types ---

interface CoachingResponse {
  message: string;
  tactic: string;
  why_it_works: string;
  growth_insight: string;  // Based on user's attachment style, etc.
}

interface MatchCoachingAnalysis {
  detected_agenda: string;
  detected_tactics: string[];
  subtext: string;
}

interface CoachingSession {
  id?: number;
  profileId: number;              // Link to match profile (local ID)
  timestamp: Date;
  conversationImages: string[];   // Base64 screenshots
  matchAnalysis: MatchCoachingAnalysis;
  suggestedResponses: CoachingResponse[];
  userActualResponse?: string;    // What user actually sent
  responseScore?: number;         // 1-10 AI rating
  scoreExplanation?: string;

  // Sync fields - links to Supabase
  serverId?: string; // UUID from Supabase coaching_sessions table
  serverProfileId?: string; // UUID of the match_profile in Supabase
  conversationImagePaths?: string[]; // Storage paths (replaces base64 after sync)
}

// --- Match Chat Messages (for Ask About Match feature) ---

interface MatchChatMessage {
  id?: number;
  profileId: number;              // Link to match profile (local ID)
  timestamp: Date;
  role: 'user' | 'assistant';
  content: string;

  // Sync fields - links to Supabase
  serverId?: string; // UUID from Supabase match_chats table
  serverProfileId?: string; // UUID of the match_profile in Supabase
}

// --- App Settings ---

interface AppSettings {
  autoCompatibility: boolean;  // Auto-run compatibility scoring when saving matches
  theme?: 'system' | 'light' | 'dark';  // User's theme preference
}

// Analysis phase for streaming analysis
type AnalysisPhaseType = 'quick' | 'deep' | 'complete';

interface Profile {
  id: number;
  name: string;
  age?: number;
  appName?: string; // New field for "Hinge", "Tinder", etc.
  timestamp: Date;
  analysis: AnalysisData;
  thumbnail: string | Blob; // Blob preferred for storage efficiency (~33% savings)

  // Streaming analysis phase tracking
  analysisPhase?: AnalysisPhaseType; // 'quick' = partial, 'deep' = running deep, 'complete' = full

  // Compatibility assessment (populated when user has synthesis)
  compatibility?: ProfileCompatibility;

  // Zodiac compatibility (populated when both signs available)
  zodiac_compatibility?: ZodiacCompatibility;

  // Date suggestions (populated on-demand)
  date_suggestions?: DateSuggestions;

  // DEPRECATED: Old 5 Partner Virtues scores (keep for backwards compatibility)
  virtue_scores?: VirtueScore[];

  // DEPRECATED: 23 Aspects scores (keep for backwards compatibility)
  aspect_scores?: MatchAspectScores;

  // NEW: 11 Virtues compatibility (primary system)
  virtues_11?: MatchVirtueCompatibility;

  // Essence Identity: AI-generated personality representation
  virtueSentence?: string;      // One-line personality summary from 11 Virtues
  essenceImage?: Blob;          // AI-generated abstract visualization
  essencePrompt?: string;       // Prompt used for generation (debugging/regeneration)

  // Mood Board: AI-generated lifestyle visualization
  moodboardImage?: Blob;        // AI-generated lifestyle scene via DALL-E 3
  moodboardPrompt?: string;     // Prompt used for generation (debugging/regeneration)

  // Sync fields - links to Supabase
  serverId?: string; // UUID from Supabase match_profiles table
  thumbnailPath?: string; // Storage path (replaces base64 thumbnail after sync)
}

// Type definitions for UserIdentity sub-structures
interface RawStats {
  matches: number;
  conversations: number;
  initiatorRatio: number; // 0 to 1
  doubleTextRatio: number; // 0 to 1
  avgMessageLength: number;
}

interface DatingGoals {
  type: 'casual' | 'short-term' | 'long-term' | 'marriage' | 'exploring';
  description?: string;
}

interface DataExport {
  source: string;
  rawStats: RawStats;
  uploadedAt: Date;
}

interface TextInput {
  content: string;
  label: string;
  addedAt: Date;
}

interface VideoAnalysis {
  frames: string[];
  thumbnailIndex?: number;  // Best frame for thumbnail
  extractedAt?: Date;       // When frames were extracted
  analyzedAt?: Date;        // Legacy field for backwards compatibility
}

interface PhotoEntry {
  base64: string;
  label?: string;
  addedAt: Date;
}

interface ManualEntry {
  name?: string;
  age?: number;
  occupation?: string;
  location?: string;
  interests?: string[];
  attachmentStyle?: string;
  relationshipHistory?: string;
  zodiac_sign?: string;  // "Aries" | "Taurus" | ... | "Pisces"
  relationshipStyle?: string[];  // Multi-select: ['monogamous', 'enm', 'polyamorous', 'open', 'exploring']
  livingSituation?: 'solo' | 'roommates' | 'caregiving';  // Living arrangement
}

interface UserSynthesis {
  meta: {
    lastUpdated: Date;
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
    attachment_confidence?: number; // 0-100, show only if > 40%
    growth_areas: string[];
    strengths: string[];
  };
  // DEPRECATED: Virtue-based partner profile (Greek philosophy / eudaimonia)
  partner_virtues?: PartnerVirtue[];  // 5 core virtues you seek
  // Neurodivergence insights
  neurodivergence?: NeurodivergenceAnalysis;
  // DEPRECATED: 23 Aspects profile (old system)
  aspect_profile?: UserAspectProfile;
  // NEW: 11 Virtues profile (primary system)
  virtue_profile?: UserVirtueProfile;
}

// Insight feedback for user validation of AI analysis
interface InsightFeedback {
  insightKey: string;       // e.g., "attachment_patterns", "strengths[0]"
  rating: 'spot_on' | 'mostly' | 'off';
  timestamp: Date;
}

// Extended UserIdentity interface for My Profile system
interface UserIdentity {
  id: number; // usually just 1, we only have one user

  // Auth fields (linked to Supabase)
  supabaseUserId?: string;
  email?: string;
  authProvider?: string;  // 'email' | 'google' | 'apple'
  linkedAt?: Date;

  // Sync fields - links to Supabase user_profiles table
  serverId?: string; // UUID from Supabase user_profiles table

  // Legacy fields (preserved for migration)
  source?: 'tinder' | 'hinge' | 'bumble';
  rawStats?: RawStats;

  // Legacy analysis (preserved for migration)
  analysis?: {
    psychoanalysis: {
      archetype: string;
      core_values: string[];
      emotional_patterns: string;
      strengths: string[];
      weaknesses: string[];
    };
    dating_strategy: {
      target_audience: string;
      what_to_look_for: string[];
      what_to_avoid: string[];
      bio_suggestions: string;
    };
  };

  // Legacy selfProfile (preserved for migration)
  selfProfile?: {
    meta: unknown;
    basics: unknown;
    photos: unknown[];
    prompts: unknown[];
    overall_analysis: unknown;
  };

  // NEW: My Profile system fields
  datingGoals?: DatingGoals;
  dataExports: DataExport[];
  textInputs: TextInput[];
  videoAnalysis?: VideoAnalysis;
  photos: PhotoEntry[];
  manualEntry: ManualEntry;
  synthesis?: UserSynthesis;

  // Insight feedback for user validation
  insightFeedback?: InsightFeedback[];

  // App settings
  settings?: AppSettings;

  lastUpdated: Date;
}

// Import inference types for the table
import type { InferenceRecord } from './inference/types';

const db = new Dexie('AuraDB') as Dexie & {
  profiles: EntityTable<Profile, 'id'>;
  userIdentity: EntityTable<UserIdentity, 'id'>;
  coachingSessions: EntityTable<CoachingSession, 'id'>;
  matchChats: EntityTable<MatchChatMessage, 'id'>;
  inferenceHistory: EntityTable<InferenceRecord, 'id'>;
};

// Schema definition with migration
db.version(2).stores({
  profiles: '++id, name, appName, timestamp',
  userIdentity: '++id, lastUpdated'
});

// Version 3: Add new fields for My Profile system
db.version(3).stores({
  profiles: '++id, name, appName, timestamp',
  userIdentity: '++id, lastUpdated'
}).upgrade(tx => {
  // Migrate existing userIdentity records to include new empty fields
  return tx.table('userIdentity').toCollection().modify((identity: Partial<UserIdentity>) => {
    // Initialize new arrays if they don't exist
    if (!identity.dataExports) identity.dataExports = [];
    if (!identity.textInputs) identity.textInputs = [];
    if (!identity.photos) identity.photos = [];
    if (!identity.manualEntry) identity.manualEntry = {};

    // Migrate legacy rawStats to dataExports if it exists
    if (identity.rawStats && identity.source && identity.dataExports && !identity.dataExports.length) {
      identity.dataExports.push({
        source: identity.source,
        rawStats: identity.rawStats,
        uploadedAt: identity.lastUpdated || new Date()
      });
    }
  });
});

// Version 4: Add coaching sessions table
db.version(4).stores({
  profiles: '++id, name, appName, timestamp',
  userIdentity: '++id, lastUpdated',
  coachingSessions: '++id, profileId, timestamp'
});

// Version 5: Add relationshipStyle to ManualEntry
db.version(5).stores({
  profiles: '++id, name, appName, timestamp',
  userIdentity: '++id, lastUpdated',
  coachingSessions: '++id, profileId, timestamp'
}).upgrade(tx => {
  // Migrate existing userIdentity records to include relationshipStyle in manualEntry
  return tx.table('userIdentity').toCollection().modify((identity: Partial<UserIdentity>) => {
    // Initialize relationshipStyle if manualEntry exists but doesn't have it
    if (identity.manualEntry && !identity.manualEntry.relationshipStyle) {
      identity.manualEntry.relationshipStyle = [];
    }
  });
});

// Version 6: Add matchChats table for Ask About Match persistence + settings field
db.version(6).stores({
  profiles: '++id, name, appName, timestamp',
  userIdentity: '++id, lastUpdated',
  coachingSessions: '++id, profileId, timestamp',
  matchChats: '++id, profileId, timestamp'
});

// Version 7: Add analysisPhase field for streaming analysis support
db.version(7).stores({
  profiles: '++id, name, appName, timestamp, analysisPhase',
  userIdentity: '++id, lastUpdated',
  coachingSessions: '++id, profileId, timestamp',
  matchChats: '++id, profileId, timestamp'
}).upgrade(tx => {
  // Migrate existing profiles to have 'complete' analysisPhase
  return tx.table('profiles').toCollection().modify((profile: Partial<Profile>) => {
    if (!profile.analysisPhase) {
      profile.analysisPhase = 'complete'; // Existing profiles are fully analyzed
    }
  });
});

// Version 8: Add insightFeedback field for user validation of AI analysis
db.version(8).stores({
  profiles: '++id, name, appName, timestamp, analysisPhase',
  userIdentity: '++id, lastUpdated',
  coachingSessions: '++id, profileId, timestamp',
  matchChats: '++id, profileId, timestamp'
}).upgrade(tx => {
  // Initialize insightFeedback array for existing users
  return tx.table('userIdentity').toCollection().modify((identity: Partial<UserIdentity>) => {
    if (!identity.insightFeedback) {
      identity.insightFeedback = [];
    }
  });
});

// Version 9: Add auth fields for Supabase authentication
db.version(9).stores({
  profiles: '++id, name, appName, timestamp, analysisPhase',
  userIdentity: '++id, lastUpdated, supabaseUserId',
  coachingSessions: '++id, profileId, timestamp',
  matchChats: '++id, profileId, timestamp'
});
// No upgrade needed - auth fields start as undefined and are set when user signs in

// Version 10: Add serverId fields for Supabase sync
db.version(10).stores({
  profiles: '++id, name, appName, timestamp, analysisPhase, serverId',
  userIdentity: '++id, lastUpdated, supabaseUserId, serverId',
  coachingSessions: '++id, profileId, timestamp, serverId',
  matchChats: '++id, profileId, timestamp, serverId'
});
// No upgrade needed - sync fields start as undefined and are set when synced to server

// Version 11: Add 11 Virtues system fields (virtue_profile for user, virtues_11 for matches)
db.version(11).stores({
  profiles: '++id, name, appName, timestamp, analysisPhase, serverId',
  userIdentity: '++id, lastUpdated, supabaseUserId, serverId',
  coachingSessions: '++id, profileId, timestamp, serverId',
  matchChats: '++id, profileId, timestamp, serverId'
}).upgrade(async tx => {
  // Migrate existing aspect_profile to virtue_profile for user
  await tx.table('userIdentity').toCollection().modify((identity: Partial<UserIdentity>) => {
    if (identity.synthesis?.aspect_profile && canMigrateAspectProfile(identity.synthesis.aspect_profile)) {
      // Only migrate if we don't already have virtue_profile
      if (!identity.synthesis.virtue_profile) {
        identity.synthesis.virtue_profile = migrateAspectProfileToVirtues(identity.synthesis.aspect_profile);
        console.log('Migrated user aspect_profile to virtue_profile');
      }
    }
  });

  // Migrate existing aspect_scores to virtues_11 for match profiles
  await tx.table('profiles').toCollection().modify((profile: Partial<Profile>) => {
    if (profile.aspect_scores && canMigrateAspectScores(profile.aspect_scores)) {
      // Only migrate if we don't already have virtues_11
      if (!profile.virtues_11) {
        // Note: This requires the user's virtue_profile to be available
        // For now, we'll mark that migration is needed but defer full compatibility calculation
        // The compatibility will be re-calculated when the profile is viewed
        console.log(`Profile ${profile.id} has aspect_scores that can be migrated to virtues_11`);
      }
    }
  });
});

// Version 12: Convert base64 thumbnails to Blob for ~33% storage savings
db.version(12).stores({
  profiles: '++id, name, appName, timestamp, analysisPhase, serverId',
  userIdentity: '++id, lastUpdated, supabaseUserId, serverId',
  coachingSessions: '++id, profileId, timestamp, serverId',
  matchChats: '++id, profileId, timestamp, serverId'
}).upgrade(async tx => {
  // Migrate existing base64 thumbnails to Blob
  // This reduces IndexedDB storage by ~33% per thumbnail
  await tx.table('profiles').toCollection().modify((profile: Partial<Profile>) => {
    if (profile.thumbnail && typeof profile.thumbnail === 'string' && profile.thumbnail.startsWith('data:')) {
      try {
        profile.thumbnail = base64ToBlob(profile.thumbnail);
        console.log(`Migrated profile ${profile.id} thumbnail to Blob`);
      } catch (error) {
        // Non-critical: if conversion fails, keep the base64 string
        console.log(`Failed to migrate profile ${profile.id} thumbnail:`, error);
      }
    }
  });
});

// Version 13: Add inferenceHistory table for AI usage tracking
// Stores token counts, costs, and context for each API call
db.version(13).stores({
  profiles: '++id, name, appName, timestamp, analysisPhase, serverId',
  userIdentity: '++id, lastUpdated, supabaseUserId, serverId',
  coachingSessions: '++id, profileId, timestamp, serverId',
  matchChats: '++id, profileId, timestamp, serverId',
  inferenceHistory: '++id, timestamp, feature, userId, success'
});
// No upgrade needed - new table starts empty

// Version 14: Add Essence Identity fields for AI-generated personality representation
// virtueSentence: One-line summary from 11 Virtues (e.g., "A curious explorer with radiant warmth")
// essenceImage: AI-generated abstract visualization via DALL-E 3
// essencePrompt: The prompt used for generation (for debugging/regeneration)
db.version(14).stores({
  profiles: '++id, name, appName, timestamp, analysisPhase, serverId',
  userIdentity: '++id, lastUpdated, supabaseUserId, serverId',
  coachingSessions: '++id, profileId, timestamp, serverId',
  matchChats: '++id, profileId, timestamp, serverId',
  inferenceHistory: '++id, timestamp, feature, userId, success'
});
// No upgrade needed - new fields start as undefined

// Version 15: Add theme setting for dark mode support
db.version(15).stores({
  profiles: '++id, name, appName, timestamp, analysisPhase, serverId',
  userIdentity: '++id, lastUpdated, supabaseUserId, serverId',
  coachingSessions: '++id, profileId, timestamp, serverId',
  matchChats: '++id, profileId, timestamp, serverId',
  inferenceHistory: '++id, timestamp, feature, userId, success'
}).upgrade(async tx => {
  // Initialize theme setting to 'system' for existing users
  await tx.table('userIdentity').toCollection().modify((identity: Partial<UserIdentity>) => {
    if (!identity.settings) {
      identity.settings = { autoCompatibility: true, theme: 'system' };
    } else if (!identity.settings.theme) {
      identity.settings.theme = 'system';
    }
  });
});

// Version 16: Add Mood Board fields for lifestyle-focused AI-generated images
// moodboardImage: AI-generated lifestyle scene via DALL-E 3
// moodboardPrompt: The prompt used for generation (for debugging/regeneration)
db.version(16).stores({
  profiles: '++id, name, appName, timestamp, analysisPhase, serverId',
  userIdentity: '++id, lastUpdated, supabaseUserId, serverId',
  coachingSessions: '++id, profileId, timestamp, serverId',
  matchChats: '++id, profileId, timestamp, serverId',
  inferenceHistory: '++id, timestamp, feature, userId, success'
});
// No upgrade needed - new fields start as undefined

export { db };
// Re-export aspect types for convenience (legacy)
export type { UserAspectProfile, MatchAspectScores, AspectScore } from './virtues/types';
// Re-export 11 Virtues types
export type { UserVirtueProfile, MatchVirtueCompatibility, VirtueScore as VirtueScore11, VirtueCompatibility } from './virtues/types';

// Re-export inference types for convenience
export type { InferenceRecord, InferenceFeature } from './inference/types';

export type {
  Profile,
  ProfileAnalysis,
  AnalysisData,
  AnalysisPhaseType,
  ProfileBasics,
  PhotoAnalysis,
  PromptAnalysis,
  SubtextAnalysis,
  Agenda,
  PsychologicalProfile,
  RecommendedOpener,
  ProfileCompatibility,
  ZodiacCompatibility,
  DateSuggestion,
  DateSuggestions,
  UserIdentity,
  RawStats,
  DatingGoals,
  DataExport,
  TextInput,
  VideoAnalysis,
  PhotoEntry,
  ManualEntry,
  UserSynthesis,
  CoachingSession,
  CoachingResponse,
  MatchCoachingAnalysis,
  PartnerVirtue,
  VirtueScore,
  NeurodivergentTrait,
  NeurodivergenceAnalysis,
  TransactionalIndicators,
  MatchChatMessage,
  AppSettings,
  InsightFeedback,
};
