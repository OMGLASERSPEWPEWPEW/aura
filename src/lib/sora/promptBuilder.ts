// src/lib/sora/promptBuilder.ts
// Build Sora prompts from virtue scores for motion portrait generation

import type { VirtueScore } from '../virtues/types';
import { getVirtueById } from '../virtues/virtues';
import { getTopVirtues } from '../essence/virtueSentence';

/**
 * Motion characteristics associated with each virtue (high score = intense motion)
 */
const VIRTUE_MOTION: Record<string, {
  highMotion: string;
  lowMotion: string;
  elements: string[];
  colorModifier: string;
}> = {
  // Biological realm
  vitality: {
    highMotion: 'rapid pulsing energy waves, electric arcs dancing',
    lowMotion: 'slow, gentle breathing rhythm',
    elements: ['energy pulses', 'electric arcs', 'vibrant sparks'],
    colorModifier: 'vivid, saturated',
  },
  lust: {
    highMotion: 'sensual undulating curves, magnetic attraction between forms',
    lowMotion: 'restrained, minimal movement',
    elements: ['flowing curves', 'warm gradients', 'subtle magnetism'],
    colorModifier: 'warm, deep',
  },
  play: {
    highMotion: 'bouncy, erratic particles, playful spirals',
    lowMotion: 'calm, measured floating',
    elements: ['bubbles', 'spirals', 'whimsical shapes'],
    colorModifier: 'bright, cheerful',
  },

  // Emotional realm
  warmth: {
    highMotion: 'expanding golden glow, embracing light waves',
    lowMotion: 'distant, cool shimmer',
    elements: ['soft glows', 'expanding warmth', 'gentle rays'],
    colorModifier: 'golden, amber',
  },
  voice: {
    highMotion: 'bold strokes cutting through space, assertive movements',
    lowMotion: 'quiet, subtle shifts',
    elements: ['sharp lines', 'decisive strokes', 'clear paths'],
    colorModifier: 'crisp, defined',
  },
  space: {
    highMotion: 'vast expansive drifts, free-floating independence',
    lowMotion: 'close, contained movements',
    elements: ['open expanses', 'floating forms', 'wide horizons'],
    colorModifier: 'airy, light',
  },
  anchor: {
    highMotion: 'steady rhythmic patterns, grounding pulses',
    lowMotion: 'fluid, unmoored floating',
    elements: ['geometric anchors', 'stable patterns', 'rhythmic pulses'],
    colorModifier: 'solid, grounded',
  },

  // Cerebral realm
  wit: {
    highMotion: 'quick darting connections, rapid pattern shifts',
    lowMotion: 'slow, deliberate transitions',
    elements: ['neural connections', 'quick flashes', 'intricate patterns'],
    colorModifier: 'electric, sharp',
  },
  drive: {
    highMotion: 'unstoppable upward trajectories, ascending momentum',
    lowMotion: 'gentle wandering, no urgency',
    elements: ['ascending arrows', 'climbing forms', 'determined motion'],
    colorModifier: 'powerful, intense',
  },
  curiosity: {
    highMotion: 'exploring tendrils, seeking pathways, endless depth',
    lowMotion: 'static, surface-level observation',
    elements: ['exploring paths', 'doorways opening', 'mysterious depths'],
    colorModifier: 'mysterious, inviting',
  },
  soul: {
    highMotion: 'transcendent flowing light, cosmic expansion',
    lowMotion: 'practical, earthbound movement',
    elements: ['cosmic nebulae', 'ethereal light', 'transcendent forms'],
    colorModifier: 'mystical, profound',
  },
};

/**
 * Get motion description for a virtue based on score
 */
function getVirtueMotionDescription(virtueId: string, score: number): string | null {
  const motion = VIRTUE_MOTION[virtueId];
  if (!motion) return null;

  // Score interpretation: 1-30 low, 31-69 mid, 70-100 high
  if (score >= 70) {
    return motion.highMotion;
  } else if (score <= 30) {
    return motion.lowMotion;
  }
  // Mid-range scores don't contribute distinctive motion
  return null;
}

/**
 * Get color modifier for a virtue
 */
function getVirtueColorModifier(virtueId: string): string | null {
  return VIRTUE_MOTION[virtueId]?.colorModifier || null;
}

/**
 * Build the Sora prompt for motion portrait generation
 *
 * @param scores - The 11 Virtues scores
 * @param virtueSentence - Optional virtue sentence for context
 * @returns The prompt string for Sora
 */
export function buildSoraPrompt(
  scores: VirtueScore[],
  virtueSentence?: string
): string {
  if (!scores || scores.length === 0) {
    return buildDefaultPrompt();
  }

  // Get top 3 most distinctive virtues
  const topVirtues = getTopVirtues(scores, 3);

  // Collect motion descriptions and elements
  const motionDescriptions: string[] = [];
  const colorModifiers: string[] = [];

  for (const virtueScore of topVirtues) {
    const virtue = getVirtueById(virtueScore.virtue_id);
    if (!virtue) continue;

    const motionDesc = getVirtueMotionDescription(virtueScore.virtue_id, virtueScore.score);
    if (motionDesc) {
      motionDescriptions.push(motionDesc);
    }

    const colorMod = getVirtueColorModifier(virtueScore.virtue_id);
    if (colorMod) {
      colorModifiers.push(colorMod);
    }
  }

  // Build the prompt
  const uniqueMotions = [...new Set(motionDescriptions)].slice(0, 3);
  const uniqueColors = [...new Set(colorModifiers)].slice(0, 2);

  const prompt = `
Create a 3-second looping abstract motion portrait.

Motion characteristics:
${uniqueMotions.length > 0 ? uniqueMotions.map(m => `- ${m}`).join('\n') : '- gentle flowing energy, balanced movements'}

Color palette:
${uniqueColors.length > 0 ? `- ${uniqueColors.join(', ')} tones` : '- harmonious, balanced tones'}
- Gradients and depth for dimension

${virtueSentence ? `Essence to capture: "${virtueSentence}"` : ''}

Style requirements:
- ABSTRACT, non-representational motion art
- NO faces, NO text, NO human forms, NO photorealistic elements
- Think: emotional resonance and energy through movement
- Flowing shapes, organic forms, light interplay
- Cinematic quality, ethereal and dreamlike
- Seamless loop: first frame transitions smoothly to last frame
- Portrait orientation (1080x1920)
- 60fps smooth motion
`.trim();

  return prompt;
}

/**
 * Default prompt when no virtue scores are available
 */
function buildDefaultPrompt(): string {
  return `
Create a 3-second looping abstract motion portrait.

Motion:
- Gentle flowing energy, balanced movements
- Soft pulsing light rhythms
- Harmonious transitions

Style:
- Abstract, non-representational motion art
- Flowing gradients and organic shapes
- Soft, harmonious color palette
- Ethereal and dreamlike atmosphere
- NO faces, NO text, NO human forms
- Cinematic quality
- Seamless loop
- Portrait orientation (1080x1920)
- 60fps smooth motion

Create motion that evokes warmth, depth, and individuality.
`.trim();
}
