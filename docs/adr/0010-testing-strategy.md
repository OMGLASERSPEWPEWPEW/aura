# ADR-0010: Testing Strategy

## Status
Accepted

## Date
2025-01-24

## Context
As Aura's codebase grew, we needed automated testing to:
- Prevent regressions during rapid development
- Document expected behavior
- Enable confident refactoring
- Catch bugs before production

We evaluated testing approaches:
1. **Unit tests only** - Fast but miss integration issues
2. **E2E tests only** - Comprehensive but slow and flaky
3. **Unit + E2E** - Best coverage but more maintenance

Key constraints:
- Local-first app with IndexedDB (hard to test)
- Browser APIs (Canvas, Video) need mocking or real browser
- AI responses need stubbing for deterministic tests

## Decision
We adopted a **two-tier testing strategy**:

**Tier 1: Unit Tests (Vitest)**
- 624+ tests covering business logic
- Fast execution (~5 seconds full suite)
- Mock external dependencies (AI, IndexedDB)
- Test individual functions and hooks

```typescript
// Example: frameQuality.test.ts
describe('scoreFrame', () => {
  it('scores bright frames higher than dark', () => {
    const brightFrame = createMockFrame({ brightness: 200 });
    const darkFrame = createMockFrame({ brightness: 50 });
    expect(scoreFrame(brightFrame)).toBeGreaterThan(scoreFrame(darkFrame));
  });
});
```

**Tier 2: E2E Tests (Playwright)**
- 201+ tests covering user journeys
- Real browser execution (Chromium, WebKit)
- Test full flows: upload → analysis → profile view
- Stub AI responses for determinism

```typescript
// Example: upload.spec.ts
test('user can upload video and see analysis', async ({ page }) => {
  await page.goto('/upload');
  await page.setInputFiles('input[type="file"]', 'fixtures/test-video.mp4');
  await expect(page.getByText('Analysis complete')).toBeVisible();
});
```

**Test Organization:**
```
src/
├── lib/
│   ├── frameQuality.ts
│   └── frameQuality.test.ts    # Unit test alongside source
e2e/
├── upload.spec.ts              # E2E tests in dedicated folder
└── fixtures/
    └── test-video.mp4
```

**CI Integration:**
Both suites run on every PR via GitHub Actions.

## Consequences

### Positive
- **High confidence**: 825+ tests catch most regressions
- **Fast feedback**: Unit tests run in seconds
- **Real browser testing**: E2E catches browser-specific bugs
- **Documentation**: Tests document expected behavior
- **Refactoring safety**: Can change internals confidently

### Negative
- **Maintenance burden**: Tests must be updated with code
- **Flaky E2E**: Browser tests occasionally fail spuriously
- **Mock complexity**: IndexedDB mocking is non-trivial
- **CI time**: Full E2E suite takes ~2 minutes

## Related
- Git commits: `6989f1a` (Vitest), `bea3b30` (Playwright)
- `vitest.config.ts` - Unit test configuration
- `playwright.config.ts` - E2E test configuration
- `src/**/*.test.ts` - Unit tests
- `e2e/*.spec.ts` - E2E tests
