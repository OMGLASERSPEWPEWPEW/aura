// src/lib/virtues/aspects.test.ts
//
// @deprecated This tests the LEGACY 23 Aspects system.
// New code should use the 11 Virtues system - see virtues.test.ts
// The 23 Aspects system is maintained only for backwards compatibility
// with profiles created before the migration to 11 Virtues.
//
import { describe, it, expect } from 'vitest';
import {
  ASPECTS,
  REALMS,
  getAspectById,
  getAspectsByRealm,
  getRealmConfig,
  buildAspectsPromptText,
} from './aspects';

describe('aspects', () => {
  // ==================== Constants Validation ====================
  describe('ASPECTS constant', () => {
    it('should have exactly 23 aspects', () => {
      expect(ASPECTS).toHaveLength(23);
    });

    it('should have 7 vitality aspects', () => {
      const vitalityAspects = ASPECTS.filter((a) => a.realm === 'vitality');
      expect(vitalityAspects).toHaveLength(7);
    });

    it('should have 8 connection aspects', () => {
      const connectionAspects = ASPECTS.filter((a) => a.realm === 'connection');
      expect(connectionAspects).toHaveLength(8);
    });

    it('should have 8 structure aspects', () => {
      const structureAspects = ASPECTS.filter((a) => a.realm === 'structure');
      expect(structureAspects).toHaveLength(8);
    });

    it('should have unique IDs for all aspects', () => {
      const ids = ASPECTS.map((a) => a.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ASPECTS.length);
    });
  });

  describe('REALMS constant', () => {
    it('should have 3 realms', () => {
      expect(REALMS).toHaveLength(3);
    });

    it('should include vitality, connection, and structure', () => {
      const realmIds = REALMS.map((r) => r.id);
      expect(realmIds).toContain('vitality');
      expect(realmIds).toContain('connection');
      expect(realmIds).toContain('structure');
    });
  });

  // ==================== getAspectById ====================
  describe('getAspectById', () => {
    it('should find existing aspect by ID', () => {
      const vigor = getAspectById('vigor');

      expect(vigor).toBeDefined();
      expect(vigor?.name).toBe('Vigor');
      expect(vigor?.realm).toBe('vitality');
    });

    it('should return undefined for invalid ID', () => {
      const result = getAspectById('nonexistent');
      expect(result).toBeUndefined();
    });

    it('should be case sensitive', () => {
      const upperCase = getAspectById('VIGOR');
      const lowerCase = getAspectById('vigor');

      expect(upperCase).toBeUndefined();
      expect(lowerCase).toBeDefined();
    });

    it('should find aspects from each realm', () => {
      // Vitality
      expect(getAspectById('adventure')?.realm).toBe('vitality');
      // Connection
      expect(getAspectById('empathy')?.realm).toBe('connection');
      // Structure
      expect(getAspectById('ambition')?.realm).toBe('structure');
    });
  });

  // ==================== getAspectsByRealm ====================
  describe('getAspectsByRealm', () => {
    it('should return 7 aspects for vitality realm', () => {
      const aspects = getAspectsByRealm('vitality');
      expect(aspects).toHaveLength(7);
      aspects.forEach((a) => expect(a.realm).toBe('vitality'));
    });

    it('should return 8 aspects for connection realm', () => {
      const aspects = getAspectsByRealm('connection');
      expect(aspects).toHaveLength(8);
      aspects.forEach((a) => expect(a.realm).toBe('connection'));
    });

    it('should return 8 aspects for structure realm', () => {
      const aspects = getAspectsByRealm('structure');
      expect(aspects).toHaveLength(8);
      aspects.forEach((a) => expect(a.realm).toBe('structure'));
    });

    it('should return correct vitality aspects', () => {
      const aspects = getAspectsByRealm('vitality');
      const ids = aspects.map((a) => a.id);

      expect(ids).toContain('vigor');
      expect(ids).toContain('adventure');
      expect(ids).toContain('play');
      expect(ids).toContain('sensuality');
      expect(ids).toContain('presence');
      expect(ids).toContain('spontaneity');
      expect(ids).toContain('grit');
    });

    it('should return correct connection aspects', () => {
      const aspects = getAspectsByRealm('connection');
      const ids = aspects.map((a) => a.id);

      expect(ids).toContain('devotion');
      expect(ids).toContain('autonomy');
      expect(ids).toContain('empathy');
      expect(ids).toContain('directness');
      expect(ids).toContain('wit');
      expect(ids).toContain('vulnerability');
      expect(ids).toContain('grace');
      expect(ids).toContain('tribe');
    });

    it('should return correct structure aspects', () => {
      const aspects = getAspectsByRealm('structure');
      const ids = aspects.map((a) => a.id);

      expect(ids).toContain('sanctuary');
      expect(ids).toContain('curiosity');
      expect(ids).toContain('aesthetic');
      expect(ids).toContain('ambition');
      expect(ids).toContain('order');
      expect(ids).toContain('protection');
      expect(ids).toContain('tradition');
      expect(ids).toContain('purpose');
    });
  });

  // ==================== getRealmConfig ====================
  describe('getRealmConfig', () => {
    it('should find vitality realm config', () => {
      const config = getRealmConfig('vitality');

      expect(config).toBeDefined();
      expect(config?.name).toBe('Realm of Vitality');
      expect(config?.subtitle).toContain('Body & Action');
    });

    it('should find connection realm config', () => {
      const config = getRealmConfig('connection');

      expect(config).toBeDefined();
      expect(config?.name).toBe('Realm of Connection');
      expect(config?.subtitle).toContain('Heart & Spirit');
    });

    it('should find structure realm config', () => {
      const config = getRealmConfig('structure');

      expect(config).toBeDefined();
      expect(config?.name).toBe('Realm of Structure');
      expect(config?.subtitle).toContain('Mind & Environment');
    });

    it('should return undefined for invalid realm', () => {
      // @ts-expect-error - testing invalid input
      const result = getRealmConfig('invalid');
      expect(result).toBeUndefined();
    });

    it('should have color classes for each realm', () => {
      const vitality = getRealmConfig('vitality');
      const connection = getRealmConfig('connection');
      const structure = getRealmConfig('structure');

      expect(vitality?.colorClass).toContain('text-');
      expect(connection?.colorClass).toContain('text-');
      expect(structure?.colorClass).toContain('text-');
    });
  });

  // ==================== buildAspectsPromptText ====================
  describe('buildAspectsPromptText', () => {
    it('should include all 23 aspects', () => {
      const text = buildAspectsPromptText();

      // Check for each aspect name
      ASPECTS.forEach((aspect) => {
        expect(text).toContain(aspect.name);
      });
    });

    it('should have proper formatting with realm headers', () => {
      const text = buildAspectsPromptText();

      expect(text).toContain('## Realm of Vitality');
      expect(text).toContain('## Realm of Connection');
      expect(text).toContain('## Realm of Structure');
    });

    it('should include aspect descriptions', () => {
      const text = buildAspectsPromptText();

      expect(text).toContain('- Description:');
      expect(text).toContain('- Wound it masks:');
      expect(text).toContain('- Match considerations:');
    });

    it('should include markdown headers for aspects', () => {
      const text = buildAspectsPromptText();

      expect(text).toContain('### Vigor');
      expect(text).toContain('### Devotion');
      expect(text).toContain('### Sanctuary');
    });

    it('should return non-empty string', () => {
      const text = buildAspectsPromptText();

      expect(text.length).toBeGreaterThan(0);
      expect(typeof text).toBe('string');
    });

    it('should include wound and match considerations for each aspect', () => {
      const text = buildAspectsPromptText();

      // Check a sample aspect has all its properties
      const vigor = getAspectById('vigor');
      expect(text).toContain(vigor?.woundItMasks);
      expect(text).toContain(vigor?.matchConsiderations);
    });
  });
});
