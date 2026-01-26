# ADR-0002: Direct Browser API Calls

## Status
**Superseded by ADR-0004** (Supabase Edge Function Proxy)

## Date
2025-01-01

## Context
For AI-powered profile analysis, we needed to call the Anthropic API. The standard approach is to route API calls through a backend server to keep API keys secure. However, our local-first architecture (ADR-0001) had no backend.

Options considered:
1. Build a backend just for API proxying
2. Call Anthropic API directly from browser
3. Use a serverless function

## Decision
We chose to call the Anthropic API **directly from the browser** during initial development:

```typescript
// anthropicClient.ts
const response = await fetch('https://api.anthropic.com/v1/messages', {
  headers: {
    'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
    'anthropic-dangerous-direct-browser-access': 'true',
  },
});
```

Key aspects:
- API key stored in environment variable (`VITE_ANTHROPIC_API_KEY`)
- Used Anthropic's `anthropic-dangerous-direct-browser-access` header
- Acceptable for development/personal use

## Consequences

### Positive
- **No backend required**: Maintained local-first simplicity
- **Fast iteration**: No server deployment needed
- **Direct debugging**: Could inspect API calls in browser DevTools

### Negative
- **API key exposure**: Key visible in browser bundle (security risk)
- **Not production-ready**: Anthropic discourages this for public apps
- **Rate limit issues**: All users would share same key
- **Key rotation difficulty**: Requires rebuild to change key

## Why Superseded
For production deployment, exposing the API key was unacceptable. ADR-0004 documents the migration to a Supabase Edge Function proxy that keeps the API key server-side while maintaining the local-first data model.

## Related
- Git commit: `3d88ce8` (Initial commit)
- `src/lib/api/anthropicClient.ts` (updated in ADR-0004)
- ADR-0004: Supabase Edge Function Proxy
