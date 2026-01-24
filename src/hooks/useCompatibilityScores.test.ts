// src/hooks/useCompatibilityScores.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCompatibilityScores } from './useCompatibilityScores';
import type { Profile, UserIdentity, VirtueScore, MatchAspectScores } from '../lib/db';

// Mock dependencies
vi.mock('../lib/ai', () => ({
  scoreMatchVirtues: vi.fn(),
  scoreMatchAspects: vi.fn(),
}));

vi.mock('../lib/db', () => ({
  db: {
    profiles: {
      update: vi.fn().mockResolvedValue(1),
    },
  },
}));

describe('useCompatibilityScores', () => {
  const mockVirtueScores: VirtueScore[] = [
    { virtue_name: 'Curiosity', score: 8, evidence: 'Shows interest', anti_virtue_detected: false },
    { virtue_name: 'Honesty', score: 7, evidence: 'Direct communication', anti_virtue_detected: false },
  ];

  const mockAspectScores: MatchAspectScores = {
    scores: [
      { aspect_id: 'vigor', score: 75, evidence: 'Active lifestyle' },
      { aspect_id: 'curiosity', score: 80, evidence: 'Asks questions' },
    ],
    compatibility_insights: {
      strong_matches: ['vigor'],
      complementary: [],
      potential_friction: [],
    },
    overall_realm_compatibility: {
      vitality: 75,
      connection: 70,
      structure: 65,
    },
  };

  const mockProfile: Partial<Profile> = {
    id: 1,
    name: 'Test Match',
    analysis: {
      basics: { name: 'Test' },
      psychological_profile: { archetype_summary: 'Explorer' },
    },
  };

  const mockUserIdentityWithVirtues: Partial<UserIdentity> = {
    id: 1,
    synthesis: {
      partner_virtues: [
        { name: 'Curiosity', description: 'Love of learning', anti_virtue: 'Closed-mindedness' },
        { name: 'Honesty', description: 'Truthfulness', anti_virtue: 'Deception' },
      ],
    },
  };

  const mockUserIdentityWithAspects: Partial<UserIdentity> = {
    id: 1,
    synthesis: {
      aspect_profile: {
        scores: [
          { aspect_id: 'vigor', score: 80, evidence: 'Active' },
        ],
        dominant_aspects: ['vigor'],
        shadow_aspects: [],
        realm_summary: {},
        lastUpdated: new Date(),
      },
    },
  };

  const mockUserIdentityFull: Partial<UserIdentity> = {
    id: 1,
    synthesis: {
      partner_virtues: mockUserIdentityWithVirtues.synthesis?.partner_virtues,
      aspect_profile: mockUserIdentityWithAspects.synthesis?.aspect_profile,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() =>
      useCompatibilityScores(undefined, undefined)
    );

    expect(result.current.virtueScores).toBeUndefined();
    expect(result.current.aspectScores).toBeUndefined();
    expect(result.current.isLoadingVirtues).toBe(false);
    expect(result.current.isLoadingAspects).toBe(false);
    expect(result.current.virtueError).toBeNull();
    expect(result.current.aspectError).toBeNull();
    expect(result.current.canGenerateVirtues).toBe(false);
    expect(result.current.canGenerateAspects).toBe(false);
  });

  it('should load existing virtue scores from profile', async () => {
    const profileWithScores = {
      ...mockProfile,
      virtue_scores: mockVirtueScores,
    };

    const { result } = renderHook(() =>
      useCompatibilityScores(profileWithScores as Profile, mockUserIdentityWithVirtues as UserIdentity)
    );

    await waitFor(() => {
      expect(result.current.virtueScores).toEqual(mockVirtueScores);
    });
  });

  it('should load existing aspect scores from profile', async () => {
    const profileWithScores = {
      ...mockProfile,
      aspect_scores: mockAspectScores,
    };

    const { result } = renderHook(() =>
      useCompatibilityScores(profileWithScores as Profile, mockUserIdentityWithAspects as UserIdentity)
    );

    await waitFor(() => {
      expect(result.current.aspectScores).toEqual(mockAspectScores);
    });
  });

  it('should detect when virtue generation is possible', () => {
    const { result } = renderHook(() =>
      useCompatibilityScores(mockProfile as Profile, mockUserIdentityWithVirtues as UserIdentity)
    );

    expect(result.current.canGenerateVirtues).toBe(true);
  });

  it('should detect when aspect generation is possible', () => {
    const { result } = renderHook(() =>
      useCompatibilityScores(mockProfile as Profile, mockUserIdentityWithAspects as UserIdentity)
    );

    expect(result.current.canGenerateAspects).toBe(true);
  });

  it('should not allow virtue generation without partner virtues', () => {
    const { result } = renderHook(() =>
      useCompatibilityScores(mockProfile as Profile, { synthesis: {} } as UserIdentity)
    );

    expect(result.current.canGenerateVirtues).toBe(false);
  });

  it('should not allow aspect generation without aspect profile', () => {
    const { result } = renderHook(() =>
      useCompatibilityScores(mockProfile as Profile, { synthesis: {} } as UserIdentity)
    );

    expect(result.current.canGenerateAspects).toBe(false);
  });

  it('should generate virtue scores', async () => {
    const { scoreMatchVirtues } = await import('../lib/ai');
    const { db } = await import('../lib/db');

    vi.mocked(scoreMatchVirtues).mockResolvedValue(mockVirtueScores);

    const { result } = renderHook(() =>
      useCompatibilityScores(mockProfile as Profile, mockUserIdentityWithVirtues as UserIdentity)
    );

    await act(async () => {
      await result.current.generateVirtues();
    });

    expect(scoreMatchVirtues).toHaveBeenCalled();
    expect(result.current.virtueScores).toEqual(mockVirtueScores);
    expect(db.profiles.update).toHaveBeenCalledWith(1, {
      virtue_scores: mockVirtueScores,
    });
  });

  it('should generate aspect scores', async () => {
    const { scoreMatchAspects } = await import('../lib/ai');
    const { db } = await import('../lib/db');

    vi.mocked(scoreMatchAspects).mockResolvedValue(mockAspectScores);

    const { result } = renderHook(() =>
      useCompatibilityScores(mockProfile as Profile, mockUserIdentityWithAspects as UserIdentity)
    );

    await act(async () => {
      await result.current.generateAspects();
    });

    expect(scoreMatchAspects).toHaveBeenCalled();
    expect(result.current.aspectScores).toEqual(mockAspectScores);
    expect(db.profiles.update).toHaveBeenCalledWith(1, {
      aspect_scores: mockAspectScores,
    });
  });

  it('should set loading state during virtue generation', async () => {
    const { scoreMatchVirtues } = await import('../lib/ai');

    let resolvePromise: (value: VirtueScore[]) => void;
    vi.mocked(scoreMatchVirtues).mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      })
    );

    const { result } = renderHook(() =>
      useCompatibilityScores(mockProfile as Profile, mockUserIdentityWithVirtues as UserIdentity)
    );

    act(() => {
      result.current.generateVirtues();
    });

    expect(result.current.isLoadingVirtues).toBe(true);

    await act(async () => {
      resolvePromise!(mockVirtueScores);
    });

    expect(result.current.isLoadingVirtues).toBe(false);
  });

  it('should set loading state during aspect generation', async () => {
    const { scoreMatchAspects } = await import('../lib/ai');

    let resolvePromise: (value: MatchAspectScores) => void;
    vi.mocked(scoreMatchAspects).mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      })
    );

    const { result } = renderHook(() =>
      useCompatibilityScores(mockProfile as Profile, mockUserIdentityWithAspects as UserIdentity)
    );

    act(() => {
      result.current.generateAspects();
    });

    expect(result.current.isLoadingAspects).toBe(true);

    await act(async () => {
      resolvePromise!(mockAspectScores);
    });

    expect(result.current.isLoadingAspects).toBe(false);
  });

  it('should handle virtue generation errors', async () => {
    const { scoreMatchVirtues } = await import('../lib/ai');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(scoreMatchVirtues).mockRejectedValue(new Error('Virtue API Error'));

    const { result } = renderHook(() =>
      useCompatibilityScores(mockProfile as Profile, mockUserIdentityWithVirtues as UserIdentity)
    );

    await act(async () => {
      await result.current.generateVirtues();
    });

    expect(result.current.virtueError).toBe('Virtue API Error');
    expect(result.current.isLoadingVirtues).toBe(false);

    consoleSpy.mockRestore();
  });

  it('should handle aspect generation errors', async () => {
    const { scoreMatchAspects } = await import('../lib/ai');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(scoreMatchAspects).mockRejectedValue(new Error('Aspect API Error'));

    const { result } = renderHook(() =>
      useCompatibilityScores(mockProfile as Profile, mockUserIdentityWithAspects as UserIdentity)
    );

    await act(async () => {
      await result.current.generateAspects();
    });

    expect(result.current.aspectError).toBe('Aspect API Error');
    expect(result.current.isLoadingAspects).toBe(false);

    consoleSpy.mockRestore();
  });

  it('should not generate virtues when profile is undefined', async () => {
    const { scoreMatchVirtues } = await import('../lib/ai');

    const { result } = renderHook(() =>
      useCompatibilityScores(undefined, mockUserIdentityWithVirtues as UserIdentity)
    );

    await act(async () => {
      await result.current.generateVirtues();
    });

    expect(scoreMatchVirtues).not.toHaveBeenCalled();
  });

  it('should not generate aspects when profile is undefined', async () => {
    const { scoreMatchAspects } = await import('../lib/ai');

    const { result } = renderHook(() =>
      useCompatibilityScores(undefined, mockUserIdentityWithAspects as UserIdentity)
    );

    await act(async () => {
      await result.current.generateAspects();
    });

    expect(scoreMatchAspects).not.toHaveBeenCalled();
  });

  it('should generate all scores in parallel', async () => {
    const { scoreMatchVirtues, scoreMatchAspects } = await import('../lib/ai');

    vi.mocked(scoreMatchVirtues).mockResolvedValue(mockVirtueScores);
    vi.mocked(scoreMatchAspects).mockResolvedValue(mockAspectScores);

    const { result } = renderHook(() =>
      useCompatibilityScores(mockProfile as Profile, mockUserIdentityFull as UserIdentity)
    );

    await act(async () => {
      await result.current.generateAll();
    });

    expect(scoreMatchVirtues).toHaveBeenCalled();
    expect(scoreMatchAspects).toHaveBeenCalled();
    expect(result.current.virtueScores).toEqual(mockVirtueScores);
    expect(result.current.aspectScores).toEqual(mockAspectScores);
  });

  it('should not regenerate when scores already exist', () => {
    const profileWithScores = {
      ...mockProfile,
      virtue_scores: mockVirtueScores,
      aspect_scores: mockAspectScores,
    };

    const { result } = renderHook(() =>
      useCompatibilityScores(profileWithScores as Profile, mockUserIdentityFull as UserIdentity)
    );

    expect(result.current.canGenerateVirtues).toBe(false);
    expect(result.current.canGenerateAspects).toBe(false);
  });
});
