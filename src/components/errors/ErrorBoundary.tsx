// src/components/errors/ErrorBoundary.tsx
// Generic error boundary with reset capability

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AuraError } from '../../lib/errors';
import { saveErrorToFile, type ErrorDebugInfo } from '../../lib/utils/errorExport';
import { ErrorFallback } from './ErrorFallback';

type ErrorLevel = 'page' | 'section' | 'component';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** How to display the error UI */
  level?: ErrorLevel;
  /** Optional custom fallback component */
  fallback?: ReactNode | ((props: { error: Error; resetError: () => void }) => ReactNode);
  /** Called when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Component name for debugging */
  componentName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Generic error boundary component that catches JavaScript errors
 * anywhere in its child component tree.
 *
 * @example
 * ```tsx
 * // Page-level boundary
 * <ErrorBoundary level="page">
 *   <MyPage />
 * </ErrorBoundary>
 *
 * // Section-level with custom handler
 * <ErrorBoundary
 *   level="section"
 *   onError={(error) => trackError(error)}
 *   componentName="ProfileSection"
 * >
 *   <ProfileSection />
 * </ErrorBoundary>
 *
 * // Custom fallback
 * <ErrorBoundary
 *   fallback={({ error, resetError }) => (
 *     <CustomError error={error} onRetry={resetError} />
 *   )}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Save to file for debugging
    const debugInfo: ErrorDebugInfo = {
      timestamp: new Date().toISOString(),
      operation: this.props.componentName || 'ErrorBoundary',
      inputSummary: {
        errorName: error.name,
        errorCode: error instanceof AuraError ? error.code : 'UNKNOWN',
        category: error instanceof AuraError ? error.category : 'unknown',
        componentStack: errorInfo.componentStack,
      },
      parseError: error.message,
      additionalContext: {
        stack: error.stack,
        level: this.props.level,
      },
    };

    // Only auto-save for page-level errors (critical)
    if (this.props.level === 'page') {
      saveErrorToFile(debugInfo);
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    const { hasError, error } = this.state;
    const { children, level = 'section', fallback } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        if (typeof fallback === 'function') {
          return fallback({ error, resetError: this.resetError });
        }
        return fallback;
      }

      // Use default error fallback
      return (
        <ErrorFallback
          error={error}
          resetError={this.resetError}
          level={level}
        />
      );
    }

    return children;
  }
}
