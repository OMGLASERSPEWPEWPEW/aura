// src/lib/errors/api.ts
// API-related error classes

import { AuraError } from './base';

/**
 * Base class for API errors
 */
export class ApiError extends AuraError {
  readonly code = 'API_ERROR';
  readonly category = 'api' as const;
  readonly statusCode?: number;

  constructor(
    message: string,
    options?: {
      statusCode?: number;
      context?: Record<string, unknown>;
      retryable?: boolean;
      cause?: Error;
    }
  ) {
    super(message, {
      ...options,
      // 5xx errors and rate limits are retryable
      retryable: options?.retryable ?? (options?.statusCode ? options.statusCode >= 500 || options.statusCode === 429 : false),
    });
    this.statusCode = options?.statusCode;
  }

  getUserMessage(): string {
    if (this.statusCode === 401) {
      return 'Your session has expired. Please sign in again.';
    }
    if (this.statusCode === 403) {
      return 'You do not have permission to perform this action.';
    }
    if (this.statusCode === 429) {
      return 'Too many requests. Please wait a moment and try again.';
    }
    if (this.statusCode && this.statusCode >= 500) {
      return 'The server is temporarily unavailable. Please try again.';
    }
    return 'Failed to communicate with the server. Please try again.';
  }

  getHint(): string | undefined {
    if (this.statusCode === 401) {
      return 'Click "Sign In" to re-authenticate';
    }
    if (this.statusCode === 429) {
      return 'Wait a few seconds before retrying';
    }
    return undefined;
  }
}

/**
 * Network connectivity errors (offline, DNS failure, etc.)
 */
export class NetworkError extends AuraError {
  readonly code = 'NETWORK_ERROR';
  readonly category = 'api' as const;

  constructor(
    message: string = 'Network connection failed',
    options?: {
      context?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    super(message, {
      ...options,
      retryable: true, // Network errors are always retryable
    });
  }

  getUserMessage(): string {
    return 'Unable to connect. Please check your internet connection.';
  }

  getHint(): string | undefined {
    return 'Check your Wi-Fi or mobile data connection';
  }
}

/**
 * Request timeout errors
 */
export class TimeoutError extends AuraError {
  readonly code = 'TIMEOUT_ERROR';
  readonly category = 'api' as const;
  readonly timeoutMs: number;

  constructor(
    timeoutMs: number,
    options?: {
      context?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    super(`Request timed out after ${timeoutMs}ms`, {
      ...options,
      retryable: true, // Timeouts are retryable
    });
    this.timeoutMs = timeoutMs;
  }

  getUserMessage(): string {
    return 'The request took too long. Please try again.';
  }

  getHint(): string | undefined {
    return 'This may be due to a slow connection or high server load';
  }
}

/**
 * Authentication errors (expired token, invalid credentials, etc.)
 */
export class AuthError extends AuraError {
  readonly code = 'AUTH_ERROR';
  readonly category = 'auth' as const;
  readonly reason: 'expired' | 'invalid' | 'missing' | 'unauthorized';

  constructor(
    reason: 'expired' | 'invalid' | 'missing' | 'unauthorized',
    options?: {
      message?: string;
      context?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    const defaultMessages: Record<typeof reason, string> = {
      expired: 'Your session has expired',
      invalid: 'Invalid authentication credentials',
      missing: 'Authentication required',
      unauthorized: 'You are not authorized to perform this action',
    };

    super(options?.message ?? defaultMessages[reason], {
      ...options,
      retryable: reason === 'expired', // Only expired tokens are retryable (after refresh)
    });

    this.reason = reason;
  }

  getUserMessage(): string {
    switch (this.reason) {
      case 'expired':
        return 'Your session has expired. Please sign in again.';
      case 'invalid':
        return 'Invalid credentials. Please check and try again.';
      case 'missing':
        return 'Please sign in to continue.';
      case 'unauthorized':
        return 'You do not have permission to perform this action.';
    }
  }

  getHint(): string | undefined {
    if (this.reason === 'expired' || this.reason === 'missing') {
      return 'Click "Sign In" to continue';
    }
    return undefined;
  }
}

/**
 * Rate limit errors with retry-after information
 */
export class RateLimitError extends AuraError {
  readonly code = 'RATE_LIMIT_ERROR';
  readonly category = 'api' as const;
  readonly retryAfterMs?: number;

  constructor(options?: {
    message?: string;
    retryAfterMs?: number;
    context?: Record<string, unknown>;
    cause?: Error;
  }) {
    super(options?.message ?? 'Rate limit exceeded', {
      ...options,
      retryable: true,
    });
    this.retryAfterMs = options?.retryAfterMs;
  }

  getUserMessage(): string {
    if (this.retryAfterMs) {
      const seconds = Math.ceil(this.retryAfterMs / 1000);
      return `Too many requests. Please wait ${seconds} seconds.`;
    }
    return 'Too many requests. Please wait a moment and try again.';
  }

  getHint(): string | undefined {
    return 'The AI service is rate-limited to prevent overload';
  }
}
