// src/components/home/FavoritesFilter.tsx
// Toggle filter for showing only favorited profiles

import { Star } from 'lucide-react';

interface FavoritesFilterProps {
  /** Whether favorites-only filter is active */
  isActive: boolean;
  /** Callback when toggled */
  onToggle: () => void;
}

/**
 * Toggle button for filtering to show only favorited profiles.
 */
export function FavoritesFilter({ isActive, onToggle }: FavoritesFilterProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`
        flex items-center gap-2
        px-4 py-3 rounded-lg
        min-h-[48px] w-full
        border transition-all duration-150
        ${isActive
          ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
        }
      `}
      aria-pressed={isActive}
    >
      <Star
        size={18}
        fill={isActive ? 'currentColor' : 'none'}
        strokeWidth={isActive ? 0 : 2}
      />
      <span className="font-medium">
        {isActive ? 'Showing favorites only' : 'Show favorites only'}
      </span>
    </button>
  );
}
