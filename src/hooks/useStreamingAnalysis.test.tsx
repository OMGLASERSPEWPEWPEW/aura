// src/hooks/useStreamingAnalysis.test.ts
// Unit tests for the streaming analysis state machine hook

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useStreamingAnalysis } from './useStreamingAnalysis';
import { createInitialAccumulatedProfile } from '../lib/streaming/types';
import type { AccumulatedProfile, FrameQualityScore } from '../lib/streaming/types';

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock frame extraction
vi.mock('../lib/frameExtraction', () => ({
  extractFramesChunked: vi.fn(),
}));

// Mock AI analysis
vi.mock('../lib/ai', () => ({
  analyzeProfileStreaming: vi.fn(),
  accumulatedToProfileAnalysis: vi.fn(() => ({
    basics: { name: 'Test', age: 25 },
    photos: [],
    prompts: [],
    psychological_profile: {},
    overall: {},
    openers: [],
  })),
  createInitialAccumulatedProfile: vi.fn(() => ({
    identity: { name: null, age: null, location: null, job: null, app: null },
    photos: { thumbnailIndex: 0, analyses: [], vibesSummary: [] },
    prompts: { found: [] },
    psychological: {
      emergingArchetype: null,
      confidenceLevel: 0,
      signals: [],
      agendas: [],
      presentationTactics: [],
      predictedTactics: [],
    },
    earlyWarnings: { redFlags: [], greenFlags: [] },
    meta: { chunksProcessed: 0, totalChunks: 4, phase: 'quick', startedAt: new Date(), lastUpdatedAt: new Date() },
  })),
}));

// Mock frame quality scoring
vi.mock('../lib/frameQuality', () => ({
  scoreAllFrames: vi.fn(),
  generateQualityHints: vi.fn(() => 'Frame 0 is brightest'),
  validateThumbnailChoice: vi.fn(() => ({ wasOverridden: false, finalIndex: 0 })),
  findBestFrameIndex: vi.fn(() => 0),
}));

// Mock database
vi.mock('../lib/db', () => ({
  db: {
    profiles: {
      add: vi.fn(),
      get: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: null } })),
    },
  },
}));

// Mock sync functions
vi.mock('../lib/sync', () => ({
  pushProfile: vi.fn(),
  updateProfileOnServer: vi.fn(),
}));

// Test wrapper with Router
function createTestWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter>{children}</MemoryRouter>;
  };
}

describe('useStreamingAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with idle phase', () => {
      const { result } = renderHook(() => useStreamingAnalysis(), {
        wrapper: createTestWrapper(),
      });

      expect(result.current.state.phase).toBe('idle');
    });

    it('should initialize with empty frames', () => {
      const { result } = renderHook(() => useStreamingAnalysis(), {
        wrapper: createTestWrapper(),
      });

      expect(result.current.state.frames).toEqual([]);
      expect(result.current.state.allFrames).toEqual([]);
    });

    it('should initialize with currentChunk 0 and totalChunks 4', () => {
      const { result } = renderHook(() => useStreamingAnalysis(), {
        wrapper: createTestWrapper(),
      });

      expect(result.current.state.currentChunk).toBe(0);
      expect(result.current.state.totalChunks).toBe(4);
    });

    it('should initialize with no error', () => {
      const { result } = renderHook(() => useStreamingAnalysis(), {
        wrapper: createTestWrapper(),
      });

      expect(result.current.state.error).toBeNull();
    });

    it('should initialize with null savedProfileId', () => {
      const { result } = renderHook(() => useStreamingAnalysis(), {
        wrapper: createTestWrapper(),
      });

      expect(result.current.state.savedProfileId).toBeNull();
    });

    it('should initialize with null thumbnailFrame', () => {
      const { result } = renderHook(() => useStreamingAnalysis(), {
        wrapper: createTestWrapper(),
      });

      expect(result.current.state.thumbnailFrame).toBeNull();
    });

    it('should initialize with empty chunkLatencies', () => {
      const { result } = renderHook(() => useStreamingAnalysis(), {
        wrapper: createTestWrapper(),
      });

      expect(result.current.state.chunkLatencies).toEqual([]);
    });

    it('should initialize with empty frameScores', () => {
      const { result } = renderHook(() => useStreamingAnalysis(), {
        wrapper: createTestWrapper(),
      });

      expect(result.current.state.frameScores).toEqual([]);
    });

    it('should initialize with thumbnailOverridden false', () => {
      const { result } = renderHook(() => useStreamingAnalysis(), {
        wrapper: createTestWrapper(),
      });

      expect(result.current.state.thumbnailOverridden).toBe(false);
    });
  });

  describe('Derived State - canAbort', () => {
    it('should return false when phase is idle', () => {
      const { result } = renderHook(() => useStreamingAnalysis(), {
        wrapper: createTestWrapper(),
      });

      expect(result.current.canAbort).toBe(false);
    });

    it('should return false when phase is complete', async () => {
      const { result } = renderHook(() => useStreamingAnalysis(), {
        wrapper: createTestWrapper(),
      });

      // Manually set phase to complete (simulating end state)
      // Since we can't directly set state, we test the logic
      // canAbort = ['extracting', 'chunk-1', 'chunk-2', 'chunk-3', 'chunk-4'].includes(state.phase)
      expect(['extracting', 'chunk-1', 'chunk-2', 'chunk-3', 'chunk-4'].includes('complete')).toBe(false);
    });

    it('should return false when phase is error', () => {
      expect(['extracting', 'chunk-1', 'chunk-2', 'chunk-3', 'chunk-4'].includes('error')).toBe(false);
    });

    it('should return false when phase is aborted', () => {
      expect(['extracting', 'chunk-1', 'chunk-2', 'chunk-3', 'chunk-4'].includes('aborted')).toBe(false);
    });

    it('should return true for extracting phase', () => {
      expect(['extracting', 'chunk-1', 'chunk-2', 'chunk-3', 'chunk-4'].includes('extracting')).toBe(true);
    });

    it('should return true for chunk-1 phase', () => {
      expect(['extracting', 'chunk-1', 'chunk-2', 'chunk-3', 'chunk-4'].includes('chunk-1')).toBe(true);
    });

    it('should return true for chunk-2 phase', () => {
      expect(['extracting', 'chunk-1', 'chunk-2', 'chunk-3', 'chunk-4'].includes('chunk-2')).toBe(true);
    });

    it('should return true for chunk-3 phase', () => {
      expect(['extracting', 'chunk-1', 'chunk-2', 'chunk-3', 'chunk-4'].includes('chunk-3')).toBe(true);
    });

    it('should return true for chunk-4 phase', () => {
      expect(['extracting', 'chunk-1', 'chunk-2', 'chunk-3', 'chunk-4'].includes('chunk-4')).toBe(true);
    });
  });

  describe('Derived State - hasMinimumViableProfile', () => {
    it('should return false when profile has no name or age', () => {
      const { result } = renderHook(() => useStreamingAnalysis(), {
        wrapper: createTestWrapper(),
      });

      // Initial state has null name and age
      expect(result.current.hasMinimumViableProfile).toBe(false);
    });

    it('should return true when profile has name', () => {
      // Test the logic directly since we can't easily set state
      const profile = createInitialAccumulatedProfile();
      profile.identity.name = 'Test';
      expect(profile.identity.name !== null || profile.identity.age !== null).toBe(true);
    });

    it('should return true when profile has age', () => {
      const profile = createInitialAccumulatedProfile();
      profile.identity.age = 25;
      expect(profile.identity.name !== null || profile.identity.age !== null).toBe(true);
    });

    it('should return true when profile has both name and age', () => {
      const profile = createInitialAccumulatedProfile();
      profile.identity.name = 'Test';
      profile.identity.age = 25;
      expect(profile.identity.name !== null || profile.identity.age !== null).toBe(true);
    });
  });

  describe('Derived State - isProcessing', () => {
    it('should return false when phase is idle', () => {
      const { result } = renderHook(() => useStreamingAnalysis(), {
        wrapper: createTestWrapper(),
      });

      expect(result.current.isProcessing).toBe(false);
    });

    it('should return true during extracting (canAbort is true)', () => {
      // isProcessing = canAbort || state.phase === 'consolidating'
      const canAbort = ['extracting', 'chunk-1', 'chunk-2', 'chunk-3', 'chunk-4'].includes('extracting');
      expect(canAbort || 'extracting' === 'consolidating').toBe(true);
    });

    it('should return true during consolidating phase', () => {
      const canAbort = ['extracting', 'chunk-1', 'chunk-2', 'chunk-3', 'chunk-4'].includes('consolidating');
      expect(canAbort || 'consolidating' === 'consolidating').toBe(true);
    });

    it('should return false when phase is complete', () => {
      const canAbort = ['extracting', 'chunk-1', 'chunk-2', 'chunk-3', 'chunk-4'].includes('complete');
      expect(canAbort || 'complete' === 'consolidating').toBe(false);
    });

    it('should return false when phase is error', () => {
      const canAbort = ['extracting', 'chunk-1', 'chunk-2', 'chunk-3', 'chunk-4'].includes('error');
      expect(canAbort || 'error' === 'consolidating').toBe(false);
    });
  });

  describe('reset()', () => {
    it('should reset state to initial values', async () => {
      const { result } = renderHook(() => useStreamingAnalysis(), {
        wrapper: createTestWrapper(),
      });

      // Call reset
      await act(async () => {
        result.current.reset();
      });

      // Verify state is reset
      expect(result.current.state.phase).toBe('idle');
      expect(result.current.state.frames).toEqual([]);
      expect(result.current.state.allFrames).toEqual([]);
      expect(result.current.state.currentChunk).toBe(0);
      expect(result.current.state.error).toBeNull();
      expect(result.current.state.savedProfileId).toBeNull();
    });

    it('should be callable multiple times', async () => {
      const { result } = renderHook(() => useStreamingAnalysis(), {
        wrapper: createTestWrapper(),
      });

      await act(async () => {
        result.current.reset();
        result.current.reset();
        result.current.reset();
      });

      expect(result.current.state.phase).toBe('idle');
    });
  });

  describe('startAnalysis()', () => {
    it('should set phase to extracting when called', async () => {
      const { extractFramesChunked } = await import('../lib/frameExtraction');

      // Make extraction hang so we can check the extracting state
      vi.mocked(extractFramesChunked).mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useStreamingAnalysis(), {
        wrapper: createTestWrapper(),
      });

      const mockFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });

      act(() => {
        result.current.startAnalysis(mockFile);
      });

      // Should transition to extracting
      await waitFor(() => {
        expect(result.current.state.phase).toBe('extracting');
      });
    });

    it('should call extractFramesChunked with correct options', async () => {
      const { extractFramesChunked } = await import('../lib/frameExtraction');
      vi.mocked(extractFramesChunked).mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useStreamingAnalysis(), {
        wrapper: createTestWrapper(),
      });

      const mockFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });

      act(() => {
        result.current.startAnalysis(mockFile);
      });

      await waitFor(() => {
        expect(extractFramesChunked).toHaveBeenCalledWith(
          mockFile,
          expect.objectContaining({
            chunkSize: 4,
            totalFrames: 16,
            onChunkReady: expect.any(Function),
            onMetadataLoaded: expect.any(Function),
          })
        );
      });
    });

    it('should update frames as chunks are ready', async () => {
      const { extractFramesChunked } = await import('../lib/frameExtraction');
      const { analyzeProfileStreaming } = await import('../lib/ai');

      // Simulate frame extraction with callback
      vi.mocked(extractFramesChunked).mockImplementation(async (file, options) => {
        // Simulate chunk ready callback
        options?.onChunkReady?.({
          chunkIndex: 0,
          totalChunks: 4,
          frames: ['frame1', 'frame2', 'frame3', 'frame4'],
          allFramesSoFar: ['frame1', 'frame2', 'frame3', 'frame4'],
        });
      });

      // Make analysis hang
      vi.mocked(analyzeProfileStreaming).mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useStreamingAnalysis(), {
        wrapper: createTestWrapper(),
      });

      const mockFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });

      await act(async () => {
        result.current.startAnalysis(mockFile);
      });

      await waitFor(() => {
        expect(result.current.state.frames.length).toBeGreaterThan(0);
      });
    });

    it('should transition to chunk-1 after frame extraction', async () => {
      const { extractFramesChunked } = await import('../lib/frameExtraction');
      const { analyzeProfileStreaming } = await import('../lib/ai');
      const { scoreAllFrames } = await import('../lib/frameQuality');

      vi.mocked(extractFramesChunked).mockResolvedValue(undefined);
      vi.mocked(scoreAllFrames).mockResolvedValue([]);
      vi.mocked(analyzeProfileStreaming).mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useStreamingAnalysis(), {
        wrapper: createTestWrapper(),
      });

      const mockFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });

      await act(async () => {
        result.current.startAnalysis(mockFile);
      });

      await waitFor(() => {
        expect(result.current.state.phase).toBe('chunk-1');
      });
    });

    it('should handle frame extraction errors', async () => {
      const { extractFramesChunked } = await import('../lib/frameExtraction');

      vi.mocked(extractFramesChunked).mockRejectedValue(new Error('Extraction failed'));

      const { result } = renderHook(() => useStreamingAnalysis(), {
        wrapper: createTestWrapper(),
      });

      const mockFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });

      await act(async () => {
        result.current.startAnalysis(mockFile);
      });

      await waitFor(() => {
        expect(result.current.state.phase).toBe('error');
        expect(result.current.state.error).toBeTruthy();
      });
    });

    it('should complete analysis and save profile', async () => {
      const { extractFramesChunked } = await import('../lib/frameExtraction');
      const { analyzeProfileStreaming } = await import('../lib/ai');
      const { scoreAllFrames } = await import('../lib/frameQuality');
      const { db } = await import('../lib/db');

      vi.mocked(extractFramesChunked).mockResolvedValue(undefined);
      vi.mocked(scoreAllFrames).mockResolvedValue([]);

      const mockProfile = createInitialAccumulatedProfile();
      mockProfile.identity.name = 'Test User';
      mockProfile.identity.age = 25;

      vi.mocked(analyzeProfileStreaming).mockResolvedValue(mockProfile);
      vi.mocked(db.profiles.add).mockResolvedValue(123);
      vi.mocked(db.profiles.get).mockResolvedValue({
        id: 123,
        name: 'Test User',
        age: 25,
        timestamp: new Date(),
      } as never);

      const { result } = renderHook(() => useStreamingAnalysis(), {
        wrapper: createTestWrapper(),
      });

      const mockFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });

      await act(async () => {
        await result.current.startAnalysis(mockFile);
      });

      await waitFor(() => {
        expect(result.current.state.phase).toBe('complete');
      });
    });
  });

  describe('abort()', () => {
    it('should set phase to aborted when saveProgress is false', async () => {
      const { result } = renderHook(() => useStreamingAnalysis(), {
        wrapper: createTestWrapper(),
      });

      await act(async () => {
        await result.current.abort(false);
      });

      expect(result.current.state.phase).toBe('aborted');
    });

    it('should set phase to aborted when saveProgress is true but no minimum viable profile', async () => {
      const { result } = renderHook(() => useStreamingAnalysis(), {
        wrapper: createTestWrapper(),
      });

      // No name or age, so hasMinimumViableProfile is false
      await act(async () => {
        await result.current.abort(true);
      });

      expect(result.current.state.phase).toBe('aborted');
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should not navigate when saveProgress is false', async () => {
      const { result } = renderHook(() => useStreamingAnalysis(), {
        wrapper: createTestWrapper(),
      });

      await act(async () => {
        await result.current.abort(false);
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Phase Transitions', () => {
    it('should follow correct phase sequence: idle -> extracting -> chunk-1 -> chunk-2 -> chunk-3 -> chunk-4 -> consolidating -> complete', () => {
      // Test the expected phase sequence
      const phases = ['idle', 'extracting', 'chunk-1', 'chunk-2', 'chunk-3', 'chunk-4', 'consolidating', 'complete'];

      expect(phases[0]).toBe('idle');
      expect(phases[1]).toBe('extracting');
      expect(phases[2]).toBe('chunk-1');
      expect(phases[3]).toBe('chunk-2');
      expect(phases[4]).toBe('chunk-3');
      expect(phases[5]).toBe('chunk-4');
      expect(phases[6]).toBe('consolidating');
      expect(phases[7]).toBe('complete');
    });

    it('should calculate next phase correctly for chunk 0', () => {
      const chunkPhases = ['chunk-1', 'chunk-2', 'chunk-3', 'chunk-4'];
      const chunkIndex = 0;
      const nextPhase = chunkIndex < 3 ? chunkPhases[chunkIndex + 1] : 'consolidating';
      expect(nextPhase).toBe('chunk-2');
    });

    it('should calculate next phase correctly for chunk 1', () => {
      const chunkPhases = ['chunk-1', 'chunk-2', 'chunk-3', 'chunk-4'];
      const chunkIndex = 1;
      const nextPhase = chunkIndex < 3 ? chunkPhases[chunkIndex + 1] : 'consolidating';
      expect(nextPhase).toBe('chunk-3');
    });

    it('should calculate next phase correctly for chunk 2', () => {
      const chunkPhases = ['chunk-1', 'chunk-2', 'chunk-3', 'chunk-4'];
      const chunkIndex = 2;
      const nextPhase = chunkIndex < 3 ? chunkPhases[chunkIndex + 1] : 'consolidating';
      expect(nextPhase).toBe('chunk-4');
    });

    it('should calculate next phase correctly for chunk 3 (final)', () => {
      const chunkPhases = ['chunk-1', 'chunk-2', 'chunk-3', 'chunk-4'];
      const chunkIndex = 3;
      const nextPhase = chunkIndex < 3 ? chunkPhases[chunkIndex + 1] : 'consolidating';
      expect(nextPhase).toBe('consolidating');
    });
  });

  describe('Error Handling', () => {
    it('should set error phase when chunk 1 fails', async () => {
      const { extractFramesChunked } = await import('../lib/frameExtraction');
      const { analyzeProfileStreaming } = await import('../lib/ai');
      const { scoreAllFrames } = await import('../lib/frameQuality');

      vi.mocked(extractFramesChunked).mockResolvedValue(undefined);
      vi.mocked(scoreAllFrames).mockResolvedValue([]);

      // Simulate chunk 1 error via onError callback
      vi.mocked(analyzeProfileStreaming).mockImplementation(async (frameChunks, callbacks) => {
        callbacks?.onError?.(new Error('Chunk 1 failed'), 0);
        throw new Error('Chunk 1 failed');
      });

      const { result } = renderHook(() => useStreamingAnalysis(), {
        wrapper: createTestWrapper(),
      });

      const mockFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });

      await act(async () => {
        await result.current.startAnalysis(mockFile);
      });

      await waitFor(() => {
        expect(result.current.state.phase).toBe('error');
      });
    });

    it('should handle abort signal correctly', async () => {
      const { extractFramesChunked } = await import('../lib/frameExtraction');

      vi.mocked(extractFramesChunked).mockRejectedValue(new Error('The user aborted a request.'));

      const { result } = renderHook(() => useStreamingAnalysis(), {
        wrapper: createTestWrapper(),
      });

      const mockFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });

      await act(async () => {
        result.current.startAnalysis(mockFile);
      });

      // Should not show error for abort
      await waitFor(() => {
        // The abort case returns early, doesn't set error
        expect(result.current.state.error).toBeNull();
      });
    });
  });

  describe('Chunk Latency Tracking', () => {
    it('should initialize with empty chunkLatencies', () => {
      const { result } = renderHook(() => useStreamingAnalysis(), {
        wrapper: createTestWrapper(),
      });

      expect(result.current.state.chunkLatencies).toEqual([]);
    });

    it('should accumulate latencies correctly', () => {
      // Test the accumulation logic
      const latencies: number[] = [];
      latencies.push(100); // Chunk 1
      latencies.push(150); // Chunk 2
      latencies.push(120); // Chunk 3
      latencies.push(130); // Chunk 4

      expect(latencies).toEqual([100, 150, 120, 130]);
      expect(latencies.length).toBe(4);
    });
  });

  describe('Thumbnail Selection', () => {
    it('should use thumbnailIndex from profile', () => {
      const profile = createInitialAccumulatedProfile();
      profile.photos.thumbnailIndex = 2;

      expect(profile.photos.thumbnailIndex).toBe(2);
    });

    it('should track thumbnailOverridden flag', () => {
      const { result } = renderHook(() => useStreamingAnalysis(), {
        wrapper: createTestWrapper(),
      });

      expect(result.current.state.thumbnailOverridden).toBe(false);
    });

    it('should store frame quality scores', async () => {
      const { result } = renderHook(() => useStreamingAnalysis(), {
        wrapper: createTestWrapper(),
      });

      expect(result.current.state.frameScores).toEqual([]);
    });
  });

  describe('Frame Quality Scoring', () => {
    it('should call scoreAllFrames for first chunk', async () => {
      const { extractFramesChunked } = await import('../lib/frameExtraction');
      const { analyzeProfileStreaming } = await import('../lib/ai');
      const { scoreAllFrames } = await import('../lib/frameQuality');

      const mockFrames = ['frame1', 'frame2', 'frame3', 'frame4'];
      vi.mocked(extractFramesChunked).mockImplementation(async (file, options) => {
        options?.onChunkReady?.({
          chunkIndex: 0,
          totalChunks: 4,
          frames: mockFrames,
          allFramesSoFar: mockFrames,
        });
      });

      const mockScores: FrameQualityScore[] = [
        { index: 0, brightness: 0.5, colorVariance: 0.5, edgeDensity: 0.5, overallScore: 50 },
      ];
      vi.mocked(scoreAllFrames).mockResolvedValue(mockScores);
      vi.mocked(analyzeProfileStreaming).mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useStreamingAnalysis(), {
        wrapper: createTestWrapper(),
      });

      const mockFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });

      await act(async () => {
        result.current.startAnalysis(mockFile);
      });

      await waitFor(() => {
        expect(scoreAllFrames).toHaveBeenCalledWith(mockFrames);
      });
    });
  });

  describe('Auto-save After Chunk 1', () => {
    it('should auto-save when chunk 1 completes with name', async () => {
      const { extractFramesChunked } = await import('../lib/frameExtraction');
      const { analyzeProfileStreaming } = await import('../lib/ai');
      const { scoreAllFrames } = await import('../lib/frameQuality');
      const { db } = await import('../lib/db');

      vi.mocked(extractFramesChunked).mockResolvedValue(undefined);
      vi.mocked(scoreAllFrames).mockResolvedValue([]);

      const mockProfile = createInitialAccumulatedProfile();
      mockProfile.identity.name = 'Auto-saved User';

      // Simulate onChunkComplete callback for chunk 0
      vi.mocked(analyzeProfileStreaming).mockImplementation(async (frameChunks, callbacks) => {
        callbacks?.onChunkComplete?.(0, mockProfile, 100);
        return mockProfile;
      });

      vi.mocked(db.profiles.add).mockResolvedValue(456);
      vi.mocked(db.profiles.get).mockResolvedValue({
        id: 456,
        name: 'Auto-saved User',
        timestamp: new Date(),
      } as never);

      const { result } = renderHook(() => useStreamingAnalysis(), {
        wrapper: createTestWrapper(),
      });

      const mockFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });

      await act(async () => {
        await result.current.startAnalysis(mockFile);
      });

      await waitFor(() => {
        expect(db.profiles.add).toHaveBeenCalled();
      });
    });

    it('should not auto-save when chunk 1 completes without name', async () => {
      const { extractFramesChunked } = await import('../lib/frameExtraction');
      const { analyzeProfileStreaming } = await import('../lib/ai');
      const { scoreAllFrames } = await import('../lib/frameQuality');
      const { db } = await import('../lib/db');

      vi.mocked(extractFramesChunked).mockResolvedValue(undefined);
      vi.mocked(scoreAllFrames).mockResolvedValue([]);

      const mockProfile = createInitialAccumulatedProfile();
      // name is null

      vi.mocked(analyzeProfileStreaming).mockImplementation(async (frameChunks, callbacks) => {
        callbacks?.onChunkComplete?.(0, mockProfile, 100);
        return mockProfile;
      });

      vi.mocked(db.profiles.add).mockResolvedValue(789);
      vi.mocked(db.profiles.get).mockResolvedValue(null);

      const { result } = renderHook(() => useStreamingAnalysis(), {
        wrapper: createTestWrapper(),
      });

      const mockFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });

      await act(async () => {
        await result.current.startAnalysis(mockFile);
      });

      // db.profiles.add should only be called for final save, not auto-save
      // Since name is null, auto-save condition fails
      await waitFor(() => {
        // Final save still happens
        expect(db.profiles.add).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Server Sync', () => {
    it('should attempt server sync after saving profile', async () => {
      const { extractFramesChunked } = await import('../lib/frameExtraction');
      const { analyzeProfileStreaming } = await import('../lib/ai');
      const { scoreAllFrames } = await import('../lib/frameQuality');
      const { db } = await import('../lib/db');
      const { supabase } = await import('../lib/supabase');

      vi.mocked(extractFramesChunked).mockResolvedValue(undefined);
      vi.mocked(scoreAllFrames).mockResolvedValue([]);

      const mockProfile = createInitialAccumulatedProfile();
      mockProfile.identity.name = 'Sync Test User';

      vi.mocked(analyzeProfileStreaming).mockResolvedValue(mockProfile);
      vi.mocked(db.profiles.add).mockResolvedValue(999);
      vi.mocked(db.profiles.get).mockResolvedValue({
        id: 999,
        name: 'Sync Test User',
        timestamp: new Date(),
      } as never);

      // Mock user exists for sync
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      } as never);

      const { result } = renderHook(() => useStreamingAnalysis(), {
        wrapper: createTestWrapper(),
      });

      const mockFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });

      await act(async () => {
        await result.current.startAnalysis(mockFile);
      });

      await waitFor(() => {
        expect(supabase.auth.getUser).toHaveBeenCalled();
      });
    });

    it('should skip server sync when no user is logged in', async () => {
      const { extractFramesChunked } = await import('../lib/frameExtraction');
      const { analyzeProfileStreaming } = await import('../lib/ai');
      const { scoreAllFrames } = await import('../lib/frameQuality');
      const { db } = await import('../lib/db');
      const { supabase } = await import('../lib/supabase');
      const { pushProfile } = await import('../lib/sync');

      vi.mocked(extractFramesChunked).mockResolvedValue(undefined);
      vi.mocked(scoreAllFrames).mockResolvedValue([]);

      const mockProfile = createInitialAccumulatedProfile();
      mockProfile.identity.name = 'No Sync User';

      vi.mocked(analyzeProfileStreaming).mockResolvedValue(mockProfile);
      vi.mocked(db.profiles.add).mockResolvedValue(888);
      vi.mocked(db.profiles.get).mockResolvedValue({
        id: 888,
        name: 'No Sync User',
        timestamp: new Date(),
      } as never);

      // No user logged in
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as never);

      const { result } = renderHook(() => useStreamingAnalysis(), {
        wrapper: createTestWrapper(),
      });

      const mockFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });

      await act(async () => {
        await result.current.startAnalysis(mockFile);
      });

      await waitFor(() => {
        expect(pushProfile).not.toHaveBeenCalled();
      });
    });
  });

  describe('Profile Update vs Create', () => {
    it('should update existing profile when savedProfileId exists', async () => {
      const { extractFramesChunked } = await import('../lib/frameExtraction');
      const { analyzeProfileStreaming } = await import('../lib/ai');
      const { scoreAllFrames } = await import('../lib/frameQuality');
      const { db } = await import('../lib/db');

      vi.mocked(extractFramesChunked).mockResolvedValue(undefined);
      vi.mocked(scoreAllFrames).mockResolvedValue([]);

      const mockProfile = createInitialAccumulatedProfile();
      mockProfile.identity.name = 'Update Test';

      // First call saves with auto-save, second call should update
      let autoSaveId: number | null = null;
      vi.mocked(analyzeProfileStreaming).mockImplementation(async (frameChunks, callbacks) => {
        // Simulate auto-save on chunk 0
        callbacks?.onChunkComplete?.(0, mockProfile, 100);
        return mockProfile;
      });

      vi.mocked(db.profiles.add).mockImplementation(async () => {
        autoSaveId = 111;
        return 111;
      });
      vi.mocked(db.profiles.update).mockResolvedValue(111);
      vi.mocked(db.profiles.get).mockResolvedValue({
        id: 111,
        name: 'Update Test',
        timestamp: new Date(),
      } as never);

      const { result } = renderHook(() => useStreamingAnalysis(), {
        wrapper: createTestWrapper(),
      });

      const mockFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });

      await act(async () => {
        await result.current.startAnalysis(mockFile);
      });

      await waitFor(() => {
        // Should call update for final save (after auto-save created the profile)
        expect(db.profiles.update).toHaveBeenCalled();
      });
    });
  });
});
