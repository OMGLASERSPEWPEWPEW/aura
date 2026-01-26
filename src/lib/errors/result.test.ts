// src/lib/errors/result.test.ts
import { describe, it, expect, vi } from 'vitest';
import {
  Ok,
  Err,
  isOk,
  isErr,
  unwrapOr,
  unwrapOrElse,
  unwrapOrThrow,
  map,
  mapErr,
  andThen,
  tryCatch,
  tryCatchSync,
  all,
  partition,
  type Result,
} from './result';
import { ValidationError } from './validation';
import { ApiError } from './api';

// Helper to create test errors
function createTestError(message: string = 'Test error'): ValidationError {
  return new ValidationError(message);
}

describe('Result utilities', () => {
  // ==================== Ok and Err constructors ====================
  describe('Ok and Err constructors', () => {
    it('Ok should create success result', () => {
      const result = Ok(42);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(42);
      }
    });

    it('Ok should handle null values', () => {
      const result = Ok(null);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(null);
      }
    });

    it('Ok should handle undefined values', () => {
      const result = Ok(undefined);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(undefined);
      }
    });

    it('Ok should handle complex objects', () => {
      const data = { name: 'test', nested: { value: [1, 2, 3] } };
      const result = Ok(data);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(data);
      }
    });

    it('Err should create failure result', () => {
      const error = createTestError('Something went wrong');
      const result = Err(error);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe(error);
        expect(result.error.message).toBe('Something went wrong');
      }
    });
  });

  // ==================== isOk and isErr type guards ====================
  describe('isOk and isErr type guards', () => {
    it('isOk should return true for Ok result', () => {
      const result = Ok('success');
      expect(isOk(result)).toBe(true);
    });

    it('isOk should return false for Err result', () => {
      const result = Err(createTestError());
      expect(isOk(result)).toBe(false);
    });

    it('isErr should return true for Err result', () => {
      const result = Err(createTestError());
      expect(isErr(result)).toBe(true);
    });

    it('isErr should return false for Ok result', () => {
      const result = Ok('success');
      expect(isErr(result)).toBe(false);
    });

    it('type guards should narrow types correctly', () => {
      const result: Result<number, ValidationError> = Ok(42);

      if (isOk(result)) {
        // TypeScript should know result.value is number
        const num: number = result.value;
        expect(num).toBe(42);
      }

      const errResult: Result<number, ValidationError> = Err(createTestError());

      if (isErr(errResult)) {
        // TypeScript should know result.error is ValidationError
        const err: ValidationError = errResult.error;
        expect(err).toBeInstanceOf(ValidationError);
      }
    });
  });

  // ==================== unwrapOr ====================
  describe('unwrapOr', () => {
    it('should return value for Ok result', () => {
      const result = Ok(42);
      expect(unwrapOr(result, 0)).toBe(42);
    });

    it('should return default for Err result', () => {
      const result = Err(createTestError());
      expect(unwrapOr(result, 0)).toBe(0);
    });

    it('should handle complex default values', () => {
      const defaultValue = { fallback: true };
      const result: Result<{ fallback: boolean }, ValidationError> = Err(createTestError());
      expect(unwrapOr(result, defaultValue)).toEqual(defaultValue);
    });
  });

  // ==================== unwrapOrElse ====================
  describe('unwrapOrElse', () => {
    it('should return value for Ok result without calling fn', () => {
      const fn = vi.fn(() => 0);
      const result = Ok(42);
      expect(unwrapOrElse(result, fn)).toBe(42);
      expect(fn).not.toHaveBeenCalled();
    });

    it('should call fn and return result for Err', () => {
      const fn = vi.fn((error: ValidationError) => error.message.length);
      const error = createTestError('error');
      const result = Err(error);
      expect(unwrapOrElse(result, fn)).toBe(5);
      expect(fn).toHaveBeenCalledWith(error);
    });

    it('should pass error to the function', () => {
      const fn = vi.fn((error: ValidationError) => `Fallback: ${error.message}`);
      const result = Err(createTestError('original'));
      expect(unwrapOrElse(result, fn)).toBe('Fallback: original');
    });
  });

  // ==================== unwrapOrThrow ====================
  describe('unwrapOrThrow', () => {
    it('should return value for Ok result', () => {
      const result = Ok(42);
      expect(unwrapOrThrow(result)).toBe(42);
    });

    it('should throw error for Err result', () => {
      const error = createTestError('Test error');
      const result = Err(error);
      expect(() => unwrapOrThrow(result)).toThrow(error);
    });

    it('should throw the actual error instance', () => {
      const error = createTestError('Specific error');
      const result = Err(error);
      try {
        unwrapOrThrow(result);
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBe(error);
      }
    });
  });

  // ==================== map ====================
  describe('map', () => {
    it('should transform value for Ok result', () => {
      const result = Ok(5);
      const mapped = map(result, (x) => x * 2);
      expect(isOk(mapped)).toBe(true);
      if (isOk(mapped)) {
        expect(mapped.value).toBe(10);
      }
    });

    it('should preserve error for Err result', () => {
      const error = createTestError();
      const result: Result<number, ValidationError> = Err(error);
      const mapped = map(result, (x) => x * 2);
      expect(isErr(mapped)).toBe(true);
      if (isErr(mapped)) {
        expect(mapped.error).toBe(error);
      }
    });

    it('should support type transformation', () => {
      const result = Ok(42);
      const mapped = map(result, (x) => x.toString());
      if (isOk(mapped)) {
        expect(mapped.value).toBe('42');
      }
    });

    it('should not call mapper function for Err', () => {
      const mapper = vi.fn((x: number) => x * 2);
      const result: Result<number, ValidationError> = Err(createTestError());
      map(result, mapper);
      expect(mapper).not.toHaveBeenCalled();
    });
  });

  // ==================== mapErr ====================
  describe('mapErr', () => {
    it('should preserve value for Ok result', () => {
      const result: Result<number, ValidationError> = Ok(42);
      const mapped = mapErr(result, () => new ApiError('mapped'));
      expect(isOk(mapped)).toBe(true);
      if (isOk(mapped)) {
        expect(mapped.value).toBe(42);
      }
    });

    it('should transform error for Err result', () => {
      const result: Result<number, ValidationError> = Err(createTestError('original'));
      const mapped = mapErr(result, (err) => new ApiError(err.message, { statusCode: 500 }));
      expect(isErr(mapped)).toBe(true);
      if (isErr(mapped)) {
        expect(mapped.error).toBeInstanceOf(ApiError);
        expect(mapped.error.message).toBe('original');
      }
    });

    it('should not call mapper function for Ok', () => {
      const mapper = vi.fn(() => new ApiError('mapped'));
      const result: Result<number, ValidationError> = Ok(42);
      mapErr(result, mapper);
      expect(mapper).not.toHaveBeenCalled();
    });
  });

  // ==================== andThen ====================
  describe('andThen', () => {
    it('should chain operations on Ok', () => {
      const result = Ok(5);
      const chained = andThen(result, (x) => Ok(x * 2));
      expect(isOk(chained)).toBe(true);
      if (isOk(chained)) {
        expect(chained.value).toBe(10);
      }
    });

    it('should short-circuit on first Err', () => {
      const error = createTestError();
      const result: Result<number, ValidationError> = Err(error);
      const fn = vi.fn((x: number) => Ok(x * 2));
      const chained = andThen(result, fn);
      expect(isErr(chained)).toBe(true);
      expect(fn).not.toHaveBeenCalled();
    });

    it('should propagate Err from chained function', () => {
      const result = Ok(5);
      const error = createTestError('from chain');
      const chained = andThen(result, () => Err(error));
      expect(isErr(chained)).toBe(true);
      if (isErr(chained)) {
        expect(chained.error).toBe(error);
      }
    });

    it('should support multiple chains', () => {
      const result = Ok(2);
      const step1 = andThen(result, (x) => Ok(x + 3)); // 5
      const step2 = andThen(step1, (x) => Ok(x * 2)); // 10
      const step3 = andThen(step2, (x) => Ok(x.toString())); // "10"
      if (isOk(step3)) {
        expect(step3.value).toBe('10');
      }
    });
  });

  // ==================== tryCatch ====================
  describe('tryCatch', () => {
    it('should return Ok for resolved promise', async () => {
      const result = await tryCatch(
        () => Promise.resolve(42),
        () => createTestError()
      );
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toBe(42);
      }
    });

    it('should return Err for rejected promise', async () => {
      const result = await tryCatch(
        () => Promise.reject(new Error('failed')),
        (e) => createTestError((e as Error).message)
      );
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.message).toBe('failed');
      }
    });

    it('should call errorMapper on rejection', async () => {
      const errorMapper = vi.fn((e: unknown) => createTestError((e as Error).message));
      await tryCatch(() => Promise.reject(new Error('test')), errorMapper);
      expect(errorMapper).toHaveBeenCalled();
    });

    it('should handle non-Error rejections', async () => {
      const result = await tryCatch(
        () => Promise.reject('string error'),
        (e) => createTestError(String(e))
      );
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.message).toBe('string error');
      }
    });

    it('should handle async functions that throw', async () => {
      const result = await tryCatch(
        async () => {
          throw new Error('async throw');
        },
        (e) => createTestError((e as Error).message)
      );
      expect(isErr(result)).toBe(true);
    });
  });

  // ==================== tryCatchSync ====================
  describe('tryCatchSync', () => {
    it('should return Ok for successful function', () => {
      const result = tryCatchSync(
        () => 42,
        () => createTestError()
      );
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toBe(42);
      }
    });

    it('should return Err for throwing function', () => {
      const result = tryCatchSync(
        () => {
          throw new Error('sync error');
        },
        (e) => createTestError((e as Error).message)
      );
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.message).toBe('sync error');
      }
    });

    it('should call errorMapper on throw', () => {
      const errorMapper = vi.fn((e: unknown) => createTestError((e as Error).message));
      tryCatchSync(() => {
        throw new Error('test');
      }, errorMapper);
      expect(errorMapper).toHaveBeenCalled();
    });

    it('should handle non-Error throws', () => {
      const result = tryCatchSync(
        () => {
          throw 'string throw';
        },
        (e) => createTestError(String(e))
      );
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.message).toBe('string throw');
      }
    });
  });

  // ==================== all ====================
  describe('all', () => {
    it('should return Ok with all values if all succeed', () => {
      const results = [Ok(1), Ok(2), Ok(3)];
      const combined = all(results);
      expect(isOk(combined)).toBe(true);
      if (isOk(combined)) {
        expect(combined.value).toEqual([1, 2, 3]);
      }
    });

    it('should return first Err if any fail', () => {
      const error1 = createTestError('first error');
      const error2 = createTestError('second error');
      const results: Result<number, ValidationError>[] = [Ok(1), Err(error1), Err(error2)];
      const combined = all(results);
      expect(isErr(combined)).toBe(true);
      if (isErr(combined)) {
        expect(combined.error).toBe(error1);
      }
    });

    it('should return Ok with empty array for empty input', () => {
      const results: Result<number, ValidationError>[] = [];
      const combined = all(results);
      expect(isOk(combined)).toBe(true);
      if (isOk(combined)) {
        expect(combined.value).toEqual([]);
      }
    });

    it('should short-circuit on first error', () => {
      const error = createTestError('early error');
      const results: Result<number, ValidationError>[] = [Err(error), Ok(2), Ok(3)];
      const combined = all(results);
      expect(isErr(combined)).toBe(true);
      if (isErr(combined)) {
        expect(combined.error).toBe(error);
      }
    });
  });

  // ==================== partition ====================
  describe('partition', () => {
    it('should separate values and errors', () => {
      const error1 = createTestError('error1');
      const error2 = createTestError('error2');
      const results: Result<number, ValidationError>[] = [
        Ok(1),
        Err(error1),
        Ok(2),
        Err(error2),
        Ok(3),
      ];
      const { values, errors } = partition(results);
      expect(values).toEqual([1, 2, 3]);
      expect(errors).toHaveLength(2);
      expect(errors[0]).toBe(error1);
      expect(errors[1]).toBe(error2);
    });

    it('should handle all successes', () => {
      const results = [Ok(1), Ok(2), Ok(3)];
      const { values, errors } = partition(results);
      expect(values).toEqual([1, 2, 3]);
      expect(errors).toEqual([]);
    });

    it('should handle all failures', () => {
      const error1 = createTestError('e1');
      const error2 = createTestError('e2');
      const results: Result<number, ValidationError>[] = [Err(error1), Err(error2)];
      const { values, errors } = partition(results);
      expect(values).toEqual([]);
      expect(errors).toHaveLength(2);
    });

    it('should handle empty array', () => {
      const results: Result<number, ValidationError>[] = [];
      const { values, errors } = partition(results);
      expect(values).toEqual([]);
      expect(errors).toEqual([]);
    });

    it('should preserve order', () => {
      const e1 = createTestError('e1');
      const e2 = createTestError('e2');
      const results: Result<number, ValidationError>[] = [Ok(1), Err(e1), Ok(2), Err(e2), Ok(3)];
      const { values, errors } = partition(results);
      expect(values).toEqual([1, 2, 3]);
      expect(errors[0].message).toBe('e1');
      expect(errors[1].message).toBe('e2');
    });
  });
});
