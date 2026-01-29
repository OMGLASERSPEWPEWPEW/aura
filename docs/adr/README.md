# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) documenting significant technical decisions made during Aura's development.

## What is an ADR?

An ADR captures a single architectural decision along with its context and consequences. They serve as a historical record explaining *why* certain choices were made, helping future developers understand the reasoning behind the codebase's structure.

## Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [0001](0001-local-first-architecture.md) | Local-First Architecture | Accepted | 2025-01-01 |
| [0002](0002-direct-browser-api-calls.md) | Direct Browser API Calls | Superseded by 0004 | 2025-01-01 |
| [0003](0003-dexie-over-raw-indexeddb.md) | Dexie over Raw IndexedDB | Accepted | 2025-01-01 |
| [0004](0004-supabase-edge-function-proxy.md) | Supabase Edge Function Proxy | Accepted | 2025-01-24 |
| [0005](0005-streaming-chunked-analysis.md) | Streaming Chunked Analysis | Accepted | 2025-01-24 |
| [0006](0006-progressive-frame-quality.md) | Progressive Frame Quality Scoring | Accepted | 2025-01-24 |
| [0007](0007-eleven-virtues-system.md) | Eleven Virtues System | Accepted | 2025-01-25 |
| [0008](0008-authentication-and-sync.md) | Authentication & Cross-Device Sync | Accepted | 2025-01-25 |
| [0009](0009-typed-error-infrastructure.md) | Typed Error Infrastructure | Accepted | 2025-01-25 |
| [0010](0010-testing-strategy.md) | Testing Strategy | Accepted | 2025-01-24 |
| [0011](0011-anonymous-feedback-pipeline.md) | Anonymous Feedback Pipeline | Accepted | 2026-01-28 |
| [0012](0012-resonance-vocabulary-system.md) | Resonance Vocabulary System | Accepted | 2026-01-28 |

## ADR Template

When creating a new ADR, use this template:

```markdown
# ADR-XXXX: Title

## Status
Accepted | Superseded by ADR-XXXX | Deprecated

## Date
YYYY-MM-DD

## Context
What is the issue motivating this decision?

## Decision
What is the change we're making?

## Consequences

### Positive
- Benefit 1
- Benefit 2

### Negative
- Tradeoff 1
- Tradeoff 2

## Related
- ADR links
- Code files
- Git commits
```

## Creating a New ADR

1. Copy the template above
2. Use the next sequential number (e.g., `0011-descriptive-name.md`)
3. Fill in all sections
4. Update this README's index
5. Commit with message: `docs: add ADR-XXXX for [topic]`

## Timeline

```
Jan 2025 - MVP Foundation
├── ADR-0001: Local-First Architecture
├── ADR-0002: Direct Browser API Calls
└── ADR-0003: Dexie over Raw IndexedDB

Jan 24 - Infrastructure & Analysis
├── ADR-0004: Supabase Edge Function Proxy
├── ADR-0005: Streaming Chunked Analysis
├── ADR-0006: Progressive Frame Quality
└── ADR-0010: Testing Strategy

Jan 25 - Scale & Reliability
├── ADR-0007: Eleven Virtues System
├── ADR-0008: Authentication & Sync
└── ADR-0009: Typed Error Infrastructure

Jan 28 - Help Desk & Display
├── ADR-0011: Anonymous Feedback Pipeline
└── ADR-0012: Resonance Vocabulary System
```
