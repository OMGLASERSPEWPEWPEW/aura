// src/lib/api/config.ts
// Centralized Anthropic API configuration

export const ANTHROPIC_CONFIG = {
  API_KEY: import.meta.env.VITE_ANTHROPIC_API_KEY as string,
  API_ENDPOINT: 'https://api.anthropic.com/v1/messages',
  API_VERSION: '2023-06-01',
  MODEL: 'claude-sonnet-4-5-20250929',
} as const;

export const TOKEN_LIMITS = {
  PROFILE_ANALYSIS: 4096,
  USER_BACKSTORY: 4096,
  USER_SELF_ANALYSIS: 8192,
  DATE_SUGGESTIONS: 1500,
  LOCAL_EVENTS: 512,
  ZODIAC: 1024,
  OPENERS: 1024,
  PROMPT_OPENER: 512,
} as const;

export function getApiKey(): string {
  const key = ANTHROPIC_CONFIG.API_KEY;
  if (!key) {
    throw new Error('Missing API Key. Please add VITE_ANTHROPIC_API_KEY to your .env file.');
  }
  return key;
}
