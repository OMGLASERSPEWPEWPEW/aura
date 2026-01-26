# ADR-0005: Streaming Chunked Analysis

## Status
Accepted

## Date
2025-01-24

## Context
Profile analysis extracts 16 frames from a video and sends them to Claude for analysis. Initially, all 16 frames were sent in a single API call. This caused problems:

1. **Long wait times**: Users saw nothing for 30-60 seconds
2. **Timeout risk**: Large payloads could exceed API timeouts
3. **Data loss**: If user navigated away, all progress was lost
4. **Poor UX**: No indication of progress or partial results

We needed a way to provide incremental feedback and protect against data loss.

## Decision
We implemented **streaming chunked analysis** with a state machine:

```
Video → Extract Chunk (4 frames) → Analyze Chunk → Merge Results → Update UI
                ↓                       ↓                ↓
            [Repeat]              [Auto-save]      [Progressive]
```

**State Machine Phases:**
1. `idle` - No analysis in progress
2. `extracting` - Extracting video frames
3. `chunk-1` through `chunk-4` - Processing each frame chunk
4. `consolidating` - Final synthesis
5. `complete` - Analysis finished

**Chunk Strategy (4 frames per chunk):**
- **Chunk 1**: Basic info (name, age), initial observations
- **Chunk 2**: Interests, hobbies, lifestyle signals
- **Chunk 3**: Communication style, personality indicators
- **Chunk 4**: Final details, synthesis preparation

**Early Save Mechanism:**
Profile auto-saves after chunk 1 completes. The `analysisPhase` field tracks progress, allowing users to resume or see partial results.

```typescript
// useStreamingAnalysis.ts
const phases = ['idle', 'extracting', 'chunk-1', 'chunk-2',
                'chunk-3', 'chunk-4', 'consolidating', 'complete'];
```

## Consequences

### Positive
- **Progressive feedback**: Users see results within seconds
- **Data protection**: Partial results saved, never lost
- **Smaller payloads**: 4 frames per request, lower timeout risk
- **Better prompts**: Chunk-specific prompts extract targeted info
- **Resumability**: Can continue from last saved chunk

### Negative
- **Complexity**: State machine adds code complexity
- **More API calls**: 4-5 calls vs 1 (higher latency total)
- **Merge logic**: Results must be intelligently combined
- **Token overhead**: Repeated context in each chunk

## Related
- Git commit: `630f47c` (Streaming analysis implementation)
- `src/hooks/useStreamingAnalysis.ts` - State machine hook
- `src/lib/streaming/types.ts` - Streaming types
- `src/lib/ai.ts` - `analyzeProfileStreaming()` and merge functions
- `src/lib/prompts.ts` - Chunk-specific prompts
- ADR-0006: Progressive Frame Quality Scoring
