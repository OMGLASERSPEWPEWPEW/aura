// src/lib/sync/syncUtils.ts
// Sync utilities with retry logic and Result pattern support

import {
  SyncError,
  StorageError,
  OfflineError,
  ImageSyncError,
  type Result,
  Ok,
  Err,
  type AuraError,
} from '../errors';

/**
 * Options for retry behavior
 */
export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  onRetry?: (attempt: number, error: AuraError) => void;
}

const DEFAULT_RETRY_OPTIONS: Required<Omit<RetryOptions, 'onRetry'>> = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
};

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay with jitter
 */
function calculateDelay(attempt: number, baseMs: number, maxMs: number): number {
  const exponentialDelay = baseMs * Math.pow(2, attempt);
  const jitter = Math.random() * 0.3 * exponentialDelay;
  return Math.min(exponentialDelay + jitter, maxMs);
}

/**
 * Check if we're likely offline
 */
export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine;
}

/**
 * Convert a Supabase error to an AuraError
 */
export function toSyncError(
  error: unknown,
  operation?: 'push' | 'pull' | 'delete' | 'update'
): AuraError {
  if (error instanceof SyncError || error instanceof StorageError ||
      error instanceof OfflineError || error instanceof ImageSyncError) {
    return error;
  }

  if (isOffline()) {
    return new OfflineError();
  }

  const message = error instanceof Error ? error.message : String(error);
  const cause = error instanceof Error ? error : undefined;

  // Check for specific Supabase errors
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('network') || lowerMessage.includes('fetch failed')) {
    return new OfflineError({ cause });
  }

  if (lowerMessage.includes('storage') || lowerMessage.includes('bucket')) {
    return new StorageError(message, 'remote', { cause });
  }

  if (lowerMessage.includes('quota') || lowerMessage.includes('exceeded')) {
    return new StorageError('Storage quota exceeded', 'remote', {
      retryable: false,
      cause,
    });
  }

  return new SyncError(message, {
    operation,
    cause,
    retryable: !lowerMessage.includes('permission') && !lowerMessage.includes('not found'),
  });
}

/**
 * Execute a sync operation with retry logic.
 * Returns a Result instead of throwing.
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => pushProfile(profile, userId),
 *   { maxRetries: 3, onRetry: (attempt) => console.log(`Retry ${attempt}`) }
 * );
 *
 * if (result.ok) {
 *   console.log('Profile pushed:', result.value);
 * } else {
 *   showError(result.error);
 * }
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<Result<T, AuraError>> {
  const {
    maxRetries = DEFAULT_RETRY_OPTIONS.maxRetries,
    baseDelayMs = DEFAULT_RETRY_OPTIONS.baseDelayMs,
    maxDelayMs = DEFAULT_RETRY_OPTIONS.maxDelayMs,
    onRetry,
  } = options;

  let lastError: AuraError | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      return Ok(result);
    } catch (error) {
      lastError = toSyncError(error);

      // Don't retry if offline - will retry when back online
      if (lastError instanceof OfflineError) {
        return Err(lastError);
      }

      // Don't retry non-retryable errors
      if (!lastError.retryable) {
        return Err(lastError);
      }

      // Check if this is the last attempt
      if (attempt === maxRetries) {
        return Err(lastError);
      }

      // Calculate delay and wait
      const delay = calculateDelay(attempt, baseDelayMs, maxDelayMs);
      console.log(`Sync operation failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms...`);

      onRetry?.(attempt + 1, lastError);
      await sleep(delay);
    }
  }

  return Err(lastError || new SyncError('Sync operation failed after retries'));
}

/**
 * Execute multiple sync operations in parallel with individual retry logic.
 * Returns results for all operations, even if some fail.
 */
export async function withRetryAll<T>(
  operations: Array<{
    name: string;
    fn: () => Promise<T>;
    options?: RetryOptions;
  }>
): Promise<Map<string, Result<T, AuraError>>> {
  const results = await Promise.all(
    operations.map(async ({ name, fn, options }) => {
      const result = await withRetry(fn, options);
      return { name, result };
    })
  );

  const resultMap = new Map<string, Result<T, AuraError>>();
  for (const { name, result } of results) {
    resultMap.set(name, result);
  }

  return resultMap;
}

/**
 * Wrap an existing sync function to return Result<T, AuraError>.
 * Use this to gradually migrate existing code.
 *
 * @example
 * ```typescript
 * // Original throwing function
 * async function pushProfile(profile, userId) { ... }
 *
 * // Wrapped version
 * const pushProfileSafe = wrapSync(pushProfile);
 *
 * // Usage
 * const result = await pushProfileSafe(profile, userId);
 * if (!result.ok) {
 *   showError(result.error);
 * }
 * ```
 */
export function wrapSync<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  operation?: 'push' | 'pull' | 'delete' | 'update'
): (...args: TArgs) => Promise<Result<TReturn, AuraError>> {
  return async (...args: TArgs) => {
    try {
      const result = await fn(...args);
      return Ok(result);
    } catch (error) {
      return Err(toSyncError(error, operation));
    }
  };
}

/**
 * Wrap a sync function with automatic retry.
 */
export function wrapSyncWithRetry<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  options: RetryOptions & { operation?: 'push' | 'pull' | 'delete' | 'update' } = {}
): (...args: TArgs) => Promise<Result<TReturn, AuraError>> {
  return async (...args: TArgs) => {
    return withRetry(() => fn(...args), options);
  };
}
