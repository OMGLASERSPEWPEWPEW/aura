// src/lib/errors/sync.ts
// Sync-related error classes

import { AuraError } from './base';

/**
 * Base class for sync errors
 */
export class SyncError extends AuraError {
  readonly code = 'SYNC_ERROR';
  readonly category = 'sync' as const;
  readonly operation?: 'push' | 'pull' | 'delete' | 'update';

  constructor(
    message: string,
    options?: {
      operation?: 'push' | 'pull' | 'delete' | 'update';
      context?: Record<string, unknown>;
      retryable?: boolean;
      cause?: Error;
    }
  ) {
    super(message, {
      ...options,
      retryable: options?.retryable ?? true, // Most sync errors are retryable
    });
    this.operation = options?.operation;
  }

  getUserMessage(): string {
    const operationText = this.operation
      ? `Failed to ${this.operation} data`
      : 'Sync failed';
    return `${operationText}. Your changes are saved locally and will sync when the connection is restored.`;
  }

  getHint(): string | undefined {
    return 'Data is saved locally - it will sync automatically when possible';
  }
}

/**
 * Conflict errors when local and server data diverge
 */
export class ConflictError extends AuraError {
  readonly code = 'SYNC_CONFLICT';
  readonly category = 'sync' as const;
  readonly localVersion?: unknown;
  readonly serverVersion?: unknown;
  readonly entityType: string;
  readonly entityId: string | number;

  constructor(
    entityType: string,
    entityId: string | number,
    options?: {
      localVersion?: unknown;
      serverVersion?: unknown;
      context?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    super(`Sync conflict for ${entityType} ${entityId}`, {
      ...options,
      retryable: false, // Conflicts need user intervention
    });
    this.entityType = entityType;
    this.entityId = entityId;
    this.localVersion = options?.localVersion;
    this.serverVersion = options?.serverVersion;
  }

  getUserMessage(): string {
    return 'This item was modified on another device. Please refresh to see the latest version.';
  }

  getHint(): string | undefined {
    return 'Pull to refresh and see the latest changes';
  }
}

/**
 * Storage errors (IndexedDB, Supabase Storage)
 */
export class StorageError extends AuraError {
  readonly code = 'STORAGE_ERROR';
  readonly category = 'sync' as const;
  readonly storageType: 'local' | 'remote';

  constructor(
    message: string,
    storageType: 'local' | 'remote',
    options?: {
      context?: Record<string, unknown>;
      retryable?: boolean;
      cause?: Error;
    }
  ) {
    super(message, {
      ...options,
      retryable: options?.retryable ?? storageType === 'remote', // Remote storage is retryable
    });
    this.storageType = storageType;
  }

  getUserMessage(): string {
    if (this.storageType === 'local') {
      return 'Failed to save data locally. Your device storage may be full.';
    }
    return 'Failed to save to cloud storage. Please try again.';
  }

  getHint(): string | undefined {
    if (this.storageType === 'local') {
      return 'Try clearing browser data or freeing up device storage';
    }
    return undefined;
  }
}

/**
 * Quota exceeded errors (storage full)
 */
export class QuotaExceededError extends AuraError {
  readonly code = 'QUOTA_EXCEEDED';
  readonly category = 'sync' as const;
  readonly storageType: 'local' | 'remote';

  constructor(
    storageType: 'local' | 'remote',
    options?: {
      context?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    super(
      storageType === 'local'
        ? 'Local storage quota exceeded'
        : 'Cloud storage quota exceeded',
      {
        ...options,
        retryable: false, // Quota errors need user action
      }
    );
    this.storageType = storageType;
  }

  getUserMessage(): string {
    if (this.storageType === 'local') {
      return 'Your device storage is full. Please delete some profiles to free up space.';
    }
    return 'Your cloud storage is full. Please upgrade your plan or delete some data.';
  }

  getHint(): string | undefined {
    return 'Go to Settings to manage your storage';
  }
}

/**
 * Offline errors when network is unavailable
 */
export class OfflineError extends AuraError {
  readonly code = 'OFFLINE';
  readonly category = 'sync' as const;

  constructor(options?: {
    context?: Record<string, unknown>;
    cause?: Error;
  }) {
    super('Device is offline', {
      ...options,
      retryable: true, // Will retry when back online
    });
  }

  getUserMessage(): string {
    return 'You are offline. Changes will sync when you reconnect.';
  }

  getHint(): string | undefined {
    return 'Check your internet connection';
  }
}

/**
 * Image sync errors (upload/download failures)
 */
export class ImageSyncError extends AuraError {
  readonly code = 'IMAGE_SYNC_ERROR';
  readonly category = 'sync' as const;
  readonly operation: 'upload' | 'download' | 'delete';
  readonly imagePath?: string;

  constructor(
    operation: 'upload' | 'download' | 'delete',
    options?: {
      imagePath?: string;
      context?: Record<string, unknown>;
      retryable?: boolean;
      cause?: Error;
    }
  ) {
    super(`Failed to ${operation} image${options?.imagePath ? `: ${options.imagePath}` : ''}`, {
      ...options,
      retryable: options?.retryable ?? true,
    });
    this.operation = operation;
    this.imagePath = options?.imagePath;
  }

  getUserMessage(): string {
    switch (this.operation) {
      case 'upload':
        return 'Failed to upload image. Please try again.';
      case 'download':
        return 'Failed to load image. Please try again.';
      case 'delete':
        return 'Failed to delete image. Please try again.';
    }
  }
}
