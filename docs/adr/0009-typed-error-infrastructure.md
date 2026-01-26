# ADR-0009: Typed Error Infrastructure

## Status
Accepted

## Date
2025-01-25

## Context
As Aura grew, error handling became inconsistent:

```typescript
// Before: Inconsistent error handling
try {
  await analyzeProfile(video);
} catch (e) {
  console.error(e);
  setError('Something went wrong'); // Generic, unhelpful
}
```

Problems:
- Generic error messages gave users no actionable info
- Different components handled errors differently
- No way to programmatically respond to specific error types
- Difficult to track error patterns in production

We needed a structured approach to errors that would:
1. Provide clear user-facing messages
2. Enable programmatic error handling
3. Support debugging and monitoring
4. Work with TypeScript's type system

## Decision
We implemented a **typed error infrastructure** with error codes and categories:

**Error Class Hierarchy:**
```typescript
// errors.ts
class AuraError extends Error {
  code: ErrorCode;
  category: ErrorCategory;
  userMessage: string;
  details?: Record<string, unknown>;
}

type ErrorCategory = 'api' | 'video' | 'storage' | 'auth' | 'sync';

type ErrorCode =
  | 'API_RATE_LIMIT'
  | 'API_INVALID_KEY'
  | 'API_TIMEOUT'
  | 'VIDEO_EXTRACTION_FAILED'
  | 'VIDEO_FORMAT_UNSUPPORTED'
  | 'STORAGE_QUOTA_EXCEEDED'
  // ... etc
```

**Error Boundary Integration:**
```typescript
// ErrorBoundary.tsx
function ErrorFallback({ error }: { error: AuraError }) {
  return (
    <div>
      <h2>{error.userMessage}</h2>
      {error.code === 'API_RATE_LIMIT' && (
        <p>Please wait a moment and try again.</p>
      )}
    </div>
  );
}
```

**Programmatic Handling:**
```typescript
try {
  await analyzeProfile(video);
} catch (e) {
  if (e instanceof AuraError && e.code === 'API_RATE_LIMIT') {
    await delay(60000);
    return retry();
  }
  throw e;
}
```

## Consequences

### Positive
- **Clear user messages**: Context-appropriate error text
- **Type safety**: TypeScript catches missing error handling
- **Programmatic recovery**: Can handle specific errors differently
- **Debugging**: Error codes map to documentation
- **Monitoring**: Can track error frequency by code

### Negative
- **Boilerplate**: More code to create typed errors
- **Migration effort**: Existing catch blocks needed updating
- **Maintenance**: Error code enum must stay in sync
- **Over-engineering risk**: Simple errors don't need this

## Related
- Git commit: `fc7532b` (Typed error infrastructure)
- `src/lib/errors.ts` - Error classes and codes
- `src/components/ErrorBoundary.tsx` - React error boundary
- `src/lib/api/anthropicClient.ts` - API error wrapping
