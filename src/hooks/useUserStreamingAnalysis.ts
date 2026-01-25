// src/hooks/useUserStreamingAnalysis.ts
// State machine hook for streaming user profile analysis

import { useState, useCallback, useRef, useEffect } from 'react';
import { extractFramesChunked, type ChunkInfo } from '../lib/frameExtraction';
import {
  analyzeUserProfileStreaming,
  accumulatedUserToSynthesis,
  type AccumulatedUserProfile,
  createInitialAccumulatedUserProfile,
} from '../lib/ai';
import { db, type UserSynthesis, type VideoAnalysis } from '../lib/db';
import type { StreamingPhase } from '../lib/streaming/types';
import {
  scoreAllFrames,
  generateQualityHints,
  validateThumbnailChoice,
  findBestFrameIndex,
  type FrameQualityScore,
} from '../lib/frameQuality';

export interface UserStreamingAnalysisState {
  phase: StreamingPhase;
  profile: AccumulatedUserProfile;
  frames: string[][];
  allFrames: string[];
  currentChunk: number;
  totalChunks: number;
  error: string | null;
  chunkLatencies: number[];
  thumbnailFrame: string | null;
  frameScores: FrameQualityScore[];
  thumbnailOverridden: boolean;
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

const INITIAL_STATE: UserStreamingAnalysisState = {
  phase: 'idle',
  profile: createInitialAccumulatedUserProfile(),
  frames: [],
  allFrames: [],
  currentChunk: 0,
  totalChunks: 4,
  error: null,
  chunkLatencies: [],
  thumbnailFrame: null,
  frameScores: [],
  thumbnailOverridden: false,
};

export function useUserStreamingAnalysis(): UseUserStreamingAnalysisReturn {
  const [state, setState] = useState<UserStreamingAnalysisState>(INITIAL_STATE);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const autoSavePromiseRef = useRef<Promise<void> | null>(null);
  const allFrameScoresRef = useRef<FrameQualityScore[]>([]);

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
  const safeSetState = useCallback((update: Partial<UserStreamingAnalysisState> | ((prev: UserStreamingAnalysisState) => UserStreamingAnalysisState)) => {
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
    allFrameScoresRef.current = [];
    setState(INITIAL_STATE);
  }, []);

  // Save synthesis to database
  const saveSynthesis = useCallback(async (
    profile: AccumulatedUserProfile,
    allFrames: string[]
  ): Promise<void> => {
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
  }, []);

  // Start streaming analysis
  const startAnalysis = useCallback(async (file: File) => {
    console.log('useUserStreamingAnalysis: Starting analysis');

    // Reset and create new abort controller
    abortControllerRef.current = new AbortController();
    allFrameScoresRef.current = [];

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
          console.log(`useUserStreamingAnalysis: Frame chunk ${chunk.chunkIndex + 1}/${chunk.totalChunks} ready`);
          frameChunks.push(chunk.frames);

          safeSetState(prev => ({
            ...prev,
            frames: [...frameChunks],
            allFrames: chunk.allFramesSoFar,
          }));
        },
        onMetadataLoaded: (info) => {
          console.log(`useUserStreamingAnalysis: Video metadata loaded, duration: ${info.duration}s`);
        },
      });

      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      console.log(`useUserStreamingAnalysis: Frame extraction complete, ${frameChunks.length} chunks`);

      // Score first chunk frames for thumbnail quality
      const firstChunkFrames = frameChunks[0] || [];
      let frameQualityScores: FrameQualityScore[] = [];
      let qualityHints = '';

      if (firstChunkFrames.length > 0) {
        console.log('useUserStreamingAnalysis: Scoring frame quality for thumbnail selection');
        try {
          frameQualityScores = await scoreAllFrames(firstChunkFrames);
          qualityHints = generateQualityHints(frameQualityScores);
          console.log('useUserStreamingAnalysis: Frame quality hints generated:', qualityHints);

          allFrameScoresRef.current = frameQualityScores;

          safeSetState(prev => ({
            ...prev,
            frameScores: frameQualityScores,
          }));
        } catch (error) {
          console.error('useUserStreamingAnalysis: Frame scoring failed, continuing without hints:', error);
        }
      }

      // Phase 2: Analyze chunks sequentially
      safeSetState({ phase: 'chunk-1' });

      let finalProfile = await analyzeUserProfileStreaming(frameChunks, {
        signal: abortControllerRef.current?.signal,
        frameQualityHints: qualityHints,
        onChunkComplete: (chunkIndex, profile, latency) => {
          console.log(`useUserStreamingAnalysis: Chunk ${chunkIndex + 1} complete, latency: ${latency}ms`);

          const chunkPhases: StreamingPhase[] = ['chunk-1', 'chunk-2', 'chunk-3', 'chunk-4'];
          const nextPhase = chunkIndex < 3 ? chunkPhases[chunkIndex + 1] : 'consolidating';

          // Get thumbnail choice
          let thumbnailIndex = profile.photos.thumbnailIndex;
          let wasOverridden = false;

          // After chunk 1, validate and potentially override thumbnail choice
          if (chunkIndex === 0 && frameQualityScores.length > 0) {
            const validation = validateThumbnailChoice(thumbnailIndex, frameQualityScores);
            if (validation.wasOverridden) {
              console.log(`useUserStreamingAnalysis: ${validation.reason}`);
              thumbnailIndex = validation.finalIndex;
              wasOverridden = true;
              profile = {
                ...profile,
                photos: {
                  ...profile.photos,
                  thumbnailIndex: thumbnailIndex,
                },
              };
            }
          }

          // Score frames for chunks 2-4 (non-blocking)
          if (chunkIndex > 0 && chunkIndex < 4) {
            const chunkFrames = frameChunks[chunkIndex];
            if (chunkFrames && chunkFrames.length > 0) {
              scoreAllFrames(chunkFrames).then(chunkScores => {
                const adjustedScores = chunkScores.map(s => ({
                  ...s,
                  index: s.index + (chunkIndex * 4),
                }));
                allFrameScoresRef.current = [...allFrameScoresRef.current, ...adjustedScores];
                console.log(`useUserStreamingAnalysis: Scored chunk ${chunkIndex + 1} frames, total scores: ${allFrameScoresRef.current.length}`);
              }).catch(err => {
                console.error(`useUserStreamingAnalysis: Failed to score chunk ${chunkIndex + 1} frames:`, err);
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

          // Auto-save after first chunk (minimum viable profile)
          if (chunkIndex === 0) {
            const savePromise = saveSynthesis(profile, frameChunks.flat())
              .then(() => {
                console.log('useUserStreamingAnalysis: Auto-saved after chunk 1');
              })
              .catch(err => {
                console.error('Auto-save failed:', err);
              });
            autoSavePromiseRef.current = savePromise;
          }
        },
        onError: (error, chunkIndex) => {
          console.error(`useUserStreamingAnalysis: Chunk ${chunkIndex + 1} error:`, error);
        },
      });

      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      // Phase 3: Final save
      console.log('useUserStreamingAnalysis: Analysis complete, saving final result');

      // Wait for any in-flight auto-save
      if (autoSavePromiseRef.current) {
        try {
          await autoSavePromiseRef.current;
        } catch {
          // Auto-save failed, will save now
        }
      }

      // Final thumbnail upgrade check
      const allScores = allFrameScoresRef.current;
      if (allScores.length > 4) {
        const currentThumbnailIndex = finalProfile.photos.thumbnailIndex;
        const currentThumbnailScore = allScores.find(s => s.index === currentThumbnailIndex);
        const bestOverallIndex = findBestFrameIndex(allScores);
        const bestScore = allScores.find(s => s.index === bestOverallIndex);

        const IMPROVEMENT_THRESHOLD = 15;
        if (bestScore && currentThumbnailScore &&
            bestScore.overallScore > currentThumbnailScore.overallScore + IMPROVEMENT_THRESHOLD) {
          console.log(`useUserStreamingAnalysis: Upgrading thumbnail from frame ${currentThumbnailIndex} to frame ${bestOverallIndex}`);
          finalProfile = {
            ...finalProfile,
            photos: {
              ...finalProfile.photos,
              thumbnailIndex: bestOverallIndex,
            },
          };
        }
      }

      const allFrames = frameChunks.flat();
      await saveSynthesis(finalProfile, allFrames);

      safeSetState({
        phase: 'complete',
        profile: finalProfile,
      });

    } catch (error) {
      console.error('useUserStreamingAnalysis: Error:', error);

      if (error instanceof Error && error.message === 'The user aborted a request.') {
        return;
      }

      safeSetState({
        phase: 'error',
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      abortControllerRef.current = null;
    }
  }, [safeSetState, saveSynthesis]);

  // Abort analysis
  const abort = useCallback(() => {
    console.log('useUserStreamingAnalysis: Aborting');

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    safeSetState({ phase: 'aborted' });
  }, [safeSetState]);

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
