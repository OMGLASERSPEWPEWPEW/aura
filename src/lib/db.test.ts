// src/lib/db.test.ts
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeAll } from 'vitest';
import Dexie from 'dexie';
import type {
  Profile,
  UserIdentity,
  CoachingSession,
} from './db';

// Import db after fake-indexeddb is set up
let db: Dexie & {
  profiles: Dexie.Table;
  userIdentity: Dexie.Table;
  coachingSessions: Dexie.Table;
};

beforeAll(async () => {
  // Dynamic import to ensure fake-indexeddb is initialized first
  const dbModule = await import('./db');
  db = dbModule.db as typeof db;
});

describe('db', () => {
  // ==================== Export Tests ====================
  describe('Export db instance', () => {
    it('db should be defined and be a Dexie instance', () => {
      expect(db).toBeDefined();
      expect(db).toBeInstanceOf(Dexie);
      expect(db.name).toBe('AuraDB');
    });
  });

  describe('Schema tables exist', () => {
    it('db should have profiles table', () => {
      const tableNames = db.tables.map((t) => t.name);
      expect(tableNames).toContain('profiles');
    });

    it('db should have userIdentity table', () => {
      const tableNames = db.tables.map((t) => t.name);
      expect(tableNames).toContain('userIdentity');
    });

    it('db should have coachingSessions table', () => {
      const tableNames = db.tables.map((t) => t.name);
      expect(tableNames).toContain('coachingSessions');
    });
  });

  // ==================== Type Export Tests ====================
  describe('Type exports', () => {
    it('Profile type should have required fields', () => {
      // Type-level test: if this compiles, the type is correctly exported
      const mockProfile: Profile = {
        id: 1,
        name: 'Test User',
        age: 25,
        appName: 'Hinge',
        timestamp: new Date(),
        analysis: { raw: 'test analysis' },
        thumbnail: 'data:image/jpeg;base64,test',
      };

      expect(mockProfile.id).toBe(1);
      expect(mockProfile.name).toBe('Test User');
      expect(mockProfile.timestamp).toBeInstanceOf(Date);
    });

    it('UserIdentity type should have required fields', () => {
      // Type-level test: if this compiles, the type is correctly exported
      const mockUserIdentity: UserIdentity = {
        id: 1,
        dataExports: [],
        textInputs: [],
        photos: [],
        manualEntry: {},
        lastUpdated: new Date(),
      };

      expect(mockUserIdentity.id).toBe(1);
      expect(mockUserIdentity.dataExports).toEqual([]);
      expect(mockUserIdentity.lastUpdated).toBeInstanceOf(Date);
    });

    it('CoachingSession type should have required fields', () => {
      // Type-level test: if this compiles, the type is correctly exported
      const mockSession: CoachingSession = {
        id: 1,
        profileId: 123,
        timestamp: new Date(),
        conversationImages: ['data:image/jpeg;base64,test'],
        matchAnalysis: {
          detected_agenda: 'casual',
          detected_tactics: ['humor'],
          subtext: 'interested',
        },
        suggestedResponses: [
          {
            message: 'Hey!',
            tactic: 'friendly opener',
            why_it_works: 'Simple and approachable',
            growth_insight: 'Builds confidence',
          },
        ],
      };

      expect(mockSession.profileId).toBe(123);
      expect(mockSession.conversationImages).toHaveLength(1);
      expect(mockSession.suggestedResponses).toHaveLength(1);
    });
  });
});
