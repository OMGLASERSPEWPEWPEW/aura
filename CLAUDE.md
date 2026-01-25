# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Aura is a local-first Progressive Web App (PWA) for dating profile analysis. It analyzes dating app profiles via screen recordings using AI to identify behavioral patterns and psychological insights. All user data stays on-device via IndexedDB.

## Development Commands

```bash
npm run dev       # Start dev server (localhost:5173)
npm run build     # TypeScript check + Vite production build
npm run lint      # ESLint check
npm run preview   # Preview production build
npm run test:run  # Run all unit tests
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
  - `ui/` - Reusable UI components

### Key Patterns

**API Layer**: All Anthropic calls go through `src/lib/api/anthropicClient.ts`. Use `callAnthropicForObject<T>()` or `callAnthropicForArray<T>()` - never raw fetch calls.

**JSON Extraction**: AI responses may contain markdown. The `jsonExtractor.ts` uses substring extraction (first `{`/`[` to last `}`/`]`) before parsing. Do not simplify this logic.

**Type System**: Profile analysis uses union type `AnalysisData = ProfileAnalysis | LegacyAnalysis | { raw: string }`. Always use `extractAnalysisFields()` from `lib/utils/profileHelpers.ts` to safely access fields.

**Local-First**: All persistence via Dexie (IndexedDB). No backend database. Schema changes require new `db.version()` with migration.

**Direct Browser API Calls**: Frontend calls Anthropic directly with `anthropic-dangerous-direct-browser-access` header. API key from `.env` as `VITE_ANTHROPIC_API_KEY`.

### Database Schema (Dexie)

Two tables in `AuraDB`:
- `profiles` - Analyzed match profiles
- `userIdentity` - Single record (id=1) for user's own profile data

### Environment Variables

Required in `.env`:
```
VITE_ANTHROPIC_API_KEY=your_key_here
```

## Workflow Guidelines

### Task Tracking
When planning multi-step tasks, create a todo list to track progress. Update task status as you complete each step. This keeps work organized and provides visibility into progress.

### Unit Test Maintenance
Tests live alongside the code they cover (`*.test.ts` files). When making code changes:
- **Adding a feature**: Add corresponding unit tests
- **Modifying a feature**: Update affected tests to match new behavior
- **Removing a feature**: Remove obsolete tests

Always run `npm run test:run` after implementation to catch regressions before considering work complete.

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
