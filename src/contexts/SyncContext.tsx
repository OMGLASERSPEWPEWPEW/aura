// src/contexts/SyncContext.tsx
// React context providing sync state and operations throughout the app

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import {
  type SyncState,
  type SyncResult,
  getSyncState,
  subscribeSyncState,
  performFullSync,
  clearAllLocalData,
  refreshPendingCount,
  hasUnsyncedData,
} from '../lib/sync';
import { useAuth } from './AuthContext';

interface SyncContextType {
  // Current sync state
  syncState: SyncState;

  // Trigger a full sync (pull + push)
  sync: () => Promise<SyncResult>;

  // Clear all local data (called on logout)
  clearLocalData: () => Promise<void>;

  // Check if there's unsynced data
  checkUnsyncedData: () => Promise<boolean>;

  // Refresh the pending changes count
  refreshPending: () => Promise<void>;

  // Is the user online?
  isOnline: boolean;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

interface SyncProviderProps {
  children: ReactNode;
}

export function SyncProvider({ children }: SyncProviderProps) {
  const { user } = useAuth();
  const [syncState, setSyncState] = useState<SyncState>(getSyncState());
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Subscribe to sync state changes
  useEffect(() => {
    const unsubscribe = subscribeSyncState(setSyncState);
    return unsubscribe;
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Perform full sync when user logs in
  useEffect(() => {
    if (user && isOnline) {
      // Auto-sync on login
      performFullSync(user.id).catch(console.error);
    }
  }, [user?.id, isOnline]);

  const sync = useCallback(async (): Promise<SyncResult> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }
    if (!isOnline) {
      return { success: false, error: 'No network connection' };
    }
    return performFullSync(user.id);
  }, [user, isOnline]);

  const clearLocalData = useCallback(async (): Promise<void> => {
    await clearAllLocalData();
  }, []);

  const checkUnsyncedData = useCallback(async (): Promise<boolean> => {
    return hasUnsyncedData();
  }, []);

  const refreshPending = useCallback(async (): Promise<void> => {
    await refreshPendingCount();
  }, []);

  const value: SyncContextType = {
    syncState,
    sync,
    clearLocalData,
    checkUnsyncedData,
    refreshPending,
    isOnline,
  };

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync(): SyncContextType {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}
