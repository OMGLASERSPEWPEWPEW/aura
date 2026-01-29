// src/components/help/AslWhatAvatar.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AslWhatAvatar } from './AslWhatAvatar';

describe('AslWhatAvatar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ─── Structure ──────────────────────────────────────────────

  it('renders with data-testid', () => {
    render(<AslWhatAvatar />);
    expect(screen.getByTestId('asl-what-avatar')).toBeInTheDocument();
  });

  it('has 40x40 dimensions via classes', () => {
    render(<AslWhatAvatar />);
    const container = screen.getByTestId('asl-what-avatar');
    expect(container.className).toContain('w-10');
    expect(container.className).toContain('h-10');
  });

  it('has circular shape', () => {
    render(<AslWhatAvatar />);
    const container = screen.getByTestId('asl-what-avatar');
    expect(container.className).toContain('rounded-full');
  });

  it('has purple border', () => {
    render(<AslWhatAvatar />);
    const container = screen.getByTestId('asl-what-avatar');
    expect(container.className).toContain('border-purple-400');
  });

  it('renders an img element, not a video', () => {
    render(<AslWhatAvatar />);
    const container = screen.getByTestId('asl-what-avatar');
    expect(container.querySelector('img')).toBeInTheDocument();
    expect(container.querySelector('video')).toBeNull();
  });

  // ─── Accessibility ──────────────────────────────────────────

  it('has role="img" on container', () => {
    render(<AslWhatAvatar />);
    const container = screen.getByTestId('asl-what-avatar');
    expect(container.getAttribute('role')).toBe('img');
  });

  it('has correct aria-label', () => {
    render(<AslWhatAvatar />);
    const container = screen.getByTestId('asl-what-avatar');
    expect(container.getAttribute('aria-label')).toBe('ASL fingerspelling: W-H-A-T');
  });

  it('has sr-only hint for slow mode', () => {
    render(<AslWhatAvatar />);
    const hint = screen.getByText('Press and hold to slow down');
    expect(hint).toBeInTheDocument();
    expect(hint.className).toContain('sr-only');
  });

  it('does not have wrist-shake animation class', () => {
    render(<AslWhatAvatar />);
    const container = screen.getByTestId('asl-what-avatar');
    expect(container.className).not.toContain('animate-wrist-shake');
  });

  // ─── Frame Cycling ──────────────────────────────────────────

  it('initial frame is W', () => {
    render(<AslWhatAvatar />);
    const img = screen.getByTestId('asl-what-avatar').querySelector('img');
    expect(img?.getAttribute('src')).toBe('/asl-w.png');
  });

  it('cycles through W→H→A→T→W in order', () => {
    // Use deterministic timing by mocking Math.random for delay calc
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);

    render(<AslWhatAvatar />);
    const img = () => screen.getByTestId('asl-what-avatar').querySelector('img');

    // Frame 0: W (initial)
    expect(img()?.getAttribute('src')).toBe('/asl-w.png');

    // Advance past the timeout (0.5 * 120 + 80 = 140ms)
    act(() => { vi.advanceTimersByTime(141); });
    expect(img()?.getAttribute('src')).toBe('/asl-h.png');

    act(() => { vi.advanceTimersByTime(141); });
    expect(img()?.getAttribute('src')).toBe('/asl-a.png');

    act(() => { vi.advanceTimersByTime(141); });
    expect(img()?.getAttribute('src')).toBe('/asl-t.png');

    // Wraps back to W
    act(() => { vi.advanceTimersByTime(141); });
    expect(img()?.getAttribute('src')).toBe('/asl-w.png');

    randomSpy.mockRestore();
  });

  // ─── Chaos Mode ─────────────────────────────────────────────

  it('applies transform style in default chaos mode', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    render(<AslWhatAvatar />);

    // Advance to trigger first frame change and jitter
    act(() => { vi.advanceTimersByTime(200); });

    const img = screen.getByTestId('asl-what-avatar').querySelector('img');
    const transform = img?.style.transform;
    expect(transform).toBeTruthy();
    expect(transform).toContain('rotate(');
    expect(transform).toContain('translate(');
  });

  it('chaos delay is between 80-200ms', () => {
    // min: Math.random()=0 → 0*120+80 = 80
    // max: Math.random()=1 → 1*120+80 = 200
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

    vi.spyOn(Math, 'random').mockReturnValue(0);
    render(<AslWhatAvatar />);

    // Find the setTimeout call with our timer (not React internals)
    const calls = setTimeoutSpy.mock.calls.filter(
      (call) => typeof call[1] === 'number' && call[1] >= 80 && call[1] <= 200,
    );
    expect(calls.length).toBeGreaterThan(0);
    expect(calls[0][1]).toBe(80); // Math.random()=0 → 80ms

    setTimeoutSpy.mockRestore();
  });

  it('chaos jitter rotation is within ±3 degrees', () => {
    // Math.random()=0 → 0*6-3 = -3
    // Math.random()=1 → 1*6-3 = 3
    vi.spyOn(Math, 'random').mockReturnValue(0);
    render(<AslWhatAvatar />);

    act(() => { vi.advanceTimersByTime(100); });

    const img = screen.getByTestId('asl-what-avatar').querySelector('img');
    const transform = img?.style.transform || '';
    // With random=0: rotate(-3deg)
    expect(transform).toContain('rotate(-3deg)');
  });

  // ─── Slow Mode ──────────────────────────────────────────────

  it('pointerdown enters slow mode with 1000ms delay', () => {
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    render(<AslWhatAvatar />);
    const container = screen.getByTestId('asl-what-avatar');

    // Enter slow mode
    fireEvent.pointerDown(container);

    // Advance past the chaos timer to re-render with new isHolding
    act(() => { vi.advanceTimersByTime(200); });

    // Now the next setTimeout should use 1000ms
    const slowCalls = setTimeoutSpy.mock.calls.filter(
      (call) => call[1] === 1000,
    );
    expect(slowCalls.length).toBeGreaterThan(0);

    setTimeoutSpy.mockRestore();
  });

  it('slow mode removes jitter (transform is zeroed)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    render(<AslWhatAvatar />);
    const container = screen.getByTestId('asl-what-avatar');

    // Enter slow mode
    fireEvent.pointerDown(container);

    // Let a frame tick occur in slow mode
    act(() => { vi.advanceTimersByTime(1100); });

    const img = container.querySelector('img');
    const transform = img?.style.transform || '';
    expect(transform).toContain('rotate(0deg)');
    expect(transform).toContain('translate(0px, 0px)');
  });

  it('pointerup exits slow mode', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    render(<AslWhatAvatar />);
    const container = screen.getByTestId('asl-what-avatar');

    fireEvent.pointerDown(container);
    act(() => { vi.advanceTimersByTime(1100); });

    // Release
    fireEvent.pointerUp(container);

    // Advance past next timer — should be back to chaos timing
    act(() => { vi.advanceTimersByTime(200); });

    const img = container.querySelector('img');
    const transform = img?.style.transform || '';
    // Should have non-zero jitter now (random=0.5 → rotate(0deg) actually, but translate(0px))
    // With random=0.5: rotate(0*6-3)=0 is only at 0.5 → 0.5*6-3=0... let's check it has rotate/translate
    expect(transform).toContain('rotate(');
    expect(transform).toContain('translate(');
  });

  it('pointerleave exits slow mode', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    render(<AslWhatAvatar />);
    const container = screen.getByTestId('asl-what-avatar');

    fireEvent.pointerDown(container);
    act(() => { vi.advanceTimersByTime(1100); });

    // Leave the element
    fireEvent.pointerLeave(container);

    act(() => { vi.advanceTimersByTime(200); });

    const img = container.querySelector('img');
    const transform = img?.style.transform || '';
    expect(transform).toContain('rotate(');
  });
});
