// src/lib/sync/syncService.ts
// Main sync orchestrator - coordinates all sync operations

import { db } from '../db';
import type { SyncState, SyncResult } from './types';
import { syncUserProfileFromServer, pushUserProfileIfNeeded } from './userProfileSync';
import { syncProfilesFromServer, pushUnsyncedProfiles } from './profileSync';
import { syncCoachingSessionsFromServer, pushUnsyncedCoachingSessions } from './coachingSync';
import { syncChatMessagesFromServer, pushUnsyncedChatMessages } from './chatSync';

// Singleton state
let syncState: SyncState = {
  status: 'idle',
  lastSyncAt: null,
  error: null,
  pendingChanges: 0,
};

// Listeners for state changes
const listeners: Set<(state: SyncState) => void> = new Set();

/**
 * Gets the current sync state
 */
export function getSyncState(): SyncState {
  return { ...syncState };
}

/**
 * Updates sync state and notifies listeners
 */
function updateState(updates: Partial<SyncState>): void {
  syncState = { ...syncState, ...updates };
  listeners.forEach(listener => listener(syncState));
}

/**
 * Subscribe to sync state changes
 */
export function subscribeSyncState(listener: (state: SyncState) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Performs a full sync: pull from server, then push any unsynced local data
 * This is the main entry point called on login
 */
export async function performFullSync(userId: string): Promise<SyncResult> {
  if (syncState.status === 'syncing') {
    return { success: false, error: 'Sync already in progress' };
  }

  updateState({ status: 'syncing', error: null });

  try {
    // 1. Pull user profile from server (or push if local has data and server doesn't)
    await syncUserProfileFromServer(userId);

    // 2. Pull match profiles from server
    await syncProfilesFromServer(userId);

    // 3. Push any local profiles that weren't synced
    await pushUnsyncedProfiles(userId);

    // 4. Pull coaching sessions (after profiles are synced)
    await syncCoachingSessionsFromServer(userId);

    // 5. Push any unsynced coaching sessions
    await pushUnsyncedCoachingSessions(userId);

    // 6. Pull chat messages
    await syncChatMessagesFromServer(userId);

    // 7. Push any unsynced chat messages
    await pushUnsyncedChatMessages(userId);

    const syncedAt = new Date();
    updateState({
      status: 'idle',
      lastSyncAt: syncedAt,
      error: null,
      pendingChanges: 0,
    });

    return { success: true, syncedAt };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
    updateState({
      status: 'error',
      error: errorMessage,
    });
    return { success: false, error: errorMessage };
  }
}

/**
 * Pulls all data from server to local
 * Used on login to populate local cache
 */
export async function pullAllFromServer(userId: string): Promise<SyncResult> {
  if (syncState.status === 'syncing') {
    return { success: false, error: 'Sync already in progress' };
  }

  updateState({ status: 'syncing', error: null });

  try {
    // Pull in order of dependencies
    await syncUserProfileFromServer(userId);
    await syncProfilesFromServer(userId);
    await syncCoachingSessionsFromServer(userId);
    await syncChatMessagesFromServer(userId);

    const syncedAt = new Date();
    updateState({
      status: 'idle',
      lastSyncAt: syncedAt,
      error: null,
    });

    return { success: true, syncedAt };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
    updateState({
      status: 'error',
      error: errorMessage,
    });
    return { success: false, error: errorMessage };
  }
}

/**
 * Pushes all unsynced local data to server
 * Used for migrating existing users who have local data
 */
export async function pushAllToServer(userId: string): Promise<SyncResult> {
  if (syncState.status === 'syncing') {
    return { success: false, error: 'Sync already in progress' };
  }

  updateState({ status: 'syncing', error: null });

  try {
    // Push in order of dependencies
    await pushUserProfileIfNeeded(userId);
    await pushUnsyncedProfiles(userId);
    await pushUnsyncedCoachingSessions(userId);
    await pushUnsyncedChatMessages(userId);

    const syncedAt = new Date();
    updateState({
      status: 'idle',
      lastSyncAt: syncedAt,
      error: null,
      pendingChanges: 0,
    });

    return { success: true, syncedAt };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
    updateState({
      status: 'error',
      error: errorMessage,
    });
    return { success: false, error: errorMessage };
  }
}

/**
 * Clears all local data
 * Called on logout
 */
export async function clearAllLocalData(): Promise<void> {
  // Clear all tables
  await db.profiles.clear();
  await db.coachingSessions.clear();
  await db.matchChats.clear();

  // Reset userIdentity but keep auth fields
  const identity = await db.userIdentity.get(1);
  if (identity) {
    await db.userIdentity.update(1, {
      // Clear synced data
      serverId: undefined,
      datingGoals: undefined,
      dataExports: [],
      textInputs: [],
      videoAnalysis: undefined,
      photos: [],
      manualEntry: {},
      synthesis: undefined,
      insightFeedback: [],
      settings: undefined,
      // Clear auth fields (user is logging out)
      supabaseUserId: undefined,
      email: undefined,
      authProvider: undefined,
      linkedAt: undefined,
      // Reset timestamp
      lastUpdated: new Date(),
    });
  }

  // Reset sync state
  updateState({
    status: 'idle',
    lastSyncAt: null,
    error: null,
    pendingChanges: 0,
  });
}

/**
 * Counts the number of unsynced local records
 */
export async function countUnsyncedRecords(): Promise<number> {
  const [profiles, sessions, chats] = await Promise.all([
    db.profiles.filter(p => !p.serverId).count(),
    db.coachingSessions.filter(s => !s.serverId).count(),
    db.matchChats.filter(c => !c.serverId).count(),
  ]);
  return profiles + sessions + chats;
}

/**
 * Updates the pending changes count
 */
export async function refreshPendingCount(): Promise<void> {
  const count = await countUnsyncedRecords();
  updateState({ pendingChanges: count });
}

/**
 * Checks if there's any unsynced local data
 */
export async function hasUnsyncedData(): Promise<boolean> {
  const count = await countUnsyncedRecords();
  return count > 0;
}

// Re-export individual sync functions for direct use
export { saveProfileWithSync, deleteProfileFromServer } from './profileSync';
export { saveUserIdentityWithSync } from './userProfileSync';
export { saveCoachingSessionWithSync, deleteCoachingSessionFromServer } from './coachingSync';
export { saveChatMessageWithSync, deleteChatMessagesFromServer } from './chatSync';
