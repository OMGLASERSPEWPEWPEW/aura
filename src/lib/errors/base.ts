// src/lib/errors/base.ts
// Base error class for all Aura errors

import type { ErrorDebugInfo } from '../utils/errorExport';

/**
 * Error categories for classification and handling
 */
export type ErrorCategory = 'api' | 'sync' | 'validation' | 'media' | 'auth';

/**
 * Base error class for all Aura application errors.
 * Provides structured error information for debugging and user feedback.
 */
export abstract class AuraError extends Error {
  /**
   * Unique error code for programmatic handling (e.g., 'API_TIMEOUT', 'SYNC_CONFLICT')
   */
  abstract readonly code: string;

  /**
   * Error category for routing and handling
   */
  abstract readonly category: ErrorCategory;

  /**
   * When the error occurred
   */
  readonly timestamp: Date;

  /**
   * Additional context for debugging (not shown to users)
   */
  readonly context?: Record<string, unknown>;

  /**
   * Whether this error can be retried (e.g., network failures vs validation errors)
   */
  readonly retryable: boolean;

  /**
   * Original error if this wraps another error
   */
  readonly cause?: Error;

  constructor(
    message: string,
    options?: {
      context?: Record<string, unknown>;
      retryable?: boolean;
      cause?: Error;
    }
  ) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.context = options?.context;
    this.retryable = options?.retryable ?? false;
    this.cause = options?.cause;

    // Maintains proper stack trace in V8 environments (Node.js, Chrome)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ErrorWithCapture = Error as any;
    if (typeof ErrorWithCapture.captureStackTrace === 'function') {
      ErrorWithCapture.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Returns a user-friendly message suitable for display in the UI.
   * Subclasses should override to provide specific user messages.
   */
  abstract getUserMessage(): string;

  /**
   * Returns a hint for the user on how to resolve the error.
   * Optional - not all errors have actionable hints.
   */
  getHint(): string | undefined {
    return undefined;
  }

  /**
   * Converts the error to a debug-friendly JSON format.
   * Compatible with the existing ErrorDebugInfo interface.
   */
  toJSON(): ErrorDebugInfo {
    return {
      timestamp: this.timestamp.toISOString(),
      operation: this.code,
      inputSummary: {
        errorName: this.name,
        errorCode: this.code,
        category: this.category,
        retryable: this.retryable,
        ...this.context,
      },
      parseError: this.message,
      additionalContext: {
        stack: this.stack,
        cause: this.cause?.message,
        causeStack: this.cause?.stack,
      },
    };
  }

  /**
   * Creates an AuraError from any error type.
   * Useful for wrapping unknown errors in catch blocks.
   */
  static from(error: unknown, fallbackCode: string, fallbackCategory: ErrorCategory): AuraError {
    if (error instanceof AuraError) {
      return error;
    }

    const message = error instanceof Error ? error.message : String(error);
    const cause = error instanceof Error ? error : undefined;

    // Create a generic wrapped error
    return new WrappedError(message, fallbackCode, fallbackCategory, { cause });
  }
}

/**
 * Generic wrapped error for unknown error types.
 * Used when we need to wrap a non-AuraError in the AuraError hierarchy.
 */
class WrappedError extends AuraError {
  readonly code: string;
  readonly category: ErrorCategory;

  constructor(
    message: string,
    code: string,
    category: ErrorCategory,
    options?: {
      context?: Record<string, unknown>;
      retryable?: boolean;
      cause?: Error;
    }
  ) {
    super(message, options);
    this.code = code;
    this.category = category;
  }

  getUserMessage(): string {
    return 'An unexpected error occurred. Please try again.';
  }
}
