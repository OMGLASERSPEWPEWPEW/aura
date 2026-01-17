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

// New Interface for the User's own backstory
// New Interface for the User's own backstory
interface UserIdentity {
  id: number; // usually just 1, we only have one user
  source: 'tinder' | 'hinge' | 'bumble';
  rawStats: {
    matches: number;
    conversations: number;
    initiatorRatio: number; // 0 to 1
    doubleTextRatio: number; // 0 to 1
    avgMessageLength: number;
  };
  // The result of the "Deep Dive" psychoanalysis
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
  // NEW: The "Self-Audit" (Video based) - Stores the same data structure as a Profile
  selfProfile?: {
    meta: any;
    basics: any;
    photos: any[];
    prompts: any[];
    overall_analysis: any;
  };
  lastUpdated: Date;

}

const db = new Dexie('AuraDB') as Dexie & {
  profiles: EntityTable<Profile, 'id'>;
  userIdentity: EntityTable<UserIdentity, 'id'>;
};

// Schema definition
db.version(2).stores({
  profiles: '++id, name, appName, timestamp',
  userIdentity: '++id, lastUpdated' 
});

export { db };
export type { Profile, UserIdentity };