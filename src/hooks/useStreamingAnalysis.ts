// src/hooks/useStreamingAnalysis.ts
// State machine hook for streaming profile analysis

import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { extractFramesChunked, type ChunkInfo } from '../lib/frameExtraction';
import {
  analyzeProfileStreaming,
  accumulatedToProfileAnalysis,
  createInitialAccumulatedProfile,
  type AccumulatedProfile,
} from '../lib/ai';
import { db } from '../lib/db';
import type { StreamingPhase } from '../lib/streaming/types';

export interface StreamingAnalysisState {
  phase: StreamingPhase;
  profile: AccumulatedProfile;
  frames: string[][];
  allFrames: string[];
  currentChunk: number;
  totalChunks: number;
  error: string | null;
  chunkLatencies: number[];
  savedProfileId: number | null;
  thumbnailFrame: string | null;
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

const INITIAL_STATE: StreamingAnalysisState = {
  phase: 'idle',
  profile: createInitialAccumulatedProfile(),
  frames: [],
  allFrames: [],
  currentChunk: 0,
  totalChunks: 4,
  error: null,
  chunkLatencies: [],
  savedProfileId: null,
  thumbnailFrame: null,
};

export function useStreamingAnalysis(): UseStreamingAnalysisReturn {
  const [state, setState] = useState<StreamingAnalysisState>(INITIAL_STATE);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  // Track saved profile ID synchronously to avoid race conditions with async state updates
  const savedProfileIdRef = useRef<number | null>(null);
  // Track in-flight auto-save promise to prevent race condition between DB write and final save
  const autoSavePromiseRef = useRef<Promise<number> | null>(null);
  const navigate = useNavigate();

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Derived state
  const canAbort = ['extracting', 'chunk-1', 'chunk-2', 'chunk-3', 'chunk-4'].includes(state.phase);
  const hasMinimumViableProfile =
    state.profile.identity.name !== null || state.profile.identity.age !== null;
  const isProcessing = canAbort || state.phase === 'consolidating';

  // Safe state update
  const safeSetState = useCallback((update: Partial<StreamingAnalysisState> | ((prev: StreamingAnalysisState) => StreamingAnalysisState)) => {
    if (isMountedRef.current) {
      setState(prev => typeof update === 'function' ? update(prev) : { ...prev, ...update });
    }
  }, []);

  // Reset to initial state
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    autoSavePromiseRef.current = null;
    savedProfileIdRef.current = null;
    setState(INITIAL_STATE);
  }, []);

  // Save current progress to database
  const saveToDatabase = useCallback(async (
    profile: AccumulatedProfile,
    allFrames: string[],
    phase: 'quick' | 'complete' = 'quick'
  ): Promise<number> => {
    // Convert accumulated profile to ProfileAnalysis format
    const analysis = accumulatedToProfileAnalysis(profile);

    // Determine thumbnail
    const thumbnailIndex = profile.photos.thumbnailIndex;
    const thumbnail = allFrames[thumbnailIndex] || allFrames[0] || '';

    // Save to database
    const profileId = await db.profiles.add({
      name: profile.identity.name || 'Unknown Match',
      age: profile.identity.age || undefined,
      appName: profile.identity.app || 'Unknown App',
      timestamp: new Date(),
      analysis: analysis,
      thumbnail: thumbnail,
      analysisPhase: phase,
    });

    return profileId;
  }, []);

  // Start streaming analysis
  const startAnalysis = useCallback(async (file: File) => {
    console.log('useStreamingAnalysis: Starting analysis');

    // Reset and create new abort controller
    abortControllerRef.current = new AbortController();

    safeSetState({
      ...INITIAL_STATE,
      phase: 'extracting',
    });

    try {
      // Phase 1: Extract frames in chunks
      const frameChunks: string[][] = [];

      await extractFramesChunked(file, {
        chunkSize: 4,
        totalFrames: 16,
        onChunkReady: (chunk: ChunkInfo) => {
          console.log(`useStreamingAnalysis: Frame chunk ${chunk.chunkIndex + 1}/${chunk.totalChunks} ready`);
          frameChunks.push(chunk.frames);

          safeSetState(prev => ({
            ...prev,
            frames: [...frameChunks],
            allFrames: chunk.allFramesSoFar,
          }));
        },
        onMetadataLoaded: (info) => {
          console.log(`useStreamingAnalysis: Video metadata loaded, duration: ${info.duration}s`);
        },
      });

      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      console.log(`useStreamingAnalysis: Frame extraction complete, ${frameChunks.length} chunks`);

      // Phase 2: Analyze chunks sequentially
      safeSetState({ phase: 'chunk-1' });

      const finalProfile = await analyzeProfileStreaming(frameChunks, {
        signal: abortControllerRef.current?.signal,
        onChunkComplete: (chunkIndex, profile, latency) => {
          console.log(`useStreamingAnalysis: Chunk ${chunkIndex + 1} complete, latency: ${latency}ms`);

          const chunkPhases: StreamingPhase[] = ['chunk-1', 'chunk-2', 'chunk-3', 'chunk-4'];
          const nextPhase = chunkIndex < 3 ? chunkPhases[chunkIndex + 1] : 'consolidating';

          // Update thumbnail frame if we have it
          const thumbnailIndex = profile.photos.thumbnailIndex;
          const thumbnailFrame = frameChunks.flat()[thumbnailIndex] || null;

          safeSetState(prev => ({
            ...prev,
            phase: nextPhase,
            profile: profile,
            currentChunk: chunkIndex + 1,
            chunkLatencies: [...prev.chunkLatencies, latency],
            thumbnailFrame,
          }));

          // Auto-save after first chunk (has minimum viable profile)
          if (chunkIndex === 0 && profile.identity.name !== null) {
            // Store promise to track in-flight save (prevents race condition with final save)
            const savePromise = saveToDatabase(profile, frameChunks.flat(), 'quick')
              .then(id => {
                console.log(`useStreamingAnalysis: Auto-saved profile with id ${id}`);
                // Set ref synchronously to avoid race conditions with final save
                savedProfileIdRef.current = id;
                safeSetState({ savedProfileId: id });
                return id;
              })
              .catch(err => {
                console.error('Auto-save failed:', err);
                throw err;
              });
            autoSavePromiseRef.current = savePromise;
          }
        },
        onError: (error, chunkIndex) => {
          console.error(`useStreamingAnalysis: Chunk ${chunkIndex + 1} error:`, error);
          // Don't fail the whole analysis - continue with remaining chunks
        },
      });

      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      // Phase 3: Save final result
      console.log('useStreamingAnalysis: Analysis complete, saving final result');

      // Wait for any in-flight auto-save to complete first (prevents race condition)
      if (autoSavePromiseRef.current) {
        try {
          await autoSavePromiseRef.current;
        } catch {
          // Auto-save failed, will create new profile below
        }
      }

      const allFrames = frameChunks.flat();
      // Use ref for synchronous check to avoid race condition with async state updates
      const existingProfileId = savedProfileIdRef.current || state.savedProfileId;
      const profileId = existingProfileId
        ? await updateProfile(existingProfileId, finalProfile, allFrames)
        : await saveToDatabase(finalProfile, allFrames, 'quick');

      // Update ref and state
      savedProfileIdRef.current = profileId;
      safeSetState({
        phase: 'complete',
        profile: finalProfile,
        savedProfileId: profileId,
      });

    } catch (error) {
      console.error('useStreamingAnalysis: Error:', error);

      if (error instanceof Error && error.message === 'The user aborted a request.') {
        // Handled by abort function
        return;
      }

      safeSetState({
        phase: 'error',
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      abortControllerRef.current = null;
    }
  }, [safeSetState, saveToDatabase, state.savedProfileId]);

  // Update existing profile in database
  const updateProfile = async (
    profileId: number,
    profile: AccumulatedProfile,
    allFrames: string[]
  ): Promise<number> => {
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

    return profileId;
  };

  // Abort analysis
  const abort = useCallback(async (saveProgress: boolean) => {
    console.log(`useStreamingAnalysis: Aborting, saveProgress: ${saveProgress}`);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (saveProgress && hasMinimumViableProfile) {
      // Check both ref and state for existing profile ID
      const existingProfileId = savedProfileIdRef.current || state.savedProfileId;

      // Save current progress
      if (!existingProfileId && state.allFrames.length > 0) {
        try {
          const profileId = await saveToDatabase(state.profile, state.allFrames, 'quick');
          savedProfileIdRef.current = profileId;
          safeSetState({
            phase: 'aborted',
            savedProfileId: profileId,
          });
          // Navigate to the saved profile
          navigate(`/profile/${profileId}`);
        } catch (error) {
          console.error('Failed to save progress:', error);
          safeSetState({ phase: 'aborted' });
        }
      } else if (existingProfileId) {
        safeSetState({ phase: 'aborted' });
        navigate(`/profile/${existingProfileId}`);
      }
    } else {
      safeSetState({ phase: 'aborted' });
    }
  }, [hasMinimumViableProfile, state.savedProfileId, state.profile, state.allFrames, saveToDatabase, safeSetState, navigate]);

  return {
    state,
    startAnalysis,
    abort,
    reset,
    canAbort,
    hasMinimumViableProfile,
    isProcessing,
  };
}
