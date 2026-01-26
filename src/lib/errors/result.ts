// src/lib/errors/result.ts
// Result type and utilities for explicit error handling

import type { AuraError } from './base';

/**
 * Result type for operations that can fail.
 * Inspired by Rust's Result type - makes error handling explicit.
 *
 * @example
 * ```typescript
 * async function fetchProfile(id: string): Promise<Result<Profile, ApiError>> {
 *   try {
 *     const profile = await api.getProfile(id);
 *     return Ok(profile);
 *   } catch (error) {
 *     return Err(new ApiError(error.message));
 *   }
 * }
 *
 * const result = await fetchProfile('123');
 * if (result.ok) {
 *   console.log(result.value.name);
 * } else {
 *   console.error(result.error.getUserMessage());
 * }
 * ```
 */
export type Result<T, E extends AuraError = AuraError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

/**
 * Creates a successful Result
 */
export function Ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/**
 * Creates a failed Result
 */
export function Err<E extends AuraError>(error: E): Result<never, E> {
  return { ok: false, error };
}

/**
 * Type guard for successful results
 */
export function isOk<T, E extends AuraError>(
  result: Result<T, E>
): result is { ok: true; value: T } {
  return result.ok;
}

/**
 * Type guard for failed results
 */
export function isErr<T, E extends AuraError>(
  result: Result<T, E>
): result is { ok: false; error: E } {
  return !result.ok;
}

/**
 * Unwraps a Result, returning the value or a default if it failed
 */
export function unwrapOr<T, E extends AuraError>(
  result: Result<T, E>,
  defaultValue: T
): T {
  return result.ok ? result.value : defaultValue;
}

/**
 * Unwraps a Result, returning the value or calling a function to get a default
 */
export function unwrapOrElse<T, E extends AuraError>(
  result: Result<T, E>,
  fn: (error: E) => T
): T {
  return result.ok ? result.value : fn(result.error);
}

/**
 * Unwraps a Result, throwing the error if it failed
 */
export function unwrapOrThrow<T, E extends AuraError>(result: Result<T, E>): T {
  if (result.ok) {
    return result.value;
  }
  throw result.error;
}

/**
 * Maps a Result's value using a function
 */
export function map<T, U, E extends AuraError>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  if (result.ok) {
    return Ok(fn(result.value));
  }
  return result;
}

/**
 * Maps a Result's error using a function
 */
export function mapErr<T, E extends AuraError, F extends AuraError>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> {
  if (!result.ok) {
    return Err(fn(result.error));
  }
  return result;
}

/**
 * Chains Result operations (flatMap)
 */
export function andThen<T, U, E extends AuraError>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  if (result.ok) {
    return fn(result.value);
  }
  return result;
}

/**
 * Wraps a Promise in a Result, catching any thrown errors
 *
 * @example
 * ```typescript
 * const result = await tryCatch(
 *   () => api.getProfile(id),
 *   (error) => new ApiError(error.message)
 * );
 * ```
 */
export async function tryCatch<T, E extends AuraError>(
  fn: () => Promise<T>,
  errorMapper: (error: unknown) => E
): Promise<Result<T, E>> {
  try {
    const value = await fn();
    return Ok(value);
  } catch (error) {
    return Err(errorMapper(error));
  }
}

/**
 * Wraps a synchronous function in a Result, catching any thrown errors
 */
export function tryCatchSync<T, E extends AuraError>(
  fn: () => T,
  errorMapper: (error: unknown) => E
): Result<T, E> {
  try {
    const value = fn();
    return Ok(value);
  } catch (error) {
    return Err(errorMapper(error));
  }
}

/**
 * Combines multiple Results into a single Result with an array of values.
 * If any Result fails, returns the first error.
 */
export function all<T, E extends AuraError>(
  results: Result<T, E>[]
): Result<T[], E> {
  const values: T[] = [];
  for (const result of results) {
    if (!result.ok) {
      return result;
    }
    values.push(result.value);
  }
  return Ok(values);
}

/**
 * Combines multiple Results, keeping all successful values and all errors.
 * Useful when you want partial success.
 */
export function partition<T, E extends AuraError>(
  results: Result<T, E>[]
): { values: T[]; errors: E[] } {
  const values: T[] = [];
  const errors: E[] = [];

  for (const result of results) {
    if (result.ok) {
      values.push(result.value);
    } else {
      errors.push(result.error);
    }
  }

  return { values, errors };
}
