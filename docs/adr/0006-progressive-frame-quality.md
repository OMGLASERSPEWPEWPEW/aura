# ADR-0006: Progressive Frame Quality Scoring

## Status
Accepted

## Date
2025-01-24

## Context
Aura extracts 16 frames from dating profile videos to use as thumbnails and for AI analysis. Initially, we simply used the first frame as the thumbnail. This often resulted in poor thumbnails:

- Blurry transition frames
- Dark/poorly lit frames
- Frames with hands or obstructions
- Loading screens or app UI

We needed a way to select the "best" frame for the thumbnail while maintaining fast initial display.

## Decision
We implemented **progressive frame quality scoring** that runs alongside chunked analysis (ADR-0005):

**Quality Scoring Algorithm:**
```typescript
// frameQuality.ts
function scoreFrame(imageData: ImageData): number {
  const brightness = calculateBrightness(pixels);      // 0-100 points
  const colorVariance = calculateColorVariance(pixels); // 0-50 points
  const edgeDensity = calculateEdgeDensity(pixels);    // 0-50 points
  return brightness + colorVariance + edgeDensity;
}
```

Scoring factors:
- **Brightness**: Penalize too dark or too bright frames
- **Color variance**: Prefer visually interesting frames
- **Edge density**: Detect faces/features vs. blank walls

**Progressive Selection Strategy:**
1. **Chunk 1 complete**: Score frames 0-3, select best as initial thumbnail
2. **Chunks 2-4**: Score frames 4-15 in background as chunks complete
3. **Consolidating phase**: If any frame scores 15+ points higher, upgrade thumbnail

```typescript
// useStreamingAnalysis.ts
if (newScore > currentScore + UPGRADE_THRESHOLD) {
  setThumbnail(betterFrame);
}
```

## Consequences

### Positive
- **Better thumbnails**: Visually appealing frames selected automatically
- **Fast initial display**: First thumbnail within seconds (chunk 1)
- **Progressive improvement**: Can upgrade if better frame found later
- **No user action required**: Fully automatic selection

### Negative
- **CPU overhead**: Canvas pixel analysis for each frame
- **Heuristic limitations**: Algorithm can't detect "interesting" content
- **Threshold tuning**: 15-point upgrade threshold is somewhat arbitrary
- **Memory usage**: All frames held in memory for comparison

## Related
- Git commit: `630f47c` (Streaming analysis implementation)
- `src/lib/frameQuality.ts` - Quality scoring algorithm
- `src/hooks/useStreamingAnalysis.ts` - Progressive thumbnail logic
- `src/lib/frameExtraction.ts` - Frame extraction with chunked support
- ADR-0005: Streaming Chunked Analysis
