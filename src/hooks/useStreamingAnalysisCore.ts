// src/hooks/useStreamingAnalysisCore.ts
// Shared core logic for streaming profile analysis

import { useState, useCallback, useRef, useEffect } from 'react';
import { extractFramesChunked, type ChunkInfo } from '../lib/frameExtraction';
import type { StreamingPhase, FrameQualityScore } from '../lib/streaming/types';
import {
  scoreAllFrames,
  generateQualityHints,
  validateThumbnailChoice,
  findBestFrameIndex,
} from '../lib/frameQuality';
import {
  FrameExtractionError,
  ChunkAnalysisError,
  AuraError,
} from '../lib/errors';

/** Threshold for upgrading thumbnail in final pass (score improvement needed) */
const THUMBNAIL_UPGRADE_THRESHOLD = 15;

/**
 * Base state structure shared by all streaming analysis implementations
 */
export interface StreamingAnalysisStateBase<TProfile> {
  phase: StreamingPhase;
  profile: TProfile;
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

/**
 * Base return type shared by all streaming analysis implementations
 */
export interface StreamingAnalysisReturnBase<TProfile, TState extends StreamingAnalysisStateBase<TProfile>> {
  state: TState;
  startAnalysis: (file: File) => Promise<void>;
  abort: () => void;
  reset: () => void;
  canAbort: boolean;
  hasMinimumViableProfile: boolean;
  isProcessing: boolean;
}

/**
 * Options for analyzing chunks - passed to the analyze function
 */
export interface ChunkAnalysisOptions<TProfile> {
  signal?: AbortSignal;
  frameQualityHints: string;
  onChunkComplete: (chunkIndex: number, profile: TProfile, latency: number) => void;
  onError: (error: Error, chunkIndex: number) => void;
}

/**
 * Callbacks for customizing streaming analysis behavior
 */
export interface StreamingAnalysisCallbacks<TProfile> {
  /** Create initial empty profile state */
  createInitialProfile: () => TProfile;

  /** Get the thumbnail index from a profile */
  getThumbnailIndex: (profile: TProfile) => number;

  /** Update thumbnail index in profile (immutably) */
  setThumbnailIndex: (profile: TProfile, index: number) => TProfile;

  /** Check if profile has minimum viable data (name or age) */
  hasMinimumViableData: (profile: TProfile) => boolean;

  /** Analyze frame chunks and call onChunkComplete for each */
  analyzeChunks: (
    frameChunks: string[][],
    options: ChunkAnalysisOptions<TProfile>
  ) => Promise<TProfile>;

  /** Save profile after chunk 1 (auto-save for recovery) */
  saveAfterChunk1?: (profile: TProfile, allFrames: string[]) => Promise<void>;

  /** Save final profile (after all chunks complete) */
  saveFinal: (profile: TProfile, allFrames: string[]) => Promise<void>;

  /** Called after chunk 3 completes (for moodboard generation etc.) */
  onChunk3Complete?: (profile: TProfile) => void;

  /** Hook name for logging */
  hookName: string;
}

/**
 * Core hook for streaming profile analysis.
 * Handles frame extraction, quality scoring, chunk processing, and state management.
 * Specialized hooks (useStreamingAnalysis, useUserStreamingAnalysis) provide
 * profile-specific callbacks.
 */
export function useStreamingAnalysisCore<TProfile>(
  callbacks: StreamingAnalysisCallbacks<TProfile>
): StreamingAnalysisReturnBase<TProfile, StreamingAnalysisStateBase<TProfile>> {
  const {
    createInitialProfile,
    getThumbnailIndex,
    setThumbnailIndex,
    hasMinimumViableData,
    analyzeChunks,
    saveAfterChunk1,
    saveFinal,
    onChunk3Complete,
    hookName,
  } = callbacks;

  const initialState: StreamingAnalysisStateBase<TProfile> = {
    phase: 'idle',
    profile: createInitialProfile(),
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

  const [state, setState] = useState<StreamingAnalysisStateBase<TProfile>>(initialState);
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
  const hasMinimumViableProfile = hasMinimumViableData(state.profile);
  const isProcessing = canAbort || state.phase === 'consolidating';

  // Safe state update
  const safeSetState = useCallback(
    (update: Partial<StreamingAnalysisStateBase<TProfile>> | ((prev: StreamingAnalysisStateBase<TProfile>) => StreamingAnalysisStateBase<TProfile>)) => {
      if (isMountedRef.current) {
        setState((prev) =>
          typeof update === 'function' ? update(prev) : { ...prev, ...update }
        );
      }
    },
    []
  );

  // Reset to initial state
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    autoSavePromiseRef.current = null;
    allFrameScoresRef.current = [];
    setState({
      phase: 'idle',
      profile: createInitialProfile(),
      frames: [],
      allFrames: [],
      currentChunk: 0,
      totalChunks: 4,
      error: null,
      chunkLatencies: [],
      thumbnailFrame: null,
      frameScores: [],
      thumbnailOverridden: false,
    });
  }, [createInitialProfile]);

  // Start streaming analysis
  const startAnalysis = useCallback(
    async (file: File) => {
      console.log(`${hookName}: Starting analysis`);

      // Reset and create new abort controller
      abortControllerRef.current = new AbortController();
      allFrameScoresRef.current = [];

      safeSetState({
        phase: 'extracting',
        profile: createInitialProfile(),
        frames: [],
        allFrames: [],
        currentChunk: 0,
        totalChunks: 4,
        error: null,
        chunkLatencies: [],
        thumbnailFrame: null,
        frameScores: [],
        thumbnailOverridden: false,
      });

      try {
        // Phase 1: Extract frames in chunks
        const frameChunks: string[][] = [];

        await extractFramesChunked(file, {
          chunkSize: 4,
          totalFrames: 16,
          onChunkReady: (chunk: ChunkInfo) => {
            console.log(`${hookName}: Frame chunk ${chunk.chunkIndex + 1}/${chunk.totalChunks} ready`);
            frameChunks.push(chunk.frames);

            safeSetState((prev) => ({
              ...prev,
              frames: [...frameChunks],
              allFrames: chunk.allFramesSoFar,
            }));
          },
          onMetadataLoaded: (info) => {
            console.log(`${hookName}: Video metadata loaded, duration: ${info.duration}s`);
          },
        });

        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        console.log(`${hookName}: Frame extraction complete, ${frameChunks.length} chunks`);

        // Score first chunk frames for thumbnail quality
        const firstChunkFrames = frameChunks[0] || [];
        let frameQualityScores: FrameQualityScore[] = [];
        let qualityHints = '';

        if (firstChunkFrames.length > 0) {
          console.log(`${hookName}: Scoring frame quality for thumbnail selection`);
          try {
            frameQualityScores = await scoreAllFrames(firstChunkFrames);
            qualityHints = generateQualityHints(frameQualityScores);
            console.log(`${hookName}: Frame quality hints generated:`, qualityHints);

            allFrameScoresRef.current = frameQualityScores;

            safeSetState((prev) => ({
              ...prev,
              frameScores: frameQualityScores,
            }));
          } catch (error) {
            // Non-critical: frame scoring failed, continue without quality hints
            const frameError = new FrameExtractionError('canvas_failed', {
              message: 'Frame scoring failed, continuing without quality hints',
              context: { frameCount: firstChunkFrames.length },
              cause: error instanceof Error ? error : undefined,
            });
            console.log(`${hookName}:`, frameError.code, frameError.message);
          }
        }

        // Phase 2: Analyze chunks sequentially
        safeSetState({ phase: 'chunk-1' });

        let finalProfile = await analyzeChunks(frameChunks, {
          signal: abortControllerRef.current?.signal,
          frameQualityHints: qualityHints,
          onChunkComplete: (chunkIndex, profile, latency) => {
            console.log(`${hookName}: Chunk ${chunkIndex + 1} complete, latency: ${latency}ms`);

            const chunkPhases: StreamingPhase[] = ['chunk-1', 'chunk-2', 'chunk-3', 'chunk-4'];
            const nextPhase = chunkIndex < 3 ? chunkPhases[chunkIndex + 1] : 'consolidating';

            // Get thumbnail choice
            let thumbnailIndex = getThumbnailIndex(profile);
            let wasOverridden = false;
            let updatedProfile = profile;

            // After chunk 1, validate and potentially override thumbnail choice
            if (chunkIndex === 0 && frameQualityScores.length > 0) {
              const validation = validateThumbnailChoice(thumbnailIndex, frameQualityScores);
              if (validation.wasOverridden) {
                console.log(`${hookName}: ${validation.reason}`);
                thumbnailIndex = validation.finalIndex;
                wasOverridden = true;
                updatedProfile = setThumbnailIndex(profile, thumbnailIndex);
              }
            }

            // Score frames for chunks 2-4 (non-blocking)
            if (chunkIndex > 0 && chunkIndex < 4) {
              const chunkFrames = frameChunks[chunkIndex];
              if (chunkFrames && chunkFrames.length > 0) {
                scoreAllFrames(chunkFrames)
                  .then((chunkScores) => {
                    const adjustedScores = chunkScores.map((s) => ({
                      ...s,
                      index: s.index + chunkIndex * 4,
                    }));
                    allFrameScoresRef.current = [...allFrameScoresRef.current, ...adjustedScores];
                    console.log(
                      `${hookName}: Scored chunk ${chunkIndex + 1} frames, total scores: ${allFrameScoresRef.current.length}`
                    );
                  })
                  .catch((err) => {
                    const frameError = new FrameExtractionError('canvas_failed', {
                      message: `Failed to score chunk ${chunkIndex + 1} frames`,
                      frameIndex: chunkIndex * 4,
                      context: { chunkIndex },
                      cause: err instanceof Error ? err : undefined,
                    });
                    console.log(`${hookName}:`, frameError.code, frameError.message);
                  });
              }
            }

            const thumbnailFrame = frameChunks.flat()[thumbnailIndex] || null;

            safeSetState((prev) => ({
              ...prev,
              phase: nextPhase,
              profile: updatedProfile,
              currentChunk: chunkIndex + 1,
              chunkLatencies: [...prev.chunkLatencies, latency],
              thumbnailFrame,
              thumbnailOverridden: wasOverridden || prev.thumbnailOverridden,
            }));

            // Auto-save after first chunk
            if (chunkIndex === 0 && saveAfterChunk1) {
              const savePromise = saveAfterChunk1(updatedProfile, frameChunks.flat())
                .then(() => {
                  console.log(`${hookName}: Auto-saved after chunk 1`);
                })
                .catch((err) => {
                  console.log(`${hookName}: Auto-save deferred:`, err);
                });
              autoSavePromiseRef.current = savePromise;
            }

            // Callback after chunk 3
            if (chunkIndex === 2 && onChunk3Complete) {
              onChunk3Complete(updatedProfile);
            }
          },
          onError: (error, chunkIndex) => {
            const chunkError = new ChunkAnalysisError(chunkIndex, 4, {
              message: error instanceof Error ? error.message : String(error),
              cause: error instanceof Error ? error : undefined,
              context: { phase: `chunk-${chunkIndex + 1}` },
            });
            console.log(`${hookName}:`, chunkError.code, chunkError.message);
          },
        });

        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        // Phase 3: Final save
        console.log(`${hookName}: Analysis complete, saving final result`);

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
          const currentThumbnailIndex = getThumbnailIndex(finalProfile);
          const currentThumbnailScore = allScores.find((s) => s.index === currentThumbnailIndex);
          const bestOverallIndex = findBestFrameIndex(allScores);
          const bestScore = allScores.find((s) => s.index === bestOverallIndex);

          if (
            bestScore &&
            currentThumbnailScore &&
            bestScore.overallScore > currentThumbnailScore.overallScore + THUMBNAIL_UPGRADE_THRESHOLD
          ) {
            console.log(
              `${hookName}: Upgrading thumbnail from frame ${currentThumbnailIndex} (score: ${Math.round(currentThumbnailScore.overallScore)}) to frame ${bestOverallIndex} (score: ${Math.round(bestScore.overallScore)})`
            );
            finalProfile = setThumbnailIndex(finalProfile, bestOverallIndex) as Awaited<TProfile>;
          } else {
            console.log(
              `${hookName}: Keeping current thumbnail (frame ${currentThumbnailIndex}, score: ${currentThumbnailScore ? Math.round(currentThumbnailScore.overallScore) : 'N/A'}). Best overall: frame ${bestOverallIndex} (score: ${bestScore ? Math.round(bestScore.overallScore) : 'N/A'})`
            );
          }
        }

        const allFrames = frameChunks.flat();
        await saveFinal(finalProfile, allFrames);

        safeSetState({
          phase: 'complete',
          profile: finalProfile,
        });
      } catch (error) {
        if (error instanceof Error && error.message === 'The user aborted a request.') {
          return;
        }

        // Wrap in typed error if not already one
        const auraError =
          error instanceof AuraError
            ? error
            : AuraError.from(error, 'STREAMING_ANALYSIS_ERROR', 'media');

        console.log(`${hookName}: Analysis failed:`, auraError.code, auraError.message);

        safeSetState({
          phase: 'error',
          error: auraError.getUserMessage(),
        });
      } finally {
        abortControllerRef.current = null;
      }
    },
    [
      hookName,
      safeSetState,
      createInitialProfile,
      analyzeChunks,
      getThumbnailIndex,
      setThumbnailIndex,
      saveAfterChunk1,
      saveFinal,
      onChunk3Complete,
    ]
  );

  // Abort analysis
  const abort = useCallback(() => {
    console.log(`${hookName}: Aborting`);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    safeSetState({ phase: 'aborted' });
  }, [hookName, safeSetState]);

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
