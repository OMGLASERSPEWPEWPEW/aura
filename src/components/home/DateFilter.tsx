// src/components/home/DateFilter.tsx
// Date preset button group for filtering by profile timestamp

import { Calendar } from 'lucide-react';
import type { DatePreset } from '../../lib/filtering/types';

interface DateFilterProps {
  /** Currently selected date preset */
  selected: DatePreset;
  /** Callback when selection changes */
  onSelect: (preset: DatePreset) => void;
}

/**
 * Date preset configuration.
 */
const DATE_PRESETS: {
  value: DatePreset;
  label: string;
  description: string;
}[] = [
  {
    value: 'all',
    label: 'All Time',
    description: 'All profiles',
  },
  {
    value: '7d',
    label: 'Last 7 Days',
    description: 'Profiles from the last week',
  },
  {
    value: '30d',
    label: 'Last 30 Days',
    description: 'Profiles from the last month',
  },
  {
    value: 'older',
    label: 'Older',
    description: 'Profiles older than 30 days',
  },
];

/**
 * Button group for selecting date range preset.
 * Single-select: clicking a button selects it and deselects others.
 */
export function DateFilter({ selected, onSelect }: DateFilterProps) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by date">
      {DATE_PRESETS.map((preset) => {
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
                ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-700'
                : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }
            `}
            aria-pressed={isSelected}
            title={preset.description}
          >
            {preset.value !== 'all' && (
              <Calendar size={14} className={isSelected ? '' : 'opacity-50'} />
            )}
            {preset.label}
          </button>
        );
      })}
    </div>
  );
}
