// src/lib/logger.ts
// Structured logging utility for consistent log formatting

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  /** Module name for log prefix */
  module: string;
  /** Whether to include timestamps (default: true in dev, false in prod) */
  timestamps?: boolean;
}

interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  /** Create a child logger with a submodule prefix */
  child: (submodule: string) => Logger;
}

// Check if we're in development mode
const isDev = import.meta.env.DEV;

// Production mode suppresses debug logs
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Minimum log level for production (info and above)
const MIN_PROD_LEVEL = LOG_LEVELS.info;

/**
 * Create a structured logger for a module
 *
 * @example
 * ```typescript
 * const log = createLogger({ module: 'ai' });
 * log.info('Starting analysis...');
 * // Output: [ai] Starting analysis...
 *
 * const childLog = log.child('streaming');
 * childLog.debug('Processing chunk 1');
 * // Output: [ai:streaming] Processing chunk 1
 * ```
 */
export function createLogger(options: LoggerOptions): Logger {
  const { module, timestamps = isDev } = options;

  const formatPrefix = (level: LogLevel): string => {
    const parts: string[] = [];

    if (timestamps) {
      parts.push(new Date().toISOString().slice(11, 23)); // HH:MM:SS.mmm
    }

    parts.push(`[${module}]`);

    if (level === 'warn' || level === 'error') {
      parts.push(level.toUpperCase());
    }

    return parts.join(' ');
  };

  const shouldLog = (level: LogLevel): boolean => {
    if (isDev) return true;
    return LOG_LEVELS[level] >= MIN_PROD_LEVEL;
  };

  const log = (level: LogLevel, ...args: unknown[]): void => {
    if (!shouldLog(level)) return;

    const prefix = formatPrefix(level);
    const method = level === 'debug' ? 'log' : level;

    // eslint-disable-next-line no-console
    console[method](prefix, ...args);
  };

  const logger: Logger = {
    debug: (...args) => log('debug', ...args),
    info: (...args) => log('info', ...args),
    warn: (...args) => log('warn', ...args),
    error: (...args) => log('error', ...args),
    child: (submodule: string) =>
      createLogger({
        module: `${module}:${submodule}`,
        timestamps,
      }),
  };

  return logger;
}

// Pre-configured loggers for common modules
export const aiLogger = createLogger({ module: 'ai' });
export const apiLogger = createLogger({ module: 'api' });
export const dbLogger = createLogger({ module: 'db' });
export const essenceLogger = createLogger({ module: 'essence' });
export const moodboardLogger = createLogger({ module: 'moodboard' });
export const streamingLogger = createLogger({ module: 'streaming' });
