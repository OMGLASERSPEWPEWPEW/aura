// src/lib/essence/promptBuilder.ts
// Build DALL-E prompts from virtue scores

import type { VirtueScore } from '../virtues/types';
import { getVirtueById } from '../virtues/virtues';
import { getTopVirtues } from './virtueSentence';

/**
 * Color palettes associated with each realm
 */
const REALM_PALETTES: Record<string, string[]> = {
  biological: ['coral', 'rose', 'crimson', 'warm pink', 'sunset orange'],
  emotional: ['gold', 'amber', 'honey', 'warm yellow', 'soft peach'],
  cerebral: ['indigo', 'violet', 'deep purple', 'cosmic blue', 'midnight'],
};

/**
 * Visual elements associated with each virtue (high score)
 */
const VIRTUE_VISUALS: Record<string, { elements: string[]; texture: string; movement: string }> = {
  // Biological
  vitality: {
    elements: ['lightning bolts', 'electric arcs', 'energy waves'],
    texture: 'crackling, electric',
    movement: 'pulsing, dynamic',
  },
  lust: {
    elements: ['flames', 'molten forms', 'passionate swirls'],
    texture: 'smoldering, sensual',
    movement: 'undulating, magnetic',
  },
  play: {
    elements: ['bubbles', 'confetti', 'playful spirals'],
    texture: 'effervescent, whimsical',
    movement: 'bouncing, joyful',
  },

  // Emotional
  warmth: {
    elements: ['glowing orbs', 'soft rays', 'embracing curves'],
    texture: 'soft, radiant',
    movement: 'expanding, welcoming',
  },
  voice: {
    elements: ['sharp crystals', 'clear lines', 'bold strokes'],
    texture: 'crisp, defined',
    movement: 'direct, assertive',
  },
  space: {
    elements: ['vast horizons', 'open expanses', 'floating islands'],
    texture: 'airy, boundless',
    movement: 'drifting, independent',
  },
  anchor: {
    elements: ['geometric patterns', 'ordered grids', 'stable forms'],
    texture: 'structured, reliable',
    movement: 'steady, grounding',
  },

  // Cerebral
  wit: {
    elements: ['intricate patterns', 'clever fractals', 'neural networks'],
    texture: 'complex, layered',
    movement: 'quick, darting',
  },
  drive: {
    elements: ['ascending arrows', 'mountain peaks', 'soaring trajectories'],
    texture: 'determined, focused',
    movement: 'upward, unstoppable',
  },
  curiosity: {
    elements: ['doorways', 'winding paths', 'mysterious depths'],
    texture: 'inviting, endless',
    movement: 'exploring, seeking',
  },
  soul: {
    elements: ['cosmic nebulae', 'ethereal light', 'transcendent forms'],
    texture: 'mystical, profound',
    movement: 'flowing, transcendent',
  },
};

/**
 * Get visual elements for a virtue based on score
 */
function getVirtueVisuals(virtueId: string, score: number): typeof VIRTUE_VISUALS[string] | null {
  const visuals = VIRTUE_VISUALS[virtueId];
  if (!visuals) return null;

  // Only use distinctive visuals for scores far from middle
  const distance = Math.abs(score - 50);
  if (distance < 15) return null;

  return visuals;
}

/**
 * Build the DALL-E prompt for essence image generation
 *
 * @param scores - The 11 Virtues scores
 * @param virtueSentence - Optional virtue sentence for context
 * @returns The prompt string for DALL-E 3
 */
export function buildEssencePrompt(
  scores: VirtueScore[],
  virtueSentence?: string
): string {
  if (!scores || scores.length === 0) {
    return buildDefaultPrompt();
  }

  // Get top 3 most distinctive virtues
  const topVirtues = getTopVirtues(scores, 3);

  // Collect visual elements from top virtues
  const elements: string[] = [];
  const textures: string[] = [];
  const movements: string[] = [];
  const colors: string[] = [];

  for (const virtueScore of topVirtues) {
    const virtue = getVirtueById(virtueScore.virtue_id);
    if (!virtue) continue;

    const visuals = getVirtueVisuals(virtueScore.virtue_id, virtueScore.score);
    if (visuals) {
      elements.push(visuals.elements[Math.floor(Math.random() * visuals.elements.length)]);
      textures.push(visuals.texture);
      movements.push(visuals.movement);
    }

    // Add realm colors
    const realmPalette = REALM_PALETTES[virtue.realm];
    if (realmPalette) {
      colors.push(realmPalette[Math.floor(Math.random() * realmPalette.length)]);
    }
  }

  // Build the prompt
  const uniqueElements = [...new Set(elements)].slice(0, 3);
  const uniqueTextures = [...new Set(textures)].slice(0, 2);
  const uniqueMovements = [...new Set(movements)].slice(0, 2);
  const uniqueColors = [...new Set(colors)].slice(0, 3);

  const prompt = `
Create an abstract, artistic visualization of a person's essence and personality.

Visual elements to incorporate:
${uniqueElements.length > 0 ? `- ${uniqueElements.join(', ')}` : '- flowing organic shapes, gradients'}

Texture and feeling:
${uniqueTextures.length > 0 ? `- ${uniqueTextures.join(' and ')}` : '- ethereal and dreamlike'}

Energy and movement:
${uniqueMovements.length > 0 ? `- ${uniqueMovements.join(', ')}` : '- gentle flowing motion'}

Color palette:
${uniqueColors.length > 0 ? `- Dominant: ${uniqueColors.join(', ')}` : '- Soft, harmonious blend'}
- Use gradients and depth to create dimension

${virtueSentence ? `Essence to capture: "${virtueSentence}"` : ''}

Style requirements:
- ABSTRACT, non-representational art
- NO faces, NO text, NO photorealistic elements, NO human forms
- Think: emotional resonance and energy, not literal depiction
- Flowing shapes, organic forms, light and shadow interplay
- Professional digital art quality, suitable as a profile image
- Square composition (1:1 aspect ratio)
`.trim();

  return prompt;
}

/**
 * Default prompt when no virtue scores are available
 */
function buildDefaultPrompt(): string {
  return `
Create an abstract, artistic visualization representing a unique personality.

Style:
- Abstract, non-representational art
- Flowing gradients and organic shapes
- Soft, harmonious color palette
- Ethereal and dreamlike atmosphere
- NO faces, NO text, NO human forms
- Professional digital art quality
- Square composition (1:1)

Create an image that evokes warmth, depth, and individuality.
`.trim();
}
