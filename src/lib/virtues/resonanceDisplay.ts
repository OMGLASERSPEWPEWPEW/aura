// src/lib/virtues/resonanceDisplay.ts
// Mystical/resonance vocabulary for score display
//
// This module replaces numeric "X/10" scores with psychologically-safe,
// mystical language that:
// - Doesn't reduce people to numbers
// - Doesn't trigger shame/anxiety for low scores
// - Filters out game-players and narcissists who want numbers to optimize
// - Uses symmetric language ("different frequencies" vs "bad match")

import { Sparkles, Moon, Waves, type LucideIcon } from 'lucide-react';

/**
 * Resonance levels based on compatibility score.
 * Three tiers only - mystical language works in broad emotional bands.
 */
export type ResonanceLevel = 'strong' | 'converging' | 'different';

/**
 * Determines resonance level from a 0-10 compatibility score.
 *
 * @param score - Numeric score from 0-10
 * @returns ResonanceLevel for display purposes
 */
export function getResonanceLevel(score: number): ResonanceLevel {
  if (score >= 7) return 'strong';
  if (score >= 5) return 'converging';
  return 'different';
}

/**
 * Human-readable labels for each resonance level.
 * Designed to be neutral and non-judgmental.
 */
export const RESONANCE_LABELS: Record<ResonanceLevel, string> = {
  strong: 'Strong Resonance',
  converging: 'Paths Converging',
  different: 'Different Frequencies',
};

/**
 * Short labels for compact displays (badges, chips).
 */
export const RESONANCE_SHORT_LABELS: Record<ResonanceLevel, string> = {
  strong: 'Resonance',
  converging: 'Converging',
  different: 'Different',
};

/**
 * Tailwind color classes for each resonance level.
 * Uses violet (high), amber (medium), slate (low) - no red.
 * Red is avoided because it implies danger/bad person, which we never say.
 */
export const RESONANCE_COLORS: Record<ResonanceLevel, string> = {
  strong: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-700',
  converging: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700',
  different: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600',
};

/**
 * Icon colors for standalone icon usage.
 */
export const RESONANCE_ICON_COLORS: Record<ResonanceLevel, string> = {
  strong: 'text-violet-500 dark:text-violet-400',
  converging: 'text-amber-500 dark:text-amber-400',
  different: 'text-slate-400 dark:text-slate-500',
};

/**
 * Background gradient classes for cards/sections.
 */
export const RESONANCE_GRADIENTS: Record<ResonanceLevel, string> = {
  strong: 'from-violet-50 to-purple-50 dark:from-violet-900/30 dark:to-purple-900/30 border-violet-200 dark:border-violet-700',
  converging: 'from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 border-amber-200 dark:border-amber-700',
  different: 'from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-gray-800/50 border-slate-200 dark:border-slate-600',
};

/**
 * Lucide icons for each resonance level.
 * - Sparkles: High resonance (magical connection)
 * - Moon: Medium (paths converging, potential)
 * - Waves: Low (different frequencies, neutral)
 */
export const RESONANCE_ICONS: Record<ResonanceLevel, LucideIcon> = {
  strong: Sparkles,
  converging: Moon,
  different: Waves,
};

/**
 * Descriptive copy for profile detail views.
 * More detailed than labels, used for explanatory text.
 */
export const RESONANCE_DESCRIPTIONS: Record<ResonanceLevel, string> = {
  strong: 'Your energies resonate strongly here.',
  converging: 'Your paths may be converging. Worth exploring.',
  different: 'Your frequencies differ. Trust your intuition if you feel a spark.',
};

/**
 * Tooltip/hover text for gallery view.
 */
export const RESONANCE_TOOLTIPS: Record<ResonanceLevel, string> = {
  strong: 'Strong pull toward connection',
  converging: 'Potential worth exploring',
  different: 'Different paths, but chemistry can surprise',
};

/**
 * Helper to get all display properties for a score at once.
 * Useful when you need multiple properties together.
 */
export function getResonanceDisplay(score: number) {
  const level = getResonanceLevel(score);
  return {
    level,
    label: RESONANCE_LABELS[level],
    shortLabel: RESONANCE_SHORT_LABELS[level],
    colors: RESONANCE_COLORS[level],
    iconColors: RESONANCE_ICON_COLORS[level],
    gradient: RESONANCE_GRADIENTS[level],
    Icon: RESONANCE_ICONS[level],
    description: RESONANCE_DESCRIPTIONS[level],
    tooltip: RESONANCE_TOOLTIPS[level],
  };
}
