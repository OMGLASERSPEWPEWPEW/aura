// src/test/testUtils.tsx
// Test utilities and wrapper components

import type { ReactNode, FC } from 'react';
import { ToastProvider } from '../contexts/ToastContext';

/**
 * Test wrapper that includes all necessary providers for hooks.
 * Use this to wrap hooks that require context providers.
 */
export const TestWrapper: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
};

/**
 * Creates a wrapper component for renderHook.
 * Use this when testing hooks with renderHook from @testing-library/react.
 *
 * @example
 * ```typescript
 * const { result } = renderHook(
 *   () => useMyHook(),
 *   { wrapper: createWrapper() }
 * );
 * ```
 */
export function createWrapper() {
  return TestWrapper;
}
