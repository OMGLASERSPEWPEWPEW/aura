# Architecture Audit

**Agent Persona**: Code Architect
**Date**: January 2026
**Scope**: Aura PWA Technical Architecture Review

---

## Executive Summary

Aura is a local-first Progressive Web App built on React 19 + TypeScript + Vite 7. While the current architecture successfully delivers core functionality, several architectural decisions create scaling limitations and security concerns that must be addressed before monetization.

---

## Current Data Flow

```
Video Upload → Frame Extraction (Canvas) → AI Analysis → IndexedDB → UI
```

### Flow Breakdown

1. **Video Upload**: User selects video file via HTML `<input type="file">`
2. **Frame Extraction**: Canvas API extracts frames locally (iOS Safari compatible with muted + playsinline)
3. **AI Analysis**: 2-stage process:
   - Stage 1: Basic profile extraction
   - Stage 2: Deep psychological analysis
4. **Storage**: Dexie.js persists to IndexedDB
5. **Rendering**: React components consume Dexie hooks

---

## Dexie.js Architecture Limits

### Storage Quotas

| Browser | Quota | Practical Limit |
|---------|-------|-----------------|
| Chrome | ~60% of disk | Effectively unlimited |
| Safari | ~1GB total | ~50-100MB per origin |
| Firefox | ~50% of disk | Effectively unlimited |

**Estimated Capacity**: ~300 profiles maximum assuming:
- Average profile: 150-300KB (JSON + base64 thumbnails)
- Conservative 50MB quota on Safari

### Schema Migration Fragility

Current implementation has **6 schema versions**:

```typescript
db.version(1).stores({ profiles: '++id, name' });
db.version(2).stores({ profiles: '++id, name', userIdentity: 'id' });
// ... through version 6
```

**Risks**:
- Each migration must handle all previous schemas
- No automated migration testing
- Upgrade failures can corrupt local database
- No rollback mechanism

### Type System Complexity

The analysis data uses a union type with 3 variants:

```typescript
type AnalysisData = ProfileAnalysis | LegacyAnalysis | { raw: string }
```

This requires defensive access patterns via `extractAnalysisFields()` helper. Every consumer must handle all variants.

### Indexing Limitations

Current indexes:
- `profiles`: Only primary key (`++id`) and `name`
- `userIdentity`: Only primary key (`id`)

**Missing**:
- No date/time indexes for sorting
- No composite indexes for filtering
- No full-text search capability

### Base64 Encoding Overhead

Thumbnails stored as base64 data URIs:
- **Overhead**: 33% larger than binary
- **Impact**: Reduced effective storage capacity
- **Alternative**: Blob storage with URL.createObjectURL()

---

## Technical Debt Inventory

### CRITICAL: API Key Exposure

```typescript
// Current implementation (INSECURE)
const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
// This key is embedded in the production bundle!
```

**Risk**: Anyone can extract the API key from browser DevTools and:
- Exhaust your API quota
- Incur unlimited charges to your Anthropic account
- Use your key for unrelated purposes

**Required Fix**: Route all API calls through authenticated backend proxy.

### Inconsistent Error Handling

Three different patterns observed in API layer:

1. **Try-catch with console.error** (most common)
```typescript
try { ... } catch (e) { console.error(e); return null; }
```

2. **Error state propagation**
```typescript
if (error) { setError(error.message); return; }
```

3. **Silent failure**
```typescript
catch { return defaultValue; }
```

**Recommendation**: Standardize on Result type pattern or centralized error boundary.

### Fragile JSON Extraction

Current approach in `jsonExtractor.ts`:

```typescript
// Find first { or [ and last } or ]
const start = Math.min(
  content.indexOf('{') !== -1 ? content.indexOf('{') : Infinity,
  content.indexOf('[') !== -1 ? content.indexOf('[') : Infinity
);
```

**Risks**:
- Breaks on nested JSON in markdown code blocks
- Breaks on JSON containing string literals with `{` or `}`
- No validation against expected schema

### Hardcoded Retry Logic

```typescript
// Not rate-limit aware
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
```

**Missing**:
- Exponential backoff
- Rate limit header parsing (`x-ratelimit-*`)
- Circuit breaker pattern
- Retry budget tracking

### Schema Sprawl

The `ProfileAnalysis` type has **30+ optional fields**:

```typescript
interface ProfileAnalysis {
  name?: string;
  age?: string | number;
  location?: string;
  occupation?: string;
  education?: string;
  // ... 25+ more optional fields
}
```

**Issues**:
- No runtime validation (only compile-time types)
- Any field can be undefined at runtime
- No schema versioning for analysis output
- Difficult to maintain backwards compatibility

---

## Token Allocation Analysis

Current token budgets across prompts:

| Use Case | Max Tokens | Purpose |
|----------|------------|---------|
| Profile Analysis | 16,384 | Full psychological analysis |
| Deep Analysis | 8,192 | Secondary analysis pass |
| Compatibility | 4,096 | Match scoring |
| Virtues | 4,096 | Eudaimonia analysis |
| Date Ideas | 2,048 | Suggestions |
| Openers | 2,048 | Conversation starters |
| Ask About Match | 4,096 | Chat responses |
| User Synthesis | 8,192 | Profile generation |
| Coaching | 4,096 | Conversation advice |

**Total distinct budgets**: 21 different configurations
**Largest allocation**: 16,384 tokens (profile analysis)

**Cost implications**:
- Claude Sonnet 3.5: ~$0.003 per 1K input, ~$0.015 per 1K output
- Average analysis: ~$0.15-0.25 per profile
- Heavy users (50+ profiles): $7.50-12.50/month API cost

---

## Recommendations

### Immediate (Security)
1. **API Proxy**: Route all Anthropic calls through backend
2. **Rate Limiting**: Implement per-user rate limits
3. **Key Rotation**: New API key after proxy deployment

### Short-term (Stability)
1. **Standardize Error Handling**: Adopt Result pattern
2. **Add Runtime Validation**: Zod schemas for API responses
3. **Improve JSON Extraction**: Use proper markdown code block parsing

### Medium-term (Scalability)
1. **Hybrid Storage**: PostgreSQL for metadata, local for video/frames
2. **Add Proper Indexes**: Date, compatibility score, tags
3. **Binary Thumbnails**: Switch from base64 to Blob storage

### Long-term (Architecture)
1. **Event Sourcing**: Track all analysis changes
2. **Offline-First Sync**: CRDTs for conflict resolution
3. **Modular Prompts**: Template system for token optimization

---

## Appendix: File References

- API Client: `src/lib/api/anthropicClient.ts`
- JSON Extractor: `src/lib/api/jsonExtractor.ts`
- Database Schema: `src/lib/db.ts`
- Type Definitions: `src/lib/db.ts` (ProfileAnalysis type)
- Prompts: `src/lib/prompts.ts`
