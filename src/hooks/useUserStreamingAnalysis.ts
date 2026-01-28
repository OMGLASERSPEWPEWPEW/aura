// src/hooks/useUserStreamingAnalysis.ts
// State machine hook for streaming user profile analysis

import { useCallback } from 'react';
import {
  analyzeUserProfileStreaming,
  accumulatedUserToSynthesis,
  type AccumulatedUserProfile,
  createInitialAccumulatedUserProfile,
} from '../lib/ai';
import { db, type UserSynthesis, type VideoAnalysis } from '../lib/db';
import { saveUserIdentityWithSync } from '../lib/sync';
import { SyncError, StorageError } from '../lib/errors';
import {
  useStreamingAnalysisCore,
  type StreamingAnalysisStateBase,
  type ChunkAnalysisOptions,
} from './useStreamingAnalysisCore';

export type UserStreamingAnalysisState = StreamingAnalysisStateBase<AccumulatedUserProfile>;

export interface UseUserStreamingAnalysisOptions {
  /** User ID for syncing to server. If provided, saves will sync to Supabase. */
  userId?: string;
}

export interface UseUserStreamingAnalysisReturn {
  state: UserStreamingAnalysisState;
  startAnalysis: (file: File) => Promise<void>;
  abort: () => void;
  reset: () => void;
  canAbort: boolean;
  hasMinimumViableProfile: boolean;
  isProcessing: boolean;
}

export function useUserStreamingAnalysis(
  options: UseUserStreamingAnalysisOptions = {}
): UseUserStreamingAnalysisReturn {
  const { userId } = options;

  // Save synthesis to database
  const saveSynthesis = useCallback(
    async (profile: AccumulatedUserProfile, allFrames: string[]): Promise<void> => {
      // Convert accumulated profile to UserSynthesis format
      const synthesisData = accumulatedUserToSynthesis(profile);

      // Build inputs used array
      const inputsUsed: string[] = ['video'];

      // Get existing user identity to preserve other fields
      const existingIdentity = await db.userIdentity.get(1);

      // Build video analysis object
      const videoAnalysis: VideoAnalysis = {
        frames: allFrames,
        thumbnailIndex: profile.photos.thumbnailIndex,
        extractedAt: new Date(),
      };

      // Build full synthesis
      const synthesis: UserSynthesis = {
        meta: {
          lastUpdated: new Date(),
          inputsUsed,
        },
        basics: synthesisData.basics,
        photos: synthesisData.photos,
        psychological_profile: synthesisData.psychological_profile,
        behavioral_insights: {
          communication_style: synthesisData.behavioral_insights.communication_style,
          attachment_patterns: synthesisData.behavioral_insights.attachment_patterns,
          attachment_confidence: synthesisData.behavioral_insights.attachment_confidence,
          growth_areas: synthesisData.behavioral_insights.growth_areas,
          strengths: synthesisData.behavioral_insights.strengths,
        },
        dating_strategy: synthesisData.dating_strategy,
      };

      // Update database
      if (existingIdentity) {
        await db.userIdentity.update(1, {
          videoAnalysis,
          synthesis,
          lastUpdated: new Date(),
        });
      } else {
        await db.userIdentity.put({
          id: 1,
          videoAnalysis,
          synthesis,
          dataExports: [],
          photos: [],
          textInputs: [],
          manualEntry: {},
          lastUpdated: new Date(),
        });
      }

      console.log('useUserStreamingAnalysis: Saved synthesis to database');

      // Sync to server if user is logged in
      if (userId) {
        try {
          await saveUserIdentityWithSync(
            {
              videoAnalysis,
              synthesis,
            },
            userId
          );
          console.log('useUserStreamingAnalysis: Synced to server');
        } catch (error) {
          const syncError = new SyncError(
            `Server sync failed: ${error instanceof Error ? error.message : String(error)}`,
            { operation: 'push', cause: error instanceof Error ? error : undefined }
          );
          console.log('useUserStreamingAnalysis: Server sync deferred:', syncError.code);
        }
      }
    },
    [userId]
  );

  // Use the core hook with user-profile-specific callbacks
  const core = useStreamingAnalysisCore<AccumulatedUserProfile>({
    hookName: 'useUserStreamingAnalysis',

    createInitialProfile: createInitialAccumulatedUserProfile,

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
      options: ChunkAnalysisOptions<AccumulatedUserProfile>
    ): Promise<AccumulatedUserProfile> => {
      return analyzeUserProfileStreaming(frameChunks, {
        signal: options.signal,
        frameQualityHints: options.frameQualityHints,
        onChunkComplete: options.onChunkComplete,
        onError: options.onError,
      });
    },

    saveAfterChunk1: async (profile, allFrames) => {
      try {
        await saveSynthesis(profile, allFrames);
      } catch (err) {
        const storageError = new StorageError(
          `Auto-save failed: ${err instanceof Error ? err.message : String(err)}`,
          'local',
          { cause: err instanceof Error ? err : undefined }
        );
        console.log('useUserStreamingAnalysis: Auto-save deferred:', storageError.code);
      }
    },

    saveFinal: saveSynthesis,

    // User profiles don't generate moodboards
    onChunk3Complete: undefined,
  });

  return {
    state: core.state,
    startAnalysis: core.startAnalysis,
    abort: core.abort,
    reset: core.reset,
    canAbort: core.canAbort,
    hasMinimumViableProfile: core.hasMinimumViableProfile,
    isProcessing: core.isProcessing,
  };
}
