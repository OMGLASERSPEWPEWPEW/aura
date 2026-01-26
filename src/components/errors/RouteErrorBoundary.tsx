// src/components/errors/RouteErrorBoundary.tsx
// Route-level error boundary wrapper

import type { ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

interface RouteErrorBoundaryProps {
  children: ReactNode;
  /** Route name for debugging */
  routeName?: string;
}

/**
 * Pre-configured error boundary for route-level components.
 * Displays a full-page error UI with navigation options.
 *
 * @example
 * ```tsx
 * <Route
 *   path="/profile/:id"
 *   element={
 *     <RouteErrorBoundary routeName="ProfileDetail">
 *       <ProfileDetail />
 *     </RouteErrorBoundary>
 *   }
 * />
 * ```
 */
export function RouteErrorBoundary({ children, routeName }: RouteErrorBoundaryProps) {
  return (
    <ErrorBoundary
      level="page"
      componentName={routeName || 'RouteComponent'}
      onError={(error, errorInfo) => {
        // Additional route-specific error logging could go here
        console.error(`Route error in ${routeName}:`, {
          error,
          componentStack: errorInfo.componentStack,
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
