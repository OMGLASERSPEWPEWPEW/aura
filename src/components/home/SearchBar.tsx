// src/components/home/SearchBar.tsx
// Search bar component for filtering profiles in the home gallery

import { Search, X } from 'lucide-react';
import { useRef, useEffect } from 'react';

interface SearchBarProps {
  /** Current search text value */
  value: string;
  /** Callback when search text changes */
  onChange: (text: string) => void;
  /** Callback to clear search */
  onClear: () => void;
  /** Whether a search is in progress (debouncing) */
  isSearching?: boolean;
  /** Placeholder text */
  placeholder?: string;
}

/**
 * Search bar component with Aura theming.
 * Features:
 * - Search icon on left
 * - Clear button (X) on right when text present
 * - 44px minimum touch targets
 * - Matches Aura's violet/slate theme
 * - Full dark mode support
 *
 * Note: This component does not include sticky positioning.
 * The parent should handle positioning if needed.
 */
export function SearchBar({
  value,
  onChange,
  onClear,
  isSearching = false,
  placeholder = 'Search profiles...',
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when clear is clicked (after clearing)
  const handleClear = () => {
    onClear();
    inputRef.current?.focus();
  };

  // Handle escape key to clear search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && value) {
        onClear();
      }
    };

    const input = inputRef.current;
    input?.addEventListener('keydown', handleKeyDown);
    return () => input?.removeEventListener('keydown', handleKeyDown);
  }, [value, onClear]);

  return (
    <div className="relative">
      {/* Search Input */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search profiles"
        className="w-full pl-10 pr-10 py-2.5 min-h-[44px]
                   border border-slate-200 dark:border-slate-700
                   rounded-lg bg-white dark:bg-slate-800
                   text-slate-900 dark:text-slate-100
                   placeholder:text-slate-400 dark:placeholder:text-slate-500
                   focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
                   transition-shadow"
      />

      {/* Search Icon */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <Search
          size={18}
          className={`transition-colors ${
            isSearching
              ? 'text-violet-500 dark:text-violet-400'
              : 'text-slate-400 dark:text-slate-500'
          }`}
          aria-hidden="true"
        />
      </div>

      {/* Clear Button - only visible when there's text */}
      {value && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-1.5 top-1/2 -translate-y-1/2
                     w-[36px] h-[36px] min-w-[44px] min-h-[44px]
                     flex items-center justify-center
                     text-slate-400 dark:text-slate-500
                     hover:text-slate-600 dark:hover:text-slate-300
                     hover:bg-slate-100 dark:hover:bg-slate-700
                     rounded-md transition-colors
                     focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <X size={18} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
