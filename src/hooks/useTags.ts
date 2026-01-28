// src/hooks/useTags.ts
// Hook for managing user-defined tags stored in UserIdentity.settings

import { useCallback, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import type { TagDefinition, TagColor } from '../lib/filtering/types';
import { SUGGESTED_TAG_COLORS } from '../lib/filtering/types';

/**
 * Generate a UUID v4 for tag IDs.
 * Uses crypto.randomUUID if available, falls back to manual generation.
 */
function generateTagId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface UseTagsReturn {
  /** All user-created tags */
  tags: TagDefinition[];

  /** Loading state while fetching from IndexedDB */
  isLoading: boolean;

  /** Create a new tag */
  createTag: (name: string, color: TagColor) => Promise<TagDefinition>;

  /** Create a tag from a suggested tag name (uses default color) */
  createFromSuggestion: (name: string) => Promise<TagDefinition>;

  /** Delete a tag (removes from all profiles) */
  deleteTag: (tagId: string) => Promise<void>;

  /** Rename a tag */
  renameTag: (tagId: string, newName: string) => Promise<void>;

  /** Update a tag's color */
  updateTagColor: (tagId: string, newColor: TagColor) => Promise<void>;

  /** Add a tag to a profile */
  addTagToProfile: (profileId: number, tagId: string) => Promise<void>;

  /** Remove a tag from a profile */
  removeTagFromProfile: (profileId: number, tagId: string) => Promise<void>;

  /** Get tag definitions by their IDs */
  getTagsByIds: (tagIds: string[]) => TagDefinition[];

  /** Get the number of profiles using a specific tag */
  getUsageCount: (tagId: string) => number;

  /** Check if a tag name already exists (case-insensitive) */
  tagNameExists: (name: string) => boolean;
}

/**
 * Hook for managing user-defined tags.
 * Tags are stored in UserIdentity.settings.tags and referenced by ID in Profile.tags.
 */
export function useTags(): UseTagsReturn {
  // Load user identity for tag definitions
  const userIdentity = useLiveQuery(() => db.userIdentity.get(1));

  // Load all profiles to calculate usage counts
  const profiles = useLiveQuery(() => db.profiles.toArray());

  // Extract tags from settings, defaulting to empty array
  const tags = useMemo(() => {
    return userIdentity?.settings?.tags ?? [];
  }, [userIdentity]);

  const isLoading = userIdentity === undefined;

  /**
   * Ensure UserIdentity exists with settings initialized.
   * Returns the current settings or initializes new ones.
   */
  const ensureSettings = useCallback(async () => {
    let identity = await db.userIdentity.get(1);

    if (!identity) {
      // Create new user identity with settings
      await db.userIdentity.add({
        id: 1,
        dataExports: [],
        textInputs: [],
        photos: [],
        manualEntry: {},
        settings: {
          autoCompatibility: true,
          theme: 'system',
          tags: [],
        },
        lastUpdated: new Date(),
      });
      identity = await db.userIdentity.get(1);
    } else if (!identity.settings) {
      // Initialize settings if missing
      await db.userIdentity.update(1, {
        settings: {
          autoCompatibility: true,
          theme: 'system',
          tags: [],
        },
        lastUpdated: new Date(),
      });
      identity = await db.userIdentity.get(1);
    } else if (!identity.settings.tags) {
      // Initialize tags array if missing
      await db.userIdentity.update(1, {
        settings: {
          ...identity.settings,
          tags: [],
        },
        lastUpdated: new Date(),
      });
      identity = await db.userIdentity.get(1);
    }

    return identity!.settings!;
  }, []);

  /**
   * Create a new tag with the given name and color.
   */
  const createTag = useCallback(
    async (name: string, color: TagColor): Promise<TagDefinition> => {
      const settings = await ensureSettings();

      const newTag: TagDefinition = {
        id: generateTagId(),
        name: name.trim(),
        color,
        createdAt: Date.now(),
      };

      const updatedTags = [...(settings.tags ?? []), newTag];

      await db.userIdentity.update(1, {
        settings: {
          ...settings,
          tags: updatedTags,
        },
        lastUpdated: new Date(),
      });

      return newTag;
    },
    [ensureSettings]
  );

  /**
   * Create a tag from a suggested tag name, using its default color.
   */
  const createFromSuggestion = useCallback(
    async (name: string): Promise<TagDefinition> => {
      const color = SUGGESTED_TAG_COLORS[name] ?? 'slate';
      return createTag(name, color);
    },
    [createTag]
  );

  /**
   * Delete a tag and remove it from all profiles.
   */
  const deleteTag = useCallback(
    async (tagId: string): Promise<void> => {
      const settings = await ensureSettings();

      // Remove tag from all profiles that have it
      const profilesWithTag = await db.profiles
        .filter((p) => p.tags?.includes(tagId) ?? false)
        .toArray();

      for (const profile of profilesWithTag) {
        await db.profiles.update(profile.id, {
          tags: (profile.tags ?? []).filter((t) => t !== tagId),
        });
      }

      // Remove tag definition
      const updatedTags = (settings.tags ?? []).filter((t) => t.id !== tagId);

      await db.userIdentity.update(1, {
        settings: {
          ...settings,
          tags: updatedTags,
        },
        lastUpdated: new Date(),
      });
    },
    [ensureSettings]
  );

  /**
   * Rename a tag.
   */
  const renameTag = useCallback(
    async (tagId: string, newName: string): Promise<void> => {
      const settings = await ensureSettings();

      const updatedTags = (settings.tags ?? []).map((t) =>
        t.id === tagId ? { ...t, name: newName.trim() } : t
      );

      await db.userIdentity.update(1, {
        settings: {
          ...settings,
          tags: updatedTags,
        },
        lastUpdated: new Date(),
      });
    },
    [ensureSettings]
  );

  /**
   * Update a tag's color.
   */
  const updateTagColor = useCallback(
    async (tagId: string, newColor: TagColor): Promise<void> => {
      const settings = await ensureSettings();

      const updatedTags = (settings.tags ?? []).map((t) =>
        t.id === tagId ? { ...t, color: newColor } : t
      );

      await db.userIdentity.update(1, {
        settings: {
          ...settings,
          tags: updatedTags,
        },
        lastUpdated: new Date(),
      });
    },
    [ensureSettings]
  );

  /**
   * Add a tag to a profile.
   */
  const addTagToProfile = useCallback(
    async (profileId: number, tagId: string): Promise<void> => {
      const profile = await db.profiles.get(profileId);
      if (!profile) return;

      const currentTags = profile.tags ?? [];
      if (currentTags.includes(tagId)) return; // Already has this tag

      await db.profiles.update(profileId, {
        tags: [...currentTags, tagId],
      });
    },
    []
  );

  /**
   * Remove a tag from a profile.
   */
  const removeTagFromProfile = useCallback(
    async (profileId: number, tagId: string): Promise<void> => {
      const profile = await db.profiles.get(profileId);
      if (!profile) return;

      const currentTags = profile.tags ?? [];
      if (!currentTags.includes(tagId)) return; // Doesn't have this tag

      await db.profiles.update(profileId, {
        tags: currentTags.filter((t) => t !== tagId),
      });
    },
    []
  );

  /**
   * Get tag definitions by their IDs.
   * Returns tags in the order they appear in tagIds.
   */
  const getTagsByIds = useCallback(
    (tagIds: string[]): TagDefinition[] => {
      const tagMap = new Map(tags.map((t) => [t.id, t]));
      return tagIds
        .map((id) => tagMap.get(id))
        .filter((t): t is TagDefinition => t !== undefined);
    },
    [tags]
  );

  /**
   * Get the number of profiles using a specific tag.
   */
  const getUsageCount = useCallback(
    (tagId: string): number => {
      if (!profiles) return 0;
      return profiles.filter((p) => p.tags?.includes(tagId) ?? false).length;
    },
    [profiles]
  );

  /**
   * Check if a tag name already exists (case-insensitive).
   */
  const tagNameExists = useCallback(
    (name: string): boolean => {
      const normalizedName = name.trim().toLowerCase();
      return tags.some((t) => t.name.toLowerCase() === normalizedName);
    },
    [tags]
  );

  return {
    tags,
    isLoading,
    createTag,
    createFromSuggestion,
    deleteTag,
    renameTag,
    updateTagColor,
    addTagToProfile,
    removeTagFromProfile,
    getTagsByIds,
    getUsageCount,
    tagNameExists,
  };
}
