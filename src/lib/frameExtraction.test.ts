// src/lib/frameExtraction.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractFramesFromVideo, FrameExtractionProgress } from './frameExtraction';

describe('frameExtraction', () => {
  // Mock video element
  let mockVideo: {
    src: string;
    playsInline: boolean;
    muted: boolean;
    crossOrigin: string;
    currentTime: number;
    duration: number;
    videoWidth: number;
    videoHeight: number;
    onloadedmetadata: (() => void) | null;
    onerror: ((e: unknown) => void) | null;
    onseeked: (() => void) | null;
  };

  // Mock canvas element
  let mockCanvas: {
    width: number;
    height: number;
    getContext: ReturnType<typeof vi.fn>;
    toDataURL: ReturnType<typeof vi.fn>;
  };

  // Mock 2D context
  let mockCtx: {
    drawImage: ReturnType<typeof vi.fn>;
  };

  // Mock URL methods
  let mockCreateObjectURL: ReturnType<typeof vi.fn>;
  let mockRevokeObjectURL: ReturnType<typeof vi.fn>;
  let createElementSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Reset mocks
    mockVideo = {
      src: '',
      playsInline: false,
      muted: false,
      crossOrigin: '',
      currentTime: 0,
      duration: 10,
      videoWidth: 1920,
      videoHeight: 1080,
      onloadedmetadata: null,
      onerror: null,
      onseeked: null,
    };

    mockCtx = {
      drawImage: vi.fn(),
    };

    mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => mockCtx),
      toDataURL: vi.fn(() => 'data:image/jpeg;base64,mockFrameData'),
    };

    // Mock document.createElement
    createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'video') {
        return mockVideo as unknown as HTMLVideoElement;
      }
      if (tagName === 'canvas') {
        return mockCanvas as unknown as HTMLCanvasElement;
      }
      // Fallback for other elements (shouldn't be called in our tests)
      return document.createElement(tagName);
    });

    // Mock URL methods
    mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
    mockRevokeObjectURL = vi.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper to create a mock File
  const createMockFile = (name = 'test.mp4') => {
    return new File(['mock video content'], name, { type: 'video/mp4' });
  };

  // Helper to trigger video loaded event with automatic seeking
  const simulateVideoLoad = async (seekDelay = 0) => {
    // Wait for the promise to start
    await new Promise(resolve => setTimeout(resolve, 0));

    // Trigger metadata loaded
    if (mockVideo.onloadedmetadata) {
      mockVideo.onloadedmetadata();
    }

    // Simulate seeking for each frame
    const frameCount = Math.ceil(mockVideo.duration / 2); // default interval is 2
    for (let i = 0; i < frameCount; i++) {
      await new Promise(resolve => setTimeout(resolve, seekDelay));
      if (mockVideo.onseeked) {
        mockVideo.onseeked();
      }
    }
  };

  // ==================== Parse Options ====================
  describe('Parse options', () => {
    it('should accept legacy intervalSeconds number parameter', async () => {
      const file = createMockFile();
      mockVideo.duration = 4;

      const promise = extractFramesFromVideo(file, 2);
      await simulateVideoLoad();
      const frames = await promise;

      expect(frames).toHaveLength(2); // 4 seconds / 2 second interval = 2 frames
    });

    it('should accept new options object format', async () => {
      const file = createMockFile();
      mockVideo.duration = 6;

      const promise = extractFramesFromVideo(file, { intervalSeconds: 3 });
      await simulateVideoLoad();
      const frames = await promise;

      expect(frames).toHaveLength(2); // 6 seconds / 3 second interval = 2 frames
    });

    it('should use 2 seconds as default interval when not specified', async () => {
      const file = createMockFile();
      mockVideo.duration = 6;

      const promise = extractFramesFromVideo(file);
      await simulateVideoLoad();
      const frames = await promise;

      expect(frames).toHaveLength(3); // 6 seconds / 2 second default = 3 frames
    });
  });

  // ==================== Metadata Callback ====================
  describe('Metadata callback', () => {
    it('should call onMetadataLoaded with duration and frame count', async () => {
      const file = createMockFile();
      mockVideo.duration = 10;
      const onMetadataLoaded = vi.fn();

      const promise = extractFramesFromVideo(file, {
        intervalSeconds: 2,
        onMetadataLoaded,
      });
      await simulateVideoLoad();
      await promise;

      expect(onMetadataLoaded).toHaveBeenCalledOnce();
      expect(onMetadataLoaded).toHaveBeenCalledWith({
        duration: 10,
        totalFrames: 5, // 10 seconds / 2 second interval = 5 frames
      });
    });
  });

  // ==================== Progress Callback ====================
  describe('Progress callback', () => {
    it('should call onProgress for each captured frame', async () => {
      const file = createMockFile();
      mockVideo.duration = 4;
      const onProgress = vi.fn();

      const promise = extractFramesFromVideo(file, {
        intervalSeconds: 2,
        onProgress,
      });
      await simulateVideoLoad();
      await promise;

      expect(onProgress).toHaveBeenCalledTimes(2);

      // First frame
      expect(onProgress).toHaveBeenNthCalledWith(1, {
        currentFrame: 1,
        totalFrames: 2,
        currentTime: 0,
        duration: 4,
      });

      // Second frame
      expect(onProgress).toHaveBeenNthCalledWith(2, {
        currentFrame: 2,
        totalFrames: 2,
        currentTime: 2,
        duration: 4,
      });
    });
  });

  // ==================== Frame Capture ====================
  describe('Frame capture', () => {
    it('should return array of base64 JPEG strings', async () => {
      const file = createMockFile();
      mockVideo.duration = 4;

      const promise = extractFramesFromVideo(file, 2);
      await simulateVideoLoad();
      const frames = await promise;

      expect(frames).toHaveLength(2);
      expect(frames[0]).toBe('data:image/jpeg;base64,mockFrameData');
      expect(frames[1]).toBe('data:image/jpeg;base64,mockFrameData');
    });

    it('should call canvas.toDataURL with correct format and quality', async () => {
      const file = createMockFile();
      mockVideo.duration = 2;

      const promise = extractFramesFromVideo(file, 2);
      await simulateVideoLoad();
      await promise;

      expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/jpeg', 0.7);
    });

    it('should draw video frame to canvas', async () => {
      const file = createMockFile();
      mockVideo.duration = 2;
      mockVideo.videoWidth = 1920;
      mockVideo.videoHeight = 1080;

      const promise = extractFramesFromVideo(file, 2);
      await simulateVideoLoad();
      await promise;

      expect(mockCanvas.width).toBe(1920);
      expect(mockCanvas.height).toBe(1080);
      expect(mockCtx.drawImage).toHaveBeenCalled();
    });
  });

  // ==================== Video Error Handling ====================
  describe('Video error handling', () => {
    it('should reject with error message on video load failure', async () => {
      const file = createMockFile();

      const promise = extractFramesFromVideo(file, 2);

      // Wait for promise to start
      await new Promise(resolve => setTimeout(resolve, 0));

      // Trigger error
      if (mockVideo.onerror) {
        mockVideo.onerror(new Error('Video load failed'));
      }

      await expect(promise).rejects.toThrow(
        'Error loading video. Please try a different file format.'
      );
    });
  });

  // ==================== URL Cleanup ====================
  describe('URL cleanup', () => {
    it('should call URL.revokeObjectURL on successful completion', async () => {
      const file = createMockFile();
      mockVideo.duration = 2;

      const promise = extractFramesFromVideo(file, 2);
      await simulateVideoLoad();
      await promise;

      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should call URL.revokeObjectURL on error', async () => {
      const file = createMockFile();

      const promise = extractFramesFromVideo(file, 2);

      // Wait for promise to start
      await new Promise(resolve => setTimeout(resolve, 0));

      // Trigger error
      if (mockVideo.onerror) {
        mockVideo.onerror(new Error('Video load failed'));
      }

      try {
        await promise;
      } catch {
        // Expected to throw
      }

      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
  });

  // ==================== iOS Safari Attributes ====================
  describe('iOS Safari attributes', () => {
    it('should set playsInline, muted, and crossOrigin attributes on video element', async () => {
      const file = createMockFile();
      mockVideo.duration = 2;

      const promise = extractFramesFromVideo(file, 2);
      await simulateVideoLoad();
      await promise;

      expect(mockVideo.playsInline).toBe(true);
      expect(mockVideo.muted).toBe(true);
      expect(mockVideo.crossOrigin).toBe('anonymous');
    });
  });
});
