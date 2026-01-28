// src/hooks/useStreamingAnalysis.ts
// State machine hook for streaming profile analysis (match profiles)

import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  analyzeProfileStreaming,
  accumulatedToProfileAnalysis,
  createInitialAccumulatedProfile,
  type AccumulatedProfile,
} from '../lib/ai';
import { db, type Profile } from '../lib/db';
import { generateAndSaveMoodboard } from '../lib/moodboard';
import { supabase } from '../lib/supabase';
import { pushProfile, updateProfileOnServer } from '../lib/sync';
import { SyncError, StorageError } from '../lib/errors';
import {
  useStreamingAnalysisCore,
  type StreamingAnalysisStateBase,
  type ChunkAnalysisOptions,
} from './useStreamingAnalysisCore';

export interface StreamingAnalysisState extends StreamingAnalysisStateBase<AccumulatedProfile> {
  savedProfileId: number | null;
}

export interface UseStreamingAnalysisReturn {
  state: StreamingAnalysisState;
  startAnalysis: (file: File) => Promise<void>;
  abort: (saveProgress: boolean) => Promise<void>;
  reset: () => void;
  canAbort: boolean;
  hasMinimumViableProfile: boolean;
  isProcessing: boolean;
}

export function useStreamingAnalysis(): UseStreamingAnalysisReturn {
  // Additional state for match profiles: saved profile ID
  const [savedProfileId, setSavedProfileId] = useState<number | null>(null);
  const savedProfileIdRef = useRef<number | null>(null);
  const moodboardGenerationRef = useRef<Promise<void> | null>(null);
  const navigate = useNavigate();

  // Sync a profile to the server (non-blocking, logs errors)
  const syncProfileToServer = useCallback(async (localProfile: Profile) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.log('useStreamingAnalysis: No user, skipping server sync');
        return;
      }

      if (localProfile.serverId) {
        await updateProfileOnServer(localProfile, user.id);
        console.log(`useStreamingAnalysis: Updated profile ${localProfile.id} on server`);
      } else {
        const serverId = await pushProfile(localProfile, user.id);
        console.log(`useStreamingAnalysis: Pushed profile ${localProfile.id} to server, serverId: ${serverId}`);
      }
    } catch (error) {
      const syncError = new SyncError(
        `Server sync failed: ${error instanceof Error ? error.message : String(error)}`,
        {
          operation: localProfile.serverId ? 'update' : 'push',
          context: { profileId: localProfile.id },
          cause: error instanceof Error ? error : undefined,
        }
      );
      console.log('useStreamingAnalysis: Server sync deferred:', syncError.code, syncError.message);
    }
  }, []);

  // Save current progress to database
  const saveToDatabase = useCallback(
    async (
      profile: AccumulatedProfile,
      allFrames: string[],
      phase: 'quick' | 'complete' = 'quick'
    ): Promise<number> => {
      const analysis = accumulatedToProfileAnalysis(profile);
      const thumbnailIndex = profile.photos.thumbnailIndex;
      const thumbnail = allFrames[thumbnailIndex] || allFrames[0] || '';

      const profileId = await db.profiles.add({
        name: profile.identity.name || 'Unknown Match',
        age: profile.identity.age || undefined,
        appName: profile.identity.app || 'Unknown App',
        timestamp: new Date(),
        analysis: analysis,
        thumbnail: thumbnail,
        analysisPhase: phase,
      });

      const fullProfile = await db.profiles.get(profileId);
      if (fullProfile) {
        syncProfileToServer(fullProfile);
      }

      return profileId;
    },
    [syncProfileToServer]
  );

  // Update existing profile in database
  const updateProfile = useCallback(
    async (profileId: number, profile: AccumulatedProfile, allFrames: string[]): Promise<number> => {
      const analysis = accumulatedToProfileAnalysis(profile);
      const thumbnailIndex = profile.photos.thumbnailIndex;
      const thumbnail = allFrames[thumbnailIndex] || allFrames[0] || '';

      await db.profiles.update(profileId, {
        name: profile.identity.name || 'Unknown Match',
        age: profile.identity.age || undefined,
        appName: profile.identity.app || 'Unknown App',
        analysis: analysis,
        thumbnail: thumbnail,
        analysisPhase: 'quick',
      });

      const fullProfile = await db.profiles.get(profileId);
      if (fullProfile) {
        syncProfileToServer(fullProfile);
      }

      return profileId;
    },
    [syncProfileToServer]
  );

  // Start mood board generation in background (after chunk 3)
  const startMoodboardGeneration = useCallback(
    (profileId: number, accumulatedProfile: AccumulatedProfile): Promise<void> => {
      console.log('useStreamingAnalysis: Starting mood board generation for profile', profileId);

      const generationPromise = (async () => {
        try {
          const result = await generateAndSaveMoodboard(profileId, accumulatedProfile);
          if (result.success) {
            console.log('useStreamingAnalysis: Mood board generated successfully!');
          } else {
            console.log('useStreamingAnalysis: Mood board generation failed:', result.error);
          }
        } catch (error) {
          console.log('useStreamingAnalysis: Mood board generation error:', error);
        }
      })();

      moodboardGenerationRef.current = generationPromise;
      return generationPromise;
    },
    []
  );

  // Use the core hook with match-profile-specific callbacks
  const core = useStreamingAnalysisCore<AccumulatedProfile>({
    hookName: 'useStreamingAnalysis',

    createInitialProfile: createInitialAccumulatedProfile,

    getThumbnailIndex: (profile) => profile.photos.thumbnailIndex,

    setThumbnailIndex: (profile, index) => ({
      ...profile,
      photos: {
        ...profile.photos,
        thumbnailIndex: index,
      },
    }),

    hasMinimumViableData: (profile) =>
      profile.identity.name !== null || profile.identity.age !== null,

    analyzeChunks: async (
      frameChunks: string[][],
      options: ChunkAnalysisOptions<AccumulatedProfile>
    ): Promise<AccumulatedProfile> => {
      return analyzeProfileStreaming(frameChunks, {
        signal: options.signal,
        frameQualityHints: options.frameQualityHints,
        onChunkComplete: options.onChunkComplete,
        onError: options.onError,
      });
    },

    saveAfterChunk1: async (profile, allFrames) => {
      if (profile.identity.name === null) return;
      try {
        const id = await saveToDatabase(profile, allFrames, 'quick');
        console.log(`useStreamingAnalysis: Auto-saved profile with id ${id}`);
        savedProfileIdRef.current = id;
        setSavedProfileId(id);
      } catch (err) {
        const storageError = new StorageError(
          `Auto-save failed: ${err instanceof Error ? err.message : String(err)}`,
          'local',
          { cause: err instanceof Error ? err : undefined }
        );
        console.log('useStreamingAnalysis: Auto-save deferred:', storageError.code);
        throw storageError;
      }
    },

    saveFinal: async (profile, allFrames) => {
      const existingProfileId = savedProfileIdRef.current;
      const profileId = existingProfileId
        ? await updateProfile(existingProfileId, profile, allFrames)
        : await saveToDatabase(profile, allFrames, 'quick');

      savedProfileIdRef.current = profileId;
      setSavedProfileId(profileId);
    },

    onChunk3Complete: (profile) => {
      const currentProfileId = savedProfileIdRef.current;
      if (currentProfileId) {
        console.log('useStreamingAnalysis: Chunk 3 complete, starting mood board generation');
        startMoodboardGeneration(currentProfileId, profile).catch((err) => {
          console.log('useStreamingAnalysis: Mood board generation deferred:', err);
        });
      } else {
        console.log('useStreamingAnalysis: No profile ID yet, deferring mood board generation');
      }
    },
  });

  // Custom reset that also clears match-profile-specific state
  const reset = useCallback(() => {
    core.reset();
    setSavedProfileId(null);
    savedProfileIdRef.current = null;
    moodboardGenerationRef.current = null;
  }, [core]);

  // Custom abort with saveProgress option (match profiles can save partial progress)
  const abort = useCallback(
    async (saveProgress: boolean) => {
      console.log(`useStreamingAnalysis: Aborting, saveProgress: ${saveProgress}`);

      // Call core abort first to stop processing
      core.abort();

      if (saveProgress && core.hasMinimumViableProfile) {
        const existingProfileId = savedProfileIdRef.current;

        if (!existingProfileId && core.state.allFrames.length > 0) {
          try {
            const profileId = await saveToDatabase(core.state.profile, core.state.allFrames, 'quick');
            savedProfileIdRef.current = profileId;
            setSavedProfileId(profileId);
            navigate(`/profile/${profileId}`);
          } catch (error) {
            const storageError = new StorageError(
              `Failed to save progress: ${error instanceof Error ? error.message : String(error)}`,
              'local',
              { cause: error instanceof Error ? error : undefined }
            );
            console.log('useStreamingAnalysis: Abort save failed:', storageError.code);
          }
        } else if (existingProfileId) {
          navigate(`/profile/${existingProfileId}`);
        }
      }
    },
    [core, saveToDatabase, navigate]
  );

  // Combine core state with match-profile-specific state
  const combinedState: StreamingAnalysisState = {
    ...core.state,
    savedProfileId,
  };

  return {
    state: combinedState,
    startAnalysis: core.startAnalysis,
    abort,
    reset,
    canAbort: core.canAbort,
    hasMinimumViableProfile: core.hasMinimumViableProfile,
    isProcessing: core.isProcessing,
  };
}
