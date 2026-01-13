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

const db = new Dexie('AuraDB') as Dexie & {
  profiles: EntityTable<Profile, 'id'>;
};

// Schema definition
db.version(1).stores({
  profiles: '++id, name, appName, timestamp' 
});

export { db };
export type { Profile };