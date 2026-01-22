// src/hooks/useZodiacCompatibility.ts
import { useState, useEffect, useCallback } from 'react';
import { getZodiacCompatibility } from '../lib/ai';
import { db } from '../lib/db';
import type { Profile, ZodiacCompatibility, UserIdentity } from '../lib/db';
import { getUserZodiacSign, getUserArchetype } from '../lib/utils';
import { getMatchZodiacSign, extractAnalysisFields } from '../lib/utils/profileHelpers';

interface UseZodiacCompatibilityReturn {
  compatibility: ZodiacCompatibility | null;
  isLoading: boolean;
  error: string | null;
  userZodiac: string | undefined;
  matchZodiac: string | undefined;
  canGenerate: boolean;
  generate: () => Promise<void>;
  regenerate: () => Promise<void>;
}

/**
 * Hook for managing zodiac compatibility generation and state.
 */
export function useZodiacCompatibility(
  profile: Profile | undefined,
  userIdentity: UserIdentity | undefined
): UseZodiacCompatibilityReturn {
  const [compatibility, setCompatibility] = useState<ZodiacCompatibility | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userZodiac = getUserZodiacSign(userIdentity);
  const matchZodiac = profile ? getMatchZodiacSign(profile) : undefined;
  const canGenerate = !!userZodiac && !!matchZodiac;

  // Load existing zodiac compatibility from profile
  useEffect(() => {
    if (profile?.zodiac_compatibility) {
      setCompatibility(profile.zodiac_compatibility);
    }
  }, [profile]);

  const generateCompatibility = useCallback(async () => {
    if (!userZodiac || !matchZodiac || !profile) return;

    setIsLoading(true);
    setError(null);

    try {
      const userArchetype = getUserArchetype(userIdentity);
      const { psych } = extractAnalysisFields(profile.analysis);
      const matchArchetype = psych.archetype_summary;

      const result = await getZodiacCompatibility(
        userZodiac,
        matchZodiac,
        userArchetype,
        matchArchetype
      );

      setCompatibility(result);

      // Save to database
      await db.profiles.update(profile.id, {
        zodiac_compatibility: result,
      });
    } catch (err) {
      console.error('Zodiac compatibility error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate zodiac compatibility');
    } finally {
      setIsLoading(false);
    }
  }, [userZodiac, matchZodiac, profile, userIdentity]);

  return {
    compatibility,
    isLoading,
    error,
    userZodiac,
    matchZodiac,
    canGenerate,
    generate: generateCompatibility,
    regenerate: generateCompatibility,
  };
}
