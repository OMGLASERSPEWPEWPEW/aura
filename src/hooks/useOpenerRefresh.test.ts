// src/hooks/useOpenerRefresh.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOpenerRefresh } from './useOpenerRefresh';
import type { Profile, UserIdentity } from '../lib/db';
import { createWrapper } from '../test/testUtils';

// Mock dependencies
vi.mock('../lib/ai', () => ({
  regenerateOpeners: vi.fn(),
  regeneratePromptOpener: vi.fn(),
}));

vi.mock('../lib/db', () => ({
  db: {
    profiles: {
      update: vi.fn().mockResolvedValue(1),
    },
  },
}));

vi.mock('../lib/utils', () => ({
  buildUserContextForMatch: vi.fn(() => ({
    goal_type: 'long-term',
    archetype_summary: 'Explorer',
  })),
}));

vi.mock('../lib/utils/profileHelpers', () => ({
  extractAnalysisFields: vi.fn(() => ({
    basics: { name: 'Test' },
    psych: { archetype_summary: 'The Explorer' },
    prompts: [
      { question: 'What do you do?', answer: 'I explore', analysis: 'Adventurous' },
    ],
  })),
  getProfileContextForOpeners: vi.fn(() => ({
    name: 'Test',
    archetype_summary: 'The Explorer',
    vulnerability_indicators: 'Seeks connection',
  })),
}));

describe('useOpenerRefresh', () => {
  const mockProfile: Partial<Profile> = {
    id: 1,
    name: 'Test Match',
    analysis: {
      recommended_openers: [],
      prompts: [{ question: 'Q1', answer: 'A1', analysis: 'Analysis' }],
    },
  };

  const mockUserIdentity: Partial<UserIdentity> = {
    id: 1,
    datingGoals: { type: 'long-term' },
  };

  const mockNewOpeners = [
    {
      type: 'like_comment' as const,
      message: 'Love your adventure!',
      tactic: 'compliment',
      why_it_works: 'Shows genuine interest',
    },
  ];

  const mockPromptOpener = {
    message: 'Great answer!',
    tactic: 'engagement',
    why_it_works: 'Creates connection',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() =>
      useOpenerRefresh(undefined, undefined),
      { wrapper: createWrapper() }
    );

    expect(result.current.isRefreshingOpeners).toBe(false);
    expect(result.current.refreshingPromptIndex).toBeNull();
  });

  it('should refresh all openers successfully', async () => {
    const { regenerateOpeners } = await import('../lib/ai');
    const { db } = await import('../lib/db');

    vi.mocked(regenerateOpeners).mockResolvedValue(mockNewOpeners);

    const { result } = renderHook(() =>
      useOpenerRefresh(mockProfile as Profile, mockUserIdentity as UserIdentity),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await result.current.refreshAll();
    });

    expect(regenerateOpeners).toHaveBeenCalled();
    expect(db.profiles.update).toHaveBeenCalledWith(1, {
      analysis: expect.objectContaining({
        recommended_openers: mockNewOpeners,
      }),
    });
  });

  it('should set loading state during refreshAll', async () => {
    const { regenerateOpeners } = await import('../lib/ai');

    let resolvePromise: (value: typeof mockNewOpeners) => void;
    vi.mocked(regenerateOpeners).mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      })
    );

    const { result } = renderHook(() =>
      useOpenerRefresh(mockProfile as Profile, mockUserIdentity as UserIdentity),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.refreshAll();
    });

    expect(result.current.isRefreshingOpeners).toBe(true);

    await act(async () => {
      resolvePromise!(mockNewOpeners);
    });

    expect(result.current.isRefreshingOpeners).toBe(false);
  });

  it('should refresh specific prompt opener', async () => {
    const { regeneratePromptOpener } = await import('../lib/ai');
    const { db } = await import('../lib/db');

    vi.mocked(regeneratePromptOpener).mockResolvedValue(mockPromptOpener);

    const { result } = renderHook(() =>
      useOpenerRefresh(mockProfile as Profile, mockUserIdentity as UserIdentity),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await result.current.refreshPrompt(0);
    });

    expect(regeneratePromptOpener).toHaveBeenCalled();
    expect(db.profiles.update).toHaveBeenCalled();
  });

  it('should set refreshingPromptIndex during prompt refresh', async () => {
    const { regeneratePromptOpener } = await import('../lib/ai');

    let resolvePromise: (value: typeof mockPromptOpener) => void;
    vi.mocked(regeneratePromptOpener).mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      })
    );

    const { result } = renderHook(() =>
      useOpenerRefresh(mockProfile as Profile, mockUserIdentity as UserIdentity),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.refreshPrompt(0);
    });

    expect(result.current.refreshingPromptIndex).toBe(0);

    await act(async () => {
      resolvePromise!(mockPromptOpener);
    });

    expect(result.current.refreshingPromptIndex).toBeNull();
  });

  it('should not refresh when profile is undefined', async () => {
    const { regenerateOpeners } = await import('../lib/ai');

    const { result } = renderHook(() =>
      useOpenerRefresh(undefined, mockUserIdentity as UserIdentity),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await result.current.refreshAll();
    });

    expect(regenerateOpeners).not.toHaveBeenCalled();
  });

  it('should handle refreshAll errors gracefully', async () => {
    const { regenerateOpeners } = await import('../lib/ai');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(regenerateOpeners).mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() =>
      useOpenerRefresh(mockProfile as Profile, mockUserIdentity as UserIdentity),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await result.current.refreshAll();
    });

    expect(consoleSpy).toHaveBeenCalled();
    expect(result.current.isRefreshingOpeners).toBe(false);

    consoleSpy.mockRestore();
  });

  it('should handle refreshPrompt errors gracefully', async () => {
    const { regeneratePromptOpener } = await import('../lib/ai');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(regeneratePromptOpener).mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() =>
      useOpenerRefresh(mockProfile as Profile, mockUserIdentity as UserIdentity),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await result.current.refreshPrompt(0);
    });

    expect(consoleSpy).toHaveBeenCalled();
    expect(result.current.refreshingPromptIndex).toBeNull();

    consoleSpy.mockRestore();
  });

  it('should not refresh prompt with invalid index', async () => {
    const { regeneratePromptOpener } = await import('../lib/ai');
    const { extractAnalysisFields } = await import('../lib/utils/profileHelpers');

    vi.mocked(extractAnalysisFields).mockReturnValue({
      basics: {},
      psych: {},
      prompts: [],
    });

    const { result } = renderHook(() =>
      useOpenerRefresh(mockProfile as Profile, mockUserIdentity as UserIdentity),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await result.current.refreshPrompt(99);
    });

    expect(regeneratePromptOpener).not.toHaveBeenCalled();
  });
});
