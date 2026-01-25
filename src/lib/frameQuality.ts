// src/lib/frameQuality.ts
// Utility for scoring frame quality to improve thumbnail selection

export interface FrameQualityScore {
  index: number;
  brightness: number;        // 0-255 average pixel brightness
  variance: number;          // 0-1 normalized variance (color diversity)
  edgeDensity: number;       // 0-1 normalized edge density
  isLikelyDark: boolean;     // brightness < 30
  isLikelyTextHeavy: boolean; // high edge density + low color variance
  overallScore: number;      // 0-100 composite score
  isUsable: boolean;         // passes minimum threshold
}

// Small canvas size for performance (~50-100ms for 16 frames)
const ANALYSIS_SIZE = 100;

// Thresholds
const DARK_THRESHOLD = 30;           // brightness below this = likely black/dark frame
const LOW_VARIANCE_THRESHOLD = 0.08; // variance below this = low color diversity
const HIGH_EDGE_THRESHOLD = 0.25;    // edge density above this = lots of edges (text)
const USABLE_SCORE_THRESHOLD = 35;   // overall score below this = not usable

/**
 * Load an image from a data URL and return it
 */
function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * Get pixel data from an image at a reduced size for fast analysis
 */
async function getPixelData(dataUrl: string): Promise<ImageData> {
  const img = await loadImage(dataUrl);

  const canvas = document.createElement('canvas');
  canvas.width = ANALYSIS_SIZE;
  canvas.height = ANALYSIS_SIZE;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Draw image scaled down to analysis size
  ctx.drawImage(img, 0, 0, ANALYSIS_SIZE, ANALYSIS_SIZE);

  return ctx.getImageData(0, 0, ANALYSIS_SIZE, ANALYSIS_SIZE);
}

/**
 * Calculate average brightness (0-255) from pixel data
 */
export function calculateBrightness(imageData: ImageData): number {
  const data = imageData.data;
  let totalBrightness = 0;
  const pixelCount = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    // Standard luminance formula: 0.299*R + 0.587*G + 0.114*B
    const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    totalBrightness += brightness;
  }

  return totalBrightness / pixelCount;
}

/**
 * Calculate color variance (0-1) - measures color diversity
 * Low variance indicates monotone image (black screen, solid colors, text on white)
 */
export function calculateColorVariance(imageData: ImageData): number {
  const data = imageData.data;
  const pixelCount = data.length / 4;

  // Calculate mean for each channel
  let meanR = 0, meanG = 0, meanB = 0;
  for (let i = 0; i < data.length; i += 4) {
    meanR += data[i];
    meanG += data[i + 1];
    meanB += data[i + 2];
  }
  meanR /= pixelCount;
  meanG /= pixelCount;
  meanB /= pixelCount;

  // Calculate variance for each channel
  let varR = 0, varG = 0, varB = 0;
  for (let i = 0; i < data.length; i += 4) {
    varR += Math.pow(data[i] - meanR, 2);
    varG += Math.pow(data[i + 1] - meanG, 2);
    varB += Math.pow(data[i + 2] - meanB, 2);
  }
  varR /= pixelCount;
  varG /= pixelCount;
  varB /= pixelCount;

  // Combined variance, normalized to 0-1
  // Max possible variance is 255^2 = 65025 per channel
  const avgVariance = (varR + varG + varB) / 3;
  const normalizedVariance = Math.min(avgVariance / 10000, 1);

  return normalizedVariance;
}

/**
 * Calculate edge density using Sobel operator (simplified)
 * High edge density + low color variance = likely text-heavy
 */
export function calculateEdgeDensity(imageData: ImageData): number {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  // Convert to grayscale array for easier processing
  const grayscale: number[] = new Array(width * height);
  for (let i = 0; i < data.length; i += 4) {
    grayscale[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  // Simple edge detection: count pixels with significant gradient
  let edgeCount = 0;
  const threshold = 30; // Gradient threshold for edge detection

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;

      // Horizontal gradient
      const gx = grayscale[idx + 1] - grayscale[idx - 1];
      // Vertical gradient
      const gy = grayscale[idx + width] - grayscale[idx - width];

      // Magnitude
      const magnitude = Math.sqrt(gx * gx + gy * gy);

      if (magnitude > threshold) {
        edgeCount++;
      }
    }
  }

  // Normalize to 0-1
  const totalPixels = (width - 2) * (height - 2);
  return edgeCount / totalPixels;
}

/**
 * Score a single frame for quality
 */
export async function scoreFrame(dataUrl: string, index: number): Promise<FrameQualityScore> {
  try {
    const imageData = await getPixelData(dataUrl);

    const brightness = calculateBrightness(imageData);
    const variance = calculateColorVariance(imageData);
    const edgeDensity = calculateEdgeDensity(imageData);

    // Detection flags
    const isLikelyDark = brightness < DARK_THRESHOLD;
    const isLikelyTextHeavy = edgeDensity > HIGH_EDGE_THRESHOLD && variance < LOW_VARIANCE_THRESHOLD;

    // Calculate overall score (0-100)
    // Factors:
    // - Brightness: penalize very dark (0-30) and very bright (225-255)
    // - Variance: higher is better (more colorful = likely photo)
    // - Edge density: moderate is good, very high is bad (text)

    let score = 50; // Start at neutral

    // Brightness component (0-30 points)
    if (brightness < 30) {
      score -= 30; // Very dark = bad
    } else if (brightness < 50) {
      score -= 15; // Dark = somewhat bad
    } else if (brightness > 225) {
      score -= 10; // Very bright/washed out
    } else if (brightness >= 80 && brightness <= 180) {
      score += 15; // Ideal brightness range
    }

    // Variance component (0-30 points)
    if (variance > 0.3) {
      score += 30; // High color diversity = likely photo with person
    } else if (variance > 0.15) {
      score += 20;
    } else if (variance > 0.08) {
      score += 10;
    } else {
      score -= 15; // Low variance = likely solid/text frame
    }

    // Edge density component (0-20 points)
    if (isLikelyTextHeavy) {
      score -= 20; // High edges + low variance = text
    } else if (edgeDensity > 0.4) {
      score -= 10; // Very busy image
    } else if (edgeDensity > 0.15 && edgeDensity < 0.35) {
      score += 10; // Moderate edges = likely face/details
    }

    // Clamp to 0-100
    score = Math.max(0, Math.min(100, score));

    const isUsable = score >= USABLE_SCORE_THRESHOLD && !isLikelyDark;

    return {
      index,
      brightness,
      variance,
      edgeDensity,
      isLikelyDark,
      isLikelyTextHeavy,
      overallScore: score,
      isUsable,
    };
  } catch (error) {
    console.error(`Error scoring frame ${index}:`, error);
    // Return a neutral score on error
    return {
      index,
      brightness: 128,
      variance: 0.5,
      edgeDensity: 0.2,
      isLikelyDark: false,
      isLikelyTextHeavy: false,
      overallScore: 50,
      isUsable: true,
    };
  }
}

/**
 * Score all frames in parallel
 */
export async function scoreAllFrames(frames: string[]): Promise<FrameQualityScore[]> {
  const scores = await Promise.all(
    frames.map((frame, index) => scoreFrame(frame, index))
  );
  return scores;
}

/**
 * Generate quality hints string for AI prompt
 */
export function generateQualityHints(scores: FrameQualityScore[]): string {
  if (scores.length === 0) return '';

  const hints = scores.map(score => {
    const flags: string[] = [];
    if (score.isLikelyDark) flags.push('LIKELY DARK');
    if (score.isLikelyTextHeavy) flags.push('LIKELY TEXT-HEAVY');

    const quality = score.overallScore >= 65 ? 'good quality' :
                   score.overallScore >= 40 ? 'moderate quality' : 'poor quality';

    const flagStr = flags.length > 0 ? ` [${flags.join(', ')}]` : '';

    return `Frame ${score.index}: ${quality} (score: ${Math.round(score.overallScore)}/100)${flagStr}`;
  }).join('\n');

  return hints;
}

/**
 * Find the best frame index based on quality scores
 * Returns the index of the best usable frame, or 0 if none are usable
 */
export function findBestFrameIndex(scores: FrameQualityScore[]): number {
  if (scores.length === 0) return 0;

  // First, try to find the best usable frame
  const usableFrames = scores.filter(s => s.isUsable);
  if (usableFrames.length > 0) {
    const best = usableFrames.reduce((a, b) => a.overallScore > b.overallScore ? a : b);
    return best.index;
  }

  // If no usable frames, find the first non-dark frame
  const nonDark = scores.find(s => !s.isLikelyDark);
  if (nonDark) {
    return nonDark.index;
  }

  // Last resort: return the frame with highest score
  const best = scores.reduce((a, b) => a.overallScore > b.overallScore ? a : b);
  return best.index;
}

/**
 * Validate AI's thumbnail choice and return override if needed
 */
export function validateThumbnailChoice(
  aiChoice: number,
  scores: FrameQualityScore[]
): { finalIndex: number; wasOverridden: boolean; reason?: string } {
  if (scores.length === 0 || aiChoice < 0 || aiChoice >= scores.length) {
    return { finalIndex: Math.max(0, aiChoice), wasOverridden: false };
  }

  const chosenScore = scores[aiChoice];

  // If AI's choice is usable, keep it
  if (chosenScore.isUsable) {
    return { finalIndex: aiChoice, wasOverridden: false };
  }

  // AI chose a bad frame - find a better one
  const betterIndex = findBestFrameIndex(scores);

  let reason: string;
  if (chosenScore.isLikelyDark) {
    reason = 'AI chose dark frame, overriding with better quality frame';
  } else if (chosenScore.isLikelyTextHeavy) {
    reason = 'AI chose text-heavy frame, overriding with better quality frame';
  } else {
    reason = `AI choice score (${Math.round(chosenScore.overallScore)}) below threshold, using frame with score ${Math.round(scores[betterIndex].overallScore)}`;
  }

  return {
    finalIndex: betterIndex,
    wasOverridden: true,
    reason,
  };
}
