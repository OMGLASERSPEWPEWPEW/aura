// src/lib/errors/errors.test.ts
import { describe, it, expect } from 'vitest';
import { AuraError } from './base';
import {
  ApiError,
  NetworkError,
  TimeoutError,
  AuthError,
  RateLimitError,
} from './api';
import {
  SyncError,
  ConflictError,
  StorageError,
  QuotaExceededError,
  OfflineError,
  ImageSyncError,
} from './sync';
import {
  ValidationError,
  ParseError,
  SchemaError,
  FileValidationError,
} from './validation';
import {
  FrameExtractionError,
  VideoFormatError,
  ChunkAnalysisError,
  ImageProcessingError,
} from './media';

describe('Error Classes', () => {
  // ==================== AuraError.from() ====================
  describe('AuraError.from()', () => {
    it('should return existing AuraError unchanged', () => {
      const original = new ApiError('test');
      const result = AuraError.from(original, 'FALLBACK', 'api');
      expect(result).toBe(original);
    });

    it('should wrap Error in WrappedError', () => {
      const original = new Error('native error');
      const result = AuraError.from(original, 'WRAPPED', 'api');
      expect(result).not.toBe(original);
      expect(result.message).toBe('native error');
      expect(result.code).toBe('WRAPPED');
      expect(result.category).toBe('api');
      expect(result.cause).toBe(original);
    });

    it('should wrap string in WrappedError', () => {
      const result = AuraError.from('string error', 'STRING_ERR', 'validation');
      expect(result.message).toBe('string error');
      expect(result.code).toBe('STRING_ERR');
      expect(result.category).toBe('validation');
    });

    it('should wrap non-Error objects in WrappedError', () => {
      const result = AuraError.from({ custom: 'object' }, 'OBJECT_ERR', 'sync');
      expect(result.message).toBe('[object Object]');
      expect(result.code).toBe('OBJECT_ERR');
      expect(result.category).toBe('sync');
    });

    it('should wrap null in WrappedError', () => {
      const result = AuraError.from(null, 'NULL_ERR', 'api');
      expect(result.message).toBe('null');
      expect(result.code).toBe('NULL_ERR');
    });

    it('should wrap undefined in WrappedError', () => {
      const result = AuraError.from(undefined, 'UNDEF_ERR', 'api');
      expect(result.message).toBe('undefined');
    });

    it('wrapped error should have generic getUserMessage', () => {
      const result = AuraError.from('test', 'TEST', 'api');
      expect(result.getUserMessage()).toBe('An unexpected error occurred. Please try again.');
    });
  });

  // ==================== ApiError ====================
  describe('ApiError', () => {
    it('should set retryable=true for 5xx status codes', () => {
      const error500 = new ApiError('Server error', { statusCode: 500 });
      const error502 = new ApiError('Bad gateway', { statusCode: 502 });
      const error503 = new ApiError('Service unavailable', { statusCode: 503 });

      expect(error500.retryable).toBe(true);
      expect(error502.retryable).toBe(true);
      expect(error503.retryable).toBe(true);
    });

    it('should set retryable=false for 4xx status codes', () => {
      const error400 = new ApiError('Bad request', { statusCode: 400 });
      const error401 = new ApiError('Unauthorized', { statusCode: 401 });
      const error404 = new ApiError('Not found', { statusCode: 404 });

      expect(error400.retryable).toBe(false);
      expect(error401.retryable).toBe(false);
      expect(error404.retryable).toBe(false);
    });

    it('should set retryable=true for 429', () => {
      const error = new ApiError('Rate limited', { statusCode: 429 });
      expect(error.retryable).toBe(true);
    });

    it('should respect explicit retryable option', () => {
      const error = new ApiError('Forced retryable', { statusCode: 400, retryable: true });
      expect(error.retryable).toBe(true);

      const error2 = new ApiError('Forced non-retryable', { statusCode: 500, retryable: false });
      expect(error2.retryable).toBe(false);
    });

    it('should return correct user message for 401', () => {
      const error = new ApiError('Unauthorized', { statusCode: 401 });
      expect(error.getUserMessage()).toBe('Your session has expired. Please sign in again.');
    });

    it('should return correct user message for 403', () => {
      const error = new ApiError('Forbidden', { statusCode: 403 });
      expect(error.getUserMessage()).toBe('You do not have permission to perform this action.');
    });

    it('should return correct user message for 429', () => {
      const error = new ApiError('Too many requests', { statusCode: 429 });
      expect(error.getUserMessage()).toBe('Too many requests. Please wait a moment and try again.');
    });

    it('should return correct user message for 500+', () => {
      const error = new ApiError('Server error', { statusCode: 500 });
      expect(error.getUserMessage()).toBe('The server is temporarily unavailable. Please try again.');
    });

    it('should return generic message for other codes', () => {
      const error = new ApiError('Not found', { statusCode: 404 });
      expect(error.getUserMessage()).toBe('Failed to communicate with the server. Please try again.');
    });

    it('should return hint for 401', () => {
      const error = new ApiError('Unauthorized', { statusCode: 401 });
      expect(error.getHint()).toBe('Click "Sign In" to re-authenticate');
    });

    it('should return hint for 429', () => {
      const error = new ApiError('Rate limited', { statusCode: 429 });
      expect(error.getHint()).toBe('Wait a few seconds before retrying');
    });

    it('should return undefined hint for other codes', () => {
      const error = new ApiError('Server error', { statusCode: 500 });
      expect(error.getHint()).toBeUndefined();
    });

    it('should have correct code and category', () => {
      const error = new ApiError('test');
      expect(error.code).toBe('API_ERROR');
      expect(error.category).toBe('api');
    });
  });

  // ==================== NetworkError ====================
  describe('NetworkError', () => {
    it('should always be retryable', () => {
      const error = new NetworkError();
      expect(error.retryable).toBe(true);
    });

    it('should have correct code and category', () => {
      const error = new NetworkError();
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.category).toBe('api');
    });

    it('should have default message', () => {
      const error = new NetworkError();
      expect(error.message).toBe('Network connection failed');
    });

    it('should accept custom message', () => {
      const error = new NetworkError('Custom network failure');
      expect(error.message).toBe('Custom network failure');
    });

    it('should return correct user message', () => {
      const error = new NetworkError();
      expect(error.getUserMessage()).toBe('Unable to connect. Please check your internet connection.');
    });

    it('should return hint', () => {
      const error = new NetworkError();
      expect(error.getHint()).toBe('Check your Wi-Fi or mobile data connection');
    });
  });

  // ==================== TimeoutError ====================
  describe('TimeoutError', () => {
    it('should store timeoutMs', () => {
      const error = new TimeoutError(5000);
      expect(error.timeoutMs).toBe(5000);
    });

    it('should format message with milliseconds', () => {
      const error = new TimeoutError(3000);
      expect(error.message).toBe('Request timed out after 3000ms');
    });

    it('should be retryable', () => {
      const error = new TimeoutError(5000);
      expect(error.retryable).toBe(true);
    });

    it('should have correct code and category', () => {
      const error = new TimeoutError(5000);
      expect(error.code).toBe('TIMEOUT_ERROR');
      expect(error.category).toBe('api');
    });

    it('should return user-friendly message', () => {
      const error = new TimeoutError(5000);
      expect(error.getUserMessage()).toBe('The request took too long. Please try again.');
    });
  });

  // ==================== AuthError ====================
  describe('AuthError', () => {
    it('should set correct message for each reason type', () => {
      const expired = new AuthError('expired');
      const invalid = new AuthError('invalid');
      const missing = new AuthError('missing');
      const unauthorized = new AuthError('unauthorized');

      expect(expired.message).toBe('Your session has expired');
      expect(invalid.message).toBe('Invalid authentication credentials');
      expect(missing.message).toBe('Authentication required');
      expect(unauthorized.message).toBe('You are not authorized to perform this action');
    });

    it('should accept custom message', () => {
      const error = new AuthError('expired', { message: 'Custom message' });
      expect(error.message).toBe('Custom message');
    });

    it('should be retryable only for expired', () => {
      const expired = new AuthError('expired');
      const invalid = new AuthError('invalid');
      const missing = new AuthError('missing');
      const unauthorized = new AuthError('unauthorized');

      expect(expired.retryable).toBe(true);
      expect(invalid.retryable).toBe(false);
      expect(missing.retryable).toBe(false);
      expect(unauthorized.retryable).toBe(false);
    });

    it('should have correct code and category', () => {
      const error = new AuthError('expired');
      expect(error.code).toBe('AUTH_ERROR');
      expect(error.category).toBe('auth');
    });

    it('should return correct user messages', () => {
      expect(new AuthError('expired').getUserMessage()).toBe('Your session has expired. Please sign in again.');
      expect(new AuthError('invalid').getUserMessage()).toBe('Invalid credentials. Please check and try again.');
      expect(new AuthError('missing').getUserMessage()).toBe('Please sign in to continue.');
      expect(new AuthError('unauthorized').getUserMessage()).toBe('You do not have permission to perform this action.');
    });

    it('should return hint for expired and missing', () => {
      const expired = new AuthError('expired');
      const missing = new AuthError('missing');
      const invalid = new AuthError('invalid');

      expect(expired.getHint()).toBe('Click "Sign In" to continue');
      expect(missing.getHint()).toBe('Click "Sign In" to continue');
      expect(invalid.getHint()).toBeUndefined();
    });
  });

  // ==================== RateLimitError ====================
  describe('RateLimitError', () => {
    it('should format retry time in seconds', () => {
      const error = new RateLimitError({ retryAfterMs: 5000 });
      expect(error.getUserMessage()).toBe('Too many requests. Please wait 5 seconds.');
    });

    it('should handle missing retryAfterMs', () => {
      const error = new RateLimitError();
      expect(error.getUserMessage()).toBe('Too many requests. Please wait a moment and try again.');
    });

    it('should round up seconds', () => {
      const error = new RateLimitError({ retryAfterMs: 2500 });
      expect(error.getUserMessage()).toBe('Too many requests. Please wait 3 seconds.');
    });

    it('should always be retryable', () => {
      const error = new RateLimitError();
      expect(error.retryable).toBe(true);
    });

    it('should have correct code and category', () => {
      const error = new RateLimitError();
      expect(error.code).toBe('RATE_LIMIT_ERROR');
      expect(error.category).toBe('api');
    });

    it('should accept custom message', () => {
      const error = new RateLimitError({ message: 'Custom rate limit' });
      expect(error.message).toBe('Custom rate limit');
    });
  });

  // ==================== SyncError ====================
  describe('SyncError', () => {
    it('should include operation in user message', () => {
      const pushError = new SyncError('Push failed', { operation: 'push' });
      const pullError = new SyncError('Pull failed', { operation: 'pull' });
      const deleteError = new SyncError('Delete failed', { operation: 'delete' });
      const updateError = new SyncError('Update failed', { operation: 'update' });

      expect(pushError.getUserMessage()).toContain('push');
      expect(pullError.getUserMessage()).toContain('pull');
      expect(deleteError.getUserMessage()).toContain('delete');
      expect(updateError.getUserMessage()).toContain('update');
    });

    it('should handle undefined operation', () => {
      const error = new SyncError('Generic sync error');
      expect(error.getUserMessage()).toBe('Sync failed. Your changes are saved locally and will sync when the connection is restored.');
    });

    it('should be retryable by default', () => {
      const error = new SyncError('test');
      expect(error.retryable).toBe(true);
    });

    it('should respect explicit retryable option', () => {
      const error = new SyncError('test', { retryable: false });
      expect(error.retryable).toBe(false);
    });

    it('should have correct code and category', () => {
      const error = new SyncError('test');
      expect(error.code).toBe('SYNC_ERROR');
      expect(error.category).toBe('sync');
    });
  });

  // ==================== ConflictError ====================
  describe('ConflictError', () => {
    it('should store entity info and versions', () => {
      const error = new ConflictError('profile', 123, {
        localVersion: { v: 1 },
        serverVersion: { v: 2 },
      });
      expect(error.entityType).toBe('profile');
      expect(error.entityId).toBe(123);
      expect(error.localVersion).toEqual({ v: 1 });
      expect(error.serverVersion).toEqual({ v: 2 });
    });

    it('should never be retryable', () => {
      const error = new ConflictError('profile', 'abc');
      expect(error.retryable).toBe(false);
    });

    it('should have correct code and category', () => {
      const error = new ConflictError('profile', 1);
      expect(error.code).toBe('SYNC_CONFLICT');
      expect(error.category).toBe('sync');
    });

    it('should return correct user message', () => {
      const error = new ConflictError('profile', 1);
      expect(error.getUserMessage()).toBe('This item was modified on another device. Please refresh to see the latest version.');
    });

    it('should include entity info in message', () => {
      const error = new ConflictError('profile', 123);
      expect(error.message).toBe('Sync conflict for profile 123');
    });
  });

  // ==================== StorageError ====================
  describe('StorageError', () => {
    it('should set retryable based on storageType', () => {
      const localError = new StorageError('Local failed', 'local');
      const remoteError = new StorageError('Remote failed', 'remote');

      expect(localError.retryable).toBe(false);
      expect(remoteError.retryable).toBe(true);
    });

    it('should respect explicit retryable option', () => {
      const error = new StorageError('test', 'local', { retryable: true });
      expect(error.retryable).toBe(true);
    });

    it('should return correct message for local', () => {
      const error = new StorageError('test', 'local');
      expect(error.getUserMessage()).toBe('Failed to save data locally. Your device storage may be full.');
    });

    it('should return correct message for remote', () => {
      const error = new StorageError('test', 'remote');
      expect(error.getUserMessage()).toBe('Failed to save to cloud storage. Please try again.');
    });

    it('should return hint for local storage', () => {
      const error = new StorageError('test', 'local');
      expect(error.getHint()).toBe('Try clearing browser data or freeing up device storage');
    });

    it('should return undefined hint for remote', () => {
      const error = new StorageError('test', 'remote');
      expect(error.getHint()).toBeUndefined();
    });

    it('should have correct code and category', () => {
      const error = new StorageError('test', 'local');
      expect(error.code).toBe('STORAGE_ERROR');
      expect(error.category).toBe('sync');
    });
  });

  // ==================== QuotaExceededError ====================
  describe('QuotaExceededError', () => {
    it('should have correct messages for local', () => {
      const error = new QuotaExceededError('local');
      expect(error.message).toBe('Local storage quota exceeded');
      expect(error.getUserMessage()).toContain('device storage is full');
    });

    it('should have correct messages for remote', () => {
      const error = new QuotaExceededError('remote');
      expect(error.message).toBe('Cloud storage quota exceeded');
      expect(error.getUserMessage()).toContain('cloud storage is full');
    });

    it('should never be retryable', () => {
      const local = new QuotaExceededError('local');
      const remote = new QuotaExceededError('remote');
      expect(local.retryable).toBe(false);
      expect(remote.retryable).toBe(false);
    });
  });

  // ==================== OfflineError ====================
  describe('OfflineError', () => {
    it('should be retryable', () => {
      const error = new OfflineError();
      expect(error.retryable).toBe(true);
    });

    it('should have correct code', () => {
      const error = new OfflineError();
      expect(error.code).toBe('OFFLINE');
    });

    it('should return user-friendly message', () => {
      const error = new OfflineError();
      expect(error.getUserMessage()).toBe('You are offline. Changes will sync when you reconnect.');
    });
  });

  // ==================== ImageSyncError ====================
  describe('ImageSyncError', () => {
    it('should store operation and path', () => {
      const error = new ImageSyncError('upload', { imagePath: '/test/path.jpg' });
      expect(error.operation).toBe('upload');
      expect(error.imagePath).toBe('/test/path.jpg');
    });

    it('should return correct messages for each operation', () => {
      expect(new ImageSyncError('upload').getUserMessage()).toBe('Failed to upload image. Please try again.');
      expect(new ImageSyncError('download').getUserMessage()).toBe('Failed to load image. Please try again.');
      expect(new ImageSyncError('delete').getUserMessage()).toBe('Failed to delete image. Please try again.');
    });

    it('should be retryable by default', () => {
      const error = new ImageSyncError('upload');
      expect(error.retryable).toBe(true);
    });
  });

  // ==================== ValidationError ====================
  describe('ValidationError', () => {
    it('should include field name in message', () => {
      const error = new ValidationError('Invalid email', { field: 'email' });
      expect(error.getUserMessage()).toBe('Invalid email. Please check and try again.');
    });

    it('should return generic message without field', () => {
      const error = new ValidationError('Invalid input');
      expect(error.getUserMessage()).toBe('Invalid input. Please check and try again.');
    });

    it('should never be retryable', () => {
      const error = new ValidationError('test');
      expect(error.retryable).toBe(false);
    });

    it('should store field and value', () => {
      const error = new ValidationError('test', { field: 'email', value: 'bad@' });
      expect(error.field).toBe('email');
      expect(error.value).toBe('bad@');
    });

    it('should have correct code and category', () => {
      const error = new ValidationError('test');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.category).toBe('validation');
    });
  });

  // ==================== ParseError ====================
  describe('ParseError', () => {
    it('should be retryable only for truncated reason', () => {
      expect(new ParseError('truncated').retryable).toBe(true);
      expect(new ParseError('no_json').retryable).toBe(false);
      expect(new ParseError('invalid_json').retryable).toBe(false);
      expect(new ParseError('unexpected_format').retryable).toBe(false);
    });

    it('should return correct message for truncated', () => {
      const error = new ParseError('truncated');
      expect(error.getUserMessage()).toBe('The AI response was cut off. Please try again.');
    });

    it('should return correct message for other reasons', () => {
      const noJson = new ParseError('no_json');
      const invalidJson = new ParseError('invalid_json');
      const unexpectedFormat = new ParseError('unexpected_format');

      expect(noJson.getUserMessage()).toBe('Failed to understand the AI response. Please try again.');
      expect(invalidJson.getUserMessage()).toBe('Failed to understand the AI response. Please try again.');
      expect(unexpectedFormat.getUserMessage()).toBe('Failed to understand the AI response. Please try again.');
    });

    it('should return hint for truncated', () => {
      const error = new ParseError('truncated');
      expect(error.getHint()).toBe('This may happen with complex profiles - trying again usually works');
    });

    it('should return undefined hint for other reasons', () => {
      expect(new ParseError('no_json').getHint()).toBeUndefined();
    });

    it('should store rawText', () => {
      const error = new ParseError('invalid_json', { rawText: 'bad json content' });
      expect(error.rawText).toBe('bad json content');
    });

    it('should accept custom message', () => {
      const error = new ParseError('no_json', { message: 'Custom parse error' });
      expect(error.message).toBe('Custom parse error');
    });

    it('should have correct code and category', () => {
      const error = new ParseError('no_json');
      expect(error.code).toBe('PARSE_ERROR');
      expect(error.category).toBe('validation');
    });
  });

  // ==================== SchemaError ====================
  describe('SchemaError', () => {
    it('should list missing fields', () => {
      const error = new SchemaError('Schema validation failed', {
        missingFields: ['name', 'age'],
      });
      expect(error.getUserMessage()).toBe('Missing required information: name, age');
    });

    it('should list invalid fields', () => {
      const error = new SchemaError('Schema validation failed', {
        invalidFields: ['email', 'phone'],
      });
      expect(error.getUserMessage()).toBe('Invalid data format for: email, phone');
    });

    it('should prefer missing fields message', () => {
      const error = new SchemaError('Schema validation failed', {
        missingFields: ['name'],
        invalidFields: ['email'],
      });
      expect(error.getUserMessage()).toContain('Missing required');
    });

    it('should return generic message if no fields specified', () => {
      const error = new SchemaError('Schema validation failed');
      expect(error.getUserMessage()).toBe('The data format is invalid. Please try again.');
    });

    it('should never be retryable', () => {
      const error = new SchemaError('test');
      expect(error.retryable).toBe(false);
    });

    it('should have correct code and category', () => {
      const error = new SchemaError('test');
      expect(error.code).toBe('SCHEMA_ERROR');
      expect(error.category).toBe('validation');
    });
  });

  // ==================== FileValidationError ====================
  describe('FileValidationError', () => {
    it('should return correct message for wrong_type', () => {
      const error = new FileValidationError('wrong_type', {
        expectedTypes: ['MP4', 'MOV'],
      });
      expect(error.getUserMessage()).toBe('Please upload a MP4 or MOV file.');
    });

    it('should return generic message for wrong_type without expected types', () => {
      const error = new FileValidationError('wrong_type');
      expect(error.getUserMessage()).toBe('This file type is not supported.');
    });

    it('should return correct message for too_large with size', () => {
      const error = new FileValidationError('too_large', {
        maxSizeBytes: 50 * 1024 * 1024, // 50MB
      });
      expect(error.getUserMessage()).toBe('File is too large. Maximum size is 50MB.');
    });

    it('should return generic message for too_large without size', () => {
      const error = new FileValidationError('too_large');
      expect(error.getUserMessage()).toBe('File is too large. Please use a smaller file.');
    });

    it('should return correct message for corrupted', () => {
      const error = new FileValidationError('corrupted');
      expect(error.getUserMessage()).toBe('This file appears to be corrupted. Please try a different file.');
    });

    it('should return correct message for empty', () => {
      const error = new FileValidationError('empty');
      expect(error.getUserMessage()).toBe('This file is empty. Please select a valid file.');
    });

    it('should return hint for too_large', () => {
      const error = new FileValidationError('too_large');
      expect(error.getHint()).toBe('Try compressing the video or using a shorter clip');
    });

    it('should store file metadata', () => {
      const error = new FileValidationError('too_large', {
        fileName: 'video.mp4',
        actualSizeBytes: 100 * 1024 * 1024,
        maxSizeBytes: 50 * 1024 * 1024,
      });
      expect(error.fileName).toBe('video.mp4');
      expect(error.actualSizeBytes).toBe(100 * 1024 * 1024);
      expect(error.maxSizeBytes).toBe(50 * 1024 * 1024);
    });

    it('should never be retryable', () => {
      const error = new FileValidationError('wrong_type');
      expect(error.retryable).toBe(false);
    });

    it('should have correct code and category', () => {
      const error = new FileValidationError('wrong_type');
      expect(error.code).toBe('FILE_VALIDATION_ERROR');
      expect(error.category).toBe('validation');
    });
  });

  // ==================== FrameExtractionError ====================
  describe('FrameExtractionError', () => {
    it('should set retryable based on reason', () => {
      expect(new FrameExtractionError('load_failed').retryable).toBe(true);
      expect(new FrameExtractionError('decode_failed').retryable).toBe(true);
      expect(new FrameExtractionError('canvas_failed').retryable).toBe(true);
      expect(new FrameExtractionError('timeout').retryable).toBe(true);
      expect(new FrameExtractionError('aborted').retryable).toBe(false);
    });

    it('should return correct message for load_failed', () => {
      const error = new FrameExtractionError('load_failed');
      expect(error.getUserMessage()).toBe('Could not load the video. Please try a different file.');
    });

    it('should return correct message for decode_failed', () => {
      const error = new FrameExtractionError('decode_failed');
      expect(error.getUserMessage()).toBe('Could not process the video format. Please try a different file.');
    });

    it('should return correct message for canvas_failed', () => {
      const error = new FrameExtractionError('canvas_failed');
      expect(error.getUserMessage()).toBe('Failed to extract frames from video. Please try again.');
    });

    it('should return correct message for timeout', () => {
      const error = new FrameExtractionError('timeout');
      expect(error.getUserMessage()).toBe('Video processing took too long. Please try a shorter video.');
    });

    it('should return correct message for aborted', () => {
      const error = new FrameExtractionError('aborted');
      expect(error.getUserMessage()).toBe('Video processing was cancelled.');
    });

    it('should return hint for load_failed and decode_failed', () => {
      const loadFailed = new FrameExtractionError('load_failed');
      const decodeFailed = new FrameExtractionError('decode_failed');
      expect(loadFailed.getHint()).toBe('Try converting to MP4 format or using a different video');
      expect(decodeFailed.getHint()).toBe('Try converting to MP4 format or using a different video');
    });

    it('should return hint for timeout', () => {
      const error = new FrameExtractionError('timeout');
      expect(error.getHint()).toBe('Videos under 30 seconds work best');
    });

    it('should return undefined hint for aborted', () => {
      const error = new FrameExtractionError('aborted');
      expect(error.getHint()).toBeUndefined();
    });

    it('should store frameIndex', () => {
      const error = new FrameExtractionError('canvas_failed', { frameIndex: 5 });
      expect(error.frameIndex).toBe(5);
    });

    it('should have correct code and category', () => {
      const error = new FrameExtractionError('load_failed');
      expect(error.code).toBe('FRAME_EXTRACTION_ERROR');
      expect(error.category).toBe('media');
    });

    it('should accept custom message', () => {
      const error = new FrameExtractionError('load_failed', { message: 'Custom load message' });
      expect(error.message).toBe('Custom load message');
    });
  });

  // ==================== VideoFormatError ====================
  describe('VideoFormatError', () => {
    it('should store detected format and supported formats', () => {
      const error = new VideoFormatError({
        detectedFormat: 'AVI',
        supportedFormats: ['MP4', 'MOV'],
      });
      expect(error.detectedFormat).toBe('AVI');
      expect(error.supportedFormats).toEqual(['MP4', 'MOV']);
    });

    it('should have default supported formats', () => {
      const error = new VideoFormatError();
      expect(error.supportedFormats).toEqual(['MP4', 'MOV', 'WebM']);
    });

    it('should never be retryable', () => {
      const error = new VideoFormatError();
      expect(error.retryable).toBe(false);
    });

    it('should have correct code and category', () => {
      const error = new VideoFormatError();
      expect(error.code).toBe('VIDEO_FORMAT_ERROR');
      expect(error.category).toBe('media');
    });
  });

  // ==================== ChunkAnalysisError ====================
  describe('ChunkAnalysisError', () => {
    it('should store chunk progress info', () => {
      const error = new ChunkAnalysisError(2, 4, {
        partialResult: { name: 'partial' },
      });
      expect(error.chunkIndex).toBe(2);
      expect(error.totalChunks).toBe(4);
      expect(error.partialResult).toEqual({ name: 'partial' });
    });

    it('should be retryable by default', () => {
      const error = new ChunkAnalysisError(0, 4);
      expect(error.retryable).toBe(true);
    });

    it('should respect explicit retryable option', () => {
      const error = new ChunkAnalysisError(0, 4, { retryable: false });
      expect(error.retryable).toBe(false);
    });

    it('should have default message with chunk info', () => {
      const error = new ChunkAnalysisError(1, 4);
      expect(error.message).toBe('Analysis failed for chunk 2 of 4');
    });

    it('should accept custom message', () => {
      const error = new ChunkAnalysisError(0, 4, { message: 'Custom chunk error' });
      expect(error.message).toBe('Custom chunk error');
    });

    it('should have correct code and category', () => {
      const error = new ChunkAnalysisError(0, 4);
      expect(error.code).toBe('CHUNK_ANALYSIS_ERROR');
      expect(error.category).toBe('media');
    });

    it('should return user-friendly message', () => {
      const error = new ChunkAnalysisError(0, 4);
      expect(error.getUserMessage()).toBe("Part of the analysis failed. We'll use what we could extract.");
    });
  });

  // ==================== ImageProcessingError ====================
  describe('ImageProcessingError', () => {
    it('should store reason', () => {
      const error = new ImageProcessingError('load_failed');
      expect(error.reason).toBe('load_failed');
    });

    it('should have default messages for each reason', () => {
      expect(new ImageProcessingError('load_failed').message).toBe('Failed to load image');
      expect(new ImageProcessingError('resize_failed').message).toBe('Failed to resize image');
      expect(new ImageProcessingError('encode_failed').message).toBe('Failed to encode image');
    });

    it('should be retryable', () => {
      const error = new ImageProcessingError('load_failed');
      expect(error.retryable).toBe(true);
    });

    it('should have correct code and category', () => {
      const error = new ImageProcessingError('load_failed');
      expect(error.code).toBe('IMAGE_PROCESSING_ERROR');
      expect(error.category).toBe('media');
    });
  });

  // ==================== AuraError base class features ====================
  describe('AuraError base class features', () => {
    it('should set timestamp', () => {
      const before = new Date();
      const error = new ApiError('test');
      const after = new Date();
      expect(error.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(error.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should store context', () => {
      const error = new ApiError('test', { context: { key: 'value' } });
      expect(error.context).toEqual({ key: 'value' });
    });

    it('should store cause', () => {
      const cause = new Error('original');
      const error = new ApiError('wrapped', { cause });
      expect(error.cause).toBe(cause);
    });

    it('should convert to JSON', () => {
      const error = new ApiError('test message', {
        statusCode: 500,
        context: { extra: 'data' },
      });
      const json = error.toJSON();
      expect(json.operation).toBe('API_ERROR');
      expect(json.parseError).toBe('test message');
      expect(json.inputSummary.errorCode).toBe('API_ERROR');
      expect(json.inputSummary.category).toBe('api');
      expect(json.inputSummary.retryable).toBe(true);
      expect(json.inputSummary.extra).toBe('data');
    });

    it('should have proper name', () => {
      const apiError = new ApiError('test');
      const networkError = new NetworkError();
      expect(apiError.name).toBe('ApiError');
      expect(networkError.name).toBe('NetworkError');
    });
  });
});
