// src/components/home/TagChip.tsx
// Color-coded pill for displaying tags

import { X } from 'lucide-react';
import type { TagColor } from '../../lib/filtering/types';

interface TagChipProps {
  /** Tag display name */
  name: string;
  /** Tag color */
  color: TagColor;
  /** Whether to show remove button */
  showRemove?: boolean;
  /** Callback when remove is clicked */
  onRemove?: () => void;
  /** Whether chip is selected (for filter UI) */
  isSelected?: boolean;
  /** Callback when chip is clicked (for selection) */
  onClick?: () => void;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Tailwind color classes for each tag color.
 * Each color has states for default, selected, and hover.
 */
const COLOR_CLASSES: Record<
  TagColor,
  {
    base: string;
    selected: string;
    text: string;
    selectedText: string;
    border: string;
    selectedBorder: string;
  }
> = {
  blue: {
    base: 'bg-blue-50 dark:bg-blue-900/30',
    selected: 'bg-blue-100 dark:bg-blue-900/50',
    text: 'text-blue-700 dark:text-blue-300',
    selectedText: 'text-blue-800 dark:text-blue-200',
    border: 'border-blue-200 dark:border-blue-800',
    selectedBorder: 'border-blue-400 dark:border-blue-600',
  },
  green: {
    base: 'bg-emerald-50 dark:bg-emerald-900/30',
    selected: 'bg-emerald-100 dark:bg-emerald-900/50',
    text: 'text-emerald-700 dark:text-emerald-300',
    selectedText: 'text-emerald-800 dark:text-emerald-200',
    border: 'border-emerald-200 dark:border-emerald-800',
    selectedBorder: 'border-emerald-400 dark:border-emerald-600',
  },
  red: {
    base: 'bg-red-50 dark:bg-red-900/30',
    selected: 'bg-red-100 dark:bg-red-900/50',
    text: 'text-red-700 dark:text-red-300',
    selectedText: 'text-red-800 dark:text-red-200',
    border: 'border-red-200 dark:border-red-800',
    selectedBorder: 'border-red-400 dark:border-red-600',
  },
  purple: {
    base: 'bg-purple-50 dark:bg-purple-900/30',
    selected: 'bg-purple-100 dark:bg-purple-900/50',
    text: 'text-purple-700 dark:text-purple-300',
    selectedText: 'text-purple-800 dark:text-purple-200',
    border: 'border-purple-200 dark:border-purple-800',
    selectedBorder: 'border-purple-400 dark:border-purple-600',
  },
  amber: {
    base: 'bg-amber-50 dark:bg-amber-900/30',
    selected: 'bg-amber-100 dark:bg-amber-900/50',
    text: 'text-amber-700 dark:text-amber-300',
    selectedText: 'text-amber-800 dark:text-amber-200',
    border: 'border-amber-200 dark:border-amber-800',
    selectedBorder: 'border-amber-400 dark:border-amber-600',
  },
  slate: {
    base: 'bg-slate-100 dark:bg-slate-700',
    selected: 'bg-slate-200 dark:bg-slate-600',
    text: 'text-slate-700 dark:text-slate-300',
    selectedText: 'text-slate-800 dark:text-slate-200',
    border: 'border-slate-300 dark:border-slate-600',
    selectedBorder: 'border-slate-400 dark:border-slate-500',
  },
};

/**
 * Size configurations.
 */
const SIZE_CONFIG = {
  sm: {
    padding: 'px-2 py-0.5',
    text: 'text-[10px]',
    removeIcon: 12,
    removeButton: 'ml-1 -mr-0.5',
  },
  md: {
    padding: 'px-2.5 py-1',
    text: 'text-xs',
    removeIcon: 14,
    removeButton: 'ml-1.5 -mr-1',
  },
} as const;

/**
 * Color-coded pill for displaying tags.
 * Can be static (display only), removable, or selectable.
 */
export function TagChip({
  name,
  color,
  showRemove = false,
  onRemove,
  isSelected = false,
  onClick,
  size = 'sm',
  className = '',
}: TagChipProps) {
  const colorClasses = COLOR_CLASSES[color];
  const sizeConfig = SIZE_CONFIG[size];

  const isInteractive = onClick !== undefined;

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove?.();
  };

  const baseClasses = `
    inline-flex items-center
    ${sizeConfig.padding}
    ${sizeConfig.text}
    font-medium
    rounded-full
    border
    transition-colors duration-150
    ${isSelected ? colorClasses.selected : colorClasses.base}
    ${isSelected ? colorClasses.selectedText : colorClasses.text}
    ${isSelected ? colorClasses.selectedBorder : colorClasses.border}
    ${isInteractive ? 'cursor-pointer hover:opacity-80' : ''}
    ${className}
  `;

  const content = (
    <>
      <span className="truncate max-w-[100px]">{name}</span>
      {showRemove && onRemove && (
        <button
          type="button"
          onClick={handleRemoveClick}
          className={`
            ${sizeConfig.removeButton}
            p-0.5 rounded-full
            hover:bg-black/10 dark:hover:bg-white/10
            transition-colors
          `}
          aria-label={`Remove ${name} tag`}
        >
          <X size={sizeConfig.removeIcon} />
        </button>
      )}
    </>
  );

  if (isInteractive) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={baseClasses}
        aria-pressed={isSelected}
      >
        {content}
      </button>
    );
  }

  return <span className={baseClasses}>{content}</span>;
}

/**
 * Helper component for displaying multiple tag chips with overflow handling.
 * Shows up to maxVisible tags, with a "+N more" indicator if there are more.
 */
interface TagChipListProps {
  /** Tags to display */
  tags: Array<{ id: string; name: string; color: TagColor }>;
  /** Maximum number of visible tags (default: 3) */
  maxVisible?: number;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Callback when a tag's remove button is clicked */
  onRemoveTag?: (tagId: string) => void;
  /** Whether to show remove buttons */
  showRemove?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function TagChipList({
  tags,
  maxVisible = 3,
  size = 'sm',
  onRemoveTag,
  showRemove = false,
  className = '',
}: TagChipListProps) {
  const visibleTags = tags.slice(0, maxVisible);
  const remainingCount = tags.length - maxVisible;

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {visibleTags.map((tag) => (
        <TagChip
          key={tag.id}
          name={tag.name}
          color={tag.color}
          size={size}
          showRemove={showRemove}
          onRemove={onRemoveTag ? () => onRemoveTag(tag.id) : undefined}
        />
      ))}
      {remainingCount > 0 && (
        <span
          className={`
            inline-flex items-center
            ${size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}
            font-medium text-slate-500 dark:text-slate-400
          `}
        >
          +{remainingCount} more
        </span>
      )}
    </div>
  );
}
