// src/components/home/TagFilter.tsx
// Tag filter chips for FilterPanel - filters profiles by selected tags

import { useTags } from '../../hooks/useTags';
import { TagChip } from './TagChip';

interface TagFilterProps {
  /** Currently selected tag IDs */
  selectedTags: string[];
  /** Callback when a tag is toggled */
  onToggle: (tagId: string) => void;
}

/**
 * Multi-select tag chips for filtering profiles by tags.
 * Uses OR logic - shows profiles that have ANY of the selected tags.
 * Only shows tags that the user has created.
 */
export function TagFilter({ selectedTags, onToggle }: TagFilterProps) {
  const { tags, isLoading } = useTags();

  // Don't render if no tags exist
  if (isLoading || tags.length === 0) {
    return (
      <div className="text-sm text-slate-500 dark:text-slate-400 italic">
        No tags created yet. Add tags to profiles to filter by them.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by tags">
      {tags.map((tag) => (
        <TagChip
          key={tag.id}
          name={tag.name}
          color={tag.color}
          size="md"
          isSelected={selectedTags.includes(tag.id)}
          onClick={() => onToggle(tag.id)}
        />
      ))}
    </div>
  );
}
