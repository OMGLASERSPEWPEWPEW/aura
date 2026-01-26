# ADR-0004: Supabase Edge Function Proxy

## Status
Accepted

## Date
2025-01-24

## Context
ADR-0002 documented our initial approach of calling Anthropic directly from the browser. While functional for development, this exposed the API key in the client bundle—unacceptable for production.

Requirements for the solution:
1. Keep API key server-side (not in browser)
2. Maintain local-first data model (no user data on server)
3. Support long-running AI analysis (60+ seconds)
4. Minimize infrastructure complexity

Options evaluated:
1. **Vercel Serverless Functions** - 10s timeout on free tier, 60s max
2. **AWS Lambda** - Complex setup, cold starts
3. **Supabase Edge Functions** - 150s timeout on Pro, simple deployment
4. **Cloudflare Workers** - 30s timeout on free tier

## Decision
We implemented a **Supabase Edge Function** as an API proxy:

```typescript
// supabase/functions/anthropic-proxy/index.ts
Deno.serve(async (req) => {
  const { messages, model, max_tokens } = await req.json();

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': Deno.env.get('ANTHROPIC_API_KEY'),
      'content-type': 'application/json',
    },
    body: JSON.stringify({ messages, model, max_tokens }),
  });

  return new Response(response.body, { headers: response.headers });
});
```

Architecture:
```
Browser → Supabase Edge Function → Anthropic API
           (API key here)
```

Configuration:
- **Project ID**: `qaueoxubnifmtdirnxgz`
- **Endpoint**: `/functions/v1/anthropic-proxy`
- **Tier**: Pro (150-second timeout for streaming analysis)

## Consequences

### Positive
- **API key secure**: Never exposed to browser
- **Long timeouts**: 150s supports chunked analysis (ADR-0005)
- **Simple deployment**: `supabase functions deploy`
- **No user data stored**: Proxy is stateless, maintains local-first
- **Global edge**: Low latency worldwide

### Negative
- **Monthly cost**: Supabase Pro tier required (~$25/mo)
- **Vendor dependency**: Tied to Supabase platform
- **Extra hop**: Slight latency increase vs direct calls
- **New failure mode**: Edge function errors to handle

## Related
- Git commit: `5c407f4` (Supabase proxy implementation)
- `src/lib/api/anthropicClient.ts` - Client-side proxy routing
- `src/lib/api/config.ts` - Environment-based proxy toggle
- ADR-0002: Direct Browser API Calls (superseded)
