// src/hooks/useCopyToClipboard.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCopyToClipboard } from './useCopyToClipboard';

describe('useCopyToClipboard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should initialize with null copiedIndex', () => {
    const { result } = renderHook(() => useCopyToClipboard());

    expect(result.current.copiedIndex).toBeNull();
  });

  it('should copy text to clipboard and set copiedIndex', async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      result.current.handleCopy('test text', 0);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test text');
    expect(result.current.copiedIndex).toBe(0);
  });

  it('should track correct index when copying different items', async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      result.current.handleCopy('first', 1);
    });
    expect(result.current.copiedIndex).toBe(1);

    await act(async () => {
      result.current.handleCopy('second', 5);
    });
    expect(result.current.copiedIndex).toBe(5);
  });

  it('should auto-clear copiedIndex after default timeout (2000ms)', async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      result.current.handleCopy('test', 2);
    });
    expect(result.current.copiedIndex).toBe(2);

    await act(async () => {
      vi.advanceTimersByTime(1999);
    });
    expect(result.current.copiedIndex).toBe(2);

    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.copiedIndex).toBeNull();
  });

  it('should use custom timeout when provided', async () => {
    const { result } = renderHook(() => useCopyToClipboard(500));

    await act(async () => {
      result.current.handleCopy('test', 0);
    });
    expect(result.current.copiedIndex).toBe(0);

    await act(async () => {
      vi.advanceTimersByTime(499);
    });
    expect(result.current.copiedIndex).toBe(0);

    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.copiedIndex).toBeNull();
  });

  it('should handle copying empty string', async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      result.current.handleCopy('', 3);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('');
    expect(result.current.copiedIndex).toBe(3);
  });

  it('should handle special characters in text', async () => {
    const { result } = renderHook(() => useCopyToClipboard());
    const specialText = 'Hello 👋 "quoted" & <tagged>';

    await act(async () => {
      result.current.handleCopy(specialText, 0);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(specialText);
  });
});
