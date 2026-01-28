// src/components/home/SortDropdown.tsx
// Sort option selector dropdown/button group

import { ArrowUpDown, Clock, Star, Type } from 'lucide-react';
import type { SortOption } from '../../lib/filtering/types';

interface SortDropdownProps {
  /** Currently selected sort option */
  selected: SortOption;
  /** Callback when selection changes */
  onSelect: (option: SortOption) => void;
}

/**
 * Sort option configuration with icons and labels.
 */
const SORT_OPTIONS: {
  value: SortOption;
  label: string;
  icon: typeof Clock;
}[] = [
  { value: 'newest', label: 'Newest First', icon: Clock },
  { value: 'oldest', label: 'Oldest First', icon: Clock },
  { value: 'highest', label: 'Highest Score', icon: Star },
  { value: 'lowest', label: 'Lowest Score', icon: Star },
  { value: 'name-asc', label: 'Name A-Z', icon: Type },
  { value: 'name-desc', label: 'Name Z-A', icon: Type },
];

/**
 * Sort option selector rendered as a compact button group.
 * Shows all options in a 2x3 grid for easy touch access.
 */
export function SortDropdown({ selected, onSelect }: SortDropdownProps) {
  return (
    <div className="space-y-2">
      {/* Header with icon */}
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
        <ArrowUpDown size={14} />
        <span className="text-xs font-medium uppercase tracking-wide">Sort By</span>
      </div>

      {/* Options grid */}
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Sort profiles">
        {SORT_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = selected === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              className={`
                flex items-center gap-2
                px-3 py-2.5 rounded-lg text-sm font-medium
                min-h-[44px]
                border transition-all duration-150
                ${isSelected
                  ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-700'
                  : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }
              `}
              aria-pressed={isSelected}
            >
              <Icon size={14} className={isSelected ? '' : 'opacity-50'} />
              <span className="truncate">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
