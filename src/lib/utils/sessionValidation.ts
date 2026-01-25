// src/lib/utils/sessionValidation.ts
// Session validation utilities for auth flows

import type { Session } from '@supabase/supabase-js';

/**
 * Checks if a session is valid for password reset
 * A valid session must have both a session object and a user object
 */
export function hasValidSession(session: Session | null): boolean {
  return session !== null && session.user !== null;
}

/**
 * Parses recovery tokens from URL hash
 * Supabase uses hash-based tokens for password recovery
 * URL format: /reset-password#access_token=xxx&type=recovery&...
 */
export function parseRecoveryTokenFromHash(hash: string): {
  accessToken: string | null;
  isRecovery: boolean;
} {
  // Remove leading # if present
  const cleanHash = hash.startsWith('#') ? hash.substring(1) : hash;
  const params = new URLSearchParams(cleanHash);

  const accessToken = params.get('access_token');
  const type = params.get('type');

  return {
    accessToken,
    isRecovery: type === 'recovery',
  };
}

/**
 * Determines if we should wait for Supabase to process the URL
 * Returns true if there's a recovery token in the URL that hasn't been processed yet
 */
export function shouldWaitForRecoveryProcessing(
  hash: string,
  session: Session | null
): boolean {
  const { accessToken, isRecovery } = parseRecoveryTokenFromHash(hash);

  // If we have a recovery token but no session yet, we should wait
  return accessToken !== null && isRecovery && session === null;
}

/**
 * Determines if we should redirect away from the reset password page
 * Returns true if there's no session and no recovery token to process
 */
export function shouldRedirectFromResetPassword(
  hash: string,
  session: Session | null,
  loading: boolean
): boolean {
  // Don't redirect while still loading
  if (loading) {
    return false;
  }

  const { accessToken } = parseRecoveryTokenFromHash(hash);

  // Redirect if no session and no token to process
  return session === null && accessToken === null;
}
