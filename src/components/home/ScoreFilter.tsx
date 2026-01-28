// src/components/home/ScoreFilter.tsx
// Score preset button group for filtering by virtue score average

import { Star } from 'lucide-react';
import type { ScorePreset } from '../../lib/filtering/types';

interface ScoreFilterProps {
  /** Currently selected score preset */
  selected: ScorePreset;
  /** Callback when selection changes */
  onSelect: (preset: ScorePreset) => void;
}

/**
 * Score preset configuration with colors matching the badge colors in Home.tsx.
 */
const SCORE_PRESETS: {
  value: ScorePreset;
  label: string;
  description: string;
  selectedBg: string;
  selectedText: string;
  selectedBorder: string;
}[] = [
  {
    value: 'all',
    label: 'All',
    description: 'All scores',
    selectedBg: 'bg-violet-100 dark:bg-violet-900/40',
    selectedText: 'text-violet-700 dark:text-violet-300',
    selectedBorder: 'border-violet-300 dark:border-violet-700',
  },
  {
    value: 'high',
    label: '7+',
    description: 'High scores',
    selectedBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    selectedText: 'text-emerald-700 dark:text-emerald-300',
    selectedBorder: 'border-emerald-300 dark:border-emerald-700',
  },
  {
    value: 'medium',
    label: '5-6',
    description: 'Medium scores',
    selectedBg: 'bg-amber-100 dark:bg-amber-900/40',
    selectedText: 'text-amber-700 dark:text-amber-300',
    selectedBorder: 'border-amber-300 dark:border-amber-700',
  },
  {
    value: 'low',
    label: '<5',
    description: 'Low scores',
    selectedBg: 'bg-slate-100 dark:bg-slate-700',
    selectedText: 'text-slate-700 dark:text-slate-200',
    selectedBorder: 'border-slate-300 dark:border-slate-600',
  },
];

/**
 * Button group for selecting score range preset.
 * Single-select: clicking a button selects it and deselects others.
 */
export function ScoreFilter({ selected, onSelect }: ScoreFilterProps) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by virtue score">
      {SCORE_PRESETS.map((preset) => {
        const isSelected = selected === preset.value;

        return (
          <button
            key={preset.value}
            type="button"
            onClick={() => onSelect(preset.value)}
            className={`
              flex items-center gap-1.5
              px-3 py-2 rounded-lg text-sm font-medium
              min-h-[44px]
              border transition-all duration-150
              ${isSelected
                ? `${preset.selectedBg} ${preset.selectedText} ${preset.selectedBorder}`
                : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }
            `}
            aria-pressed={isSelected}
            title={preset.description}
          >
            {preset.value !== 'all' && (
              <Star size={14} className={isSelected ? '' : 'opacity-50'} />
            )}
            {preset.label}
          </button>
        );
      })}
    </div>
  );
}
