// src/components/SyncIndicator.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SyncIndicator, SyncStatusDot } from './SyncIndicator';

// Mock the useSyncStatus hook
const mockUseSyncStatus = vi.fn();
vi.mock('../hooks/useSyncStatus', () => ({
  useSyncStatus: () => mockUseSyncStatus(),
}));

describe('SyncIndicator', () => {
  const mockTriggerSync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockTriggerSync.mockResolvedValue(undefined);
  });

  const createMockSyncStatus = (overrides = {}) => ({
    status: 'idle' as const,
    isSyncing: false,
    hasError: false,
    error: null,
    lastSyncAt: null,
    pendingChanges: 0,
    isOnline: true,
    statusMessage: 'Ready',
    triggerSync: mockTriggerSync,
    ...overrides,
  });

  describe('badge variant', () => {
    it('should show "Synced" with green dot when synced', () => {
      mockUseSyncStatus.mockReturnValue(
        createMockSyncStatus({
          statusMessage: 'Synced 5m ago',
          lastSyncAt: new Date(),
        })
      );

      render(<SyncIndicator variant="badge" />);

      expect(screen.getByText('Synced')).toBeInTheDocument();
      // Check for green dot (bg-green-500 class)
      const dot = document.querySelector('.bg-green-500');
      expect(dot).toBeInTheDocument();
    });

    it('should show "Syncing" with pulsing dot when syncing', () => {
      mockUseSyncStatus.mockReturnValue(
        createMockSyncStatus({
          isSyncing: true,
          statusMessage: 'Syncing...',
        })
      );

      render(<SyncIndicator variant="badge" />);

      expect(screen.getByText('Syncing')).toBeInTheDocument();
      // Check for pulsing animation
      const dot = document.querySelector('.animate-pulse');
      expect(dot).toBeInTheDocument();
    });

    it('should show "Offline" with gray dot when offline', () => {
      mockUseSyncStatus.mockReturnValue(
        createMockSyncStatus({
          isOnline: false,
          statusMessage: 'Offline',
        })
      );

      render(<SyncIndicator variant="badge" />);

      expect(screen.getByText('Offline')).toBeInTheDocument();
      // Check for gray dot
      const dot = document.querySelector('.bg-gray-400');
      expect(dot).toBeInTheDocument();
    });

    it('should be clickable when online and not syncing', () => {
      mockUseSyncStatus.mockReturnValue(createMockSyncStatus());

      render(<SyncIndicator variant="badge" />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockTriggerSync).toHaveBeenCalledTimes(1);
    });

    it('should be disabled when syncing', () => {
      mockUseSyncStatus.mockReturnValue(
        createMockSyncStatus({ isSyncing: true })
      );

      render(<SyncIndicator variant="badge" />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should be disabled when offline', () => {
      mockUseSyncStatus.mockReturnValue(
        createMockSyncStatus({ isOnline: false })
      );

      render(<SyncIndicator variant="badge" />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('detailed variant', () => {
    it('should show status message', () => {
      mockUseSyncStatus.mockReturnValue(
        createMockSyncStatus({ statusMessage: 'Synced 10m ago' })
      );

      render(<SyncIndicator variant="detailed" />);

      expect(screen.getByText('Synced 10m ago')).toBeInTheDocument();
    });

    it('should show last sync time when available', () => {
      const lastSync = new Date('2024-01-15T12:00:00Z');
      mockUseSyncStatus.mockReturnValue(
        createMockSyncStatus({
          lastSyncAt: lastSync,
          statusMessage: 'Synced just now',
        })
      );

      render(<SyncIndicator variant="detailed" />);

      expect(screen.getByText(/Last sync:/)).toBeInTheDocument();
    });

    it('should show "Retry" button when there is an error', () => {
      mockUseSyncStatus.mockReturnValue(
        createMockSyncStatus({
          hasError: true,
          error: 'Network error',
          statusMessage: 'Sync error: Network error',
        })
      );

      render(<SyncIndicator variant="detailed" />);

      const retryButton = screen.getByText('Retry');
      expect(retryButton).toBeInTheDocument();

      fireEvent.click(retryButton);
      expect(mockTriggerSync).toHaveBeenCalledTimes(1);
    });

    it('should show "Sync Now" button when idle and online', () => {
      mockUseSyncStatus.mockReturnValue(createMockSyncStatus());

      render(<SyncIndicator variant="detailed" />);

      const syncButton = screen.getByText('Sync Now');
      expect(syncButton).toBeInTheDocument();

      fireEvent.click(syncButton);
      expect(mockTriggerSync).toHaveBeenCalledTimes(1);
    });

    it('should not show "Sync Now" when syncing', () => {
      mockUseSyncStatus.mockReturnValue(
        createMockSyncStatus({ isSyncing: true })
      );

      render(<SyncIndicator variant="detailed" />);

      expect(screen.queryByText('Sync Now')).not.toBeInTheDocument();
    });

    it('should show pending changes count', () => {
      mockUseSyncStatus.mockReturnValue(
        createMockSyncStatus({
          pendingChanges: 5,
          statusMessage: '5 pending',
        })
      );

      render(<SyncIndicator variant="detailed" />);

      expect(screen.getByText('5 changes waiting to sync')).toBeInTheDocument();
    });

    it('should show singular "change" for 1 pending', () => {
      mockUseSyncStatus.mockReturnValue(
        createMockSyncStatus({
          pendingChanges: 1,
          statusMessage: '1 pending',
        })
      );

      render(<SyncIndicator variant="detailed" />);

      expect(screen.getByText('1 change waiting to sync')).toBeInTheDocument();
    });
  });
});

describe('SyncStatusDot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockSyncStatus = (overrides = {}) => ({
    status: 'idle' as const,
    isSyncing: false,
    hasError: false,
    error: null,
    lastSyncAt: null,
    pendingChanges: 0,
    isOnline: true,
    statusMessage: 'Ready',
    triggerSync: vi.fn(),
    ...overrides,
  });

  it('should render green dot when synced', () => {
    mockUseSyncStatus.mockReturnValue(createMockSyncStatus());

    render(<SyncStatusDot />);

    const dot = document.querySelector('.bg-green-500');
    expect(dot).toBeInTheDocument();
  });

  it('should render blue pulsing dot when syncing', () => {
    mockUseSyncStatus.mockReturnValue(
      createMockSyncStatus({ isSyncing: true })
    );

    render(<SyncStatusDot />);

    const dot = document.querySelector('.bg-blue-500.animate-pulse');
    expect(dot).toBeInTheDocument();
  });

  it('should render gray dot when offline', () => {
    mockUseSyncStatus.mockReturnValue(
      createMockSyncStatus({ isOnline: false })
    );

    render(<SyncStatusDot />);

    const dot = document.querySelector('.bg-gray-400');
    expect(dot).toBeInTheDocument();
  });

  it('should render red dot when error', () => {
    mockUseSyncStatus.mockReturnValue(
      createMockSyncStatus({ hasError: true })
    );

    render(<SyncStatusDot />);

    const dot = document.querySelector('.bg-red-500');
    expect(dot).toBeInTheDocument();
  });

  it('should render yellow dot when pending changes', () => {
    mockUseSyncStatus.mockReturnValue(
      createMockSyncStatus({ pendingChanges: 3 })
    );

    render(<SyncStatusDot />);

    const dot = document.querySelector('.bg-yellow-500');
    expect(dot).toBeInTheDocument();
  });
});
