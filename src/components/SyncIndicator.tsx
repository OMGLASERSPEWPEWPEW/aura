// src/components/SyncIndicator.tsx
// Visual indicator showing sync status

import { useSyncStatus } from '../hooks/useSyncStatus';

interface SyncIndicatorProps {
  /** Show as a compact badge (default) or expanded with details */
  variant?: 'badge' | 'detailed';
  /** Additional CSS classes */
  className?: string;
}

export function SyncIndicator({ variant = 'badge', className = '' }: SyncIndicatorProps) {
  const {
    isSyncing,
    hasError,
    isOnline,
    statusMessage,
    pendingChanges,
    lastSyncAt,
    triggerSync,
  } = useSyncStatus();

  // Determine the indicator color
  const getStatusColor = () => {
    if (!isOnline) return 'bg-gray-400 dark:bg-gray-500';
    if (hasError) return 'bg-red-500';
    if (isSyncing) return 'bg-blue-500';
    if (pendingChanges > 0) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Determine the icon
  const getStatusIcon = () => {
    if (!isOnline) {
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728M5.636 5.636a9 9 0 000 12.728M8.464 8.464a5 5 0 010 7.072M15.536 8.464a5 5 0 000 7.072M12 12h.01" />
        </svg>
      );
    }
    if (isSyncing) {
      return (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      );
    }
    if (hasError) {
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    );
  };

  if (variant === 'badge') {
    return (
      <button
        onClick={isSyncing ? undefined : triggerSync}
        disabled={isSyncing || !isOnline}
        className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full transition-colors ${className}`}
        title={statusMessage}
      >
        <span className={`w-2 h-2 rounded-full ${getStatusColor()} ${isSyncing ? 'animate-pulse' : ''}`} />
        <span className="text-slate-600 dark:text-slate-300">
          {isSyncing ? 'Syncing' : isOnline ? 'Synced' : 'Offline'}
        </span>
      </button>
    );
  }

  // Detailed variant
  return (
    <div className={`p-4 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${getStatusColor()} text-white`}>
            {getStatusIcon()}
          </div>
          <div>
            <p className="font-medium text-slate-900 dark:text-slate-50">
              {statusMessage}
            </p>
            {lastSyncAt && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Last sync: {lastSyncAt.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        {hasError && isOnline && (
          <button
            onClick={triggerSync}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
          >
            Retry
          </button>
        )}

        {!isSyncing && isOnline && !hasError && (
          <button
            onClick={triggerSync}
            className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
          >
            Sync Now
          </button>
        )}
      </div>

      {pendingChanges > 0 && (
        <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
          {pendingChanges} change{pendingChanges !== 1 ? 's' : ''} waiting to sync
        </p>
      )}
    </div>
  );
}

/**
 * Compact inline status indicator
 */
export function SyncStatusDot() {
  const { isSyncing, hasError, isOnline, pendingChanges } = useSyncStatus();

  const getColor = () => {
    if (!isOnline) return 'bg-gray-400 dark:bg-gray-500';
    if (hasError) return 'bg-red-500';
    if (isSyncing) return 'bg-blue-500';
    if (pendingChanges > 0) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${getColor()} ${isSyncing ? 'animate-pulse' : ''}`}
      title={isSyncing ? 'Syncing...' : isOnline ? 'Synced' : 'Offline'}
    />
  );
}
