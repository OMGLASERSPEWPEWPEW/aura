// src/components/home/FavoriteButton.tsx
// Star button for toggling profile favorite status

import { useState, useCallback } from 'react';
import { Star } from 'lucide-react';
import { useFavorites } from '../../hooks/useFavorites';

interface FavoriteButtonProps {
  /** Profile ID to toggle favorite for */
  profileId: number;
  /** Current favorite status */
  isFavorite: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Optional callback after toggle */
  onToggle?: (newStatus: boolean) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Size configurations for the button.
 */
const SIZE_CONFIG = {
  sm: {
    button: 'w-8 h-8 min-w-[32px] min-h-[32px]',
    icon: 16,
  },
  md: {
    button: 'w-10 h-10 min-w-[40px] min-h-[40px]',
    icon: 20,
  },
  lg: {
    button: 'w-11 h-11 min-w-[44px] min-h-[44px]',
    icon: 24,
  },
} as const;

/**
 * Star button for toggling profile favorite status.
 * Shows filled gold star when favorited, outline star when not.
 * Includes optimistic UI update and haptic feedback.
 */
export function FavoriteButton({
  profileId,
  isFavorite,
  size = 'md',
  onToggle,
  className = '',
}: FavoriteButtonProps) {
  const { toggleFavorite } = useFavorites();
  const [isOptimistic, setIsOptimistic] = useState(isFavorite);
  const [isAnimating, setIsAnimating] = useState(false);

  // Sync optimistic state with prop when it changes externally
  // (e.g., from Dexie live query update)
  if (isFavorite !== isOptimistic && !isAnimating) {
    setIsOptimistic(isFavorite);
  }

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Optimistic update
      const newStatus = !isOptimistic;
      setIsOptimistic(newStatus);
      setIsAnimating(true);

      try {
        const actualStatus = await toggleFavorite(profileId);
        onToggle?.(actualStatus);

        // Sync with actual result (should match optimistic)
        if (actualStatus !== newStatus) {
          setIsOptimistic(actualStatus);
        }
      } catch (error) {
        // Revert on error
        console.error('Failed to toggle favorite:', error);
        setIsOptimistic(!newStatus);
      } finally {
        // Allow animation to complete
        setTimeout(() => setIsAnimating(false), 200);
      }
    },
    [isOptimistic, profileId, toggleFavorite, onToggle]
  );

  const config = SIZE_CONFIG[size];

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`
        ${config.button}
        flex items-center justify-center
        rounded-full
        transition-all duration-200
        ${isOptimistic
          ? 'text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300'
          : 'text-slate-300 hover:text-amber-400 dark:text-slate-600 dark:hover:text-amber-500'
        }
        ${isAnimating ? 'scale-125' : 'scale-100'}
        hover:bg-slate-100/50 dark:hover:bg-slate-700/50
        active:scale-90
        ${className}
      `}
      aria-label={isOptimistic ? 'Remove from favorites' : 'Add to favorites'}
      aria-pressed={isOptimistic}
    >
      <Star
        size={config.icon}
        fill={isOptimistic ? 'currentColor' : 'none'}
        strokeWidth={isOptimistic ? 0 : 2}
        className={`transition-transform duration-200 ${isAnimating ? 'animate-pulse' : ''}`}
      />
    </button>
  );
}
