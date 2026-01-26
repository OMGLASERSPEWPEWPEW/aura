// src/hooks/useOpenerRefresh.ts
import { useState, useCallback } from 'react';
import { regenerateOpeners, regeneratePromptOpener } from '../lib/ai';
import { db } from '../lib/db';
import type { Profile, UserIdentity } from '../lib/db';
import { buildUserContextForMatch } from '../lib/utils';
import { extractAnalysisFields, getProfileContextForOpeners } from '../lib/utils/profileHelpers';
import { AuraError, ApiError } from '../lib/errors';
import { useErrorToast } from '../contexts/ToastContext';

interface UseOpenerRefreshReturn {
  isRefreshingOpeners: boolean;
  refreshingPromptIndex: number | null;
  error: AuraError | null;
  refreshAll: () => Promise<void>;
  refreshPrompt: (promptIndex: number) => Promise<void>;
}

/**
 * Hook for managing opener regeneration.
 */
export function useOpenerRefresh(
  profile: Profile | undefined,
  userIdentity: UserIdentity | undefined
): UseOpenerRefreshReturn {
  const [isRefreshingOpeners, setIsRefreshingOpeners] = useState(false);
  const [refreshingPromptIndex, setRefreshingPromptIndex] = useState<number | null>(null);
  const [error, setError] = useState<AuraError | null>(null);
  const showError = useErrorToast();

  // Refresh all openers
  const refreshAll = useCallback(async () => {
    if (!profile) return;

    setIsRefreshingOpeners(true);

    try {
      const { basics, psych, prompts } = extractAnalysisFields(profile.analysis);
      const userContext = buildUserContextForMatch(userIdentity);

      const analysisForApi = {
        basics: basics as Record<string, unknown>,
        psychological_profile: psych,
        prompts,
      };

      const newOpeners = await regenerateOpeners(analysisForApi, userContext);

      // Update the profile in database
      const updatedAnalysis = {
        ...profile.analysis,
        recommended_openers: newOpeners,
      };

      await db.profiles.update(profile.id, { analysis: updatedAnalysis });
    } catch (err) {
      const auraError = err instanceof AuraError
        ? err
        : new ApiError(err instanceof Error ? err.message : 'Failed to refresh openers', { cause: err instanceof Error ? err : undefined });
      console.log('useOpenerRefresh:', auraError.code, auraError.message);
      setError(auraError);
      showError(auraError);
    } finally {
      setIsRefreshingOpeners(false);
    }
  }, [profile, userIdentity, showError]);

  // Refresh opener for a specific prompt
  const refreshPrompt = useCallback(
    async (promptIndex: number) => {
      if (!profile) return;

      const { prompts } = extractAnalysisFields(profile.analysis);
      if (!prompts[promptIndex]) return;

      setRefreshingPromptIndex(promptIndex);

      try {
        const prompt = prompts[promptIndex];
        const profileContext = getProfileContextForOpeners(profile);
        const userContext = buildUserContextForMatch(userIdentity);

        const newOpener = await regeneratePromptOpener(prompt, profileContext, userContext);

        // Update the specific prompt's opener
        const updatedPrompts = [...prompts];
        updatedPrompts[promptIndex] = {
          ...updatedPrompts[promptIndex],
          suggested_opener: newOpener,
        };

        const updatedAnalysis = {
          ...profile.analysis,
          prompts: updatedPrompts,
        };

        await db.profiles.update(profile.id, { analysis: updatedAnalysis });
      } catch (err) {
        const auraError = err instanceof AuraError
          ? err
          : new ApiError(err instanceof Error ? err.message : 'Failed to refresh opener', { cause: err instanceof Error ? err : undefined });
        console.log('useOpenerRefresh:', auraError.code, auraError.message);
        setError(auraError);
        showError(auraError);
      } finally {
        setRefreshingPromptIndex(null);
      }
    },
    [profile, userIdentity, showError]
  );

  return {
    isRefreshingOpeners,
    refreshingPromptIndex,
    error,
    refreshAll,
    refreshPrompt,
  };
}
