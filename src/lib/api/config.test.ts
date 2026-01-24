// src/lib/api/config.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We need to test getApiKey which depends on import.meta.env
// We'll dynamically import and mock the module

describe('config', () => {
  const originalEnv = { ...import.meta.env };

  afterEach(() => {
    // Restore original env values
    Object.assign(import.meta.env, originalEnv);
    vi.resetModules();
  });

  // ==================== getApiKey ====================
  describe('getApiKey', () => {
    it('should return empty string when using proxy mode', async () => {
      import.meta.env.VITE_USE_PROXY = 'true';
      import.meta.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
      import.meta.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
      vi.resetModules();

      const { getApiKey } = await import('./config');
      expect(getApiKey()).toBe('');
    });

    it('should return API key when not using proxy', async () => {
      import.meta.env.VITE_USE_PROXY = 'false';
      import.meta.env.VITE_ANTHROPIC_API_KEY = 'test-api-key-123';
      vi.resetModules();

      const { getApiKey } = await import('./config');
      expect(getApiKey()).toBe('test-api-key-123');
    });

    it('should throw error when API key is missing in non-proxy mode', async () => {
      import.meta.env.VITE_USE_PROXY = 'false';
      import.meta.env.VITE_ANTHROPIC_API_KEY = '';
      vi.resetModules();

      const { getApiKey } = await import('./config');
      expect(() => getApiKey()).toThrow('Missing API Key');
    });
  });

  // ==================== Constants ====================
  describe('ANTHROPIC_CONFIG', () => {
    it('should use proxy endpoint when proxy mode enabled', async () => {
      import.meta.env.VITE_USE_PROXY = 'true';
      import.meta.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
      import.meta.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
      vi.resetModules();

      const { ANTHROPIC_CONFIG } = await import('./config');
      expect(ANTHROPIC_CONFIG.API_ENDPOINT).toBe('https://test.supabase.co/functions/v1/anthropic-proxy');
    });

    it('should use direct Anthropic endpoint when proxy disabled', async () => {
      import.meta.env.VITE_USE_PROXY = 'false';
      import.meta.env.VITE_ANTHROPIC_API_KEY = 'test-key';
      vi.resetModules();

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
      expect(TIMEOUTS.PROFILE_ANALYSIS).toBe(150000); // Matches Supabase Pro limit
      expect(TIMEOUTS.QUICK_ANALYSIS).toBe(30000);
    });
  });
});
