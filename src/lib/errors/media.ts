// src/lib/errors/media.ts
// Media processing error classes

import { AuraError } from './base';

/**
 * Frame extraction errors during video processing
 */
export class FrameExtractionError extends AuraError {
  readonly code = 'FRAME_EXTRACTION_ERROR';
  readonly category = 'media' as const;
  readonly reason: 'load_failed' | 'decode_failed' | 'canvas_failed' | 'timeout' | 'aborted';
  readonly frameIndex?: number;

  constructor(
    reason: 'load_failed' | 'decode_failed' | 'canvas_failed' | 'timeout' | 'aborted',
    options?: {
      message?: string;
      frameIndex?: number;
      context?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    const defaultMessages: Record<typeof reason, string> = {
      load_failed: 'Failed to load video file',
      decode_failed: 'Failed to decode video',
      canvas_failed: 'Failed to extract frame to canvas',
      timeout: 'Video processing timed out',
      aborted: 'Video processing was cancelled',
    };

    super(options?.message ?? defaultMessages[reason], {
      ...options,
      retryable: reason !== 'aborted', // Don't retry user-initiated aborts
    });

    this.reason = reason;
    this.frameIndex = options?.frameIndex;
  }

  getUserMessage(): string {
    switch (this.reason) {
      case 'load_failed':
        return 'Could not load the video. Please try a different file.';
      case 'decode_failed':
        return 'Could not process the video format. Please try a different file.';
      case 'canvas_failed':
        return 'Failed to extract frames from video. Please try again.';
      case 'timeout':
        return 'Video processing took too long. Please try a shorter video.';
      case 'aborted':
        return 'Video processing was cancelled.';
    }
  }

  getHint(): string | undefined {
    if (this.reason === 'load_failed' || this.reason === 'decode_failed') {
      return 'Try converting to MP4 format or using a different video';
    }
    if (this.reason === 'timeout') {
      return 'Videos under 30 seconds work best';
    }
    return undefined;
  }
}

/**
 * Video format errors
 */
export class VideoFormatError extends AuraError {
  readonly code = 'VIDEO_FORMAT_ERROR';
  readonly category = 'media' as const;
  readonly detectedFormat?: string;
  readonly supportedFormats: string[];

  constructor(options?: {
    detectedFormat?: string;
    supportedFormats?: string[];
    context?: Record<string, unknown>;
    cause?: Error;
  }) {
    const supported = options?.supportedFormats ?? ['MP4', 'MOV', 'WebM'];
    super(
      `Unsupported video format${options?.detectedFormat ? `: ${options.detectedFormat}` : ''}. Supported formats: ${supported.join(', ')}`,
      {
        ...options,
        retryable: false,
      }
    );
    this.detectedFormat = options?.detectedFormat;
    this.supportedFormats = supported;
  }

  getUserMessage(): string {
    return `This video format is not supported. Please use ${this.supportedFormats.join(', ')}.`;
  }

  getHint(): string | undefined {
    return 'Screen recordings from your phone are usually in a supported format';
  }
}

/**
 * Analysis chunk errors (partial failure during streaming analysis)
 */
export class ChunkAnalysisError extends AuraError {
  readonly code = 'CHUNK_ANALYSIS_ERROR';
  readonly category = 'media' as const;
  readonly chunkIndex: number;
  readonly totalChunks: number;
  readonly partialResult?: unknown;

  constructor(
    chunkIndex: number,
    totalChunks: number,
    options?: {
      message?: string;
      partialResult?: unknown;
      context?: Record<string, unknown>;
      retryable?: boolean;
      cause?: Error;
    }
  ) {
    super(
      options?.message ?? `Analysis failed for chunk ${chunkIndex + 1} of ${totalChunks}`,
      {
        ...options,
        retryable: options?.retryable ?? true,
      }
    );
    this.chunkIndex = chunkIndex;
    this.totalChunks = totalChunks;
    this.partialResult = options?.partialResult;
  }

  getUserMessage(): string {
    return `Part of the analysis failed. We'll use what we could extract.`;
  }

  getHint(): string | undefined {
    return 'The profile may be missing some details';
  }
}

/**
 * Image processing errors
 */
export class ImageProcessingError extends AuraError {
  readonly code = 'IMAGE_PROCESSING_ERROR';
  readonly category = 'media' as const;
  readonly reason: 'load_failed' | 'resize_failed' | 'encode_failed';

  constructor(
    reason: 'load_failed' | 'resize_failed' | 'encode_failed',
    options?: {
      message?: string;
      context?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    const defaultMessages: Record<typeof reason, string> = {
      load_failed: 'Failed to load image',
      resize_failed: 'Failed to resize image',
      encode_failed: 'Failed to encode image',
    };

    super(options?.message ?? defaultMessages[reason], {
      ...options,
      retryable: true,
    });

    this.reason = reason;
  }

  getUserMessage(): string {
    return 'Failed to process the image. Please try again.';
  }
}
