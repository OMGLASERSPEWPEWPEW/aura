// src/hooks/useZodiacCompatibility.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useZodiacCompatibility } from './useZodiacCompatibility';
import type { Profile, UserIdentity, ZodiacCompatibility } from '../lib/db';
import { createWrapper } from '../test/testUtils';

// Mock dependencies
vi.mock('../lib/ai', () => ({
  getZodiacCompatibility: vi.fn(),
}));

vi.mock('../lib/db', () => ({
  db: {
    profiles: {
      update: vi.fn().mockResolvedValue(1),
    },
  },
}));

vi.mock('../lib/utils', () => ({
  getUserZodiacSign: vi.fn(),
  getUserArchetype: vi.fn(),
}));

vi.mock('../lib/utils/profileHelpers', () => ({
  getMatchZodiacSign: vi.fn(),
  extractAnalysisFields: vi.fn(() => ({
    basics: {},
    psych: { archetype_summary: 'The Explorer' },
    prompts: [],
  })),
}));

describe('useZodiacCompatibility', () => {
  const mockProfile: Partial<Profile> = {
    id: 1,
    name: 'Test Match',
    analysis: {},
  };

  const mockUserIdentity: Partial<UserIdentity> = {
    id: 1,
    synthesis: {
      psychological_profile: {
        archetype_summary: 'The Caregiver',
      },
    },
    manualInfo: {
      zodiacSign: 'Aries',
    },
  };

  const mockCompatibility: ZodiacCompatibility = {
    user_sign: 'Aries',
    match_sign: 'Leo',
    overall_score: 9,
    summary: 'Fire signs unite!',
    strengths: ['Passion', 'Energy'],
    challenges: ['Ego clashes'],
    advice: 'Channel your energy together',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with null compatibility', async () => {
    const { getUserZodiacSign } = await import('../lib/utils');
    const { getMatchZodiacSign } = await import('../lib/utils/profileHelpers');

    vi.mocked(getUserZodiacSign).mockReturnValue(undefined);
    vi.mocked(getMatchZodiacSign).mockReturnValue(undefined);

    const { result } = renderHook(() =>
      useZodiacCompatibility(undefined, undefined),
      { wrapper: createWrapper() }
    );

    expect(result.current.compatibility).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should detect when generation is possible', async () => {
    const { getUserZodiacSign } = await import('../lib/utils');
    const { getMatchZodiacSign } = await import('../lib/utils/profileHelpers');

    vi.mocked(getUserZodiacSign).mockReturnValue('Aries');
    vi.mocked(getMatchZodiacSign).mockReturnValue('Leo');

    const { result } = renderHook(() =>
      useZodiacCompatibility(mockProfile as Profile, mockUserIdentity as UserIdentity),
      { wrapper: createWrapper() }
    );

    expect(result.current.userZodiac).toBe('Aries');
    expect(result.current.matchZodiac).toBe('Leo');
    expect(result.current.canGenerate).toBe(true);
  });

  it('should not allow generation when zodiac signs are missing', async () => {
    const { getUserZodiacSign } = await import('../lib/utils');
    const { getMatchZodiacSign } = await import('../lib/utils/profileHelpers');

    vi.mocked(getUserZodiacSign).mockReturnValue('Aries');
    vi.mocked(getMatchZodiacSign).mockReturnValue(undefined);

    const { result } = renderHook(() =>
      useZodiacCompatibility(mockProfile as Profile, mockUserIdentity as UserIdentity),
      { wrapper: createWrapper() }
    );

    expect(result.current.canGenerate).toBe(false);
  });

  it('should load existing compatibility from profile', async () => {
    const { getUserZodiacSign } = await import('../lib/utils');
    const { getMatchZodiacSign } = await import('../lib/utils/profileHelpers');

    vi.mocked(getUserZodiacSign).mockReturnValue('Aries');
    vi.mocked(getMatchZodiacSign).mockReturnValue('Leo');

    const profileWithCompatibility = {
      ...mockProfile,
      zodiac_compatibility: mockCompatibility,
    };

    const { result } = renderHook(() =>
      useZodiacCompatibility(profileWithCompatibility as Profile, mockUserIdentity as UserIdentity),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.compatibility).toEqual(mockCompatibility);
    });
  });

  it('should generate new compatibility', async () => {
    const { getZodiacCompatibility } = await import('../lib/ai');
    const { getUserZodiacSign, getUserArchetype } = await import('../lib/utils');
    const { getMatchZodiacSign } = await import('../lib/utils/profileHelpers');
    const { db } = await import('../lib/db');

    vi.mocked(getUserZodiacSign).mockReturnValue('Aries');
    vi.mocked(getMatchZodiacSign).mockReturnValue('Leo');
    vi.mocked(getUserArchetype).mockReturnValue('The Caregiver');
    vi.mocked(getZodiacCompatibility).mockResolvedValue(mockCompatibility);

    const { result } = renderHook(() =>
      useZodiacCompatibility(mockProfile as Profile, mockUserIdentity as UserIdentity),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await result.current.generate();
    });

    expect(getZodiacCompatibility).toHaveBeenCalledWith(
      'Aries',
      'Leo',
      'The Caregiver',
      'The Explorer'
    );
    expect(result.current.compatibility).toEqual(mockCompatibility);
    expect(db.profiles.update).toHaveBeenCalledWith(1, {
      zodiac_compatibility: mockCompatibility,
    });
  });

  it('should handle generation errors', async () => {
    const { getZodiacCompatibility } = await import('../lib/ai');
    const { getUserZodiacSign } = await import('../lib/utils');
    const { getMatchZodiacSign } = await import('../lib/utils/profileHelpers');

    vi.mocked(getUserZodiacSign).mockReturnValue('Aries');
    vi.mocked(getMatchZodiacSign).mockReturnValue('Leo');
    vi.mocked(getZodiacCompatibility).mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() =>
      useZodiacCompatibility(mockProfile as Profile, mockUserIdentity as UserIdentity),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await result.current.generate();
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toBe('API Error');
    expect(result.current.compatibility).toBeNull();
  });

  it('should set loading state during generation', async () => {
    const { getZodiacCompatibility } = await import('../lib/ai');
    const { getUserZodiacSign } = await import('../lib/utils');
    const { getMatchZodiacSign } = await import('../lib/utils/profileHelpers');

    vi.mocked(getUserZodiacSign).mockReturnValue('Aries');
    vi.mocked(getMatchZodiacSign).mockReturnValue('Leo');

    let resolvePromise: (value: ZodiacCompatibility) => void;
    vi.mocked(getZodiacCompatibility).mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      })
    );

    const { result } = renderHook(() =>
      useZodiacCompatibility(mockProfile as Profile, mockUserIdentity as UserIdentity),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.generate();
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolvePromise!(mockCompatibility);
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('should not generate when profile is undefined', async () => {
    const { getZodiacCompatibility } = await import('../lib/ai');
    const { getUserZodiacSign } = await import('../lib/utils');
    const { getMatchZodiacSign } = await import('../lib/utils/profileHelpers');

    vi.mocked(getUserZodiacSign).mockReturnValue('Aries');
    vi.mocked(getMatchZodiacSign).mockReturnValue('Leo');

    const { result } = renderHook(() =>
      useZodiacCompatibility(undefined, mockUserIdentity as UserIdentity),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await result.current.generate();
    });

    expect(getZodiacCompatibility).not.toHaveBeenCalled();
  });

  it('regenerate should call the same function as generate', async () => {
    const { getZodiacCompatibility } = await import('../lib/ai');
    const { getUserZodiacSign } = await import('../lib/utils');
    const { getMatchZodiacSign } = await import('../lib/utils/profileHelpers');

    vi.mocked(getUserZodiacSign).mockReturnValue('Aries');
    vi.mocked(getMatchZodiacSign).mockReturnValue('Leo');
    vi.mocked(getZodiacCompatibility).mockResolvedValue(mockCompatibility);

    const { result } = renderHook(() =>
      useZodiacCompatibility(mockProfile as Profile, mockUserIdentity as UserIdentity),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await result.current.regenerate();
    });

    expect(getZodiacCompatibility).toHaveBeenCalled();
    expect(result.current.compatibility).toEqual(mockCompatibility);
  });
});
