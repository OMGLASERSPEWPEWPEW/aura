// src/lib/errors/index.ts
// Re-exports for the error module

// Base
export { AuraError, type ErrorCategory } from './base';

// API errors
export {
  ApiError,
  NetworkError,
  TimeoutError,
  AuthError,
  RateLimitError,
  ensureAuraError,
} from './api';

// Sync errors
export {
  SyncError,
  ConflictError,
  StorageError,
  QuotaExceededError,
  OfflineError,
  ImageSyncError,
} from './sync';

// Validation errors
export {
  ValidationError,
  ParseError,
  SchemaError,
  FileValidationError,
} from './validation';

// Media errors
export {
  FrameExtractionError,
  VideoFormatError,
  ChunkAnalysisError,
  ImageProcessingError,
} from './media';

// Result type and utilities
export {
  type Result,
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
} from './result';
