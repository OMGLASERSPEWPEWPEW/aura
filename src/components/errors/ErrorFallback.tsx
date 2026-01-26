// src/components/errors/ErrorFallback.tsx
// UI components for error states

import type { AuraError } from '../../lib/errors';

interface ErrorFallbackProps {
  error: Error | AuraError;
  resetError?: () => void;
  level: 'page' | 'section' | 'component';
}

/**
 * Full page error fallback for critical errors
 */
export function FullPageError({ error, resetError }: ErrorFallbackProps) {
  const isAuraError = 'getUserMessage' in error;
  const userMessage = isAuraError
    ? (error as AuraError).getUserMessage()
    : 'Something went wrong';
  const hint = isAuraError ? (error as AuraError).getHint?.() : undefined;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {/* Error icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-xl font-semibold text-slate-900 mb-2">
          Oops! Something went wrong
        </h1>

        {/* User-friendly message */}
        <p className="text-slate-600 mb-4">{userMessage}</p>

        {/* Hint if available */}
        {hint && (
          <p className="text-sm text-slate-500 mb-6">{hint}</p>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {resetError && (
            <button
              onClick={resetError}
              className="w-full py-3 px-4 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
            >
              Try Again
            </button>
          )}
          <button
            onClick={() => window.location.href = '/'}
            className="w-full py-3 px-4 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
          >
            Go Home
          </button>
        </div>

        {/* Technical details (collapsed by default) */}
        <details className="mt-6 text-left">
          <summary className="text-sm text-slate-400 cursor-pointer hover:text-slate-500">
            Technical Details
          </summary>
          <pre className="mt-2 p-3 bg-slate-100 rounded-lg text-xs text-slate-600 overflow-auto max-h-32">
            {error.message}
            {'\n\n'}
            {error.stack?.split('\n').slice(0, 5).join('\n')}
          </pre>
        </details>
      </div>
    </div>
  );
}

/**
 * Section-level error fallback for non-critical failures
 */
export function SectionError({ error, resetError }: ErrorFallbackProps) {
  const isAuraError = 'getUserMessage' in error;
  const userMessage = isAuraError
    ? (error as AuraError).getUserMessage()
    : 'This section failed to load';

  return (
    <div className="bg-red-50 rounded-xl p-6 text-center">
      <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-red-100 flex items-center justify-center">
        <svg
          className="w-5 h-5 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <p className="text-red-700 font-medium mb-1">Something went wrong</p>
      <p className="text-red-600 text-sm mb-4">{userMessage}</p>
      {resetError && (
        <button
          onClick={resetError}
          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}

/**
 * Compact error fallback for small components
 */
export function ComponentError({ error, resetError }: ErrorFallbackProps) {
  const isAuraError = 'getUserMessage' in error;
  const userMessage = isAuraError
    ? (error as AuraError).getUserMessage()
    : 'Failed to load';

  return (
    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
      <div className="flex items-center gap-2">
        <svg
          className="w-4 h-4 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="text-sm text-red-700">{userMessage}</span>
      </div>
      {resetError && (
        <button
          onClick={resetError}
          className="text-sm text-red-600 hover:text-red-800 font-medium"
        >
          Retry
        </button>
      )}
    </div>
  );
}

/**
 * Get the appropriate fallback component based on error level
 */
export function ErrorFallback(props: ErrorFallbackProps) {
  switch (props.level) {
    case 'page':
      return <FullPageError {...props} />;
    case 'section':
      return <SectionError {...props} />;
    case 'component':
      return <ComponentError {...props} />;
    default:
      return <SectionError {...props} />;
  }
}
