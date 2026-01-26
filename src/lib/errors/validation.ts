// src/lib/errors/validation.ts
// Validation and parsing error classes

import { AuraError } from './base';

/**
 * Validation errors for user input or data format issues
 */
export class ValidationError extends AuraError {
  readonly code = 'VALIDATION_ERROR';
  readonly category = 'validation' as const;
  readonly field?: string;
  readonly value?: unknown;

  constructor(
    message: string,
    options?: {
      field?: string;
      value?: unknown;
      context?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    super(message, {
      ...options,
      retryable: false, // Validation errors need user correction
    });
    this.field = options?.field;
    this.value = options?.value;
  }

  getUserMessage(): string {
    if (this.field) {
      return `Invalid ${this.field}. Please check and try again.`;
    }
    return 'Invalid input. Please check and try again.';
  }
}

/**
 * JSON parsing errors from AI responses
 */
export class ParseError extends AuraError {
  readonly code = 'PARSE_ERROR';
  readonly category = 'validation' as const;
  readonly rawText?: string;
  readonly reason: 'no_json' | 'invalid_json' | 'truncated' | 'unexpected_format';

  constructor(
    reason: 'no_json' | 'invalid_json' | 'truncated' | 'unexpected_format',
    options?: {
      message?: string;
      rawText?: string;
      context?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    const defaultMessages: Record<typeof reason, string> = {
      no_json: 'AI response did not contain valid JSON',
      invalid_json: 'Failed to parse AI response as JSON',
      truncated: 'AI response was truncated before completion',
      unexpected_format: 'AI response format was unexpected',
    };

    super(options?.message ?? defaultMessages[reason], {
      ...options,
      retryable: reason === 'truncated', // Truncated responses might succeed on retry
    });

    this.reason = reason;
    this.rawText = options?.rawText;
  }

  getUserMessage(): string {
    switch (this.reason) {
      case 'truncated':
        return 'The AI response was cut off. Please try again.';
      case 'no_json':
      case 'invalid_json':
      case 'unexpected_format':
        return 'Failed to understand the AI response. Please try again.';
    }
  }

  getHint(): string | undefined {
    if (this.reason === 'truncated') {
      return 'This may happen with complex profiles - trying again usually works';
    }
    return undefined;
  }
}

/**
 * Schema validation errors (missing required fields, wrong types)
 */
export class SchemaError extends AuraError {
  readonly code = 'SCHEMA_ERROR';
  readonly category = 'validation' as const;
  readonly missingFields?: string[];
  readonly invalidFields?: string[];

  constructor(
    message: string,
    options?: {
      missingFields?: string[];
      invalidFields?: string[];
      context?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    super(message, {
      ...options,
      retryable: false,
    });
    this.missingFields = options?.missingFields;
    this.invalidFields = options?.invalidFields;
  }

  getUserMessage(): string {
    if (this.missingFields?.length) {
      return `Missing required information: ${this.missingFields.join(', ')}`;
    }
    if (this.invalidFields?.length) {
      return `Invalid data format for: ${this.invalidFields.join(', ')}`;
    }
    return 'The data format is invalid. Please try again.';
  }
}

/**
 * File validation errors (wrong type, too large, etc.)
 */
export class FileValidationError extends AuraError {
  readonly code = 'FILE_VALIDATION_ERROR';
  readonly category = 'validation' as const;
  readonly reason: 'wrong_type' | 'too_large' | 'corrupted' | 'empty';
  readonly fileName?: string;
  readonly expectedTypes?: string[];
  readonly maxSizeBytes?: number;
  readonly actualSizeBytes?: number;

  constructor(
    reason: 'wrong_type' | 'too_large' | 'corrupted' | 'empty',
    options?: {
      fileName?: string;
      expectedTypes?: string[];
      maxSizeBytes?: number;
      actualSizeBytes?: number;
      context?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    const defaultMessages: Record<typeof reason, string> = {
      wrong_type: `Invalid file type${options?.expectedTypes ? `. Expected: ${options.expectedTypes.join(', ')}` : ''}`,
      too_large: `File is too large${options?.maxSizeBytes ? `. Maximum size: ${Math.round(options.maxSizeBytes / 1024 / 1024)}MB` : ''}`,
      corrupted: 'File appears to be corrupted',
      empty: 'File is empty',
    };

    super(defaultMessages[reason], {
      ...options,
      retryable: false,
    });

    this.reason = reason;
    this.fileName = options?.fileName;
    this.expectedTypes = options?.expectedTypes;
    this.maxSizeBytes = options?.maxSizeBytes;
    this.actualSizeBytes = options?.actualSizeBytes;
  }

  getUserMessage(): string {
    switch (this.reason) {
      case 'wrong_type':
        if (this.expectedTypes?.length) {
          return `Please upload a ${this.expectedTypes.join(' or ')} file.`;
        }
        return 'This file type is not supported.';
      case 'too_large':
        if (this.maxSizeBytes) {
          const maxMB = Math.round(this.maxSizeBytes / 1024 / 1024);
          return `File is too large. Maximum size is ${maxMB}MB.`;
        }
        return 'File is too large. Please use a smaller file.';
      case 'corrupted':
        return 'This file appears to be corrupted. Please try a different file.';
      case 'empty':
        return 'This file is empty. Please select a valid file.';
    }
  }

  getHint(): string | undefined {
    if (this.reason === 'too_large') {
      return 'Try compressing the video or using a shorter clip';
    }
    return undefined;
  }
}
