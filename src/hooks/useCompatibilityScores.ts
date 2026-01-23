// src/hooks/useCompatibilityScores.ts
import { useState, useEffect, useCallback } from 'react';
import { scoreMatchVirtues, scoreMatchAspects } from '../lib/ai';
import { db } from '../lib/db';
import type { Profile, ProfileAnalysis, UserIdentity, VirtueScore, MatchAspectScores } from '../lib/db';

interface UseCompatibilityScoresReturn {
  virtueScores: VirtueScore[] | undefined;
  aspectScores: MatchAspectScores | undefined;
  isLoadingVirtues: boolean;
  isLoadingAspects: boolean;
  virtueError: string | null;
  aspectError: string | null;
  canGenerateVirtues: boolean;
  canGenerateAspects: boolean;
  generateVirtues: () => Promise<void>;
  generateAspects: () => Promise<void>;
  generateAll: () => Promise<void>;
}

/**
 * Hook for managing virtue and aspect compatibility scores.
 * Loads existing scores from the profile, or allows on-demand generation
 * if the user has synthesis data but the profile doesn't have scores yet.
 */
export function useCompatibilityScores(
  profile: Profile | undefined,
  userIdentity: UserIdentity | undefined
): UseCompatibilityScoresReturn {
  const [virtueScores, setVirtueScores] = useState<VirtueScore[] | undefined>(undefined);
  const [aspectScores, setAspectScores] = useState<MatchAspectScores | undefined>(undefined);
  const [isLoadingVirtues, setIsLoadingVirtues] = useState(false);
  const [isLoadingAspects, setIsLoadingAspects] = useState(false);
  const [virtueError, setVirtueError] = useState<string | null>(null);
  const [aspectError, setAspectError] = useState<string | null>(null);

  // Check if user has the required synthesis data
  const hasPartnerVirtues = !!(
    userIdentity?.synthesis?.partner_virtues &&
    userIdentity.synthesis.partner_virtues.length > 0
  );
  const hasAspectProfile = !!(
    userIdentity?.synthesis?.aspect_profile?.scores &&
    userIdentity.synthesis.aspect_profile.scores.length > 0
  );

  // Can generate if user has synthesis data and profile doesn't have scores yet
  const canGenerateVirtues = hasPartnerVirtues && (!virtueScores || virtueScores.length === 0);
  const canGenerateAspects = hasAspectProfile && (!aspectScores || !aspectScores.scores?.length);

  // Load existing scores from profile
  useEffect(() => {
    if (profile?.virtue_scores) {
      setVirtueScores(profile.virtue_scores);
    }
    if (profile?.aspect_scores) {
      setAspectScores(profile.aspect_scores);
    }
  }, [profile]);

  const generateVirtues = useCallback(async () => {
    if (!profile || !userIdentity?.synthesis?.partner_virtues) return;

    setIsLoadingVirtues(true);
    setVirtueError(null);

    try {
      const matchAnalysis = profile.analysis as ProfileAnalysis;
      const scores = await scoreMatchVirtues(
        matchAnalysis,
        userIdentity.synthesis.partner_virtues
      );

      setVirtueScores(scores);

      // Save to database
      await db.profiles.update(profile.id!, {
        virtue_scores: scores,
      });

      console.log('Virtue scores saved:', scores);
    } catch (err) {
      console.error('Virtue scoring error:', err);
      setVirtueError(err instanceof Error ? err.message : 'Failed to generate virtue scores');
    } finally {
      setIsLoadingVirtues(false);
    }
  }, [profile, userIdentity]);

  const generateAspects = useCallback(async () => {
    if (!profile || !userIdentity?.synthesis?.aspect_profile) return;

    setIsLoadingAspects(true);
    setAspectError(null);

    try {
      const matchAnalysis = profile.analysis as ProfileAnalysis;
      const scores = await scoreMatchAspects(
        matchAnalysis,
        userIdentity.synthesis.aspect_profile
      );

      setAspectScores(scores);

      // Save to database
      await db.profiles.update(profile.id!, {
        aspect_scores: scores,
      });

      console.log('Aspect scores saved:', scores);
    } catch (err) {
      console.error('Aspect scoring error:', err);
      setAspectError(err instanceof Error ? err.message : 'Failed to generate aspect scores');
    } finally {
      setIsLoadingAspects(false);
    }
  }, [profile, userIdentity]);

  const generateAll = useCallback(async () => {
    // Run both in parallel
    const promises: Promise<void>[] = [];

    if (canGenerateVirtues) {
      promises.push(generateVirtues());
    }
    if (canGenerateAspects) {
      promises.push(generateAspects());
    }

    if (promises.length > 0) {
      await Promise.allSettled(promises);
    }
  }, [canGenerateVirtues, canGenerateAspects, generateVirtues, generateAspects]);

  return {
    virtueScores,
    aspectScores,
    isLoadingVirtues,
    isLoadingAspects,
    virtueError,
    aspectError,
    canGenerateVirtues,
    canGenerateAspects,
    generateVirtues,
    generateAspects,
    generateAll,
  };
}
