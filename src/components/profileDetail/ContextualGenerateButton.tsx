// src/components/profileDetail/ContextualGenerateButton.tsx
// Single contextual button that changes based on carousel position

import { Sparkles, Film } from 'lucide-react';

export type CarouselPosition =
  | 'moodboard'
  | 'essence-locked'
  | 'essence'
  | 'sora-locked'
  | 'sora'
  | 'photo';

interface ContextualGenerateButtonProps {
  carouselPosition: CarouselPosition;
  hasVirtues: boolean;
  isGeneratingEssence: boolean;
  isGeneratingSora: boolean;
  onGenerateEssence: () => void;
  onGenerateSora: () => void;
}

/**
 * Contextual button that appears below the carousel.
 * Changes text and action based on what carousel item is currently shown.
 *
 * Button visibility logic:
 * - Mood Board: Hidden (auto-generated)
 * - Essence locked + has virtues: "Generate Essence (~$0.04)"
 * - Essence locked + no virtues: Hidden
 * - Essence (generated): Hidden
 * - Sora locked + has virtues: "Generate Motion (~$0.30)"
 * - Sora locked + no virtues: Hidden
 * - Sora (generated): Hidden
 * - Photo: Hidden
 */
export function ContextualGenerateButton({
  carouselPosition,
  hasVirtues,
  isGeneratingEssence,
  isGeneratingSora,
  onGenerateEssence,
  onGenerateSora,
}: ContextualGenerateButtonProps) {
  // Determine what to render based on position
  if (carouselPosition === 'essence-locked' && hasVirtues) {
    return (
      <div className="flex justify-center py-3">
        <button
          onClick={onGenerateEssence}
          disabled={isGeneratingEssence}
          aria-label="Generate essence portrait"
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full font-medium shadow-lg transition-all duration-200 flex items-center gap-2"
        >
          {isGeneratingEssence ? (
            <>
              <Sparkles size={18} className="animate-pulse" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Generate Essence (~$0.04)
            </>
          )}
        </button>
      </div>
    );
  }

  if (carouselPosition === 'sora-locked' && hasVirtues) {
    return (
      <div className="flex justify-center py-3">
        <button
          onClick={onGenerateSora}
          disabled={isGeneratingSora}
          aria-label="Generate motion portrait"
          className="px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-500 hover:from-teal-700 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full font-medium shadow-lg transition-all duration-200 flex items-center gap-2"
        >
          {isGeneratingSora ? (
            <>
              <Film size={18} className="animate-pulse" />
              Generating...
            </>
          ) : (
            <>
              <Film size={18} />
              Generate Motion (~$0.30)
            </>
          )}
        </button>
      </div>
    );
  }

  // All other positions: hidden
  return null;
}
