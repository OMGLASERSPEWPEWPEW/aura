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
import { db, type Profile } from '../lib/db';
import type { StreamingPhase, FrameQualityScore } from '../lib/streaming/types';
import {
  scoreAllFrames,
  generateQualityHints,
  validateThumbnailChoice,
  findBestFrameIndex,
} from '../lib/frameQuality';
import { supabase } from '../lib/supabase';
import { pushProfile, updateProfileOnServer } from '../lib/sync';

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
  /** Frame quality scores for thumbnail selection */
  frameScores: FrameQualityScore[];
  /** Whether thumbnail was overridden from AI's choice */
  thumbnailOverridden: boolean;
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
  frameScores: [],
  thumbnailOverridden: false,
};

export function useStreamingAnalysis(): UseStreamingAnalysisReturn {
  const [state, setState] = useState<StreamingAnalysisState>(INITIAL_STATE);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  // Track saved profile ID synchronously to avoid race conditions with async state updates
  const savedProfileIdRef = useRef<number | null>(null);
  // Track in-flight auto-save promise to prevent race condition between DB write and final save
  const autoSavePromiseRef = useRef<Promise<number> | null>(null);
  // Track all frame scores across all chunks for final thumbnail selection
  const allFrameScoresRef = useRef<FrameQualityScore[]>([]);
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
    allFrameScoresRef.current = [];
    setState(INITIAL_STATE);
  }, []);

  // Sync a profile to the server (non-blocking, logs errors)
  const syncProfileToServer = useCallback(async (localProfile: Profile) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('useStreamingAnalysis: No user, skipping server sync');
        return;
      }

      if (localProfile.serverId) {
        // Update existing server record
        await updateProfileOnServer(localProfile, user.id);
        console.log(`useStreamingAnalysis: Updated profile ${localProfile.id} on server`);
      } else {
        // Push new profile to server
        const serverId = await pushProfile(localProfile, user.id);
        console.log(`useStreamingAnalysis: Pushed profile ${localProfile.id} to server, serverId: ${serverId}`);
      }
    } catch (error) {
      console.error('useStreamingAnalysis: Server sync failed (will retry on next full sync):', error);
      // Don't throw - local save succeeded, server sync is non-critical
    }
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

    // Save to local database first (fast)
    const profileId = await db.profiles.add({
      name: profile.identity.name || 'Unknown Match',
      age: profile.identity.age || undefined,
      appName: profile.identity.app || 'Unknown App',
      timestamp: new Date(),
      analysis: analysis,
      thumbnail: thumbnail,
      analysisPhase: phase,
    });

    // Get the full profile for server sync
    const fullProfile = await db.profiles.get(profileId);
    if (fullProfile) {
      // Sync to server in background (non-blocking)
      syncProfileToServer(fullProfile);
    }

    return profileId;
  }, [syncProfileToServer]);

  // Update existing profile in database
  const updateProfile = useCallback(async (
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

    // Get the full profile for server sync
    const fullProfile = await db.profiles.get(profileId);
    if (fullProfile) {
      // Sync to server in background (non-blocking)
      syncProfileToServer(fullProfile);
    }

    return profileId;
  }, [syncProfileToServer]);

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

      // Score first chunk frames for thumbnail quality (runs ~50-100ms)
      const firstChunkFrames = frameChunks[0] || [];
      let frameQualityScores: FrameQualityScore[] = [];
      let qualityHints = '';

      // Reset all frame scores for this analysis
      allFrameScoresRef.current = [];

      if (firstChunkFrames.length > 0) {
        console.log('useStreamingAnalysis: Scoring frame quality for thumbnail selection');
        try {
          frameQualityScores = await scoreAllFrames(firstChunkFrames);
          qualityHints = generateQualityHints(frameQualityScores);
          console.log('useStreamingAnalysis: Frame quality hints generated:', qualityHints);

          // Store chunk 1 scores in ref for later comparison
          allFrameScoresRef.current = frameQualityScores;

          safeSetState(prev => ({
            ...prev,
            frameScores: frameQualityScores,
          }));
        } catch (error) {
          console.error('useStreamingAnalysis: Frame scoring failed, continuing without hints:', error);
        }
      }

      // Phase 2: Analyze chunks sequentially
      safeSetState({ phase: 'chunk-1' });

      let finalProfile = await analyzeProfileStreaming(frameChunks, {
        signal: abortControllerRef.current?.signal,
        frameQualityHints: qualityHints,
        onChunkComplete: (chunkIndex, profile, latency) => {
          console.log(`useStreamingAnalysis: Chunk ${chunkIndex + 1} complete, latency: ${latency}ms`);

          const chunkPhases: StreamingPhase[] = ['chunk-1', 'chunk-2', 'chunk-3', 'chunk-4'];
          const nextPhase = chunkIndex < 3 ? chunkPhases[chunkIndex + 1] : 'consolidating';

          // Get AI's thumbnail choice
          let thumbnailIndex = profile.photos.thumbnailIndex;
          let wasOverridden = false;

          // After chunk 1, validate and potentially override AI's thumbnail choice
          if (chunkIndex === 0 && frameQualityScores.length > 0) {
            const validation = validateThumbnailChoice(thumbnailIndex, frameQualityScores);
            if (validation.wasOverridden) {
              console.log(`useStreamingAnalysis: ${validation.reason}`);
              thumbnailIndex = validation.finalIndex;
              wasOverridden = true;
              // Update profile with corrected thumbnail index
              profile = {
                ...profile,
                photos: {
                  ...profile.photos,
                  thumbnailIndex: thumbnailIndex,
                },
              };
            }
          }

          // Score frames for chunks 2-4 (non-blocking, runs in background)
          if (chunkIndex > 0 && chunkIndex < 4) {
            const chunkFrames = frameChunks[chunkIndex];
            if (chunkFrames && chunkFrames.length > 0) {
              scoreAllFrames(chunkFrames).then(chunkScores => {
                // Adjust indices to be global (0-15 instead of chunk-local 0-3)
                const adjustedScores = chunkScores.map(s => ({
                  ...s,
                  index: s.index + (chunkIndex * 4),
                }));
                // Append to all frame scores
                allFrameScoresRef.current = [...allFrameScoresRef.current, ...adjustedScores];
                console.log(`useStreamingAnalysis: Scored chunk ${chunkIndex + 1} frames, total scores: ${allFrameScoresRef.current.length}`);
              }).catch(err => {
                console.error(`useStreamingAnalysis: Failed to score chunk ${chunkIndex + 1} frames:`, err);
              });
            }
          }

          const thumbnailFrame = frameChunks.flat()[thumbnailIndex] || null;

          safeSetState(prev => ({
            ...prev,
            phase: nextPhase,
            profile: profile,
            currentChunk: chunkIndex + 1,
            chunkLatencies: [...prev.chunkLatencies, latency],
            thumbnailFrame,
            thumbnailOverridden: wasOverridden || prev.thumbnailOverridden,
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

          // If chunk 1 fails, we can't continue (no basic info)
          if (chunkIndex === 0) {
            safeSetState({
              phase: 'error',
              error: error instanceof Error ? error.message : String(error),
            });
            return;
          }

          // For later chunks, advance the state so UI doesn't freeze
          const chunkPhases: StreamingPhase[] = ['chunk-1', 'chunk-2', 'chunk-3', 'chunk-4'];
          const nextPhase = chunkIndex < 3 ? chunkPhases[chunkIndex + 1] : 'consolidating';

          safeSetState(prev => ({
            ...prev,
            phase: nextPhase,
            currentChunk: chunkIndex + 1,
            chunkLatencies: [...prev.chunkLatencies, 0], // Mark as instant (failed)
          }));
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

      // Final thumbnail upgrade check: compare all 16 frame scores
      const allScores = allFrameScoresRef.current;
      if (allScores.length > 4) {
        const currentThumbnailIndex = finalProfile.photos.thumbnailIndex;
        const currentThumbnailScore = allScores.find(s => s.index === currentThumbnailIndex);
        const bestOverallIndex = findBestFrameIndex(allScores);
        const bestScore = allScores.find(s => s.index === bestOverallIndex);

        // Upgrade if significantly better (15+ points improvement)
        const IMPROVEMENT_THRESHOLD = 15;
        if (bestScore && currentThumbnailScore &&
            bestScore.overallScore > currentThumbnailScore.overallScore + IMPROVEMENT_THRESHOLD) {
          console.log(`useStreamingAnalysis: Upgrading thumbnail from frame ${currentThumbnailIndex} (score: ${Math.round(currentThumbnailScore.overallScore)}) to frame ${bestOverallIndex} (score: ${Math.round(bestScore.overallScore)})`);
          finalProfile = {
            ...finalProfile,
            photos: {
              ...finalProfile.photos,
              thumbnailIndex: bestOverallIndex,
            },
          };
        } else {
          console.log(`useStreamingAnalysis: Keeping current thumbnail (frame ${currentThumbnailIndex}, score: ${currentThumbnailScore ? Math.round(currentThumbnailScore.overallScore) : 'N/A'}). Best overall: frame ${bestOverallIndex} (score: ${bestScore ? Math.round(bestScore.overallScore) : 'N/A'})`);
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
  }, [safeSetState, saveToDatabase, updateProfile, state.savedProfileId]);

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
