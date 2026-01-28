// src/components/home/FilterPanel.tsx
// Bottom sheet modal for filter and sort options

import { useEffect, useRef } from 'react';
import { X, Smartphone, Star, Calendar, RotateCcw, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FilterPreferences, DatingApp, ScorePreset, DatePreset, SortOption } from '../../lib/filtering/types';
import { FilterSection } from './FilterSection';
import { AppFilter } from './AppFilter';
import { ScoreFilter } from './ScoreFilter';
import { DateFilter } from './DateFilter';
import { SortDropdown } from './SortDropdown';
import { FavoritesFilter } from './FavoritesFilter';
import { TagFilter } from './TagFilter';

interface FilterPanelProps {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Callback to close the panel */
  onClose: () => void;
  /** Current filter preferences */
  filters: FilterPreferences;
  /** Callbacks for updating filters */
  onToggleApp: (app: DatingApp) => void;
  onScoreChange: (preset: ScorePreset) => void;
  onDateChange: (preset: DatePreset) => void;
  onSortChange: (option: SortOption) => void;
  onReset: () => void;
  /** Whether any filters are active */
  hasActiveFilters: boolean;
  /** Phase C: Favorites and Tags callbacks */
  onToggleFavoritesOnly: () => void;
  onToggleTagFilter: (tagId: string) => void;
}

/**
 * Bottom sheet modal for filter and sort options.
 * Slides up from the bottom with a backdrop overlay.
 *
 * Features:
 * - Slide-up animation
 * - Backdrop closes panel
 * - Escape key closes panel
 * - Reset All button when filters active
 * - Full dark mode support
 */
export function FilterPanel({
  isOpen,
  onClose,
  filters,
  onToggleApp,
  onScoreChange,
  onDateChange,
  onSortChange,
  onReset,
  hasActiveFilters,
  onToggleFavoritesOnly,
  onToggleTagFilter,
}: FilterPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-hidden rounded-t-2xl bg-white dark:bg-slate-800 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Filter and sort profiles"
          >
            {/* Handle bar for visual affordance */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                Filters & Sort
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close filters"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content - scrollable */}
            <div className="overflow-y-auto max-h-[calc(85vh-140px)]">
              {/* Sort Section */}
              <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-700">
                <SortDropdown
                  selected={filters.sortBy}
                  onSelect={onSortChange}
                />
              </div>

              {/* Favorites Filter */}
              <FilterSection
                title="Favorites"
                icon={<Star size={16} />}
              >
                <FavoritesFilter
                  isActive={filters.showFavoritesOnly}
                  onToggle={onToggleFavoritesOnly}
                />
              </FilterSection>

              {/* Tags Filter */}
              <FilterSection
                title="Tags"
                icon={<Tag size={16} />}
              >
                <TagFilter
                  selectedTags={filters.selectedTags}
                  onToggle={onToggleTagFilter}
                />
              </FilterSection>

              {/* Dating App Filter */}
              <FilterSection
                title="Dating App"
                icon={<Smartphone size={16} />}
              >
                <AppFilter
                  selectedApps={filters.selectedApps}
                  onToggle={onToggleApp}
                />
              </FilterSection>

              {/* Score Filter */}
              <FilterSection
                title="Virtue Score"
                icon={<Star size={16} />}
              >
                <ScoreFilter
                  selected={filters.scorePreset}
                  onSelect={onScoreChange}
                />
              </FilterSection>

              {/* Date Filter */}
              <FilterSection
                title="Date Added"
                icon={<Calendar size={16} />}
              >
                <DateFilter
                  selected={filters.datePreset}
                  onSelect={onDateChange}
                />
              </FilterSection>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-4 py-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={onReset}
                  className="flex-1 flex items-center justify-center gap-2 py-3 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors min-h-[48px]"
                >
                  <RotateCcw size={16} />
                  Reset All
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className={`py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold transition-colors min-h-[48px] ${
                  hasActiveFilters ? 'flex-1' : 'w-full'
                }`}
              >
                Apply
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
