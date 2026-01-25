// src/hooks/useRequireAuth.ts
// Hook for requiring authentication on non-protected pages
// Returns a function that can be used to guard actions that need auth

import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface UseRequireAuthResult {
  /** Whether the user is currently authenticated */
  isAuthenticated: boolean;
  /** Whether auth state is still loading */
  isLoading: boolean;
  /**
   * Call this before performing an action that requires auth.
   * Returns true if authenticated, false if redirecting to login.
   */
  requireAuth: () => boolean;
  /**
   * Wrap an async action - redirects to login if not authenticated,
   * otherwise executes the action.
   */
  withAuth: <T>(action: () => Promise<T>) => Promise<T | null>;
}

export function useRequireAuth(): UseRequireAuthResult {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthenticated = user !== null;

  const redirectToLogin = useCallback(() => {
    navigate('/login', { state: { from: location.pathname } });
  }, [navigate, location.pathname]);

  const requireAuth = useCallback((): boolean => {
    if (loading) {
      // Still loading - don't redirect yet
      return false;
    }

    if (!user) {
      redirectToLogin();
      return false;
    }

    return true;
  }, [user, loading, redirectToLogin]);

  const withAuth = useCallback(async <T>(action: () => Promise<T>): Promise<T | null> => {
    if (loading) {
      // Still loading - wait a bit and try again
      return null;
    }

    if (!user) {
      redirectToLogin();
      return null;
    }

    return action();
  }, [user, loading, redirectToLogin]);

  return {
    isAuthenticated,
    isLoading: loading,
    requireAuth,
    withAuth,
  };
}
