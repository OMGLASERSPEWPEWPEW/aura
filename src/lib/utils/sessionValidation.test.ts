// src/lib/utils/sessionValidation.test.ts
import { describe, it, expect } from 'vitest';
import type { Session, User } from '@supabase/supabase-js';
import {
  hasValidSession,
  parseRecoveryTokenFromHash,
  shouldWaitForRecoveryProcessing,
  shouldRedirectFromResetPassword,
} from './sessionValidation';

// Helper to create mock session
const createMockSession = (overrides?: Partial<Session>): Session => ({
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Date.now() / 1000 + 3600,
  token_type: 'bearer',
  user: {
    id: 'user-123',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  } as User,
  ...overrides,
});

describe('sessionValidation', () => {
  describe('hasValidSession', () => {
    it('should return false for null session', () => {
      expect(hasValidSession(null)).toBe(false);
    });

    it('should return false for session with null user', () => {
      const session = createMockSession({ user: null as unknown as User });
      expect(hasValidSession(session)).toBe(false);
    });

    it('should return true for valid session with user', () => {
      const session = createMockSession();
      expect(hasValidSession(session)).toBe(true);
    });
  });

  describe('parseRecoveryTokenFromHash', () => {
    it('should parse access_token and type from hash', () => {
      const hash = '#access_token=abc123&type=recovery&refresh_token=xyz';
      const result = parseRecoveryTokenFromHash(hash);

      expect(result.accessToken).toBe('abc123');
      expect(result.isRecovery).toBe(true);
    });

    it('should handle hash without leading #', () => {
      const hash = 'access_token=abc123&type=recovery';
      const result = parseRecoveryTokenFromHash(hash);

      expect(result.accessToken).toBe('abc123');
      expect(result.isRecovery).toBe(true);
    });

    it('should return null for missing access_token', () => {
      const hash = '#type=recovery';
      const result = parseRecoveryTokenFromHash(hash);

      expect(result.accessToken).toBeNull();
      expect(result.isRecovery).toBe(true);
    });

    it('should return isRecovery false for non-recovery type', () => {
      const hash = '#access_token=abc123&type=signup';
      const result = parseRecoveryTokenFromHash(hash);

      expect(result.accessToken).toBe('abc123');
      expect(result.isRecovery).toBe(false);
    });

    it('should return isRecovery false for missing type', () => {
      const hash = '#access_token=abc123';
      const result = parseRecoveryTokenFromHash(hash);

      expect(result.accessToken).toBe('abc123');
      expect(result.isRecovery).toBe(false);
    });

    it('should handle empty hash', () => {
      const result = parseRecoveryTokenFromHash('');

      expect(result.accessToken).toBeNull();
      expect(result.isRecovery).toBe(false);
    });

    it('should handle hash with only #', () => {
      const result = parseRecoveryTokenFromHash('#');

      expect(result.accessToken).toBeNull();
      expect(result.isRecovery).toBe(false);
    });
  });

  describe('shouldWaitForRecoveryProcessing', () => {
    it('should return true when recovery token exists but no session', () => {
      const hash = '#access_token=abc123&type=recovery';
      expect(shouldWaitForRecoveryProcessing(hash, null)).toBe(true);
    });

    it('should return false when session already exists', () => {
      const hash = '#access_token=abc123&type=recovery';
      const session = createMockSession();
      expect(shouldWaitForRecoveryProcessing(hash, session)).toBe(false);
    });

    it('should return false when no recovery token in hash', () => {
      const hash = '';
      expect(shouldWaitForRecoveryProcessing(hash, null)).toBe(false);
    });

    it('should return false when type is not recovery', () => {
      const hash = '#access_token=abc123&type=signup';
      expect(shouldWaitForRecoveryProcessing(hash, null)).toBe(false);
    });
  });

  describe('shouldRedirectFromResetPassword', () => {
    it('should not redirect while loading', () => {
      expect(shouldRedirectFromResetPassword('', null, true)).toBe(false);
    });

    it('should redirect when no session and no token', () => {
      expect(shouldRedirectFromResetPassword('', null, false)).toBe(true);
    });

    it('should not redirect when session exists', () => {
      const session = createMockSession();
      expect(shouldRedirectFromResetPassword('', session, false)).toBe(false);
    });

    it('should not redirect when recovery token is being processed', () => {
      const hash = '#access_token=abc123&type=recovery';
      expect(shouldRedirectFromResetPassword(hash, null, false)).toBe(false);
    });

    it('should redirect after token processed if session is null', () => {
      // After Supabase processes token, hash is cleared but if session failed
      // to be created (e.g., expired token), we should redirect
      expect(shouldRedirectFromResetPassword('', null, false)).toBe(true);
    });
  });
});
