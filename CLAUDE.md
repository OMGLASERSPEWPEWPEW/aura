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

### Directory Structure

- `src/lib/` - Core business logic
  - `api/` - Anthropic API client (`anthropicClient.ts`, `config.ts`, `jsonExtractor.ts`)
  - `utils/` - Shared utilities (`userContext.ts`, `profileHelpers.ts`)
  - `ai.ts` - AI function orchestration (uses api/ internally)
  - `db.ts` - Dexie schema and TypeScript types
  
  - `prompts.ts` - AI prompt templates
  - `frameExtraction.ts` - Video frame extraction via Canvas
  - `weather.ts` - Weather API integration

- `src/hooks/` - Custom React hooks for feature state management
  - `useZodiacCompatibility.ts`, `useDateIdeas.ts`, `useOpenerRefresh.ts`, `useCopyToClipboard.ts`

- `src/pages/` - Route-level components
  - `Home.tsx` - Profile gallery
  - `Upload.tsx` - Video upload and analysis
  - `ProfileDetail.tsx` - Match profile view (orchestrates section components)
  - `MyProfile.tsx` - User's own profile management

- `src/components/`
  - `profileDetail/` - Section components for ProfileDetail page
  - `profile/` - Tab components for MyProfile page
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
