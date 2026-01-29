// src/components/help/ComicBubble.tsx
// Comic book speech bubble with SVG tail pointing toward the speaker

import type { ReactNode } from 'react';

interface ComicBubbleProps {
  children: ReactNode;
  side: 'left' | 'right';
  className?: string;
}

export function ComicBubble({ children, side, className = '' }: ComicBubbleProps) {
  const isRight = side === 'right';

  return (
    <div
      data-testid={`comic-bubble-${side}`}
      className={`relative -rotate-1 ${className}`}
    >
      {/* Bubble body */}
      <div
        className={`rounded-2xl px-3 py-2 text-sm border ${
          isRight
            ? 'border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-900 dark:text-purple-100'
            : 'border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100'
        }`}
      >
        {children}
      </div>

      {/* SVG tail */}
      <svg
        width="8"
        height="8"
        viewBox="0 0 8 8"
        className={`absolute -bottom-1.5 ${isRight ? 'right-3' : 'left-3'}`}
        aria-hidden="true"
      >
        <polygon
          points={isRight ? '0,0 8,0 8,8' : '0,0 8,0 0,8'}
          className={
            isRight
              ? 'fill-purple-50 dark:fill-purple-900/20'
              : 'fill-slate-100 dark:fill-slate-700'
          }
        />
      </svg>
    </div>
  );
}
