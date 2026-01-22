// src/lib/db.ts
import Dexie, { type EntityTable } from 'dexie';

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

interface Profile {
  id: number;
  name: string;
  age?: number;
  appName?: string; // New field for "Hinge", "Tinder", etc.
  timestamp: Date;
  analysis: AnalysisData;
  thumbnail: string;

  // Compatibility assessment (populated when user has synthesis)
  compatibility?: ProfileCompatibility;

  // Zodiac compatibility (populated when both signs available)
  zodiac_compatibility?: ZodiacCompatibility;

  // Date suggestions (populated on-demand)
  date_suggestions?: DateSuggestions;
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
  analyzedAt: Date;
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
    growth_areas: string[];
    strengths: string[];
  };
}

// Extended UserIdentity interface for My Profile system
interface UserIdentity {
  id: number; // usually just 1, we only have one user

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

  lastUpdated: Date;
}

const db = new Dexie('AuraDB') as Dexie & {
  profiles: EntityTable<Profile, 'id'>;
  userIdentity: EntityTable<UserIdentity, 'id'>;
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

export { db };
export type {
  Profile,
  ProfileAnalysis,
  AnalysisData,
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
};