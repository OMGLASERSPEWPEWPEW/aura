// src/lib/api/config.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We need to test getApiKey which depends on import.meta.env
// We'll dynamically import and mock the module

describe('config', () => {
  // ==================== getApiKey ====================
  describe('getApiKey', () => {
    const originalEnv = import.meta.env.VITE_ANTHROPIC_API_KEY;

    afterEach(() => {
      // Restore original env
      import.meta.env.VITE_ANTHROPIC_API_KEY = originalEnv;
      vi.resetModules();
    });

    it('should return API key when present', async () => {
      import.meta.env.VITE_ANTHROPIC_API_KEY = 'test-api-key-123';

      // Dynamically import to get fresh module with new env
      const { getApiKey } = await import('./config');

      expect(getApiKey()).toBe('test-api-key-123');
    });

    it('should throw error when API key is missing', async () => {
      import.meta.env.VITE_ANTHROPIC_API_KEY = '';

      const { getApiKey } = await import('./config');

      expect(() => getApiKey()).toThrow('Missing API Key');
    });

    it('should handle falsy API key values', async () => {
      // Note: In Vite, undefined env vars become empty strings
      // The getApiKey function checks for falsy values
      // This test verifies the error message format
      import.meta.env.VITE_ANTHROPIC_API_KEY = '';

      const { getApiKey } = await import('./config');

      expect(() => getApiKey()).toThrow('VITE_ANTHROPIC_API_KEY');
    });
  });

  // ==================== Constants ====================
  describe('ANTHROPIC_CONFIG', () => {
    it('should have correct API endpoint', async () => {
      const { ANTHROPIC_CONFIG } = await import('./config');
      expect(ANTHROPIC_CONFIG.API_ENDPOINT).toBe('https://api.anthropic.com/v1/messages');
    });

    it('should have correct API version', async () => {
      const { ANTHROPIC_CONFIG } = await import('./config');
      expect(ANTHROPIC_CONFIG.API_VERSION).toBe('2023-06-01');
    });
  });

  describe('TOKEN_LIMITS', () => {
    it('should have expected token limits defined', async () => {
      const { TOKEN_LIMITS } = await import('./config');

      expect(TOKEN_LIMITS.PROFILE_ANALYSIS).toBeDefined();
      expect(TOKEN_LIMITS.PROFILE_BASICS).toBeDefined();
      expect(TOKEN_LIMITS.PROFILE_DEEP).toBeDefined();
      expect(typeof TOKEN_LIMITS.PROFILE_ANALYSIS).toBe('number');
    });
  });

  describe('TIMEOUTS', () => {
    it('should have expected timeout values', async () => {
      const { TIMEOUTS } = await import('./config');

      expect(TIMEOUTS.DEFAULT).toBe(60000);
      expect(TIMEOUTS.PROFILE_ANALYSIS).toBe(120000);
      expect(TIMEOUTS.QUICK_ANALYSIS).toBe(30000);
    });
  });
});
