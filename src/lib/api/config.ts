// src/lib/api/config.ts
// Centralized Anthropic API configuration

// Proxy mode: when enabled, calls go through Supabase Edge Function instead of direct to Anthropic
// This keeps the API key server-side and secure
const USE_PROXY = import.meta.env.VITE_USE_PROXY === 'true';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

// Validate proxy configuration
if (USE_PROXY && !SUPABASE_URL) {
  console.error('VITE_SUPABASE_URL is required when VITE_USE_PROXY is true');
}

export const ANTHROPIC_CONFIG = {
  // Only load API key when not using proxy (development mode)
  API_KEY: USE_PROXY ? '' : (import.meta.env.VITE_ANTHROPIC_API_KEY as string),
  // Use proxy endpoint when enabled, otherwise direct Anthropic API
  API_ENDPOINT: USE_PROXY
    ? `${SUPABASE_URL}/functions/v1/anthropic-proxy`
    : 'https://api.anthropic.com/v1/messages',
  API_VERSION: '2023-06-01',
  MODEL: 'claude-sonnet-4-5-20250929',
  USE_PROXY,
} as const;

export const TOKEN_LIMITS = {
  PROFILE_ANALYSIS: 12288,
  PROFILE_BASICS: 2048,      // Quick extraction of name, age, location, etc.
  PROFILE_DEEP: 10240,       // Full psychological analysis
  USER_BACKSTORY: 4096,
  USER_SELF_ANALYSIS: 16384,
  DATE_SUGGESTIONS: 1500,
  LOCAL_EVENTS: 512,
  ZODIAC: 1024,
  OPENERS: 1024,
  PROMPT_OPENER: 512,
  COACHING: 2048,
  COACHING_SCORE: 512,
  COACHING_DATE_ASK: 1024,
  VIRTUE_EXTRACTION: 2048,
  VIRTUE_SCORING: 1536,
  ASK_ABOUT_MATCH: 1024,
  NEURODIVERGENCE_ANALYSIS: 4096,
  // 23 Aspects System
  USER_ASPECTS: 4096,      // Scoring all 23 aspects for user
  MATCH_ASPECTS: 4096,     // Scoring match + compatibility analysis
} as const;

// Timeout configuration in milliseconds
export const TIMEOUTS = {
  DEFAULT: 60000,           // 60 seconds default
  PROFILE_ANALYSIS: 120000, // 120 seconds for large analysis (deep analysis with many frames)
  QUICK_ANALYSIS: 30000,    // 30 seconds for basics extraction
} as const;

export function getApiKey(): string {
  // When using proxy, API key is stored server-side
  if (ANTHROPIC_CONFIG.USE_PROXY) {
    return ''; // Empty string - the Edge Function will add the key
  }

  const key = ANTHROPIC_CONFIG.API_KEY;
  if (!key) {
    throw new Error('Missing API Key. Please add VITE_ANTHROPIC_API_KEY to your .env file.');
  }
  return key;
}

export function isUsingProxy(): boolean {
  return ANTHROPIC_CONFIG.USE_PROXY;
}
