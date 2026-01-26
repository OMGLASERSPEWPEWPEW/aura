// src/lib/ai.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { UserContextForMatch, RecommendedOpener, PromptOpener } from './ai';

// Mock all API dependencies to avoid network calls
const mockCallAnthropicForObject = vi.fn();
const mockCallAnthropicForArray = vi.fn();
const mockCallAnthropicForArraySafe = vi.fn();
const mockCallAnthropicForText = vi.fn();
const mockCallAnthropicWithDebug = vi.fn();
const mockCallAnthropicForObjectValidated = vi.fn();

vi.mock('./api', () => ({
  callAnthropicForObject: mockCallAnthropicForObject,
  callAnthropicForArray: mockCallAnthropicForArray,
  callAnthropicForArraySafe: mockCallAnthropicForArraySafe,
  callAnthropicForText: mockCallAnthropicForText,
  callAnthropicWithDebug: mockCallAnthropicWithDebug,
  callAnthropicForObjectValidated: mockCallAnthropicForObjectValidated,
  textContent: vi.fn((text: string) => ({ type: 'text', text })),
  imageContent: vi.fn((data: string) => ({ type: 'image', source: { data } })),
  TOKEN_LIMITS: {
    PROFILE_ANALYSIS: 12288,
    PROFILE_BASICS: 2048,
    PROFILE_DEEP: 10240,
    USER_BACKSTORY: 4096,
    USER_SELF_ANALYSIS: 16384,
    DATE_SUGGESTIONS: 1500,
    LOCAL_EVENTS: 512,
    ZODIAC: 1024,
    OPENERS: 1024,
    PROMPT_OPENER: 512,
    COACHING: 2048,
    COACHING_SCORE: 512,
    COACHING_DATE_ASK: 1024,
    VIRTUE_EXTRACTION: 2048,
    VIRTUE_SCORING: 1536,
    ASK_ABOUT_MATCH: 1024,
    NEURODIVERGENCE_ANALYSIS: 4096,
    USER_ASPECTS: 4096,
    MATCH_ASPECTS: 4096,
  },
  TIMEOUTS: {
    DEFAULT: 60000,
    PROFILE_ANALYSIS: 150000,
    QUICK_ANALYSIS: 30000,
  },
}));

vi.mock('./prompts', () => ({
  PROFILE_ANALYSIS_PROMPT: 'PROFILE_ANALYSIS_PROMPT',
  PROFILE_BASICS_PROMPT: 'PROFILE_BASICS_PROMPT',
  PROFILE_DEEP_PROMPT: 'PROFILE_DEEP_PROMPT {basics_json}',
  USER_CONTEXT_PROMPT: 'USER_CONTEXT_PROMPT',
  USER_SELF_ANALYSIS_PROMPT: 'USER_SELF_ANALYSIS_PROMPT',
  USER_CONTEXT_FOR_MATCH:
    '{goal_type}{archetype_summary}{communication_style}{what_to_look_for}{what_to_avoid}{opener_style_recommendations}{user_location}{relationship_style}',
  ZODIAC_COMPATIBILITY_PROMPT: '{user_sign}{match_sign}',
  REGENERATE_OPENERS_PROMPT:
    '{basics}{archetype_summary}{vulnerability_indicators}{power_dynamics}{prompts}{user_context}',
  REGENERATE_PROMPT_OPENER_PROMPT:
    '{question}{answer}{analysis}{name}{archetype_summary}{vulnerability_indicators}{user_context}',
  CONVERSATION_COACH_PROMPT: 'CONVERSATION_COACH_PROMPT',
  SCORE_RESPONSE_PROMPT: 'SCORE_RESPONSE_PROMPT',
  DATE_ASK_PROMPT: 'DATE_ASK_PROMPT',
  PARTNER_VIRTUES_PROMPT: 'PARTNER_VIRTUES_PROMPT',
  VIRTUE_SCORING_PROMPT: 'VIRTUE_SCORING_PROMPT',
  ASK_ABOUT_MATCH_PROMPT: 'ASK_ABOUT_MATCH_PROMPT',
  NEURODIVERGENCE_ANALYSIS_PROMPT: 'NEURODIVERGENCE_ANALYSIS_PROMPT',
  USER_ASPECTS_PROMPT: 'USER_ASPECTS_PROMPT {user_profile_data}',
  MATCH_ASPECTS_PROMPT: 'MATCH_ASPECTS_PROMPT',
  DATE_SUGGESTIONS_PROMPT: 'DATE_SUGGESTIONS_PROMPT',
  LOCAL_EVENTS_PROMPT: 'LOCAL_EVENTS_PROMPT',
}));

describe('ai module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==================== Input Validation Tests ====================
  describe('analyzeProfile', () => {
    it('should throw error when no frames provided', async () => {
      const { analyzeProfile } = await import('./ai');

      await expect(analyzeProfile([])).rejects.toThrow('No frames provided for analysis');
      await expect(analyzeProfile(null as unknown as string[])).rejects.toThrow();
    });

    it('should call API with frames when valid input provided', async () => {
      const { analyzeProfile } = await import('./ai');

      const mockAnalysis = {
        meta: { app_name: 'Hinge' },
        basics: { name: 'Jane', age: 28 },
        photos: [{ description: 'Beach photo', vibe: 'adventurous' }],
      };

      mockCallAnthropicForObject.mockResolvedValue(mockAnalysis);

      const result = await analyzeProfile(['frame1', 'frame2', 'frame3']);

      expect(mockCallAnthropicForObject).toHaveBeenCalled();
      expect(result).toEqual(mockAnalysis);
    });
  });

  describe('analyzeUserBackstory', () => {
    it('should throw error when text context is too short', async () => {
      const { analyzeUserBackstory } = await import('./ai');

      await expect(analyzeUserBackstory('short')).rejects.toThrow('Context is too short');
      await expect(analyzeUserBackstory('')).rejects.toThrow();
    });

    it('should call API when context is long enough', async () => {
      const { analyzeUserBackstory } = await import('./ai');

      const mockResult = {
        psychoanalysis: {
          archetype: 'Explorer',
          core_values: ['adventure'],
        },
      };

      mockCallAnthropicForObject.mockResolvedValue(mockResult);

      const longText = 'This is a long enough text context for analysis. '.repeat(10);
      const result = await analyzeUserBackstory(longText);

      expect(mockCallAnthropicForObject).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });

  describe('analyzeUserSelf', () => {
    it('should throw error when no input provided', async () => {
      const { analyzeUserSelf } = await import('./ai');

      await expect(analyzeUserSelf({})).rejects.toThrow(
        'Please provide at least one type of input'
      );
    });

    it('should accept frames as input', async () => {
      const { analyzeUserSelf } = await import('./ai');

      const mockSynthesis = {
        basics: { name: 'John' },
        psychological_profile: {},
        dating_strategy: {},
        behavioral_insights: {},
      };

      mockCallAnthropicWithDebug.mockResolvedValue(mockSynthesis);

      const result = await analyzeUserSelf({ frames: ['frame1', 'frame2'] });

      expect(mockCallAnthropicWithDebug).toHaveBeenCalled();
      expect(result).toEqual(mockSynthesis);
    });

    it('should accept text context', async () => {
      const { analyzeUserSelf } = await import('./ai');

      const mockSynthesis = {
        basics: { name: 'John' },
        psychological_profile: {},
        dating_strategy: {},
        behavioral_insights: {},
      };

      mockCallAnthropicWithDebug.mockResolvedValue(mockSynthesis);

      // textContext must be > 10 chars to be considered valid
      const result = await analyzeUserSelf({ textContext: 'This is my detailed bio text with enough content.' });

      expect(mockCallAnthropicWithDebug).toHaveBeenCalled();
      expect(result).toEqual(mockSynthesis);
    });

    it('should accept manual info', async () => {
      const { analyzeUserSelf } = await import('./ai');

      const mockSynthesis = {
        basics: { name: 'John' },
        psychological_profile: {},
        dating_strategy: {},
        behavioral_insights: {},
      };

      mockCallAnthropicWithDebug.mockResolvedValue(mockSynthesis);

      const result = await analyzeUserSelf({
        manualInfo: { name: 'John', age: 30 },
      });

      expect(mockCallAnthropicWithDebug).toHaveBeenCalled();
      expect(result).toEqual(mockSynthesis);
    });
  });

  describe('analyzeConversation', () => {
    it('should throw error when no conversation images provided', async () => {
      const { analyzeConversation } = await import('./ai');

      await expect(
        analyzeConversation({
          conversationImages: [],
          userContext: {},
          matchContext: {},
        })
      ).rejects.toThrow('No conversation images provided');
    });

    it('should analyze conversation with images', async () => {
      const { analyzeConversation } = await import('./ai');

      // Result structure matches CoachingAnalysisResult
      const mockResult = {
        match_analysis: {
          detected_agenda: 'relationship',
          detected_tactics: ['flirting'],
          subtext: 'interested',
        },
        suggested_responses: [
          {
            message: 'That sounds great!',
            tactic: 'enthusiasm',
            why_it_works: 'Shows interest',
            growth_insight: 'Good energy',
          },
        ],
      };

      mockCallAnthropicForObject.mockResolvedValue(mockResult);

      const result = await analyzeConversation({
        conversationImages: ['image1', 'image2'],
        userContext: {},
        matchContext: {},
      });

      expect(mockCallAnthropicForObject).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });

  describe('generateDateAsk', () => {
    it('should throw error when no conversation images provided', async () => {
      const { generateDateAsk } = await import('./ai');

      await expect(generateDateAsk([], {}, {})).rejects.toThrow(
        'No conversation images provided'
      );
    });

    it('should generate date ask suggestions', async () => {
      const { generateDateAsk } = await import('./ai');

      // Result is an array of DateAskSuggestion
      const mockResult = [
        {
          message: "Let's grab coffee this weekend!",
          approach: 'Direct' as const,
          tactic: 'Straightforward invite',
          why_it_works: 'Natural progression of conversation',
        },
      ];

      mockCallAnthropicForArray.mockResolvedValue(mockResult);

      const result = await generateDateAsk(['image1'], {}, {});

      expect(mockCallAnthropicForArray).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });

  describe('scoreMatchVirtues', () => {
    it('should return empty array when no user virtues provided', async () => {
      const { scoreMatchVirtues } = await import('./ai');
      const mockAnalysis = { basics: { name: 'Test' } };

      const result = await scoreMatchVirtues(mockAnalysis as any, []);
      expect(result).toEqual([]);
    });

    it('should score virtues when provided', async () => {
      const { scoreMatchVirtues } = await import('./ai');

      const mockScores = [
        { virtue_name: 'Curiosity', score: 8, evidence: 'Shows interest', anti_virtue_detected: false },
        { virtue_name: 'Honesty', score: 7, evidence: 'Direct communication', anti_virtue_detected: false },
      ];

      // Function now uses callAnthropicForObjectValidated which returns Result<T, Error>
      mockCallAnthropicForObjectValidated.mockResolvedValue({
        ok: true,
        value: { virtue_scores: mockScores },
      });

      const userVirtues = [
        { name: 'Curiosity', description: 'Love of learning', anti_virtue: 'Closed-mindedness' },
        { name: 'Honesty', description: 'Truthfulness', anti_virtue: 'Deception' },
      ];

      const mockAnalysis = {
        basics: { name: 'Test' },
        psychological_profile: { archetype_summary: 'Explorer' },
      };

      const result = await scoreMatchVirtues(mockAnalysis as any, userVirtues as any);

      expect(mockCallAnthropicForObjectValidated).toHaveBeenCalled();
      expect(result).toEqual(mockScores);
    });
  });

  describe('scoreMatchAspects', () => {
    it('should throw error when user aspects are missing', async () => {
      const { scoreMatchAspects } = await import('./ai');
      const mockAnalysis = { basics: { name: 'Test' } };

      await expect(scoreMatchAspects(mockAnalysis as any, null as any)).rejects.toThrow(
        'User aspect profile required'
      );
    });

    it('should throw error when user aspects scores are empty', async () => {
      const { scoreMatchAspects } = await import('./ai');
      const mockAnalysis = { basics: { name: 'Test' } };
      const emptyAspects = { scores: [] };

      await expect(
        scoreMatchAspects(mockAnalysis as any, emptyAspects as any)
      ).rejects.toThrow('User aspect profile required');
    });

    it('should score aspects when valid profile provided', async () => {
      const { scoreMatchAspects } = await import('./ai');

      const mockResult = {
        scores: [{ aspect_id: 'vigor', score: 75 }],
        compatibility_insights: {
          strong_matches: [],
          complementary: [],
          potential_friction: [],
        },
        overall_realm_compatibility: {
          vitality: 70,
          connection: 80,
          structure: 65,
        },
      };

      mockCallAnthropicForObject.mockResolvedValue(mockResult);

      const userAspects = {
        scores: [{ aspect_id: 'vigor', score: 80 }],
        dominant_aspects: ['vigor'],
        shadow_aspects: [],
        realm_summary: {},
        lastUpdated: new Date(),
      };

      const mockAnalysis = { basics: { name: 'Test' } };

      const result = await scoreMatchAspects(mockAnalysis as any, userAspects as any);

      expect(mockCallAnthropicForObject).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });

  describe('getZodiacCompatibility', () => {
    it('should get zodiac compatibility', async () => {
      const { getZodiacCompatibility } = await import('./ai');

      const mockResult = {
        user_sign: 'Aries',
        match_sign: 'Leo',
        overall_score: 9,
        summary: 'Fire signs unite!',
        strengths: ['Passion', 'Energy'],
        challenges: ['Ego clashes'],
        advice: 'Channel energy together',
      };

      mockCallAnthropicForObject.mockResolvedValue(mockResult);

      const result = await getZodiacCompatibility('Aries', 'Leo');

      expect(mockCallAnthropicForObject).toHaveBeenCalled();
      expect(result.overall_score).toBe(9);
    });
  });

  describe('regenerateOpeners', () => {
    it('should regenerate openers for profile', async () => {
      const { regenerateOpeners } = await import('./ai');

      const mockOpeners = [
        {
          type: 'like_comment' as const,
          message: 'Love your travel pics!',
          tactic: 'compliment',
          why_it_works: 'Shows genuine interest',
        },
      ];

      mockCallAnthropicForArray.mockResolvedValue(mockOpeners);

      // Function expects profileAnalysis object with basics, psychological_profile, prompts
      const profileAnalysis = {
        basics: { name: 'Jane' },
        psychological_profile: {
          archetype_summary: 'Adventurer',
          subtext_analysis: {
            vulnerability_indicators: 'Seeks connection',
            power_dynamics: 'Equal',
          },
        },
        prompts: [{ question: 'Favorite place?', answer: 'Beach' }],
      };

      const result = await regenerateOpeners(profileAnalysis);

      expect(mockCallAnthropicForArray).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].message).toBe('Love your travel pics!');
    });
  });

  describe('regeneratePromptOpener', () => {
    it('should regenerate opener for specific prompt', async () => {
      const { regeneratePromptOpener } = await import('./ai');

      const mockOpener = {
        message: 'Great taste in music!',
        tactic: 'connection',
        why_it_works: 'Shared interest',
      };

      mockCallAnthropicForObject.mockResolvedValue(mockOpener);

      // Function signature: regeneratePromptOpener(prompt, profileContext, userContext?)
      const promptData = {
        question: "What's your favorite music?",
        answer: 'Indie rock',
        analysis: 'Music lover',
      };

      const profileContext = {
        name: 'Jane',
        archetype_summary: 'Creative soul',
        vulnerability_indicators: 'Artistic',
      };

      const result = await regeneratePromptOpener(promptData, profileContext);

      expect(mockCallAnthropicForObject).toHaveBeenCalled();
      expect(result.message).toBe('Great taste in music!');
    });
  });

  describe('getDateSuggestions', () => {
    it('should get date suggestions', async () => {
      const { getDateSuggestions } = await import('./ai');

      const mockSuggestions = [
        {
          name: 'Coffee at Blue Bottle',
          type: 'coffee',
          location: 'Downtown',
          why_good_fit: 'Casual and relaxed',
        },
      ];

      mockCallAnthropicForArray.mockResolvedValue(mockSuggestions);

      // Function signature: getDateSuggestions(matchLocation, userLocation, matchInterests, userGoal, options?)
      const result = await getDateSuggestions(
        'San Francisco', // matchLocation
        'Oakland',       // userLocation
        ['coffee', 'art'], // matchInterests
        'long-term'      // userGoal
      );

      expect(mockCallAnthropicForArray).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('coffee');
    });
  });

  describe('scoreUserResponse', () => {
    it('should score user response', async () => {
      const { scoreUserResponse } = await import('./ai');

      const mockScore = {
        score: 8,
        explanation: 'Good balance of wit and vulnerability',
        growth_note: 'Keep engaging authentically',
      };

      mockCallAnthropicForObject.mockResolvedValue(mockScore);

      // Function signature: scoreUserResponse(userResponse, matchContext, userContext, suggestedResponses)
      const userResponse = 'That sounds fun!';
      const matchContext = {
        archetype: 'Explorer',
        detectedAgenda: 'relationship',
        detectedTactics: ['flirting'],
        subtext: 'Interested in connection',
      };
      const userContext = {
        archetype: 'Caregiver',
        growthAreas: ['assertiveness'],
        communicationStyle: 'warm',
      };
      const suggestedResponses = [
        {
          message: 'Tell me more!',
          tactic: 'curiosity',
          why_it_works: 'Shows interest',
          growth_insight: 'Encourages engagement',
        },
      ];

      const result = await scoreUserResponse(userResponse, matchContext, userContext, suggestedResponses);

      expect(mockCallAnthropicForObject).toHaveBeenCalled();
      expect(result.score).toBe(8);
    });
  });

  describe('askAboutMatch', () => {
    it('should answer questions about match', async () => {
      const { askAboutMatch } = await import('./ai');

      mockCallAnthropicForText.mockResolvedValue(
        'Based on their profile, they seem to value adventure and spontaneity.'
      );

      const mockAnalysis = {
        basics: { name: 'Jane' },
        psychological_profile: { archetype_summary: 'Explorer' },
      };

      // Function signature: askAboutMatch(input: AskAboutMatchInput)
      const result = await askAboutMatch({
        question: 'What are they looking for?',
        matchAnalysis: mockAnalysis as any,
      });

      expect(mockCallAnthropicForText).toHaveBeenCalled();
      expect(result).toContain('adventure');
    });
  });

  describe('extractUserAspects', () => {
    it('should extract user aspects from input', async () => {
      const { extractUserAspects } = await import('./ai');

      const mockAspects = {
        scores: [
          { aspect_id: 'vigor', score: 85, evidence: 'Active lifestyle' },
          { aspect_id: 'curiosity', score: 90, evidence: 'Lifelong learner' },
        ],
        dominant_aspects: ['curiosity', 'vigor'],
        shadow_aspects: ['order'],
        realm_summary: {
          vitality: 'High energy',
          connection: 'Warm',
          structure: 'Flexible',
        },
      };

      mockCallAnthropicForObject.mockResolvedValue(mockAspects);

      // Function expects UserAspectsInput, not a synthesis object
      const input = {
        archetype_summary: 'Explorer',
        communication_style: 'Direct',
        attachment_patterns: 'Secure',
        dating_goal: 'long-term',
        what_to_look_for: ['authenticity'],
        growth_areas: ['patience'],
      };

      const result = await extractUserAspects(input);

      expect(mockCallAnthropicForObject).toHaveBeenCalled();
      expect(result.scores).toHaveLength(2);
      expect(result.dominant_aspects).toContain('curiosity');
      // Function also adds lastUpdated timestamp
      expect(result.lastUpdated).toBeDefined();
    });
  });

  // ==================== Type Tests ====================
  describe('Type Exports', () => {
    it('should have correct UserContextForMatch shape', () => {
      const context: UserContextForMatch = {
        goal_type: 'long-term',
        archetype_summary: 'The Explorer',
        communication_style: 'direct',
        what_to_look_for: ['intelligence'],
        what_to_avoid: ['dishonesty'],
        opener_style_recommendations: ['playful'],
        location: 'NYC',
        relationship_style: ['monogamous'],
      };

      expect(context.goal_type).toBe('long-term');
      expect(context.what_to_look_for).toContain('intelligence');
    });

    it('should have correct RecommendedOpener shape', () => {
      const opener: RecommendedOpener = {
        type: 'match_opener',
        message: 'Hello!',
        tactic: 'friendly',
        why_it_works: 'casual tone',
      };

      expect(opener.type).toBe('match_opener');
      expect(opener.message).toBe('Hello!');
    });

    it('should have correct PromptOpener shape', () => {
      const opener: PromptOpener = {
        message: 'Great answer!',
        tactic: 'compliment',
        why_it_works: 'shows interest',
      };

      expect(opener.message).toBe('Great answer!');
      expect(opener.tactic).toBe('compliment');
    });
  });

  // ==================== Edge Cases ====================
  describe('Edge Cases', () => {
    it('analyzeQuickBasicsResult should limit frames to first 3', async () => {
      const { analyzeQuickBasicsResult } = await import('./ai');

      mockCallAnthropicForObject.mockResolvedValue({
        meta: {},
        basics: { name: 'Test' },
      });

      const frames = ['frame1', 'frame2', 'frame3', 'frame4', 'frame5'];
      await analyzeQuickBasicsResult(frames);

      expect(mockCallAnthropicForObject).toHaveBeenCalled();
    });

    it('should handle undefined user context gracefully', async () => {
      const { regenerateOpeners } = await import('./ai');

      const mockOpeners = [
        {
          type: 'like_comment' as const,
          message: 'Hey!',
          tactic: 'casual',
          why_it_works: 'Simple',
        },
      ];

      mockCallAnthropicForArray.mockResolvedValue(mockOpeners);

      const profileAnalysis = {
        basics: { name: 'Jane' },
        psychological_profile: {
          archetype_summary: undefined,
          subtext_analysis: {
            vulnerability_indicators: undefined,
            power_dynamics: undefined,
          },
        },
        prompts: [],
      };

      const result = await regenerateOpeners(profileAnalysis as any);

      expect(result).toHaveLength(1);
    });
  });

  // ==================== API Error Handling ====================
  describe('API Error Handling', () => {
    it('should propagate API errors from analyzeProfile', async () => {
      const { analyzeProfile } = await import('./ai');

      mockCallAnthropicForObject.mockRejectedValue(new Error('API Error: Rate limited'));

      await expect(analyzeProfile(['frame1'])).rejects.toThrow('API Error');
    });

    it('should propagate API errors from getZodiacCompatibility', async () => {
      const { getZodiacCompatibility } = await import('./ai');

      mockCallAnthropicForObject.mockRejectedValue(new Error('API Error'));

      await expect(getZodiacCompatibility('Aries', 'Leo')).rejects.toThrow('API Error');
    });
  });
});
