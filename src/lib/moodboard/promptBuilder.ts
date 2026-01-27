// src/lib/moodboard/promptBuilder.ts
// Build DALL-E prompts from extracted lifestyle themes

import type { MoodboardThemes } from './types';

/**
 * Map energy types to visual style descriptors
 */
const ENERGY_STYLES: Record<MoodboardThemes['energy'], string> = {
  adventurous: 'dynamic, sunlit, expansive view',
  cozy: 'warm, intimate, soft lighting',
  social: 'vibrant, welcoming, gathered elements',
  introspective: 'serene, contemplative, peaceful',
};

/**
 * Map energy types to color palettes
 */
const ENERGY_PALETTES: Record<MoodboardThemes['energy'], string> = {
  adventurous: 'golden hour tones, blue skies, earth colors',
  cozy: 'warm ambers, soft creams, rich browns, candlelight glow',
  social: 'warm terracotta, sage green, natural wood tones',
  introspective: 'muted blues, soft grays, touches of deep purple',
};

/**
 * Build a DALL-E 3 prompt for mood board generation
 *
 * Creates a unified lifestyle scene visualization based on extracted themes.
 * The prompt emphasizes:
 * - Concrete objects and settings (not abstract)
 * - NO people or faces
 * - NO text
 * - Square composition for carousel display
 *
 * @param themes - Extracted lifestyle themes
 * @returns DALL-E prompt string
 */
export function buildMoodboardPrompt(themes: MoodboardThemes): string {
  const style = ENERGY_STYLES[themes.energy];
  const palette = ENERGY_PALETTES[themes.energy];

  // Build activities description
  const activitiesText = themes.activities.length > 0
    ? themes.activities.slice(0, 4).join(', ')
    : 'relaxing, exploring';

  // Build settings description
  const settingsText = themes.settings.length > 0
    ? themes.settings.slice(0, 2).join(' or ')
    : 'a comfortable indoor space';

  const prompt = `Create a warm, inviting lifestyle scene in a ${themes.aesthetic} style.

Scene concept: A ${style} visualization representing someone who enjoys ${activitiesText}.

Setting/Environment: ${settingsText}

Visual requirements:
- Include objects, items, and environmental details that suggest these interests
- Style the scene with ${themes.aesthetic} aesthetic sensibilities
- Use a color palette of ${palette}
- Create atmosphere through lighting, textures, and spatial arrangement
- Capture the ${themes.energy} energy through composition and mood

CRITICAL requirements:
- NO people, faces, or human figures - focus entirely on environment and objects
- NO text, words, letters, or signage in the image
- Square composition (1:1 aspect ratio)
- Professional photography or digital art quality
- The scene should feel lived-in, personal, and authentic

Create an image that evokes a sense of lifestyle and personality through the space and objects alone.`;

  return prompt.trim();
}

/**
 * Build a simplified default prompt when themes are minimal
 */
export function buildDefaultMoodboardPrompt(): string {
  return `Create a warm, inviting lifestyle scene with modern aesthetic.

Scene: A cozy, well-designed living space with natural light streaming in.

Include:
- Comfortable seating with soft textures
- Plants and greenery
- Books or magazines
- A warm beverage (coffee/tea)
- Natural wood accents
- Soft, inviting lighting

Style requirements:
- NO people, faces, or human figures
- NO text or words in the image
- Square composition (1:1 aspect ratio)
- Warm, welcoming color palette
- Professional photography quality

Create an image that feels personal, lived-in, and inviting.`.trim();
}
