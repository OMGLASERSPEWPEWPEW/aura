// src/lib/inference/featureMapper.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { inferFeatureFromOperation, getCurrentPage, getProfileIdFromPage } from './featureMapper';

describe('featureMapper', () => {
  describe('inferFeatureFromOperation', () => {
    // Profile analysis chunks
    it('maps analyzeChunk1 to profile_analysis_chunk1', () => {
      expect(inferFeatureFromOperation('analyzeChunk1')).toBe('profile_analysis_chunk1');
    });

    it('maps analyzeChunk2 to profile_analysis_chunk2', () => {
      expect(inferFeatureFromOperation('analyzeChunk2')).toBe('profile_analysis_chunk2');
    });

    it('maps analyzeChunk3 to profile_analysis_chunk3', () => {
      expect(inferFeatureFromOperation('analyzeChunk3')).toBe('profile_analysis_chunk3');
    });

    it('maps analyzeChunk4 to profile_analysis_chunk4', () => {
      expect(inferFeatureFromOperation('analyzeChunk4')).toBe('profile_analysis_chunk4');
    });

    it('maps analyzeProfileChunk variants', () => {
      expect(inferFeatureFromOperation('analyzeProfileChunk1')).toBe('profile_analysis_chunk1');
      expect(inferFeatureFromOperation('analyzeProfileChunk2')).toBe('profile_analysis_chunk2');
      expect(inferFeatureFromOperation('analyzeProfileChunk3')).toBe('profile_analysis_chunk3');
      expect(inferFeatureFromOperation('analyzeProfileChunk4')).toBe('profile_analysis_chunk4');
    });

    // Consolidation
    it('maps consolidateProfile to profile_analysis_consolidation', () => {
      expect(inferFeatureFromOperation('consolidateProfile')).toBe('profile_analysis_consolidation');
    });

    it('maps consolidateAnalysis to profile_analysis_consolidation', () => {
      expect(inferFeatureFromOperation('consolidateAnalysis')).toBe('profile_analysis_consolidation');
    });

    // User synthesis
    it('maps generateUserSynthesis to user_synthesis', () => {
      expect(inferFeatureFromOperation('generateUserSynthesis')).toBe('user_synthesis');
    });

    it('maps synthesizeUser to user_synthesis', () => {
      expect(inferFeatureFromOperation('synthesizeUser')).toBe('user_synthesis');
    });

    it('maps userSynthesis to user_synthesis', () => {
      expect(inferFeatureFromOperation('userSynthesis')).toBe('user_synthesis');
    });

    // Compatibility
    it('maps calculateCompatibility to compatibility_scoring', () => {
      expect(inferFeatureFromOperation('calculateCompatibility')).toBe('compatibility_scoring');
    });

    it('maps scoreCompatibility to compatibility_scoring', () => {
      expect(inferFeatureFromOperation('scoreCompatibility')).toBe('compatibility_scoring');
    });

    // Date ideas
    it('maps generateDateIdeas to date_ideas', () => {
      expect(inferFeatureFromOperation('generateDateIdeas')).toBe('date_ideas');
    });

    it('maps dateIdeas to date_ideas', () => {
      expect(inferFeatureFromOperation('dateIdeas')).toBe('date_ideas');
    });

    // Opener suggestions
    it('maps generateOpeners to opener_suggestions', () => {
      expect(inferFeatureFromOperation('generateOpeners')).toBe('opener_suggestions');
    });

    it('maps refreshOpener to opener_suggestions', () => {
      expect(inferFeatureFromOperation('refreshOpener')).toBe('opener_suggestions');
    });

    // Ask about match
    it('maps askAboutMatch to ask_about_match', () => {
      expect(inferFeatureFromOperation('askAboutMatch')).toBe('ask_about_match');
    });

    // Conversation coaching
    it('maps coachConversation to conversation_coaching', () => {
      expect(inferFeatureFromOperation('coachConversation')).toBe('conversation_coaching');
    });

    it('maps analyzeConversation to conversation_coaching', () => {
      expect(inferFeatureFromOperation('analyzeConversation')).toBe('conversation_coaching');
    });

    // Zodiac
    it('maps analyzeZodiacCompatibility to zodiac_compatibility', () => {
      expect(inferFeatureFromOperation('analyzeZodiacCompatibility')).toBe('zodiac_compatibility');
    });

    // Unknown operations
    it('returns unknown for undefined', () => {
      expect(inferFeatureFromOperation(undefined)).toBe('unknown');
    });

    it('returns unknown for empty string', () => {
      expect(inferFeatureFromOperation('')).toBe('unknown');
    });

    it('returns unknown for unmapped operations', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      expect(inferFeatureFromOperation('someRandomOperation')).toBe('unknown');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown operation name: someRandomOperation')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('getCurrentPage', () => {
    const originalWindow = global.window;

    beforeEach(() => {
      // @ts-expect-error - mocking window
      global.window = {
        location: {
          pathname: '/test-page',
        },
      };
    });

    afterEach(() => {
      global.window = originalWindow;
    });

    it('returns the current pathname', () => {
      expect(getCurrentPage()).toBe('/test-page');
    });

    it('returns /unknown when window is undefined', () => {
      // @ts-expect-error - testing undefined window
      global.window = undefined;
      expect(getCurrentPage()).toBe('/unknown');
    });
  });

  describe('getProfileIdFromPage', () => {
    const originalWindow = global.window;

    afterEach(() => {
      global.window = originalWindow;
    });

    it('extracts profile ID from /profile/:id path', () => {
      // @ts-expect-error - mocking window
      global.window = { location: { pathname: '/profile/42' } };
      expect(getProfileIdFromPage()).toBe(42);
    });

    it('extracts profile ID with multiple digits', () => {
      // @ts-expect-error - mocking window
      global.window = { location: { pathname: '/profile/12345' } };
      expect(getProfileIdFromPage()).toBe(12345);
    });

    it('returns undefined for non-profile paths', () => {
      // @ts-expect-error - mocking window
      global.window = { location: { pathname: '/upload' } };
      expect(getProfileIdFromPage()).toBeUndefined();
    });

    it('returns undefined for home path', () => {
      // @ts-expect-error - mocking window
      global.window = { location: { pathname: '/' } };
      expect(getProfileIdFromPage()).toBeUndefined();
    });

    it('returns undefined when window is undefined', () => {
      // @ts-expect-error - testing undefined window
      global.window = undefined;
      expect(getProfileIdFromPage()).toBeUndefined();
    });
  });
});
