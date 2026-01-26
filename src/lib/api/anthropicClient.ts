// src/lib/api/anthropicClient.ts
// Centralized Anthropic API client

import { ANTHROPIC_CONFIG, TIMEOUTS, getApiKey, isUsingProxy } from './config';
import {
  extractJsonObject,
  extractJsonArray,
  extractJsonObjectWithDebug,
  extractJsonObjectSafe,
  extractJsonArraySafe,
} from './jsonExtractor';
import { saveErrorToFile, type ErrorDebugInfo } from '../utils/errorExport';
import { getAccessToken } from '../supabase';
import {
  ApiError,
  NetworkError,
  TimeoutError,
  AuthError,
  RateLimitError,
  ParseError,
  type Result,
  Ok,
  Err,
  type AuraError,
} from '../errors';

// Content types for API messages
export interface TextContent {
  type: 'text';
  text: string;
}

export interface ImageContent {
  type: 'image';
  source: {
    type: 'base64';
    media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
    data: string;
  };
}

export type MessageContent = TextContent | ImageContent;

export interface AnthropicRequestOptions {
  messages: MessageContent[];
  maxTokens: number;
  signal?: AbortSignal;      // For cancellation
  timeout?: number;          // Custom timeout in ms
  retries?: number;          // Number of retry attempts (default: 2)
  onRetry?: (attempt: number, error: Error) => void;  // Callback for retry notifications
}

interface AnthropicResponse {
  content: Array<{ type: string; text: string }>;
}

/**
 * Check if an error is retryable (network issues, timeouts, 5xx errors, truncated responses)
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    // Retry on timeout, network errors, 5xx server errors, and truncated responses
    if (message.includes('timeout') ||
        message.includes('network') ||
        message.includes('fetch failed') ||
        message.includes('500') ||
        message.includes('502') ||
        message.includes('503') ||
        message.includes('504') ||
        message.includes('truncated')) {
      return true;
    }
  }
  return false;
}

/**
 * Check if an error is a user-initiated abort (should not retry)
 */
function isAbortError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.name === 'AbortError' ||
           error.message.includes('aborted') ||
           error.message.includes('user aborted');
  }
  return false;
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create an AbortSignal that times out after the specified duration.
 */
function createTimeoutSignal(timeoutMs: number, existingSignal?: AbortSignal): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort(new Error(`Request timed out after ${timeoutMs}ms`));
  }, timeoutMs);

  // If there's an existing signal, abort when it aborts
  if (existingSignal) {
    if (existingSignal.aborted) {
      controller.abort(existingSignal.reason);
    } else {
      existingSignal.addEventListener('abort', () => {
        controller.abort(existingSignal.reason);
      });
    }
  }

  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timeoutId),
  };
}

/**
 * Make a request to the Anthropic API and return the raw text response.
 */
async function makeRequest(options: AnthropicRequestOptions, operationName?: string): Promise<string> {
  const timeout = options.timeout ?? TIMEOUTS.DEFAULT;
  const usingProxy = isUsingProxy();

  // Create timeout signal, combining with any user-provided signal
  const { signal, cleanup } = createTimeoutSignal(timeout, options.signal);

  // Build headers based on whether we're using proxy or direct API
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };

  if (usingProxy) {
    // Proxy mode: Edge Function adds API key and version headers
    // Send user's JWT token for authentication (requires user to be logged in)
    console.log('Proxy mode: fetching access token...');
    const accessToken = await getAccessToken();
    console.log('Access token:', accessToken ? `${accessToken.substring(0, 20)}...` : 'NULL');
    if (!accessToken) {
      console.error('No access token available - user may not be logged in');
      throw new Error('Authentication required. Please sign in to analyze profiles.');
    }
    headers['Authorization'] = `Bearer ${accessToken}`;
  } else {
    // Direct mode: include all Anthropic-required headers
    headers['x-api-key'] = getApiKey();
    headers['anthropic-version'] = ANTHROPIC_CONFIG.API_VERSION;
    headers['anthropic-dangerous-direct-browser-access'] = 'true';
  }

  try {
    const response = await fetch(ANTHROPIC_CONFIG.API_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: ANTHROPIC_CONFIG.MODEL,
        max_tokens: options.maxTokens,
        messages: [
          {
            role: 'user',
            content: options.messages,
          },
        ],
      }),
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error:', errorData);

      // Auto-save error info for debugging
      const debugInfo: ErrorDebugInfo = {
        timestamp: new Date().toISOString(),
        operation: operationName || 'makeRequest',
        inputSummary: {
          maxTokens: options.maxTokens,
          messageCount: options.messages.length,
          messageTypes: options.messages.map(m => m.type),
        },
        apiError: {
          status: response.status,
          message: errorData.error?.message || response.statusText,
        },
      };
      saveErrorToFile(debugInfo);

      throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data: AnthropicResponse = await response.json();

    if (!data.content || !data.content[0] || !data.content[0].text) {
      // Auto-save error info for debugging
      const debugInfo: ErrorDebugInfo = {
        timestamp: new Date().toISOString(),
        operation: operationName || 'makeRequest',
        inputSummary: {
          maxTokens: options.maxTokens,
          messageCount: options.messages.length,
        },
        rawResponse: JSON.stringify(data).substring(0, 2000),
        parseError: 'API returned unexpected response structure',
      };
      saveErrorToFile(debugInfo);

      throw new Error('API returned unexpected response structure');
    }

    return data.content[0].text;
  } finally {
    cleanup();
  }
}

/**
 * Make a request with automatic retry on transient failures.
 * Exponential backoff: 1s, 3s delays between retries.
 */
async function makeRequestWithRetry(
  options: AnthropicRequestOptions,
  operationName?: string
): Promise<string> {
  const maxRetries = options.retries ?? 2;
  const backoffDelays = [1000, 3000]; // 1s, 3s

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await makeRequest(options, operationName);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry user aborts
      if (isAbortError(error)) {
        throw error;
      }

      // Don't retry 4xx client errors (except rate limits which are 429)
      if (lastError.message.includes('API Error: 4') && !lastError.message.includes('429')) {
        throw error;
      }

      // Check if we should retry
      const isLastAttempt = attempt === maxRetries;
      if (isLastAttempt || !isRetryableError(error)) {
        throw error;
      }

      // Notify about retry
      const nextAttempt = attempt + 1;
      console.log(`Request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${backoffDelays[attempt]}ms...`);

      if (options.onRetry) {
        options.onRetry(nextAttempt, lastError);
      }

      // Wait before retry
      await sleep(backoffDelays[attempt] || backoffDelays[backoffDelays.length - 1]);
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError || new Error('Request failed after retries');
}

/**
 * Call Anthropic API and return raw text response (no JSON parsing).
 */
export async function callAnthropicForText(options: AnthropicRequestOptions): Promise<string> {
  const rawText = await makeRequestWithRetry(options);
  console.log('AI Raw Text Response:', rawText.substring(0, 500) + '...');
  return rawText;
}

/**
 * Call Anthropic API and parse response as JSON object.
 */
export async function callAnthropicForObject<T>(options: AnthropicRequestOptions): Promise<T> {
  const rawText = await makeRequestWithRetry(options);
  console.log('AI Raw Response:', rawText);
  return extractJsonObject<T>(rawText);
}

/**
 * Call Anthropic API and parse response as JSON array.
 */
export async function callAnthropicForArray<T>(options: AnthropicRequestOptions): Promise<T[]> {
  const rawText = await makeRequestWithRetry(options);
  console.log('AI Raw Response:', rawText);
  return extractJsonArray<T>(rawText);
}

/**
 * Call Anthropic API and parse response as JSON array, returning empty array on failure.
 */
export async function callAnthropicForArraySafe<T>(options: AnthropicRequestOptions): Promise<T[]> {
  try {
    return await callAnthropicForArray<T>(options);
  } catch (error) {
    console.error('API call failed, returning empty array:', error);
    return [];
  }
}

/**
 * Call Anthropic API with detailed debug info saved on failure.
 * Used for complex operations that need debugging capabilities.
 */
export async function callAnthropicWithDebug<T>(
  options: AnthropicRequestOptions,
  debugInfo: Record<string, unknown>
): Promise<T> {
  const timeout = options.timeout ?? TIMEOUTS.DEFAULT;
  const usingProxy = isUsingProxy();

  debugInfo.timestamp = new Date().toISOString();

  // Create timeout signal, combining with any user-provided signal
  const { signal, cleanup } = createTimeoutSignal(timeout, options.signal);

  // Build headers based on whether we're using proxy or direct API
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };

  if (usingProxy) {
    // Proxy mode: Edge Function adds API key and version headers
    // Send user's JWT token for authentication (requires user to be logged in)
    const accessToken = await getAccessToken();
    if (!accessToken) {
      cleanup();
      throw new Error('Authentication required. Please sign in to analyze profiles.');
    }
    headers['Authorization'] = `Bearer ${accessToken}`;
  } else {
    // Direct mode: include all Anthropic-required headers
    headers['x-api-key'] = getApiKey();
    headers['anthropic-version'] = ANTHROPIC_CONFIG.API_VERSION;
    headers['anthropic-dangerous-direct-browser-access'] = 'true';
  }

  let response: Response;
  try {
    response = await fetch(ANTHROPIC_CONFIG.API_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: ANTHROPIC_CONFIG.MODEL,
        max_tokens: options.maxTokens,
        messages: [
          {
            role: 'user',
            content: options.messages,
          },
        ],
      }),
      signal,
    });
  } catch (error) {
    cleanup();
    throw error;
  }

  cleanup();
  debugInfo.responseStatus = response.status;
  debugInfo.responseOk = response.ok;

  if (!response.ok) {
    const errorData = await response.json();
    debugInfo.errorData = errorData;
    localStorage.setItem('aura_debug_info', JSON.stringify(debugInfo, null, 2));

    // Auto-save error file for debugging
    saveErrorToFile({
      timestamp: new Date().toISOString(),
      operation: (debugInfo.operation as string) || 'callAnthropicWithDebug',
      inputSummary: debugInfo,
      apiError: {
        status: response.status,
        message: errorData.error?.message || response.statusText,
      },
    });

    throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
  }

  const data: AnthropicResponse = await response.json();
  debugInfo.hasContent = !!data.content;
  debugInfo.contentLength = data.content?.length;

  if (!data.content || !data.content[0] || !data.content[0].text) {
    debugInfo.fullResponse = data;
    localStorage.setItem('aura_debug_info', JSON.stringify(debugInfo, null, 2));

    // Auto-save error file for debugging
    saveErrorToFile({
      timestamp: new Date().toISOString(),
      operation: (debugInfo.operation as string) || 'callAnthropicWithDebug',
      inputSummary: debugInfo,
      rawResponse: JSON.stringify(data).substring(0, 2000),
      parseError: 'API returned unexpected response structure',
    });

    throw new Error('API returned unexpected response structure');
  }

  const rawText = data.content[0].text;
  debugInfo.rawTextLength = rawText.length;
  debugInfo.rawTextPreview = rawText.substring(0, 2000);

  return extractJsonObjectWithDebug<T>(rawText, debugInfo);
}

/**
 * Helper to create text content
 */
export function textContent(text: string): TextContent {
  return { type: 'text', text };
}

/**
 * Helper to create image content from a base64 data URL or raw base64 string
 */
export function imageContent(
  base64Data: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg'
): ImageContent {
  // Handle both raw base64 and data URL formats
  const data = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
  return {
    type: 'image',
    source: {
      type: 'base64',
      media_type: mediaType,
      data,
    },
  };
}

// ============================================
// Safe variants that return Result<T, AuraError>
// ============================================

/**
 * Converts a caught error to an appropriate AuraError type.
 */
function toAuraError(error: unknown, operationName?: string): AuraError {
  if (error instanceof ApiError || error instanceof NetworkError ||
      error instanceof TimeoutError || error instanceof AuthError ||
      error instanceof RateLimitError || error instanceof ParseError) {
    return error;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Check for abort/cancellation
    if (error.name === 'AbortError' || message.includes('aborted')) {
      return new ApiError('Request was cancelled', {
        context: { operation: operationName },
        cause: error,
      });
    }

    // Check for timeout
    if (message.includes('timeout')) {
      return new TimeoutError(TIMEOUTS.DEFAULT, { cause: error });
    }

    // Check for network errors
    if (message.includes('network') || message.includes('fetch failed') ||
        message.includes('failed to fetch')) {
      return new NetworkError(error.message, { cause: error });
    }

    // Check for auth errors
    if (message.includes('authentication required') || message.includes('sign in')) {
      return new AuthError('missing', { cause: error });
    }

    // Check for rate limits
    if (message.includes('429') || message.includes('rate limit') ||
        message.includes('too many requests')) {
      return new RateLimitError({ cause: error });
    }

    // Check for truncated responses (retryable parse errors)
    if (message.includes('truncated')) {
      return new ParseError('truncated', {
        message: error.message,
        cause: error,
      });
    }

    // Check for specific HTTP status codes
    const statusMatch = message.match(/api error:?\s*(\d{3})/i);
    if (statusMatch) {
      const statusCode = parseInt(statusMatch[1], 10);
      return new ApiError(error.message, { statusCode, cause: error });
    }

    // Generic API error
    return new ApiError(error.message, {
      context: { operation: operationName },
      cause: error,
    });
  }

  return new ApiError(String(error), {
    context: { operation: operationName },
  });
}

/**
 * Make a request with retry, returning a Result instead of throwing.
 */
async function makeRequestWithRetrySafe(
  options: AnthropicRequestOptions,
  operationName?: string
): Promise<Result<string, AuraError>> {
  const maxRetries = options.retries ?? 2;
  const backoffDelays = [1000, 3000];

  let lastError: AuraError | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await makeRequest(options, operationName);
      return Ok(result);
    } catch (error) {
      lastError = toAuraError(error, operationName);

      // Don't retry user aborts
      if (isAbortError(error)) {
        return Err(lastError);
      }

      // Don't retry 4xx client errors (except rate limits)
      if (lastError instanceof ApiError && lastError.statusCode &&
          lastError.statusCode >= 400 && lastError.statusCode < 500 &&
          lastError.statusCode !== 429) {
        return Err(lastError);
      }

      // Check if we should retry
      const isLastAttempt = attempt === maxRetries;
      if (isLastAttempt || !lastError.retryable) {
        return Err(lastError);
      }

      // Notify about retry
      const nextAttempt = attempt + 1;
      console.log(`Request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${backoffDelays[attempt]}ms...`);

      if (options.onRetry) {
        options.onRetry(nextAttempt, lastError);
      }

      // Wait before retry
      await sleep(backoffDelays[attempt] || backoffDelays[backoffDelays.length - 1]);
    }
  }

  return Err(lastError || new ApiError('Request failed after retries'));
}

/**
 * Call Anthropic API and parse response as JSON object.
 * Returns a Result instead of throwing.
 *
 * @example
 * ```typescript
 * const result = await callAnthropicForObjectSafe<Profile>(options);
 * if (result.ok) {
 *   console.log(result.value);
 * } else {
 *   showError(result.error);
 * }
 * ```
 */
export async function callAnthropicForObjectSafe<T>(
  options: AnthropicRequestOptions
): Promise<Result<T, ApiError | ParseError>> {
  const requestResult = await makeRequestWithRetrySafe(options, 'callAnthropicForObjectSafe');

  if (!requestResult.ok) {
    return requestResult as Result<T, ApiError>;
  }

  const rawText = requestResult.value;
  console.log('AI Raw Response:', rawText);

  return extractJsonObjectSafe<T>(rawText);
}

/**
 * Call Anthropic API and parse response as JSON array.
 * Returns a Result instead of throwing.
 */
export async function callAnthropicForArrayResultSafe<T>(
  options: AnthropicRequestOptions
): Promise<Result<T[], ApiError | ParseError>> {
  const requestResult = await makeRequestWithRetrySafe(options, 'callAnthropicForArrayResultSafe');

  if (!requestResult.ok) {
    return requestResult as Result<T[], ApiError>;
  }

  const rawText = requestResult.value;
  console.log('AI Raw Response:', rawText);

  return extractJsonArraySafe<T>(rawText);
}

/**
 * Call Anthropic API and return raw text response.
 * Returns a Result instead of throwing.
 */
export async function callAnthropicForTextSafe(
  options: AnthropicRequestOptions
): Promise<Result<string, AuraError>> {
  const result = await makeRequestWithRetrySafe(options, 'callAnthropicForTextSafe');

  if (result.ok) {
    console.log('AI Raw Text Response:', result.value.substring(0, 500) + '...');
  }

  return result;
}
