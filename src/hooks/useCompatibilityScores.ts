// src/hooks/useCompatibilityScores.ts
import { useState, useEffect, useCallback } from 'react';
import { scoreMatchVirtues, scoreMatchAspects, scoreMatchVirtues11 } from '../lib/ai';
import { db } from '../lib/db';
import type {
  Profile,
  ProfileAnalysis,
  UserIdentity,
  VirtueScore,
  MatchAspectScores,
  UserVirtueProfile,
  MatchVirtueCompatibility,
} from '../lib/db';

interface UseCompatibilityScoresReturn {
  // Legacy systems (deprecated but still supported)
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

  // NEW: 11 Virtues system (primary)
  virtues11: MatchVirtueCompatibility | undefined;
  userVirtueProfile: UserVirtueProfile | undefined;
  isLoadingVirtues11: boolean;
  virtues11Error: string | null;
  canGenerateVirtues11: boolean;
  generateVirtues11: () => Promise<void>;

  // Combined actions
  generateAll: () => Promise<void>;
}

/**
 * Hook for managing virtue and aspect compatibility scores.
 * Loads existing scores from the profile, or allows on-demand generation
 * if the user has synthesis data but the profile doesn't have scores yet.
 *
 * Supports three systems:
 * 1. NEW: 11 Virtues (primary) - Uses virtue_profile from UserSynthesis
 * 2. DEPRECATED: Partner Virtues (5 virtues) - Uses partner_virtues from UserSynthesis
 * 3. DEPRECATED: 23 Aspects - Uses aspect_profile from UserSynthesis
 */
export function useCompatibilityScores(
  profile: Profile | undefined,
  userIdentity: UserIdentity | undefined
): UseCompatibilityScoresReturn {
  // Legacy state
  const [virtueScores, setVirtueScores] = useState<VirtueScore[] | undefined>(undefined);
  const [aspectScores, setAspectScores] = useState<MatchAspectScores | undefined>(undefined);
  const [isLoadingVirtues, setIsLoadingVirtues] = useState(false);
  const [isLoadingAspects, setIsLoadingAspects] = useState(false);
  const [virtueError, setVirtueError] = useState<string | null>(null);
  const [aspectError, setAspectError] = useState<string | null>(null);

  // 11 Virtues state
  const [virtues11, setVirtues11] = useState<MatchVirtueCompatibility | undefined>(undefined);
  const [isLoadingVirtues11, setIsLoadingVirtues11] = useState(false);
  const [virtues11Error, setVirtues11Error] = useState<string | null>(null);

  // User's virtue profile (for display in UI)
  const userVirtueProfile = userIdentity?.synthesis?.virtue_profile;

  // Check if user has the required synthesis data
  const hasPartnerVirtues = !!(
    userIdentity?.synthesis?.partner_virtues &&
    userIdentity.synthesis.partner_virtues.length > 0
  );
  const hasAspectProfile = !!(
    userIdentity?.synthesis?.aspect_profile?.scores &&
    userIdentity.synthesis.aspect_profile.scores.length > 0
  );
  const hasVirtueProfile = !!(
    userIdentity?.synthesis?.virtue_profile?.scores &&
    userIdentity.synthesis.virtue_profile.scores.length > 0
  );

  // Can generate if user has synthesis data and profile doesn't have scores yet
  const canGenerateVirtues = hasPartnerVirtues && (!virtueScores || virtueScores.length === 0);
  const canGenerateAspects = hasAspectProfile && (!aspectScores || !aspectScores.scores?.length);
  const canGenerateVirtues11 = hasVirtueProfile && !virtues11;

  // Load existing scores from profile
  useEffect(() => {
    if (profile?.virtue_scores) {
      setVirtueScores(profile.virtue_scores);
    }
    if (profile?.aspect_scores) {
      setAspectScores(profile.aspect_scores);
    }
    if (profile?.virtues_11) {
      setVirtues11(profile.virtues_11);
    }
  }, [profile]);

  // Generate legacy partner virtues scores
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

  // Generate legacy 23 Aspects scores
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

  // Generate 11 Virtues compatibility scores (primary system)
  const generateVirtues11 = useCallback(async () => {
    if (!profile || !userIdentity?.synthesis?.virtue_profile) {
      console.log('Cannot generate 11 Virtues: missing profile or virtue_profile');
      return;
    }

    setIsLoadingVirtues11(true);
    setVirtues11Error(null);

    try {
      const matchAnalysis = profile.analysis as ProfileAnalysis;
      const compatibility = await scoreMatchVirtues11(
        matchAnalysis,
        userIdentity.synthesis.virtue_profile
      );

      setVirtues11(compatibility);

      // Save to database
      await db.profiles.update(profile.id!, {
        virtues_11: compatibility,
      });

      console.log('11 Virtues compatibility saved:', compatibility);
    } catch (err) {
      console.error('11 Virtues scoring error:', err);
      setVirtues11Error(err instanceof Error ? err.message : 'Failed to generate 11 Virtues compatibility');
    } finally {
      setIsLoadingVirtues11(false);
    }
  }, [profile, userIdentity]);

  // Generate all scores in parallel
  const generateAll = useCallback(async () => {
    const promises: Promise<void>[] = [];

    // Prioritize 11 Virtues (new system)
    if (canGenerateVirtues11) {
      promises.push(generateVirtues11());
    }

    // Also run legacy systems if available
    if (canGenerateVirtues) {
      promises.push(generateVirtues());
    }
    if (canGenerateAspects) {
      promises.push(generateAspects());
    }

    if (promises.length > 0) {
      await Promise.allSettled(promises);
    }
  }, [canGenerateVirtues11, canGenerateVirtues, canGenerateAspects, generateVirtues11, generateVirtues, generateAspects]);

  return {
    // Legacy systems
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

    // 11 Virtues system
    virtues11,
    userVirtueProfile,
    isLoadingVirtues11,
    virtues11Error,
    canGenerateVirtues11,
    generateVirtues11,

    // Combined
    generateAll,
  };
}
