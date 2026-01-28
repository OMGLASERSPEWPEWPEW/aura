// src/lib/logger.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLogger } from './logger';

describe('createLogger', () => {
  const originalConsole = { ...console };

  beforeEach(() => {
    console.log = vi.fn();
    console.info = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();
  });

  afterEach(() => {
    console.log = originalConsole.log;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  });

  it('creates a logger with module prefix', () => {
    const log = createLogger({ module: 'test', timestamps: false });
    log.info('Hello');

    expect(console.info).toHaveBeenCalledWith('[test]', 'Hello');
  });

  it('supports debug level', () => {
    const log = createLogger({ module: 'test', timestamps: false });
    log.debug('Debug message');

    // debug uses console.log
    expect(console.log).toHaveBeenCalledWith('[test]', 'Debug message');
  });

  it('adds level prefix for warn', () => {
    const log = createLogger({ module: 'test', timestamps: false });
    log.warn('Warning message');

    expect(console.warn).toHaveBeenCalledWith('[test] WARN', 'Warning message');
  });

  it('adds level prefix for error', () => {
    const log = createLogger({ module: 'test', timestamps: false });
    log.error('Error message');

    expect(console.error).toHaveBeenCalledWith('[test] ERROR', 'Error message');
  });

  it('creates child loggers with combined prefix', () => {
    const log = createLogger({ module: 'parent', timestamps: false });
    const child = log.child('child');
    child.info('Child message');

    expect(console.info).toHaveBeenCalledWith('[parent:child]', 'Child message');
  });

  it('supports multiple arguments', () => {
    const log = createLogger({ module: 'test', timestamps: false });
    log.info('Message', { key: 'value' }, 123);

    expect(console.info).toHaveBeenCalledWith('[test]', 'Message', { key: 'value' }, 123);
  });

  it('includes timestamps when enabled', () => {
    const log = createLogger({ module: 'test', timestamps: true });
    log.info('Timestamped');

    // Check that the first argument contains a timestamp pattern
    const call = (console.info as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toMatch(/^\d{2}:\d{2}:\d{2}\.\d{3} \[test\]$/);
    expect(call[1]).toBe('Timestamped');
  });
});
