// src/lib/frameQuality.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateBrightness,
  calculateColorVariance,
  calculateEdgeDensity,
  generateQualityHints,
  findBestFrameIndex,
  validateThumbnailChoice,
  type FrameQualityScore,
} from './frameQuality';

// Helper to create mock ImageData
function createMockImageData(
  width: number,
  height: number,
  fillFn: (x: number, y: number) => [number, number, number, number]
): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const [r, g, b, a] = fillFn(x, y);
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = a;
    }
  }
  return { data, width, height, colorSpace: 'srgb' } as ImageData;
}

// Create black image data
function createBlackImageData(size = 100): ImageData {
  return createMockImageData(size, size, () => [0, 0, 0, 255]);
}

// Create white image data
function createWhiteImageData(size = 100): ImageData {
  return createMockImageData(size, size, () => [255, 255, 255, 255]);
}

// Create colorful image data (simulating a photo)
function createColorfulImageData(size = 100): ImageData {
  return createMockImageData(size, size, (x, y) => {
    // Create a gradient with variation
    const r = Math.floor((x / size) * 200 + Math.random() * 55);
    const g = Math.floor((y / size) * 200 + Math.random() * 55);
    const b = Math.floor(((x + y) / (size * 2)) * 200 + Math.random() * 55);
    return [r, g, b, 255];
  });
}

// Create text-like image data (high contrast edges, low color variance)
function createTextImageData(size = 100): ImageData {
  return createMockImageData(size, size, (x, y) => {
    // Simulate text: alternating black and white horizontal stripes
    const isText = (y % 10 < 5) && (x % 3 === 0);
    return isText ? [0, 0, 0, 255] : [255, 255, 255, 255];
  });
}

describe('frameQuality', () => {
  describe('calculateBrightness', () => {
    it('should return ~0 for black images', () => {
      const imageData = createBlackImageData();
      const brightness = calculateBrightness(imageData);
      expect(brightness).toBeLessThan(1);
    });

    it('should return ~255 for white images', () => {
      const imageData = createWhiteImageData();
      const brightness = calculateBrightness(imageData);
      expect(brightness).toBeGreaterThan(254);
    });

    it('should return mid-range for colorful images', () => {
      const imageData = createColorfulImageData();
      const brightness = calculateBrightness(imageData);
      expect(brightness).toBeGreaterThan(50);
      expect(brightness).toBeLessThan(200);
    });
  });

  describe('calculateColorVariance', () => {
    it('should return 0 for solid color images', () => {
      const imageData = createBlackImageData();
      const variance = calculateColorVariance(imageData);
      expect(variance).toBeLessThan(0.01);
    });

    it('should return higher variance for colorful images', () => {
      const imageData = createColorfulImageData();
      const variance = calculateColorVariance(imageData);
      expect(variance).toBeGreaterThan(0.05);
    });
  });

  describe('calculateEdgeDensity', () => {
    it('should return ~0 for solid color images', () => {
      const imageData = createBlackImageData();
      const edgeDensity = calculateEdgeDensity(imageData);
      expect(edgeDensity).toBeLessThan(0.01);
    });

    it('should return high density for text-like images', () => {
      const imageData = createTextImageData();
      const edgeDensity = calculateEdgeDensity(imageData);
      expect(edgeDensity).toBeGreaterThan(0.1);
    });
  });

  describe('generateQualityHints', () => {
    it('should return empty string for empty scores', () => {
      const hints = generateQualityHints([]);
      expect(hints).toBe('');
    });

    it('should generate hints for each frame', () => {
      const scores: FrameQualityScore[] = [
        {
          index: 0,
          brightness: 10,
          variance: 0.01,
          edgeDensity: 0.1,
          isLikelyDark: true,
          isLikelyTextHeavy: false,
          overallScore: 15,
          isUsable: false,
        },
        {
          index: 1,
          brightness: 128,
          variance: 0.4,
          edgeDensity: 0.2,
          isLikelyDark: false,
          isLikelyTextHeavy: false,
          overallScore: 75,
          isUsable: true,
        },
      ];

      const hints = generateQualityHints(scores);

      expect(hints).toContain('Frame 0');
      expect(hints).toContain('Frame 1');
      expect(hints).toContain('LIKELY DARK');
      expect(hints).toContain('poor quality');
      expect(hints).toContain('good quality');
    });

    it('should indicate text-heavy frames', () => {
      const scores: FrameQualityScore[] = [
        {
          index: 0,
          brightness: 200,
          variance: 0.05,
          edgeDensity: 0.35,
          isLikelyDark: false,
          isLikelyTextHeavy: true,
          overallScore: 30,
          isUsable: false,
        },
      ];

      const hints = generateQualityHints(scores);
      expect(hints).toContain('LIKELY TEXT-HEAVY');
    });
  });

  describe('findBestFrameIndex', () => {
    it('should return 0 for empty scores', () => {
      expect(findBestFrameIndex([])).toBe(0);
    });

    it('should return highest scoring usable frame', () => {
      const scores: FrameQualityScore[] = [
        {
          index: 0,
          brightness: 10,
          variance: 0.01,
          edgeDensity: 0.1,
          isLikelyDark: true,
          isLikelyTextHeavy: false,
          overallScore: 15,
          isUsable: false,
        },
        {
          index: 1,
          brightness: 128,
          variance: 0.3,
          edgeDensity: 0.2,
          isLikelyDark: false,
          isLikelyTextHeavy: false,
          overallScore: 65,
          isUsable: true,
        },
        {
          index: 2,
          brightness: 140,
          variance: 0.4,
          edgeDensity: 0.2,
          isLikelyDark: false,
          isLikelyTextHeavy: false,
          overallScore: 80,
          isUsable: true,
        },
        {
          index: 3,
          brightness: 120,
          variance: 0.25,
          edgeDensity: 0.2,
          isLikelyDark: false,
          isLikelyTextHeavy: false,
          overallScore: 55,
          isUsable: true,
        },
      ];

      expect(findBestFrameIndex(scores)).toBe(2);
    });

    it('should find first non-dark frame if no usable frames', () => {
      const scores: FrameQualityScore[] = [
        {
          index: 0,
          brightness: 10,
          variance: 0.01,
          edgeDensity: 0.1,
          isLikelyDark: true,
          isLikelyTextHeavy: false,
          overallScore: 10,
          isUsable: false,
        },
        {
          index: 1,
          brightness: 5,
          variance: 0.01,
          edgeDensity: 0.1,
          isLikelyDark: true,
          isLikelyTextHeavy: false,
          overallScore: 5,
          isUsable: false,
        },
        {
          index: 2,
          brightness: 50,
          variance: 0.05,
          edgeDensity: 0.3,
          isLikelyDark: false,
          isLikelyTextHeavy: true,
          overallScore: 25,
          isUsable: false,
        },
      ];

      expect(findBestFrameIndex(scores)).toBe(2);
    });

    it('should return highest scoring frame as last resort', () => {
      const scores: FrameQualityScore[] = [
        {
          index: 0,
          brightness: 10,
          variance: 0.01,
          edgeDensity: 0.1,
          isLikelyDark: true,
          isLikelyTextHeavy: false,
          overallScore: 10,
          isUsable: false,
        },
        {
          index: 1,
          brightness: 15,
          variance: 0.02,
          edgeDensity: 0.1,
          isLikelyDark: true,
          isLikelyTextHeavy: false,
          overallScore: 15,
          isUsable: false,
        },
      ];

      expect(findBestFrameIndex(scores)).toBe(1);
    });
  });

  describe('validateThumbnailChoice', () => {
    const usableScores: FrameQualityScore[] = [
      {
        index: 0,
        brightness: 10,
        variance: 0.01,
        edgeDensity: 0.1,
        isLikelyDark: true,
        isLikelyTextHeavy: false,
        overallScore: 15,
        isUsable: false,
      },
      {
        index: 1,
        brightness: 128,
        variance: 0.4,
        edgeDensity: 0.2,
        isLikelyDark: false,
        isLikelyTextHeavy: false,
        overallScore: 75,
        isUsable: true,
      },
      {
        index: 2,
        brightness: 200,
        variance: 0.05,
        edgeDensity: 0.35,
        isLikelyDark: false,
        isLikelyTextHeavy: true,
        overallScore: 30,
        isUsable: false,
      },
    ];

    it('should keep usable AI choice', () => {
      const result = validateThumbnailChoice(1, usableScores);
      expect(result.finalIndex).toBe(1);
      expect(result.wasOverridden).toBe(false);
    });

    it('should override dark frame choice', () => {
      const result = validateThumbnailChoice(0, usableScores);
      expect(result.finalIndex).toBe(1); // Best usable frame
      expect(result.wasOverridden).toBe(true);
      expect(result.reason).toContain('dark frame');
    });

    it('should override text-heavy frame choice', () => {
      const result = validateThumbnailChoice(2, usableScores);
      expect(result.finalIndex).toBe(1); // Best usable frame
      expect(result.wasOverridden).toBe(true);
      expect(result.reason).toContain('text-heavy');
    });

    it('should handle empty scores', () => {
      const result = validateThumbnailChoice(0, []);
      expect(result.finalIndex).toBe(0);
      expect(result.wasOverridden).toBe(false);
    });

    it('should handle out-of-bounds AI choice', () => {
      const result = validateThumbnailChoice(10, usableScores);
      expect(result.finalIndex).toBe(10);
      expect(result.wasOverridden).toBe(false);
    });

    it('should handle negative AI choice', () => {
      const result = validateThumbnailChoice(-1, usableScores);
      expect(result.finalIndex).toBe(0);
      expect(result.wasOverridden).toBe(false);
    });
  });

  // Tests for the async functions (scoreFrame, scoreAllFrames) require browser APIs
  // These are integration tests that should run in a browser environment
  describe('Integration tests (browser APIs)', () => {
    beforeEach(() => {
      // Reset mocks before each test
      vi.clearAllMocks();
    });

    it('should be tested in browser environment', () => {
      // Placeholder - these functions use Canvas API which requires browser/jsdom
      expect(true).toBe(true);
    });
  });
});
