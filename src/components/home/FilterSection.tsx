// src/components/home/FilterSection.tsx
// Reusable collapsible section wrapper for filter panel

import { ChevronDown } from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface FilterSectionProps {
  /** Section title */
  title: string;
  /** Optional icon component */
  icon?: ReactNode;
  /** Section content */
  children: ReactNode;
  /** Start collapsed (default: false) */
  defaultCollapsed?: boolean;
}

/**
 * Collapsible section wrapper for filter panel.
 * Used to group related filter options.
 */
export function FilterSection({
  title,
  icon,
  children,
  defaultCollapsed = false,
}: FilterSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <div className="border-b border-slate-100 dark:border-slate-700 last:border-b-0">
      <button
        type="button"
        onClick={() => setIsCollapsed((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
        aria-expanded={!isCollapsed}
      >
        <div className="flex items-center gap-2">
          {icon && (
            <span className="text-slate-400 dark:text-slate-500">
              {icon}
            </span>
          )}
          <span className="font-medium text-slate-900 dark:text-slate-50">
            {title}
          </span>
        </div>
        <ChevronDown
          size={18}
          className={`text-slate-400 dark:text-slate-500 transition-transform duration-200 ${
            isCollapsed ? '-rotate-90' : ''
          }`}
        />
      </button>

      {!isCollapsed && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  );
}
