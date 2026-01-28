// src/components/home/TagSelector.tsx
// Bottom sheet modal for selecting and creating tags for a profile

import { useState, useEffect, useRef } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTags } from '../../hooks/useTags';
import { TagChip } from './TagChip';
import type { TagColor } from '../../lib/filtering/types';
import { SUGGESTED_TAGS } from '../../lib/filtering/types';

interface TagSelectorProps {
  /** Whether the selector is open */
  isOpen: boolean;
  /** Callback to close the selector */
  onClose: () => void;
  /** Profile ID to manage tags for */
  profileId: number;
  /** Current tag IDs on the profile */
  currentTagIds: string[];
}

/**
 * Available colors for new tags.
 */
const TAG_COLORS: TagColor[] = ['blue', 'green', 'red', 'purple', 'amber', 'slate'];

/**
 * Color picker button component.
 */
function ColorPickerButton({
  color,
  isSelected,
  onClick,
}: {
  color: TagColor;
  isSelected: boolean;
  onClick: () => void;
}) {
  const colorMap: Record<TagColor, string> = {
    blue: 'bg-blue-500',
    green: 'bg-emerald-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    amber: 'bg-amber-500',
    slate: 'bg-slate-500',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-8 h-8 rounded-full
        ${colorMap[color]}
        flex items-center justify-center
        transition-all duration-150
        ${isSelected ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white dark:ring-offset-slate-800' : ''}
      `}
      aria-label={`Select ${color} color`}
      aria-pressed={isSelected}
    >
      {isSelected && <Check size={16} className="text-white" />}
    </button>
  );
}

/**
 * Bottom sheet modal for selecting and creating tags for a profile.
 * Shows suggested tags, user-created tags, and a form to create new tags.
 */
export function TagSelector({
  isOpen,
  onClose,
  profileId,
  currentTagIds,
}: TagSelectorProps) {
  const {
    tags,
    createTag,
    createFromSuggestion,
    addTagToProfile,
    removeTagFromProfile,
    tagNameExists,
  } = useTags();

  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState<TagColor>('blue');
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setNewTagName('');
      setNewTagColor('blue');
      setIsCreating(false);
    }
  }, [isOpen]);

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

  /**
   * Toggle a tag on the profile.
   */
  const handleToggleTag = async (tagId: string) => {
    if (currentTagIds.includes(tagId)) {
      await removeTagFromProfile(profileId, tagId);
    } else {
      await addTagToProfile(profileId, tagId);
    }
  };

  /**
   * Create and add a tag from a suggested name.
   */
  const handleSuggestedTag = async (name: string) => {
    // Check if this suggestion already exists as a user tag
    const existingTag = tags.find(
      (t) => t.name.toLowerCase() === name.toLowerCase()
    );

    if (existingTag) {
      // Toggle the existing tag
      await handleToggleTag(existingTag.id);
    } else {
      // Create new tag from suggestion and add to profile
      const newTag = await createFromSuggestion(name);
      await addTagToProfile(profileId, newTag.id);
    }
  };

  /**
   * Create a new custom tag.
   */
  const handleCreateTag = async () => {
    const trimmedName = newTagName.trim();
    if (!trimmedName) return;

    if (tagNameExists(trimmedName)) {
      // Tag already exists, find it and add to profile
      const existingTag = tags.find(
        (t) => t.name.toLowerCase() === trimmedName.toLowerCase()
      );
      if (existingTag) {
        await addTagToProfile(profileId, existingTag.id);
      }
    } else {
      // Create new tag
      setIsCreating(true);
      try {
        const newTag = await createTag(trimmedName, newTagColor);
        await addTagToProfile(profileId, newTag.id);
        setNewTagName('');
        setNewTagColor('blue');
      } finally {
        setIsCreating(false);
      }
    }
  };

  /**
   * Check if a suggestion is currently on this profile.
   */
  const isSuggestionOnProfile = (suggestion: string): boolean => {
    const existingTag = tags.find(
      (t) => t.name.toLowerCase() === suggestion.toLowerCase()
    );
    return existingTag ? currentTagIds.includes(existingTag.id) : false;
  };

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
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-hidden rounded-t-2xl bg-white dark:bg-slate-800 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Add tags to profile"
          >
            {/* Handle bar for visual affordance */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                Add Tags
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content - scrollable */}
            <div className="overflow-y-auto max-h-[calc(85vh-140px)] px-4 py-4 space-y-6">
              {/* Suggested Tags */}
              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
                  Suggested Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_TAGS.map((suggestion) => {
                    const isOnProfile = isSuggestionOnProfile(suggestion);
                    return (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => handleSuggestedTag(suggestion)}
                        className={`
                          inline-flex items-center gap-1.5
                          px-3 py-2 rounded-lg
                          text-sm font-medium
                          border transition-all duration-150
                          min-h-[44px]
                          ${isOnProfile
                            ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-700'
                            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                          }
                        `}
                      >
                        {isOnProfile && <Check size={14} />}
                        {suggestion}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* User's Custom Tags */}
              {tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
                    Your Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <TagChip
                        key={tag.id}
                        name={tag.name}
                        color={tag.color}
                        size="md"
                        isSelected={currentTagIds.includes(tag.id)}
                        onClick={() => handleToggleTag(tag.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Create New Tag */}
              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
                  Create New Tag
                </h3>

                {/* Tag Name Input */}
                <div className="flex gap-2 mb-3">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateTag();
                      }
                    }}
                    placeholder="Tag name..."
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400 focus:border-transparent min-h-[44px]"
                    maxLength={30}
                  />
                  <button
                    type="button"
                    onClick={handleCreateTag}
                    disabled={!newTagName.trim() || isCreating}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white rounded-lg font-medium transition-colors min-w-[44px] min-h-[44px]"
                    aria-label="Create tag"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                {/* Color Picker */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500 dark:text-slate-400 mr-2">
                    Color:
                  </span>
                  {TAG_COLORS.map((color) => (
                    <ColorPickerButton
                      key={color}
                      color={color}
                      isSelected={newTagColor === color}
                      onClick={() => setNewTagColor(color)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold transition-colors min-h-[48px]"
              >
                Done
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
