// src/hooks/useFavorites.ts
// Hook for managing profile favorites stored directly in Profile.isFavorite

import { useCallback } from 'react';
import { db } from '../lib/db';

interface UseFavoritesReturn {
  /** Toggle favorite status for a profile */
  toggleFavorite: (profileId: number) => Promise<boolean>;

  /** Check if a profile is favorited (sync, for render) */
  isFavorite: (profile: { isFavorite?: boolean }) => boolean;

  /** Set favorite status for a profile */
  setFavorite: (profileId: number, isFavorite: boolean) => Promise<void>;
}

/**
 * Hook for managing profile favorites.
 * Favorites are stored directly on the Profile.isFavorite field in IndexedDB.
 */
export function useFavorites(): UseFavoritesReturn {
  /**
   * Toggle favorite status for a profile.
   * Returns the new favorite status.
   */
  const toggleFavorite = useCallback(async (profileId: number): Promise<boolean> => {
    const profile = await db.profiles.get(profileId);
    if (!profile) {
      console.warn(`useFavorites: Profile ${profileId} not found`);
      return false;
    }

    const newStatus = !profile.isFavorite;

    await db.profiles.update(profileId, {
      isFavorite: newStatus,
    });

    // Trigger haptic feedback if available
    if (newStatus && 'vibrate' in navigator) {
      try {
        navigator.vibrate(10); // Short vibration on favorite
      } catch {
        // Vibration not supported or blocked
      }
    }

    return newStatus;
  }, []);

  /**
   * Check if a profile is favorited.
   * This is a synchronous check for render-time use.
   */
  const isFavorite = useCallback((profile: { isFavorite?: boolean }): boolean => {
    return profile.isFavorite === true;
  }, []);

  /**
   * Set favorite status for a profile directly.
   */
  const setFavorite = useCallback(async (profileId: number, isFavorite: boolean): Promise<void> => {
    await db.profiles.update(profileId, {
      isFavorite,
    });

    // Trigger haptic feedback if favoriting
    if (isFavorite && 'vibrate' in navigator) {
      try {
        navigator.vibrate(10);
      } catch {
        // Vibration not supported or blocked
      }
    }
  }, []);

  return {
    toggleFavorite,
    isFavorite,
    setFavorite,
  };
}
