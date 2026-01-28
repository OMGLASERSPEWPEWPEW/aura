// src/components/home/AppFilter.tsx
// Dating app chip selector for filtering by app

import type { DatingApp } from '../../lib/filtering/types';

interface AppFilterProps {
  /** Currently selected apps */
  selectedApps: DatingApp[];
  /** Callback when app selection changes */
  onToggle: (app: DatingApp) => void;
}

/**
 * App-specific colors and styling.
 * Matches the existing badge colors in Home.tsx.
 */
const APP_CONFIG: Record<DatingApp, {
  label: string;
  selectedBg: string;
  selectedText: string;
  selectedBorder: string;
}> = {
  Hinge: {
    label: 'Hinge',
    selectedBg: 'bg-purple-100 dark:bg-purple-900/40',
    selectedText: 'text-purple-700 dark:text-purple-300',
    selectedBorder: 'border-purple-300 dark:border-purple-700',
  },
  Tinder: {
    label: 'Tinder',
    selectedBg: 'bg-pink-100 dark:bg-pink-900/40',
    selectedText: 'text-pink-700 dark:text-pink-300',
    selectedBorder: 'border-pink-300 dark:border-pink-700',
  },
  Bumble: {
    label: 'Bumble',
    selectedBg: 'bg-yellow-100 dark:bg-yellow-900/40',
    selectedText: 'text-yellow-700 dark:text-yellow-300',
    selectedBorder: 'border-yellow-300 dark:border-yellow-700',
  },
  Other: {
    label: 'Other',
    selectedBg: 'bg-slate-100 dark:bg-slate-700',
    selectedText: 'text-slate-700 dark:text-slate-200',
    selectedBorder: 'border-slate-300 dark:border-slate-600',
  },
};

const APPS: DatingApp[] = ['Hinge', 'Tinder', 'Bumble', 'Other'];

/**
 * Multi-select chip group for filtering profiles by dating app.
 * Each chip toggles its app in the selection.
 */
export function AppFilter({ selectedApps, onToggle }: AppFilterProps) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by dating app">
      {APPS.map((app) => {
        const config = APP_CONFIG[app];
        const isSelected = selectedApps.includes(app);

        return (
          <button
            key={app}
            type="button"
            onClick={() => onToggle(app)}
            className={`
              px-3 py-2 rounded-lg text-sm font-medium
              min-h-[44px] min-w-[44px]
              border transition-all duration-150
              ${isSelected
                ? `${config.selectedBg} ${config.selectedText} ${config.selectedBorder}`
                : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }
            `}
            aria-pressed={isSelected}
          >
            {config.label}
          </button>
        );
      })}
    </div>
  );
}
