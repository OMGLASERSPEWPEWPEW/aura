// src/components/help/ComicBubble.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComicBubble } from './ComicBubble';

describe('ComicBubble', () => {
  it('renders children content', () => {
    render(<ComicBubble side="left">hello world</ComicBubble>);
    expect(screen.getByText('hello world')).toBeInTheDocument();
  });

  it('renders with data-testid for left side', () => {
    render(<ComicBubble side="left">msg</ComicBubble>);
    expect(screen.getByTestId('comic-bubble-left')).toBeInTheDocument();
  });

  it('renders with data-testid for right side', () => {
    render(<ComicBubble side="right">msg</ComicBubble>);
    expect(screen.getByTestId('comic-bubble-right')).toBeInTheDocument();
  });

  it('applies purple border for right (Sorry) side', () => {
    render(<ComicBubble side="right">sorry msg</ComicBubble>);
    const bubble = screen.getByTestId('comic-bubble-right');
    const inner = bubble.querySelector('div');
    expect(inner?.className).toContain('border-purple-300');
  });

  it('applies slate border for left (user) side', () => {
    render(<ComicBubble side="left">user msg</ComicBubble>);
    const bubble = screen.getByTestId('comic-bubble-left');
    const inner = bubble.querySelector('div');
    expect(inner?.className).toContain('border-slate-300');
  });

  it('includes SVG tail element', () => {
    render(<ComicBubble side="right">msg</ComicBubble>);
    const bubble = screen.getByTestId('comic-bubble-right');
    const svg = bubble.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('positions tail on right for right-side bubble', () => {
    render(<ComicBubble side="right">msg</ComicBubble>);
    const svg = screen.getByTestId('comic-bubble-right').querySelector('svg');
    expect(svg?.className.baseVal).toContain('right-3');
  });

  it('positions tail on left for left-side bubble', () => {
    render(<ComicBubble side="left">msg</ComicBubble>);
    const svg = screen.getByTestId('comic-bubble-left').querySelector('svg');
    expect(svg?.className.baseVal).toContain('left-3');
  });

  it('applies tilt rotation class', () => {
    render(<ComicBubble side="left">msg</ComicBubble>);
    const bubble = screen.getByTestId('comic-bubble-left');
    expect(bubble.className).toContain('-rotate-1');
  });

  it('applies custom className', () => {
    render(<ComicBubble side="left" className="my-custom">msg</ComicBubble>);
    const bubble = screen.getByTestId('comic-bubble-left');
    expect(bubble.className).toContain('my-custom');
  });
});
