// src/hooks/useSyncStatus.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSyncStatus, useNeedsInitialSync } from './useSyncStatus';
import type { SyncState } from '../lib/sync';

// Mock the SyncContext
const mockUseSync = vi.fn();
vi.mock('../contexts/SyncContext', () => ({
  useSync: () => mockUseSync(),
}));

describe('useSyncStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  const createMockSyncState = (overrides: Partial<SyncState> = {}): SyncState => ({
    status: 'idle',
    lastSyncAt: null,
    error: null,
    pendingChanges: 0,
    ...overrides,
  });

  describe('statusMessage', () => {
    it('should show "Offline" when not online', () => {
      mockUseSync.mockReturnValue({
        syncState: createMockSyncState(),
        sync: vi.fn(),
        isOnline: false,
      });

      const { result } = renderHook(() => useSyncStatus());

      expect(result.current.statusMessage).toBe('Offline');
      expect(result.current.isOnline).toBe(false);
    });

    it('should show "Syncing..." when status is syncing', () => {
      mockUseSync.mockReturnValue({
        syncState: createMockSyncState({ status: 'syncing' }),
        sync: vi.fn(),
        isOnline: true,
      });

      const { result } = renderHook(() => useSyncStatus());

      expect(result.current.statusMessage).toBe('Syncing...');
      expect(result.current.isSyncing).toBe(true);
    });

    it('should show error message when status is error', () => {
      mockUseSync.mockReturnValue({
        syncState: createMockSyncState({
          status: 'error',
          error: 'Network timeout',
        }),
        sync: vi.fn(),
        isOnline: true,
      });

      const { result } = renderHook(() => useSyncStatus());

      expect(result.current.statusMessage).toBe('Sync error: Network timeout');
      expect(result.current.hasError).toBe(true);
      expect(result.current.error).toBe('Network timeout');
    });

    it('should show pending count when there are pending changes', () => {
      mockUseSync.mockReturnValue({
        syncState: createMockSyncState({ pendingChanges: 3 }),
        sync: vi.fn(),
        isOnline: true,
      });

      const { result } = renderHook(() => useSyncStatus());

      expect(result.current.statusMessage).toBe('3 pending');
      expect(result.current.pendingChanges).toBe(3);
    });

    it('should show "Synced just now" when lastSyncAt is recent', () => {
      const recentDate = new Date('2024-01-15T11:59:30Z'); // 30 seconds ago
      mockUseSync.mockReturnValue({
        syncState: createMockSyncState({ lastSyncAt: recentDate }),
        sync: vi.fn(),
        isOnline: true,
      });

      const { result } = renderHook(() => useSyncStatus());

      expect(result.current.statusMessage).toBe('Synced just now');
      expect(result.current.lastSyncAt).toEqual(recentDate);
    });

    it('should show "Synced Xm ago" when lastSyncAt is minutes ago', () => {
      const fiveMinutesAgo = new Date('2024-01-15T11:55:00Z'); // 5 minutes ago
      mockUseSync.mockReturnValue({
        syncState: createMockSyncState({ lastSyncAt: fiveMinutesAgo }),
        sync: vi.fn(),
        isOnline: true,
      });

      const { result } = renderHook(() => useSyncStatus());

      expect(result.current.statusMessage).toBe('Synced 5m ago');
    });

    it('should show "Synced Xh ago" when lastSyncAt is hours ago', () => {
      const twoHoursAgo = new Date('2024-01-15T10:00:00Z'); // 2 hours ago
      mockUseSync.mockReturnValue({
        syncState: createMockSyncState({ lastSyncAt: twoHoursAgo }),
        sync: vi.fn(),
        isOnline: true,
      });

      const { result } = renderHook(() => useSyncStatus());

      expect(result.current.statusMessage).toBe('Synced 2h ago');
    });

    it('should show "Ready" when no lastSyncAt and no pending changes', () => {
      mockUseSync.mockReturnValue({
        syncState: createMockSyncState(),
        sync: vi.fn(),
        isOnline: true,
      });

      const { result } = renderHook(() => useSyncStatus());

      expect(result.current.statusMessage).toBe('Ready');
    });
  });

  describe('triggerSync', () => {
    it('should call the sync function from context', async () => {
      const mockSync = vi.fn().mockResolvedValue({ success: true });
      mockUseSync.mockReturnValue({
        syncState: createMockSyncState(),
        sync: mockSync,
        isOnline: true,
      });

      const { result } = renderHook(() => useSyncStatus());
      await result.current.triggerSync();

      expect(mockSync).toHaveBeenCalledTimes(1);
    });
  });
});

describe('useNeedsInitialSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true when lastSyncAt is null and not syncing', () => {
    mockUseSync.mockReturnValue({
      syncState: {
        status: 'idle',
        lastSyncAt: null,
        error: null,
        pendingChanges: 0,
      },
      sync: vi.fn(),
      isOnline: true,
    });

    const { result } = renderHook(() => useNeedsInitialSync());

    expect(result.current).toBe(true);
  });

  it('should return false when currently syncing', () => {
    mockUseSync.mockReturnValue({
      syncState: {
        status: 'syncing',
        lastSyncAt: null,
        error: null,
        pendingChanges: 0,
      },
      sync: vi.fn(),
      isOnline: true,
    });

    const { result } = renderHook(() => useNeedsInitialSync());

    expect(result.current).toBe(false);
  });

  it('should return false when already synced', () => {
    mockUseSync.mockReturnValue({
      syncState: {
        status: 'idle',
        lastSyncAt: new Date(),
        error: null,
        pendingChanges: 0,
      },
      sync: vi.fn(),
      isOnline: true,
    });

    const { result } = renderHook(() => useNeedsInitialSync());

    expect(result.current).toBe(false);
  });
});
