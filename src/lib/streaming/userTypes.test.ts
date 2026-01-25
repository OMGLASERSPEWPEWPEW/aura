// src/lib/streaming/userTypes.test.ts
// Unit tests for user streaming analysis types and merge functions

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createInitialAccumulatedUserProfile,
  mergeUserChunkBasics,
  mergeUserChunkImpressions,
  mergeUserChunkObservations,
  mergeUserChunkSynthesis,
  type AccumulatedUserProfile,
  type UserChunkBasicsResult,
  type UserChunkImpressionsResult,
  type UserChunkObservationsResult,
  type UserChunkSynthesisResult,
} from './userTypes';

describe('userTypes', () => {
  describe('createInitialAccumulatedUserProfile', () => {
    it('should create a valid initial profile with null identity fields', () => {
      const profile = createInitialAccumulatedUserProfile();

      expect(profile.identity.name).toBeNull();
      expect(profile.identity.age).toBeNull();
      expect(profile.identity.location).toBeNull();
      expect(profile.identity.occupation).toBeNull();
    });

    it('should initialize empty arrays', () => {
      const profile = createInitialAccumulatedUserProfile();

      expect(profile.photos.analyses).toEqual([]);
      expect(profile.photos.vibesSummary).toEqual([]);
      expect(profile.psychological.agendas).toEqual([]);
      expect(profile.behavioral.strengths).toEqual([]);
      expect(profile.behavioral.growthAreas).toEqual([]);
    });

    it('should set initial meta fields correctly', () => {
      const profile = createInitialAccumulatedUserProfile();

      expect(profile.meta.chunksProcessed).toBe(0);
      expect(profile.meta.totalChunks).toBe(4);
      expect(profile.meta.phase).toBe('quick');
      expect(profile.meta.startedAt).toBeInstanceOf(Date);
    });
  });

  describe('mergeUserChunkBasics', () => {
    let initialProfile: AccumulatedUserProfile;

    beforeEach(() => {
      initialProfile = createInitialAccumulatedUserProfile();
    });

    it('should merge identity fields from basics chunk', () => {
      const basics: UserChunkBasicsResult = {
        name: 'John',
        age: 28,
        location: 'NYC',
        occupation: 'Engineer',
        thumbnailIndex: 2,
        initialVibes: ['friendly', 'outgoing'],
      };

      const result = mergeUserChunkBasics(initialProfile, basics);

      expect(result.identity.name).toBe('John');
      expect(result.identity.age).toBe(28);
      expect(result.identity.location).toBe('NYC');
      expect(result.identity.occupation).toBe('Engineer');
    });

    it('should not overwrite existing identity fields with null', () => {
      // First set some values
      initialProfile.identity.name = 'Jane';
      initialProfile.identity.age = 25;

      const basics: UserChunkBasicsResult = {
        name: null, // Should not overwrite
        age: null,
        location: 'LA',
        occupation: null,
        thumbnailIndex: 1,
        initialVibes: [],
      };

      const result = mergeUserChunkBasics(initialProfile, basics);

      expect(result.identity.name).toBe('Jane'); // Preserved
      expect(result.identity.age).toBe(25); // Preserved
      expect(result.identity.location).toBe('LA'); // New value
    });

    it('should accumulate vibes from initial vibes', () => {
      const basics: UserChunkBasicsResult = {
        name: null,
        age: null,
        location: null,
        occupation: null,
        thumbnailIndex: 0,
        initialVibes: ['adventurous', 'creative'],
      };

      const result = mergeUserChunkBasics(initialProfile, basics);

      expect(result.photos.vibesSummary).toEqual(['adventurous', 'creative']);
    });

    it('should increment chunks processed', () => {
      const basics: UserChunkBasicsResult = {
        name: null,
        age: null,
        location: null,
        occupation: null,
        thumbnailIndex: 0,
        initialVibes: [],
      };

      const result = mergeUserChunkBasics(initialProfile, basics);

      expect(result.meta.chunksProcessed).toBe(1);
    });
  });

  describe('mergeUserChunkImpressions', () => {
    let profile: AccumulatedUserProfile;

    beforeEach(() => {
      profile = createInitialAccumulatedUserProfile();
      profile.meta.chunksProcessed = 1;
    });

    it('should accumulate vibes', () => {
      profile.photos.vibesSummary = ['existing'];

      const impressions: UserChunkImpressionsResult = {
        vibes: ['new1', 'new2'],
        archetype: 'The Adventurer',
        archetypeConfidence: 75,
        initialStrengths: ['confident'],
        communicationHints: ['direct'],
      };

      const result = mergeUserChunkImpressions(profile, impressions);

      expect(result.photos.vibesSummary).toEqual(['existing', 'new1', 'new2']);
    });

    it('should set archetype and confidence', () => {
      const impressions: UserChunkImpressionsResult = {
        vibes: [],
        archetype: 'The Creative',
        archetypeConfidence: 80,
        initialStrengths: [],
        communicationHints: [],
      };

      const result = mergeUserChunkImpressions(profile, impressions);

      expect(result.psychological.archetype).toBe('The Creative');
      expect(result.psychological.confidenceLevel).toBe(80);
    });

    it('should keep higher confidence level', () => {
      profile.psychological.confidenceLevel = 90;

      const impressions: UserChunkImpressionsResult = {
        vibes: [],
        archetype: null,
        archetypeConfidence: 70, // Lower than existing
        initialStrengths: [],
        communicationHints: [],
      };

      const result = mergeUserChunkImpressions(profile, impressions);

      expect(result.psychological.confidenceLevel).toBe(90); // Kept higher
    });

    it('should accumulate strengths', () => {
      profile.behavioral.strengths = ['existing'];

      const impressions: UserChunkImpressionsResult = {
        vibes: [],
        archetype: null,
        archetypeConfidence: 0,
        initialStrengths: ['new1', 'new2'],
        communicationHints: [],
      };

      const result = mergeUserChunkImpressions(profile, impressions);

      expect(result.behavioral.strengths).toEqual(['existing', 'new1', 'new2']);
    });
  });

  describe('mergeUserChunkObservations', () => {
    let profile: AccumulatedUserProfile;

    beforeEach(() => {
      profile = createInitialAccumulatedUserProfile();
      profile.meta.chunksProcessed = 2;
    });

    it('should accumulate photo analyses', () => {
      const observations: UserChunkObservationsResult = {
        photos: [
          { description: 'Photo 1', vibe: 'casual', subtext: 'relaxed' },
          { description: 'Photo 2', vibe: 'professional', subtext: 'ambitious' },
        ],
        signals: [],
        presentationTactics: [],
        subtextAnalysis: {
          sexual_signaling: '',
          power_dynamics: '',
          vulnerability_indicators: '',
          disconnect: '',
        },
      };

      const result = mergeUserChunkObservations(profile, observations);

      expect(result.photos.analyses).toHaveLength(2);
      expect(result.photos.analyses[0].description).toBe('Photo 1');
    });

    it('should accumulate presentation tactics', () => {
      profile.psychological.presentationTactics = ['existing'];

      const observations: UserChunkObservationsResult = {
        photos: [],
        signals: [],
        presentationTactics: ['tactic1', 'tactic2'],
        subtextAnalysis: {
          sexual_signaling: '',
          power_dynamics: '',
          vulnerability_indicators: '',
          disconnect: '',
        },
      };

      const result = mergeUserChunkObservations(profile, observations);

      expect(result.psychological.presentationTactics).toEqual(['existing', 'tactic1', 'tactic2']);
    });

    it('should update subtext analysis with new non-empty values', () => {
      profile.psychological.subtextAnalysis.sexual_signaling = 'original';

      const observations: UserChunkObservationsResult = {
        photos: [],
        signals: [],
        presentationTactics: [],
        subtextAnalysis: {
          sexual_signaling: '', // Empty - should keep original
          power_dynamics: 'new power dynamics',
          vulnerability_indicators: 'new vulnerability',
          disconnect: '',
        },
      };

      const result = mergeUserChunkObservations(profile, observations);

      expect(result.psychological.subtextAnalysis.sexual_signaling).toBe('original');
      expect(result.psychological.subtextAnalysis.power_dynamics).toBe('new power dynamics');
      expect(result.psychological.subtextAnalysis.vulnerability_indicators).toBe('new vulnerability');
    });
  });

  describe('mergeUserChunkSynthesis', () => {
    let profile: AccumulatedUserProfile;

    beforeEach(() => {
      profile = createInitialAccumulatedUserProfile();
      profile.meta.chunksProcessed = 3;
      profile.behavioral.strengths = ['existing strength'];
      profile.behavioral.growthAreas = ['existing growth'];
    });

    it('should deduplicate strengths and growth areas', () => {
      const synthesis: UserChunkSynthesisResult = {
        communicationStyle: 'direct',
        attachmentPatterns: 'secure',
        attachmentConfidence: 75,
        strengths: ['existing strength', 'new strength'], // Has duplicate
        growthAreas: ['existing growth', 'new growth'], // Has duplicate
        idealPartnerProfile: 'Someone creative',
        whatToLookFor: [],
        whatToAvoid: [],
        bioSuggestions: [],
        openerStyleRecommendations: [],
        agendas: [],
        predictedTactics: [],
        archetypeRefinement: '',
        finalConfidence: 80,
      };

      const result = mergeUserChunkSynthesis(profile, synthesis);

      expect(result.behavioral.strengths).toEqual(['existing strength', 'new strength']);
      expect(result.behavioral.growthAreas).toEqual(['existing growth', 'new growth']);
    });

    it('should update behavioral fields from synthesis', () => {
      const synthesis: UserChunkSynthesisResult = {
        communicationStyle: 'warm and open',
        attachmentPatterns: 'anxious-preoccupied',
        attachmentConfidence: 65,
        strengths: [],
        growthAreas: [],
        idealPartnerProfile: '',
        whatToLookFor: [],
        whatToAvoid: [],
        bioSuggestions: [],
        openerStyleRecommendations: [],
        agendas: [],
        predictedTactics: [],
        archetypeRefinement: '',
        finalConfidence: 0,
      };

      const result = mergeUserChunkSynthesis(profile, synthesis);

      expect(result.behavioral.communicationStyle).toBe('warm and open');
      expect(result.behavioral.attachmentPatterns).toBe('anxious-preoccupied');
      expect(result.behavioral.attachmentConfidence).toBe(65);
    });

    it('should update dating strategy fields', () => {
      const synthesis: UserChunkSynthesisResult = {
        communicationStyle: '',
        attachmentPatterns: '',
        attachmentConfidence: 0,
        strengths: [],
        growthAreas: [],
        idealPartnerProfile: 'Someone adventurous',
        whatToLookFor: ['sense of humor', 'ambition'],
        whatToAvoid: ['negativity'],
        bioSuggestions: ['Show your creative side'],
        openerStyleRecommendations: ['Use humor'],
        agendas: [],
        predictedTactics: [],
        archetypeRefinement: '',
        finalConfidence: 0,
      };

      const result = mergeUserChunkSynthesis(profile, synthesis);

      expect(result.dating.idealPartnerProfile).toBe('Someone adventurous');
      expect(result.dating.whatToLookFor).toEqual(['sense of humor', 'ambition']);
      expect(result.dating.whatToAvoid).toEqual(['negativity']);
      expect(result.dating.bioSuggestions).toEqual(['Show your creative side']);
    });

    it('should update archetype and agendas', () => {
      const synthesis: UserChunkSynthesisResult = {
        communicationStyle: '',
        attachmentPatterns: '',
        attachmentConfidence: 0,
        strengths: [],
        growthAreas: [],
        idealPartnerProfile: '',
        whatToLookFor: [],
        whatToAvoid: [],
        bioSuggestions: [],
        openerStyleRecommendations: [],
        agendas: [
          { type: 'finding connection', evidence: 'genuine prompts', priority: 'primary' },
        ],
        predictedTactics: ['vulnerability', 'humor'],
        archetypeRefinement: 'The Thoughtful Creative',
        finalConfidence: 85,
      };

      const result = mergeUserChunkSynthesis(profile, synthesis);

      expect(result.psychological.archetype).toBe('The Thoughtful Creative');
      expect(result.psychological.confidenceLevel).toBe(85);
      expect(result.psychological.agendas).toHaveLength(1);
      expect(result.psychological.predictedTactics).toEqual(['vulnerability', 'humor']);
    });
  });
});
