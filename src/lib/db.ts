// src/lib/db.ts
import Dexie, { type EntityTable } from 'dexie';

interface Profile {
  id: number;
  name: string;
  age?: number;
  appName?: string; // New field for "Hinge", "Tinder", etc.
  timestamp: Date;
  analysis: any;
  thumbnail: string;
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
    meta: any;
    basics: any;
    photos: any[];
    prompts: any[];
    overall_analysis: any;
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
  UserIdentity,
  RawStats,
  DatingGoals,
  DataExport,
  TextInput,
  VideoAnalysis,
  PhotoEntry,
  ManualEntry,
  UserSynthesis
};