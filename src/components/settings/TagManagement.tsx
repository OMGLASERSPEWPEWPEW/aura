// src/components/settings/TagManagement.tsx
// Settings section for managing user-created tags

import { useState } from 'react';
import { Tags, Trash2, Edit2, Check, X, AlertTriangle } from 'lucide-react';
import { useTags } from '../../hooks/useTags';
import { TagChip } from '../home/TagChip';
import type { TagColor, TagDefinition } from '../../lib/filtering/types';

/**
 * Available colors for tags.
 */
const TAG_COLORS: TagColor[] = ['blue', 'green', 'red', 'purple', 'amber', 'slate'];

/**
 * Color button for inline color picker.
 */
function ColorDot({
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
        w-5 h-5 rounded-full
        ${colorMap[color]}
        transition-all duration-150
        ${isSelected ? 'ring-2 ring-offset-1 ring-slate-600 dark:ring-white dark:ring-offset-slate-800' : ''}
      `}
      aria-label={`Select ${color} color`}
      aria-pressed={isSelected}
    />
  );
}

/**
 * Individual tag row with edit and delete actions.
 */
function TagRow({
  tag,
  usageCount,
  onRename,
  onUpdateColor,
  onDelete,
}: {
  tag: TagDefinition;
  usageCount: number;
  onRename: (newName: string) => Promise<void>;
  onUpdateColor: (newColor: TagColor) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(tag.name);
  const [editColor, setEditColor] = useState<TagColor>(tag.color);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async () => {
    const trimmedName = editName.trim();
    if (!trimmedName) return;

    if (trimmedName !== tag.name) {
      await onRename(trimmedName);
    }
    if (editColor !== tag.color) {
      await onUpdateColor(editColor);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(tag.name);
    setEditColor(tag.color);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (showDeleteConfirm) {
    return (
      <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <div className="flex items-start gap-2 mb-3">
          <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-700 dark:text-red-300">
              Delete "{tag.name}"?
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              This tag will be removed from {usageCount} profile{usageCount !== 1 ? 's' : ''}.
              This cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(false)}
            disabled={isDeleting}
            className="flex-1 py-2 px-3 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 py-2 px-3 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
        {/* Name input */}
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="w-full px-3 py-2 mb-3 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500"
          maxLength={30}
          autoFocus
        />

        {/* Color picker */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-slate-500 dark:text-slate-400">Color:</span>
          {TAG_COLORS.map((color) => (
            <ColorDot
              key={color}
              color={color}
              isSelected={editColor === color}
              onClick={() => setEditColor(color)}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 py-2 px-3 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
          >
            <X size={14} className="inline mr-1" />
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!editName.trim()}
            className="flex-1 py-2 px-3 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <Check size={14} className="inline mr-1" />
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
      <div className="flex items-center gap-3 min-w-0">
        <TagChip name={tag.name} color={tag.color} size="md" />
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {usageCount} profile{usageCount !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          aria-label={`Edit ${tag.name}`}
        >
          <Edit2 size={16} />
        </button>
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          aria-label={`Delete ${tag.name}`}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

/**
 * Settings section for managing all user-created tags.
 * Allows editing, renaming, and deleting tags with usage counts.
 */
export function TagManagement() {
  const { tags, isLoading, renameTag, updateTagColor, deleteTag, getUsageCount } = useTags();

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Tags size={18} className="text-violet-500" />
        <h3 className="font-semibold text-slate-900 dark:text-slate-50">Manage Tags</h3>
      </div>

      {isLoading ? (
        <div className="py-4 text-center text-slate-500 dark:text-slate-400">
          Loading tags...
        </div>
      ) : tags.length === 0 ? (
        <div className="py-4 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No tags created yet.
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Add tags to profiles from the home screen to organize your matches.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {tags.map((tag) => (
            <TagRow
              key={tag.id}
              tag={tag}
              usageCount={getUsageCount(tag.id)}
              onRename={(name) => renameTag(tag.id, name)}
              onUpdateColor={(color) => updateTagColor(tag.id, color)}
              onDelete={() => deleteTag(tag.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
