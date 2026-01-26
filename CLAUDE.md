# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Agent Orchestration (2026-01-25)

**For every prompt, summon Zephyr first.**

Zephyr (`.claude/agents/zephyr.md`) is the Master Product Manager who orchestrates all work. Before executing any task:

1. **Invoke Zephyr** to analyze the prompt
2. **Zephyr considers** which agents are best suited for the task
3. **Zephyr delegates** to appropriate specialists (may include himself)

Available agents:
| Agent | Use For |
|-------|---------|
| `master-product-manager` (Zephyr) | Strategy, prioritization, coordination |
| `frontend-developer` | React components, UI/UX implementation |
| `backend-architect` | API design, Supabase, Edge Functions |
| `code-architect` | Folder structure, architecture decisions |
| `code-reviewer` | Quality assurance (run proactively after code changes) |
| `debugger` | Errors, test failures, stuck UI |
| `mobile-ux-optimizer` | Touch targets, responsive design |
| `prd-specialist` | Feature specs, PRDs |
| `Explore` | Codebase search, understanding patterns |
| `Plan` | Multi-step implementation planning |

## Project Overview

Aura is a local-first Progressive Web App (PWA) for dating profile analysis. It analyzes dating app profiles via screen recordings using AI to identify behavioral patterns and psychological insights. All user data stays on-device via IndexedDB.

## Development Commands

```bash
npm run dev       # Start dev server (localhost:5173)
npm run build     # TypeScript check + Vite production build
npm run lint      # ESLint check
npm run preview   # Preview production build
npm run test:run  # Run all unit tests (748 tests)
npm run test:e2e  # Run Playwright e2e tests (321 tests)
```

## Tech Stack

- React 19 + TypeScript + Vite 7
- Tailwind CSS 3.4
- Dexie.js (IndexedDB wrapper) for local storage
- Anthropic API (Claude) called directly from browser
- React Router for navigation

## Architecture

### Core Data Flow

```
Video Upload → Frame Extraction (Canvas) → AI Analysis → IndexedDB → UI
```

### Streaming Analysis Architecture

The app uses progressive streaming analysis to provide incremental results as frames are processed:

```
Video → Extract Chunk (4 frames) → Analyze Chunk → Merge Results → Update UI
                ↓                       ↓                ↓
            [Repeat]              [Auto-save]      [Progressive]
```

**State Machine Phases:**
1. `idle` - No analysis in progress
2. `extracting` - Extracting video frames
3. `chunk-1` through `chunk-4` - Processing each frame chunk
4. `consolidating` - Final synthesis of all chunks
5. `complete` - Analysis finished

**Chunk Strategy (4 frames per chunk):**
- **Chunk 1**: Basic info (name, age), initial observations
- **Chunk 2**: Interests, hobbies, lifestyle signals
- **Chunk 3**: Communication style, personality indicators
- **Chunk 4**: Final details, synthesis preparation

**Early Save Mechanism:** Profile auto-saves after chunk 1 completes. This prevents data loss if the user navigates away mid-analysis. The `analysisPhase` field tracks progress.

**Progressive Thumbnail Selection:** All 16 frames are scored for quality (brightness, color variance, edge density) to select the best thumbnail:
1. **Chunk 1**: Frames 0-3 scored immediately, initial thumbnail selected (fast start)
2. **Chunks 2-4**: Frames 4-15 scored in background as each chunk completes
3. **Consolidating phase**: If any frame scores 15+ points higher than current thumbnail, upgrade to better frame

This ensures fast initial display while ultimately selecting the optimal thumbnail from all frames.

**Key Files:**
- `src/hooks/useStreamingAnalysis.ts` - State machine hook, progressive thumbnail logic
- `src/lib/frameQuality.ts` - Frame quality scoring (brightness, variance, edge detection)
- `src/lib/streaming/types.ts` - Streaming types and chunk definitions
- `src/lib/ai.ts` - `analyzeProfileStreaming()` and merge functions
- `src/components/upload/` - Progressive UI components

### Directory Structure

- `public/` - Static assets and PWA configuration
  - `manifest.json` - PWA manifest (icons, theme, display mode)
  - `logo-full.png` - Primary logo asset (1024x1024)
  - `favicon-16.png`, `favicon-32.png` - Browser favicons
  - `apple-touch-icon.png` - iOS home screen icon (180x180)
  - `icon-192.png`, `icon-512.png` - PWA icons
  - `og-image.png` - Open Graph social sharing image (1200x630)

- `src/lib/` - Core business logic
  - `api/` - Anthropic API client (`anthropicClient.ts`, `config.ts`, `jsonExtractor.ts`)
  - `utils/` - Shared utilities (`userContext.ts`, `profileHelpers.ts`)
  - `streaming/` - Streaming analysis types and chunk definitions
  - `ai.ts` - AI function orchestration (includes `analyzeProfileStreaming()`)
  - `db.ts` - Dexie schema and TypeScript types
  - `prompts.ts` - AI prompt templates (includes chunk-specific prompts)
  - `frameExtraction.ts` - Video frame extraction via Canvas (chunked support)
  - `frameQuality.ts` - Frame quality scoring for thumbnail selection
  - `weather.ts` - Weather API integration

- `src/hooks/` - Custom React hooks for feature state management
  - `useStreamingAnalysis.ts` - State machine hook for progressive analysis
  - `useZodiacCompatibility.ts`, `useDateIdeas.ts`, `useOpenerRefresh.ts`, `useCopyToClipboard.ts`

- `src/pages/` - Route-level components
  - `Home.tsx` - Profile gallery
  - `Upload.tsx` - Video upload and analysis
  - `ProfileDetail.tsx` - Match profile view (orchestrates section components)
  - `MyProfile.tsx` - User's own profile management

- `src/components/`
  - `profileDetail/` - Section components for ProfileDetail page
  - `profile/` - Tab components for MyProfile page
  - `upload/` - Progressive analysis UI (ProgressiveHeader, InsightCard)
  - `ui/` - Reusable UI components (Logo, buttons, cards, etc.)

### Key Patterns

**API Layer**: All Anthropic calls go through `src/lib/api/anthropicClient.ts`. Use `callAnthropicForObject<T>()` or `callAnthropicForArray<T>()` - never raw fetch calls.

**JSON Extraction**: AI responses may contain markdown. The `jsonExtractor.ts` uses substring extraction (first `{`/`[` to last `}`/`]`) before parsing. Do not simplify this logic.

**Type System**: Profile analysis uses union type `AnalysisData = ProfileAnalysis | LegacyAnalysis | { raw: string }`. Always use `extractAnalysisFields()` from `lib/utils/profileHelpers.ts` to safely access fields.

**Local-First**: All persistence via Dexie (IndexedDB). No backend database. Schema changes require new `db.version()` with migration.

**Direct Browser API Calls**: Frontend calls Anthropic directly with `anthropic-dangerous-direct-browser-access` header. API key from `.env` as `VITE_ANTHROPIC_API_KEY`.

**Logo Component**: Use `<Logo />` from `src/components/ui/Logo.tsx` for consistent branding. Supports sizes (`sm`, `md`, `lg`, `xl`) and optional `showText`/`showTagline` props.

### Database Schema (Dexie)

Two tables in `AuraDB`:
- `profiles` - Analyzed match profiles
- `userIdentity` - Single record (id=1) for user's own profile data
  - `manualEntry.livingSituation` - User's living situation: 'solo' | 'roommates' | 'caregiving'

### Environment Variables

Required in `.env`:
```
VITE_ANTHROPIC_API_KEY=your_key_here
```

## Workflow Guidelines

### Task Tracking
When planning multi-step tasks, create a todo list to track progress. Update task status as you complete each step. This keeps work organized and provides visibility into progress.

### Test Maintenance
Tests live alongside the code they cover:
- **Unit tests** (`*.test.ts` files) - 748 tests via Vitest
- **E2E tests** (`e2e/*.spec.ts` files) - 321 tests via Playwright

When making code changes:
- **Adding a feature**: Add corresponding unit tests
- **Modifying a feature**: Update affected tests to match new behavior
- **Removing a feature**: Remove obsolete tests

**Always run BOTH test suites before pushing to main:**
```bash
npm run test:run  # Unit tests
npm run test:e2e  # E2E tests (Playwright)
```

Only consider work complete when both pass.

### Documentation Maintenance
After completing any feature work, consider whether documentation needs updating. Check:
- **This file (CLAUDE.md)**: Update if architecture, patterns, or key files change
- **Code comments**: Update inline comments if behavior changes significantly
- **Reference docs**: If changing features based on `.claude/docs/` designs, note any deviations

Triggers for documentation review:
- Completing a new feature
- Removing or deprecating a feature
- Changing core architecture or data flow
- Adding new files/directories to the structure
- Modifying database schema

## Important Constraints

1. **Privacy**: User data never leaves device except anonymous frames sent to LLM
2. **No Backend**: All storage is client-side IndexedDB
3. **Video Handling**: Videos processed locally via Canvas, never uploaded
4. **iOS Safari**: Videos must be muted and playsinline for frame extraction

## Infrastructure

### Production Hosting (Vercel)
- **URL:** https://aura-xi-ten.vercel.app
- **Repo:** github.com/OMGLASERSPEWPEWPEW/aura
- **Auto-deploy:** Every push to `main` triggers deploy
- **CLI:** `vercel` commands available for logs/debugging

### API Proxy (Supabase Edge Function)
- **Project:** qaueoxubnifmtdirnxgz
- **Edge Function:** `anthropic-proxy` at `/functions/v1/anthropic-proxy`
- **Purpose:** Keeps Anthropic API key server-side (not in browser bundle)
- **Tier:** Pro (150-second timeout). Free tier has 60-second timeout.

### Environment Variables

**Vercel (Production):**
- `VITE_USE_PROXY=true`
- `VITE_SUPABASE_URL=https://qaueoxubnifmtdirnxgz.supabase.co`
- `VITE_SUPABASE_ANON_KEY=<anon_key>`

**Local Development (.env):**
- Same as above, OR
- `VITE_USE_PROXY=false` + `VITE_ANTHROPIC_API_KEY=<key>` for direct API

### CLI Tools for Debugging
- `vercel logs <deployment-url>` - View runtime logs
- `vercel list` - See recent deployments
- Supabase MCP - Query database and Edge Function logs directly

## Reference Documentation

Design documents in `.claude/docs/` informed the implementation but are NOT runtime dependencies:

| Document | Implemented In | Purpose |
|----------|---------------|---------|
| `virtue_system.md` | `src/lib/virtues/virtues.ts` | **11 Virtues** system (3 realms, compatibility scoring) |
| `12152025 - Scene & Dialogue Basics 2025 - With Agendas & Tactics.md` | `src/lib/prompts.ts` | Agendas & Tactics framework for psychological analysis |

**Note:** The old "23 Aspects" system (`aspects.ts`) is deprecated. New code should use the **11 Virtues** system. Legacy profiles auto-migrate via `src/lib/virtues/migration.ts`.

These docs define the **conceptual framework**. The actual implementation lives in code. If updating the framework, modify the source code files, not just the docs.

## Architecture Decision Records

Major architectural decisions are documented in `docs/adr/`. Each ADR captures the context, decision, and consequences of significant technical choices.

| ADR | Title | Status |
|-----|-------|--------|
| [0001](docs/adr/0001-local-first-architecture.md) | Local-First Architecture | Accepted |
| [0002](docs/adr/0002-direct-browser-api-calls.md) | Direct Browser API Calls | Superseded by 0004 |
| [0003](docs/adr/0003-dexie-over-raw-indexeddb.md) | Dexie over Raw IndexedDB | Accepted |
| [0004](docs/adr/0004-supabase-edge-function-proxy.md) | Supabase Edge Function Proxy | Accepted |
| [0005](docs/adr/0005-streaming-chunked-analysis.md) | Streaming Chunked Analysis | Accepted |
| [0006](docs/adr/0006-progressive-frame-quality.md) | Progressive Frame Quality Scoring | Accepted |
| [0007](docs/adr/0007-eleven-virtues-system.md) | Eleven Virtues System | Accepted |
| [0008](docs/adr/0008-authentication-and-sync.md) | Authentication & Cross-Device Sync | Accepted |
| [0009](docs/adr/0009-typed-error-infrastructure.md) | Typed Error Infrastructure | Accepted |
| [0010](docs/adr/0010-testing-strategy.md) | Testing Strategy | Accepted |

See `docs/adr/README.md` for the full index and ADR template.
