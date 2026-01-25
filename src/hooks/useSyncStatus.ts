// src/hooks/useSyncStatus.ts
// Hook for accessing sync status in components

import { useSync } from '../contexts/SyncContext';
import type { SyncStatus } from '../lib/sync';

interface SyncStatusInfo {
  // Current status
  status: SyncStatus;

  // Is a sync currently in progress?
  isSyncing: boolean;

  // Was there an error?
  hasError: boolean;

  // Error message if any
  error: string | null;

  // When was the last successful sync?
  lastSyncAt: Date | null;

  // Number of pending (unsynced) changes
  pendingChanges: number;

  // Is the user online?
  isOnline: boolean;

  // Human-readable status message
  statusMessage: string;

  // Trigger a sync
  triggerSync: () => Promise<void>;
}

export function useSyncStatus(): SyncStatusInfo {
  const { syncState, sync, isOnline } = useSync();

  const isSyncing = syncState.status === 'syncing';
  const hasError = syncState.status === 'error';

  // Generate human-readable status message
  let statusMessage: string;
  if (!isOnline) {
    statusMessage = 'Offline';
  } else if (isSyncing) {
    statusMessage = 'Syncing...';
  } else if (hasError) {
    statusMessage = `Sync error: ${syncState.error}`;
  } else if (syncState.pendingChanges > 0) {
    statusMessage = `${syncState.pendingChanges} pending`;
  } else if (syncState.lastSyncAt) {
    const ago = getTimeAgo(syncState.lastSyncAt);
    statusMessage = `Synced ${ago}`;
  } else {
    statusMessage = 'Ready';
  }

  const triggerSync = async () => {
    await sync();
  };

  return {
    status: syncState.status,
    isSyncing,
    hasError,
    error: syncState.error,
    lastSyncAt: syncState.lastSyncAt,
    pendingChanges: syncState.pendingChanges,
    isOnline,
    statusMessage,
    triggerSync,
  };
}

/**
 * Formats a date as a relative time string
 */
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return 'just now';
  } else if (diffMin < 60) {
    return `${diffMin}m ago`;
  } else if (diffHour < 24) {
    return `${diffHour}h ago`;
  } else {
    return `${diffDay}d ago`;
  }
}

/**
 * Hook for checking if initial sync is needed
 */
export function useNeedsInitialSync(): boolean {
  const { syncState } = useSync();
  return syncState.lastSyncAt === null && syncState.status !== 'syncing';
}
