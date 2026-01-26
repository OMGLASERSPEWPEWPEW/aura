// src/hooks/useConversationCoach.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useConversationCoach } from './useConversationCoach';
import type { Profile, UserIdentity, CoachingSession, CoachingResponse, MatchCoachingAnalysis } from '../lib/db';
import { createWrapper } from '../test/testUtils';

// Mock dexie-react-hooks
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(() => []),
}));

// Mock dependencies
vi.mock('../lib/ai', () => ({
  analyzeConversation: vi.fn(),
  scoreUserResponse: vi.fn(),
  generateDateAsk: vi.fn(),
}));

vi.mock('../lib/db', () => ({
  db: {
    coachingSessions: {
      add: vi.fn().mockResolvedValue(1),
      update: vi.fn().mockResolvedValue(1),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          reverse: vi.fn(() => ({
            sortBy: vi.fn().mockResolvedValue([]),
          })),
        })),
      })),
    },
  },
}));

vi.mock('../lib/utils/profileHelpers', () => ({
  extractAnalysisFields: vi.fn(() => ({
    basics: { name: 'Test Match' },
    psych: {
      archetype_summary: 'The Explorer',
      agendas: [{ type: 'relationship' }],
      predicted_tactics: ['flirting'],
      subtext_analysis: {
        vulnerability_indicators: 'Seeking connection',
        power_dynamics: 'Equal',
      },
    },
    prompts: [],
  })),
}));

describe('useConversationCoach', () => {
  const mockProfile: Partial<Profile> = {
    id: 1,
    name: 'Test Match',
    analysis: {},
  };

  const mockUserIdentity: Partial<UserIdentity> = {
    id: 1,
    datingGoals: { type: 'long-term' },
    synthesis: {
      psychological_profile: {
        archetype_summary: 'The Caregiver',
      },
      behavioral_insights: {
        attachment_patterns: 'Secure',
        communication_style: 'Warm',
        growth_areas: ['assertiveness'],
      },
    },
  };

  const mockMatchAnalysis: MatchCoachingAnalysis = {
    detected_agenda: 'relationship',
    detected_tactics: ['flirting', 'testing'],
    subtext: 'Interested but cautious',
  };

  const mockSuggestedResponses: CoachingResponse[] = [
    {
      message: 'That sounds great!',
      tactic: 'enthusiasm',
      why_it_works: 'Shows genuine interest',
      growth_insight: 'Encourages openness',
    },
  ];

  const mockAnalysisResult = {
    match_analysis: mockMatchAnalysis,
    suggested_responses: mockSuggestedResponses,
  };

  const mockDateAskSuggestions = [
    {
      message: "Let's grab coffee!",
      approach: 'Direct' as const,
      tactic: 'Straightforward',
      why_it_works: 'Clear intent',
    },
  ];

  const mockScoreResult = {
    score: 8,
    explanation: 'Good response!',
    growth_note: 'Keep it up',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() =>
      useConversationCoach(undefined, undefined),
      { wrapper: createWrapper() }
    );

    expect(result.current.conversationImages).toEqual([]);
    expect(result.current.isAnalyzing).toBe(false);
    expect(result.current.isScoring).toBe(false);
    expect(result.current.isGeneratingDateAsk).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.currentSession).toBeNull();
    expect(result.current.matchAnalysis).toBeNull();
    expect(result.current.suggestedResponses).toEqual([]);
    expect(result.current.dateAskSuggestions).toEqual([]);
  });

  it('should add images to conversation', () => {
    const { result } = renderHook(() =>
      useConversationCoach(mockProfile as Profile, mockUserIdentity as UserIdentity),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.addImages(['image1', 'image2']);
    });

    expect(result.current.conversationImages).toEqual(['image1', 'image2']);
  });

  it('should append images when addImages is called multiple times', () => {
    const { result } = renderHook(() =>
      useConversationCoach(mockProfile as Profile, mockUserIdentity as UserIdentity),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.addImages(['image1']);
    });

    act(() => {
      result.current.addImages(['image2', 'image3']);
    });

    expect(result.current.conversationImages).toEqual(['image1', 'image2', 'image3']);
  });

  it('should clear images', () => {
    const { result } = renderHook(() =>
      useConversationCoach(mockProfile as Profile, mockUserIdentity as UserIdentity),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.addImages(['image1', 'image2']);
    });

    act(() => {
      result.current.clearImages();
    });

    expect(result.current.conversationImages).toEqual([]);
  });

  it('should analyze conversation successfully', async () => {
    const { analyzeConversation } = await import('../lib/ai');
    const { db } = await import('../lib/db');

    vi.mocked(analyzeConversation).mockResolvedValue(mockAnalysisResult);

    const { result } = renderHook(() =>
      useConversationCoach(mockProfile as Profile, mockUserIdentity as UserIdentity),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.addImages(['image1']);
    });

    await act(async () => {
      await result.current.analyzeConversation();
    });

    expect(analyzeConversation).toHaveBeenCalled();
    expect(result.current.matchAnalysis).toEqual(mockMatchAnalysis);
    expect(result.current.suggestedResponses).toEqual(mockSuggestedResponses);
    expect(db.coachingSessions.add).toHaveBeenCalled();
  });

  it('should set error when analyzing without images', async () => {
    const { result } = renderHook(() =>
      useConversationCoach(mockProfile as Profile, mockUserIdentity as UserIdentity),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await result.current.analyzeConversation();
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toBe('Please add conversation screenshots first.');
  });

  it('should set loading state during analysis', async () => {
    const { analyzeConversation } = await import('../lib/ai');

    let resolvePromise: (value: typeof mockAnalysisResult) => void;
    vi.mocked(analyzeConversation).mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      })
    );

    const { result } = renderHook(() =>
      useConversationCoach(mockProfile as Profile, mockUserIdentity as UserIdentity),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.addImages(['image1']);
    });

    act(() => {
      result.current.analyzeConversation();
    });

    expect(result.current.isAnalyzing).toBe(true);

    await act(async () => {
      resolvePromise!(mockAnalysisResult);
    });

    expect(result.current.isAnalyzing).toBe(false);
  });

  it('should score user response', async () => {
    const { analyzeConversation, scoreUserResponse } = await import('../lib/ai');

    vi.mocked(analyzeConversation).mockResolvedValue(mockAnalysisResult);
    vi.mocked(scoreUserResponse).mockResolvedValue(mockScoreResult);

    const { result } = renderHook(() =>
      useConversationCoach(mockProfile as Profile, mockUserIdentity as UserIdentity),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.addImages(['image1']);
    });

    await act(async () => {
      await result.current.analyzeConversation();
    });

    let scoreResult;
    await act(async () => {
      scoreResult = await result.current.scoreResponse('Great message!');
    });

    expect(scoreUserResponse).toHaveBeenCalled();
    expect(scoreResult).toEqual(mockScoreResult);
  });

  it('should return null when scoring without analysis', async () => {
    const { result } = renderHook(() =>
      useConversationCoach(mockProfile as Profile, mockUserIdentity as UserIdentity),
      { wrapper: createWrapper() }
    );

    let scoreResult;
    await act(async () => {
      scoreResult = await result.current.scoreResponse('Test');
    });

    expect(scoreResult).toBeNull();
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toBe('No analysis to score against.');
  });

  it('should generate date ask suggestions', async () => {
    const { generateDateAsk } = await import('../lib/ai');

    vi.mocked(generateDateAsk).mockResolvedValue(mockDateAskSuggestions);

    const { result } = renderHook(() =>
      useConversationCoach(mockProfile as Profile, mockUserIdentity as UserIdentity),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.addImages(['image1']);
    });

    await act(async () => {
      await result.current.generateDateAskSuggestions();
    });

    expect(generateDateAsk).toHaveBeenCalled();
    expect(result.current.dateAskSuggestions).toEqual(mockDateAskSuggestions);
  });

  it('should set error when generating date ask without images', async () => {
    const { result } = renderHook(() =>
      useConversationCoach(mockProfile as Profile, mockUserIdentity as UserIdentity),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await result.current.generateDateAskSuggestions();
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toBe('Please add conversation screenshots first.');
  });

  it('should load previous session', () => {
    const mockSession: CoachingSession = {
      id: 1,
      profileId: 1,
      timestamp: new Date(),
      conversationImages: ['old_image'],
      matchAnalysis: mockMatchAnalysis,
      suggestedResponses: mockSuggestedResponses,
    };

    const { result } = renderHook(() =>
      useConversationCoach(mockProfile as Profile, mockUserIdentity as UserIdentity),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.loadSession(mockSession);
    });

    expect(result.current.currentSession).toEqual(mockSession);
    expect(result.current.matchAnalysis).toEqual(mockMatchAnalysis);
    expect(result.current.suggestedResponses).toEqual(mockSuggestedResponses);
    expect(result.current.conversationImages).toEqual(['old_image']);
  });

  it('should clear session', () => {
    const mockSession: CoachingSession = {
      id: 1,
      profileId: 1,
      timestamp: new Date(),
      conversationImages: ['old_image'],
      matchAnalysis: mockMatchAnalysis,
      suggestedResponses: mockSuggestedResponses,
    };

    const { result } = renderHook(() =>
      useConversationCoach(mockProfile as Profile, mockUserIdentity as UserIdentity),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.loadSession(mockSession);
    });

    act(() => {
      result.current.clearSession();
    });

    expect(result.current.currentSession).toBeNull();
    expect(result.current.matchAnalysis).toBeNull();
    expect(result.current.suggestedResponses).toEqual([]);
    expect(result.current.conversationImages).toEqual([]);
  });

  it('should handle analysis errors', async () => {
    const { analyzeConversation } = await import('../lib/ai');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(analyzeConversation).mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() =>
      useConversationCoach(mockProfile as Profile, mockUserIdentity as UserIdentity),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.addImages(['image1']);
    });

    await act(async () => {
      await result.current.analyzeConversation();
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toBe('API Error');
    expect(result.current.isAnalyzing).toBe(false);

    consoleSpy.mockRestore();
  });

  it('should clear error after 5 seconds', async () => {
    const { result } = renderHook(() =>
      useConversationCoach(mockProfile as Profile, mockUserIdentity as UserIdentity),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await result.current.analyzeConversation();
    });

    expect(result.current.error).not.toBeNull();

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.error).toBeNull();
  });

  it('should refresh responses', async () => {
    const { analyzeConversation } = await import('../lib/ai');

    vi.mocked(analyzeConversation).mockResolvedValue(mockAnalysisResult);

    const { result } = renderHook(() =>
      useConversationCoach(mockProfile as Profile, mockUserIdentity as UserIdentity),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.addImages(['image1']);
    });

    await act(async () => {
      await result.current.refreshResponses();
    });

    expect(analyzeConversation).toHaveBeenCalled();
    expect(result.current.matchAnalysis).toEqual(mockMatchAnalysis);
  });

  it('should set error when refreshing without conversation', async () => {
    const { result } = renderHook(() =>
      useConversationCoach(mockProfile as Profile, mockUserIdentity as UserIdentity),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await result.current.refreshResponses();
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toBe('No conversation to refresh.');
  });
});
