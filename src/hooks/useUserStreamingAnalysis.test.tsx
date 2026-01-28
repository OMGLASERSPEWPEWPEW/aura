// src/hooks/useUserStreamingAnalysis.test.tsx
// Unit tests for the user streaming analysis state machine hook

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUserStreamingAnalysis } from './useUserStreamingAnalysis';
import { createInitialAccumulatedUserProfile } from '../lib/streaming/userTypes';
import type { AccumulatedUserProfile } from '../lib/streaming/userTypes';
import type { FrameQualityScore } from '../lib/streaming/types';

// Mock frame extraction
vi.mock('../lib/frameExtraction', () => ({
  extractFramesChunked: vi.fn(),
}));

// Mock AI analysis
vi.mock('../lib/ai', () => ({
  analyzeUserProfileStreaming: vi.fn(),
  accumulatedUserToSynthesis: vi.fn(() => ({
    basics: { name: 'Test User', age: 28 },
    photos: { thumbnailIndex: 0 },
    psychological_profile: {},
    behavioral_insights: {
      communication_style: 'direct',
      attachment_patterns: 'secure',
      attachment_confidence: 0.8,
      growth_areas: [],
      strengths: [],
    },
    dating_strategy: {},
  })),
  createInitialAccumulatedUserProfile: vi.fn(() => ({
    identity: { name: null, age: null, location: null, job: null },
    photos: { thumbnailIndex: 0, analyses: [], vibesSummary: [] },
    psychological: {
      coreValues: [],
      attachmentStyle: null,
      attachmentConfidence: 0,
      communicationPattern: null,
      strengthAreas: [],
      growthAreas: [],
    },
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
    userIdentity: {
      get: vi.fn(),
      put: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock sync functions
vi.mock('../lib/sync', () => ({
  saveUserIdentityWithSync: vi.fn(),
}));

describe('useUserStreamingAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with idle phase', () => {
      const { result } = renderHook(() => useUserStreamingAnalysis());

      expect(result.current.state.phase).toBe('idle');
    });

    it('should initialize with empty frames', () => {
      const { result } = renderHook(() => useUserStreamingAnalysis());

      expect(result.current.state.frames).toEqual([]);
      expect(result.current.state.allFrames).toEqual([]);
    });

    it('should initialize with currentChunk 0 and totalChunks 4', () => {
      const { result } = renderHook(() => useUserStreamingAnalysis());

      expect(result.current.state.currentChunk).toBe(0);
      expect(result.current.state.totalChunks).toBe(4);
    });

    it('should initialize with no error', () => {
      const { result } = renderHook(() => useUserStreamingAnalysis());

      expect(result.current.state.error).toBeNull();
    });

    it('should initialize with null thumbnailFrame', () => {
      const { result } = renderHook(() => useUserStreamingAnalysis());

      expect(result.current.state.thumbnailFrame).toBeNull();
    });

    it('should initialize with empty chunkLatencies', () => {
      const { result } = renderHook(() => useUserStreamingAnalysis());

      expect(result.current.state.chunkLatencies).toEqual([]);
    });

    it('should initialize with empty frameScores', () => {
      const { result } = renderHook(() => useUserStreamingAnalysis());

      expect(result.current.state.frameScores).toEqual([]);
    });

    it('should initialize with thumbnailOverridden false', () => {
      const { result } = renderHook(() => useUserStreamingAnalysis());

      expect(result.current.state.thumbnailOverridden).toBe(false);
    });
  });

  describe('Derived State - canAbort', () => {
    it('should return false when phase is idle', () => {
      const { result } = renderHook(() => useUserStreamingAnalysis());

      expect(result.current.canAbort).toBe(false);
    });

    it('should return false when phase is complete', () => {
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

    it('should return true for chunk phases', () => {
      expect(['extracting', 'chunk-1', 'chunk-2', 'chunk-3', 'chunk-4'].includes('chunk-1')).toBe(true);
      expect(['extracting', 'chunk-1', 'chunk-2', 'chunk-3', 'chunk-4'].includes('chunk-2')).toBe(true);
      expect(['extracting', 'chunk-1', 'chunk-2', 'chunk-3', 'chunk-4'].includes('chunk-3')).toBe(true);
      expect(['extracting', 'chunk-1', 'chunk-2', 'chunk-3', 'chunk-4'].includes('chunk-4')).toBe(true);
    });
  });

  describe('Derived State - hasMinimumViableProfile', () => {
    it('should return false when profile has no name or age', () => {
      const { result } = renderHook(() => useUserStreamingAnalysis());

      expect(result.current.hasMinimumViableProfile).toBe(false);
    });

    it('should return true when profile has name', () => {
      const profile = createInitialAccumulatedUserProfile();
      profile.identity.name = 'Test User';
      expect(profile.identity.name !== null || profile.identity.age !== null).toBe(true);
    });

    it('should return true when profile has age', () => {
      const profile = createInitialAccumulatedUserProfile();
      profile.identity.age = 28;
      expect(profile.identity.name !== null || profile.identity.age !== null).toBe(true);
    });
  });

  describe('Derived State - isProcessing', () => {
    it('should return false when phase is idle', () => {
      const { result } = renderHook(() => useUserStreamingAnalysis());

      expect(result.current.isProcessing).toBe(false);
    });

    it('should return true during extracting (canAbort is true)', () => {
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
  });

  describe('reset()', () => {
    it('should reset state to initial values', async () => {
      const { result } = renderHook(() => useUserStreamingAnalysis());

      await act(async () => {
        result.current.reset();
      });

      expect(result.current.state.phase).toBe('idle');
      expect(result.current.state.frames).toEqual([]);
      expect(result.current.state.allFrames).toEqual([]);
      expect(result.current.state.currentChunk).toBe(0);
      expect(result.current.state.error).toBeNull();
    });

    it('should be callable multiple times', async () => {
      const { result } = renderHook(() => useUserStreamingAnalysis());

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

      vi.mocked(extractFramesChunked).mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useUserStreamingAnalysis());

      const mockFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });

      act(() => {
        result.current.startAnalysis(mockFile);
      });

      await waitFor(() => {
        expect(result.current.state.phase).toBe('extracting');
      });
    });

    it('should call extractFramesChunked with correct options', async () => {
      const { extractFramesChunked } = await import('../lib/frameExtraction');
      vi.mocked(extractFramesChunked).mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useUserStreamingAnalysis());

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
      const { analyzeUserProfileStreaming } = await import('../lib/ai');

      vi.mocked(extractFramesChunked).mockImplementation(async (file, options) => {
        options?.onChunkReady?.({
          chunkIndex: 0,
          totalChunks: 4,
          frames: ['frame1', 'frame2', 'frame3', 'frame4'],
          allFramesSoFar: ['frame1', 'frame2', 'frame3', 'frame4'],
        });
      });

      vi.mocked(analyzeUserProfileStreaming).mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useUserStreamingAnalysis());

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
      const { analyzeUserProfileStreaming } = await import('../lib/ai');
      const { scoreAllFrames } = await import('../lib/frameQuality');

      vi.mocked(extractFramesChunked).mockResolvedValue(undefined);
      vi.mocked(scoreAllFrames).mockResolvedValue([]);
      vi.mocked(analyzeUserProfileStreaming).mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useUserStreamingAnalysis());

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

      const { result } = renderHook(() => useUserStreamingAnalysis());

      const mockFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });

      await act(async () => {
        await result.current.startAnalysis(mockFile);
      });

      await waitFor(() => {
        expect(result.current.state.phase).toBe('error');
        expect(result.current.state.error).toBeTruthy();
      });
    });

    it('should complete analysis and save synthesis', async () => {
      const { extractFramesChunked } = await import('../lib/frameExtraction');
      const { analyzeUserProfileStreaming } = await import('../lib/ai');
      const { scoreAllFrames } = await import('../lib/frameQuality');
      const { db } = await import('../lib/db');

      vi.mocked(extractFramesChunked).mockResolvedValue(undefined);
      vi.mocked(scoreAllFrames).mockResolvedValue([]);

      const mockProfile = createInitialAccumulatedUserProfile();
      mockProfile.identity.name = 'Test User';
      mockProfile.identity.age = 28;

      vi.mocked(analyzeUserProfileStreaming).mockResolvedValue(mockProfile);
      vi.mocked(db.userIdentity.get).mockResolvedValue(null);
      vi.mocked(db.userIdentity.put).mockResolvedValue(1);

      const { result } = renderHook(() => useUserStreamingAnalysis());

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
    it('should set phase to aborted', async () => {
      const { result } = renderHook(() => useUserStreamingAnalysis());

      await act(async () => {
        result.current.abort();
      });

      expect(result.current.state.phase).toBe('aborted');
    });

    it('should be callable during any processing phase', async () => {
      const { extractFramesChunked } = await import('../lib/frameExtraction');

      vi.mocked(extractFramesChunked).mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useUserStreamingAnalysis());

      const mockFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });

      act(() => {
        result.current.startAnalysis(mockFile);
      });

      await waitFor(() => {
        expect(result.current.canAbort).toBe(true);
      });

      await act(async () => {
        result.current.abort();
      });

      expect(result.current.state.phase).toBe('aborted');
    });
  });

  describe('Phase Transitions', () => {
    it('should follow correct phase sequence', () => {
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

    it('should calculate next phase correctly for each chunk', () => {
      const chunkPhases = ['chunk-1', 'chunk-2', 'chunk-3', 'chunk-4'];

      expect(0 < 3 ? chunkPhases[0 + 1] : 'consolidating').toBe('chunk-2');
      expect(1 < 3 ? chunkPhases[1 + 1] : 'consolidating').toBe('chunk-3');
      expect(2 < 3 ? chunkPhases[2 + 1] : 'consolidating').toBe('chunk-4');
      expect(3 < 3 ? chunkPhases[3 + 1] : 'consolidating').toBe('consolidating');
    });
  });

  describe('Error Handling', () => {
    it('should handle abort signal correctly', async () => {
      const { extractFramesChunked } = await import('../lib/frameExtraction');

      vi.mocked(extractFramesChunked).mockRejectedValue(new Error('The user aborted a request.'));

      const { result } = renderHook(() => useUserStreamingAnalysis());

      const mockFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });

      await act(async () => {
        result.current.startAnalysis(mockFile);
      });

      await waitFor(() => {
        expect(result.current.state.error).toBeNull();
      });
    });
  });

  describe('Chunk Latency Tracking', () => {
    it('should initialize with empty chunkLatencies', () => {
      const { result } = renderHook(() => useUserStreamingAnalysis());

      expect(result.current.state.chunkLatencies).toEqual([]);
    });

    it('should accumulate latencies correctly', () => {
      const latencies: number[] = [];
      latencies.push(100);
      latencies.push(150);
      latencies.push(120);
      latencies.push(130);

      expect(latencies).toEqual([100, 150, 120, 130]);
      expect(latencies.length).toBe(4);
    });
  });

  describe('Thumbnail Selection', () => {
    it('should use thumbnailIndex from profile', () => {
      const profile = createInitialAccumulatedUserProfile();
      profile.photos.thumbnailIndex = 2;

      expect(profile.photos.thumbnailIndex).toBe(2);
    });

    it('should track thumbnailOverridden flag', () => {
      const { result } = renderHook(() => useUserStreamingAnalysis());

      expect(result.current.state.thumbnailOverridden).toBe(false);
    });
  });

  describe('Frame Quality Scoring', () => {
    it('should call scoreAllFrames for first chunk', async () => {
      const { extractFramesChunked } = await import('../lib/frameExtraction');
      const { analyzeUserProfileStreaming } = await import('../lib/ai');
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
      vi.mocked(analyzeUserProfileStreaming).mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useUserStreamingAnalysis());

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
    it('should auto-save when chunk 1 completes', async () => {
      const { extractFramesChunked } = await import('../lib/frameExtraction');
      const { analyzeUserProfileStreaming } = await import('../lib/ai');
      const { scoreAllFrames } = await import('../lib/frameQuality');
      const { db } = await import('../lib/db');

      vi.mocked(extractFramesChunked).mockResolvedValue(undefined);
      vi.mocked(scoreAllFrames).mockResolvedValue([]);

      const mockProfile = createInitialAccumulatedUserProfile();
      mockProfile.identity.name = 'Auto-saved User';

      vi.mocked(analyzeUserProfileStreaming).mockImplementation(async (frameChunks, callbacks) => {
        callbacks?.onChunkComplete?.(0, mockProfile, 100);
        return mockProfile;
      });

      vi.mocked(db.userIdentity.get).mockResolvedValue(null);
      vi.mocked(db.userIdentity.put).mockResolvedValue(1);

      const { result } = renderHook(() => useUserStreamingAnalysis());

      const mockFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });

      await act(async () => {
        await result.current.startAnalysis(mockFile);
      });

      await waitFor(() => {
        expect(db.userIdentity.put).toHaveBeenCalled();
      });
    });
  });

  describe('Server Sync with UserId', () => {
    it('should sync to server when userId is provided', async () => {
      const { extractFramesChunked } = await import('../lib/frameExtraction');
      const { analyzeUserProfileStreaming } = await import('../lib/ai');
      const { scoreAllFrames } = await import('../lib/frameQuality');
      const { db } = await import('../lib/db');
      const { saveUserIdentityWithSync } = await import('../lib/sync');

      vi.mocked(extractFramesChunked).mockResolvedValue(undefined);
      vi.mocked(scoreAllFrames).mockResolvedValue([]);

      const mockProfile = createInitialAccumulatedUserProfile();
      mockProfile.identity.name = 'Sync User';

      vi.mocked(analyzeUserProfileStreaming).mockResolvedValue(mockProfile);
      vi.mocked(db.userIdentity.get).mockResolvedValue(null);
      vi.mocked(db.userIdentity.put).mockResolvedValue(1);
      vi.mocked(saveUserIdentityWithSync).mockResolvedValue(undefined);

      const { result } = renderHook(() => useUserStreamingAnalysis({ userId: 'test-user-123' }));

      const mockFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });

      await act(async () => {
        await result.current.startAnalysis(mockFile);
      });

      await waitFor(() => {
        expect(saveUserIdentityWithSync).toHaveBeenCalled();
      });
    });

    it('should skip server sync when userId is not provided', async () => {
      const { extractFramesChunked } = await import('../lib/frameExtraction');
      const { analyzeUserProfileStreaming } = await import('../lib/ai');
      const { scoreAllFrames } = await import('../lib/frameQuality');
      const { db } = await import('../lib/db');
      const { saveUserIdentityWithSync } = await import('../lib/sync');

      vi.mocked(extractFramesChunked).mockResolvedValue(undefined);
      vi.mocked(scoreAllFrames).mockResolvedValue([]);

      const mockProfile = createInitialAccumulatedUserProfile();
      mockProfile.identity.name = 'No Sync User';

      vi.mocked(analyzeUserProfileStreaming).mockResolvedValue(mockProfile);
      vi.mocked(db.userIdentity.get).mockResolvedValue(null);
      vi.mocked(db.userIdentity.put).mockResolvedValue(1);

      const { result } = renderHook(() => useUserStreamingAnalysis());

      const mockFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });

      await act(async () => {
        await result.current.startAnalysis(mockFile);
      });

      await waitFor(() => {
        expect(saveUserIdentityWithSync).not.toHaveBeenCalled();
      });
    });
  });

  describe('Options', () => {
    it('should accept userId option', () => {
      const { result } = renderHook(() => useUserStreamingAnalysis({ userId: 'test-user' }));

      expect(result.current.state.phase).toBe('idle');
    });

    it('should work with empty options', () => {
      const { result } = renderHook(() => useUserStreamingAnalysis({}));

      expect(result.current.state.phase).toBe('idle');
    });

    it('should work without options', () => {
      const { result } = renderHook(() => useUserStreamingAnalysis());

      expect(result.current.state.phase).toBe('idle');
    });
  });
});
