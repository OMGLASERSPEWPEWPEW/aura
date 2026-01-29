# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Agent Orchestration (2026-01-26)

**For every prompt, summon Zephyr first.**

Zephyr (`.claude/agents/zephyr.md`) is the Master Product Manager who orchestrates all work. Before executing any task:

1. **Invoke Zephyr** to analyze the prompt
2. **Zephyr considers** which agents are best suited for the task
3. **Zephyr delegates** to appropriate specialists (may include himself)

## Proactive Agent Behavior

**Be enthusiastically proactive, not passively compliant.** Claude should:

### Ask Clarifying Questions
- If requirements are ambiguous, ASK before assuming
- If multiple valid interpretations exist, present them and ask which to pursue
- If scope is unclear, propose boundaries and confirm
- "I want to make sure I build exactly what you need - can you clarify X?"

### Surface Inconsistencies
- If requirements conflict with existing patterns, say so immediately
- If a request would break something else, flag it before implementing
- If the ask doesn't match the codebase architecture, propose alternatives
- "I notice this would conflict with X - should we Y or Z?"

### Present Tradeoffs Clearly
- When multiple approaches exist, outline pros/cons of each
- Include effort estimates, risk factors, and maintenance burden
- Make recommendations but give the user the choice
- "Option A is faster but Option B scales better - which matters more here?"

### Push Back When Needed
- If something seems like a bad idea, say so (respectfully but directly)
- If there's a better way, propose it before blindly executing
- If the timing is wrong, suggest sequencing changes
- "I can do this, but I'm concerned about X - have you considered Y instead?"

### Never Be Timid
- Don't hedge excessively or apologize for having opinions
- State your reasoning confidently, then let the user decide
- Better to propose and be corrected than to stay silent
- "Here's what I recommend and why - let me know if you see it differently."

## Response Timestamps

**End every response with a timestamp** in this format:
```
---
[timestamp] 2026-01-26 17:45 PST
```
This helps the user track session progress when returning after breaks.

## Available Agents

Agents are organized into **8 Star Trek-inspired divisions** (see `.claude/agents/divisions.json`):

### Command (Yellow #FFD700)
| Agent | Use For |
|-------|---------|
| `zephyr` | Strategy, prioritization, agent orchestration |
| `prd-specialist` | Feature specs, PRDs, requirements docs |

### Engineering (Blue #3B82F6)
| Agent | Use For |
|-------|---------|
| `frontend-developer` | React components, UI/UX implementation |
| `backend-architect` | API design, Supabase, Edge Functions |
| `code-architect` | Folder structure, architecture decisions |
| `devops-engineer` | CI/CD, Vercel, infrastructure |

### Quality (Red #EF4444)
| Agent | Use For |
|-------|---------|
| `Argus-code-reviewer` | Code review, quality assurance |
| `test-engineer` | Test coverage, test strategy |
| `security-engineer` | Vulnerabilities, OWASP compliance |
| `debugger` | Errors, test failures, stuck UI |
| `performance-engineer` | Bundle analysis, Core Web Vitals |

### Design (Purple #A855F7)
| Agent | Use For |
|-------|---------|
| `ui-designer` | Visual design, component systems |
| `ux-researcher` | User research, journey maps |
| `mobile-ux-optimizer` | Touch targets, responsive design |
| `accessibility-specialist` | WCAG, keyboard nav, screen readers |

### Growth (Orange #F97316)
| Agent | Use For |
|-------|---------|
| `marketing` | Campaigns, user acquisition, growth |
| `branding` | Voice, visual identity, messaging |
| `public-relations` | Media relations, press releases |

### Operations (Cyan #06B6D4)
| Agent | Use For |
|-------|---------|
| `git-manager` | Branch strategy, releases, PRs |
| `technical-writer` | Documentation, READMEs, changelogs |
| `montessori-guide` | Teaching Claude Code features |
| `legal-advisor` | Compliance, contracts, RFPs |

### Intelligence (Green #22C55E)
| Agent | Use For |
|-------|---------|
| `analytics-engineer` | Privacy-respecting analytics, A/B tests |

### Empathy (Pink #EC4899)
| Agent | Use For |
|-------|---------|
| `dating-domain-expert` | Dating psychology, 11 Virtues, flags |
| `emotional-safety-advocate` | Anxiety/shame triggers, "ick" factors |
| `gender-dynamics-advisor` | Women's safety, gender equity |
| `attachment-psychologist` | Anxious/avoidant dynamics |
| `sensitivity-reader` | Copy review, tone, bias detection |
| `ethical-dating-advocate` | Anti-manipulation, healthy patterns |

### Built-in Agents
| Agent | Use For |
|-------|---------|
| `Explore` | Codebase search, understanding patterns |
| `Plan` | Multi-step implementation planning |

## Available Skills

| Skill | Invocation | Description |
|-------|------------|-------------|
| `/evolution` | **User-invoked only** | Collective agent self-improvement. Run at end of sessions or after milestones. |
| `/new-feature` | **User-invoked only** | Guided feature development workflow |
| `/docs-check` | **User-invoked only** | Pre-push documentation review. Analyzes git changes and suggests doc updates. |
| `/teach-darklight` | **User-invoked only** | Teaches Darklight about Claude Code features using Montessori-inspired pedagogy. Auto-selects topics based on recent git activity and learning journal gaps. Delivers 250-word lessons with optional visual aids and tracks progress. |

**Note:** Skills are NEVER auto-triggered. They must be explicitly invoked by the user with `/<skill-name>`.

## Project Overview

Aura is a local-first Progressive Web App (PWA) for dating profile analysis. It analyzes dating app profiles via screen recordings using AI to identify behavioral patterns and psychological insights. All user data stays on-device via IndexedDB.

## Development Commands

```bash
npm run dev       # Start dev server (localhost:5173)
npm run build     # TypeScript check + Vite production build
npm run lint      # ESLint check
npm run preview   # Preview production build
npm run test:run  # Run all unit tests (1237 tests)
npm run test:e2e  # Run Playwright e2e tests (~460 tests)
```

## Tech Stack

- React 19 + TypeScript + Vite 7
- Tailwind CSS 3.4
- Dexie.js (IndexedDB wrapper) for local storage
- Anthropic API (Claude) called directly from browser
- OpenAI API (DALL-E 3) for essence image generation
- OpenAI API (Sora) for video generation (motion portraits, character animation)
- React Router for navigation

### Dark Mode Support

The app supports system-aware dark mode with three preferences:
- `system` - Follow OS preference (default)
- `light` - Force light mode
- `dark` - Force dark mode

**Key Files:**
- `src/contexts/ThemeContext.tsx` - Theme provider with system preference detection
- `tailwind.config.js` - `darkMode: 'class'` configuration
- `src/pages/Settings.tsx` - Theme toggle UI (System/Light/Dark buttons)

**Implementation Notes:**
- Flash prevention script in `index.html` prevents white flash on dark theme load
- PWA theme-color meta tag updates dynamically based on theme
- Theme persisted in IndexedDB via Dexie (db version 15)
- All components use Tailwind `dark:` variants for styling

## Architecture

### Core Data Flow

```
Video Upload -> Frame Extraction (Canvas) -> AI Analysis -> IndexedDB -> UI
                                                    |
                                    [Mood Board Generation] (after chunk 3, auto, ~$0.04)
                                                    |
                                    [Virtue Sentence] (after complete, auto, FREE)
                                                    |
                                    [Essence Image] (manual trigger via button, ~$0.04)
```

### Streaming Analysis Architecture

The app uses progressive streaming analysis to provide incremental results as frames are processed:

```
Video -> Extract Chunk (4 frames) -> Analyze Chunk -> Merge Results -> Update UI
                |                       |                |
            [Repeat]              [Auto-save]      [Progressive]
```

**State Machine Phases:**
1. `idle` - No analysis in progress
2. `extracting` - Extracting video frames
3. `chunk-1` through `chunk-4` - Processing each frame chunk
4. `consolidating` - Final synthesis of all chunks
5. `complete` - Analysis finished, virtue sentence auto-generated (essence image requires manual trigger)

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

### Essence Identity System

After analysis completes, the app generates an "Essence Identity" for each match:

```
Analysis Complete -> Compute virtues_11 -> Generate Virtue Sentence (auto, FREE)
                                                    |
                                    User clicks "Generate Essence" button
                                                    |
                                    Build DALL-E Prompt -> Call DALL-E 3 -> Save Image (~$0.04)
```

**Components:**
1. **Virtue Sentence**: One-line personality summary derived from 11 Virtues scores (e.g., "A curious explorer with radiant warmth") - **AUTO-GENERATED, FREE**
2. **Essence Image**: AI-generated abstract art representing the person's personality via DALL-E 3 - **MANUAL TRIGGER, ~$0.04**
3. **Locked Placeholder**: Before generation, shows virtue sentence as teaser with "Generate Essence (~$0.04)" button
4. **Swipeable Carousel**: ProfileHeader displays essence image alongside profile photo with touch gestures

**Key Files:**
- `src/lib/essence/virtueSentence.ts` - Generates virtue sentences from scores
- `src/lib/essence/promptBuilder.ts` - Builds DALL-E prompts from virtue scores
- `src/lib/essence/dalleClient.ts` - DALL-E 3 API client via Supabase proxy
- `src/lib/essence/essenceGenerator.ts` - Orchestrates full essence generation
- `src/components/profileDetail/ProfileHeader.tsx` - Swipeable carousel UI with locked placeholder
- `src/components/profileDetail/EssencePlaceholder.tsx` - Locked state UI with generate button

**Cost Control:** Essence images are expensive (~$0.04 each). By requiring manual trigger, users control costs and only generate for profiles they're genuinely interested in.

### Mood Board System

During analysis (after chunk 3 completes, ~75% through), the app generates a "Mood Board" lifestyle scene:

```
Chunk 3 Complete -> Extract Lifestyle Themes -> Build DALL-E Prompt -> Generate Image -> Save to Profile
```

**Components:**
1. **Theme Extraction**: Claude analyzes partial profile data to identify 3 lifestyle themes (e.g., "urban nightlife", "outdoor adventures", "cozy homebody")
2. **Mood Board Image**: DALL-E 3 generates a cinematic lifestyle scene based on extracted themes
3. **Carousel Position**: Mood Board appears first (amber "Lifestyle" badge), before Essence (purple) and Photo

**Key Files:**
- `src/lib/moodboard/themeExtractor.ts` - Extracts lifestyle themes from partial analysis
- `src/lib/moodboard/promptBuilder.ts` - Builds DALL-E prompt from themes
- `src/lib/moodboard/moodboardGenerator.ts` - Orchestrates full generation flow

**Cost:** ~$0.043 per mood board (~$0.003 theme extraction + $0.04 DALL-E 3)

### Resonance Display System

Compatibility scores use mystical vocabulary instead of dehumanizing numbers (see ADR-0012):

| Score | Display | Icon | Color |
|-------|---------|------|-------|
| 7-10 | **Strong Resonance** | Sparkles | `violet-400` |
| 5-6 | **Paths Converging** | Moon | `amber-400` |
| 1-4 | **Different Frequencies** | Waves | `slate-400` |

**No red anywhere.** Red = danger/bad person. We never say someone is bad.

**Key Files:**
- `src/lib/virtues/resonanceDisplay.ts` - Centralized display helper (single source of truth)
- `src/lib/virtues/resonanceDisplay.test.ts` - 17 tests covering all tiers
- `src/pages/Home.tsx` - Gallery badge display
- `src/components/profileDetail/CompatibilityCard.tsx` - Detail view display

### Sorry Help Desk System

In-app help desk with an emo goth zombie girl character ("Sorry") accessible from the bottom nav bar:

```
User taps Sorry avatar -> Popup expands (spring animation) -> Sora video plays in header
                                |
                    ┌───────────┼───────────┐──────────────┐
                    │           │           │              │
                  [Home]      [FAQ]    [Feedback]       [Chat]
                                        │                 │
                                   Supabase insert    Claude API
                                   (anonymous)       (Sorry's personality)
```

**Components:**
1. **Animated Avatar**: Sorry's face in nav bar with purple pulse glow (`animate-pulse-glow`)
2. **Video Header**: Sora-generated 4-second loop with static PNG crossfade fallback
3. **FAQ**: Static help topics about app features
4. **Feedback**: Anonymous complaint/feedback submission to Supabase (see ADR-0011)
5. **Chat**: Claude-powered conversational support with Sorry's personality, scoped to app help only (no dating advice)

**Key Files:**
- `src/components/help/HelpDeskPopup.tsx` - Full help desk UI (tabs, feedback form, chatbot)
- `src/components/help/index.ts` - Barrel export
- `src/components/layout/BottomNavBar.tsx` - Sorry avatar button with pulse glow
- `public/helpdesk-agent.png` - Static character image (DALL-E generated)
- `public/helpdesk-agent-animated.mp4` - Sora-generated 4-second loop (459KB)

**Chatbot Architecture:**
- Multi-turn conversation via Anthropic proxy with `system` prompt
- Sorry's personality enforced via system prompt (lowercase, ellipses, reluctant but helpful)
- Scope: app functionality, privacy, mission, troubleshooting only
- Out of scope: dating advice, profile analysis, feature requests
- History: sessionStorage (max 10 messages), clears on tab close

**Feedback Pipeline:**
- Two types: `complaint` and `feedback` (equal visual weight)
- Anonymous Supabase insert (no PII, no user_id)
- RLS policy: anon insert allowed, no client reads
- Client-side: 2000 char limit, 5-second cooldown
- Sorry's responses: "...that sucks. writing it down." / "noted. writing it down."

### Sora Video Generation System

OpenAI Sora integration for video generation (motion portraits, character animation):

**Key Files:**
- `src/lib/sora/soraClient.ts` - Sora API client via Supabase Edge Function
- `src/lib/sora/promptBuilder.ts` - Builds prompts from virtue scores (for profile motion portraits)
- `src/lib/sora/soraGenerator.ts` - Orchestrates generation and saves to profile
- `src/lib/sora/index.ts` - Barrel export

**API:** `POST ${SUPABASE_URL}/functions/v1/sora-proxy` → Creates job, polls for completion, downloads video as base64.

**Cost:** ~$0.30 per 4-second video generation.

### Search & Organization System

The Home gallery includes a comprehensive search, filter, and organization system:

```
User Opens Gallery -> Load Profiles -> Apply Search -> Apply Filters -> Sort -> Display
                                          |                |           |
                                    [Name Match]    [App/Score/Date]  [Newest/Name/Score]
                                                         |
                                              [Tags + Favorites Filter]
```

**Components:**
1. **Search Bar**: Real-time name search with 300ms debounce
2. **Filter Panel**: Bottom sheet with app, score, date, tags, favorites filters
3. **Sort Dropdown**: 6 sort options (newest, oldest, highest/lowest score, name A-Z/Z-A)
4. **Tags**: User-defined labels (e.g., "Met IRL", "Second Date", "Pass")
5. **Favorites**: Star toggle for bookmarking profiles

**Key Files:**
- `src/lib/filtering/` - Pure logic layer (types, searchEngine, filterEngine, sortEngine, persistence)
- `src/hooks/useProfileSearch.ts` - Search state with debounce
- `src/hooks/useProfileFilters.ts` - Filter state with localStorage persistence
- `src/hooks/useFilteredProfiles.ts` - Orchestrates search + filters + sort
- `src/hooks/useTags.ts` - Tag CRUD operations
- `src/hooks/useFavorites.ts` - Favorite toggle
- `src/components/home/` - UI components (SearchBar, FilterPanel, TagSelector, FavoriteButton)

**Filter Logic:**
- Filters combine with **AND logic** (must match all active filters)
- Tags use **OR logic** (match any selected tag)
- Filter preferences persist to localStorage
- Search persists to sessionStorage (clears on tab close)

**Database (v19):** Added `isFavorite?: boolean` and `tags?: string[]` to Profile schema.

**Key Files:**
- `src/hooks/useStreamingAnalysis.ts` - State machine hook, progressive thumbnail logic, mood board and essence triggers
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
  - `helpdesk-agent.png` - Sorry character portrait (DALL-E generated)
  - `helpdesk-agent-animated.mp4` - Sorry animation loop (Sora generated, 459KB)

- `src/lib/` - Core business logic
  - `api/` - Anthropic API client (`anthropicClient.ts`, `config.ts`, `jsonExtractor.ts`)
  - `essence/` - Essence Identity generation (virtue sentences, DALL-E prompts, image generation)
  - `filtering/` - Search, filter, sort logic (`types.ts`, `searchEngine.ts`, `filterEngine.ts`, `sortEngine.ts`, `persistence.ts`)
  - `moodboard/` - Mood Board generation (theme extraction, DALL-E prompts, lifestyle scenes)
  - `sora/` - Sora video generation (client, prompt builder, generator)
  - `utils/` - Shared utilities (`userContext.ts`, `profileHelpers.ts`, `thumbnailUtils.ts`)
  - `streaming/` - Streaming analysis types and chunk definitions
  - `virtues/` - 11 Virtues system (scoring, compatibility, migration, resonance display)
  - `ai.ts` - AI function orchestration (includes `analyzeProfileStreaming()`)
  - `db.ts` - Dexie schema and TypeScript types (v19 with tags/favorites)
  - `prompts.ts` - AI prompt templates (includes chunk-specific prompts)
  - `frameExtraction.ts` - Video frame extraction via Canvas (chunked support)
  - `frameQuality.ts` - Frame quality scoring for thumbnail selection
  - `weather.ts` - Weather API integration

- `src/contexts/` - React context providers
  - `ThemeContext.tsx` - Dark mode with system preference detection

- `src/hooks/` - Custom React hooks for feature state management
  - `useStreamingAnalysis.ts` - State machine hook for progressive analysis
  - `useProfileSearch.ts` - Search with 300ms debounce, sessionStorage persistence
  - `useProfileFilters.ts` - Filter state with localStorage persistence
  - `useFilteredProfiles.ts` - Orchestrates search + filters + sort
  - `useTags.ts` - Tag CRUD operations (create, rename, delete, assign to profiles)
  - `useFavorites.ts` - Favorite toggle with haptic feedback
  - `useZodiacCompatibility.ts`, `useDateIdeas.ts`, `useOpenerRefresh.ts`, `useCopyToClipboard.ts`

- `src/pages/` - Route-level components
  - `Home.tsx` - Profile gallery
  - `Upload.tsx` - Video upload and analysis
  - `ProfileDetail.tsx` - Match profile view (orchestrates section components)
  - `MyProfile.tsx` - User's own profile management

- `src/components/`
  - `help/` - Sorry Help Desk (HelpDeskPopup with FAQ, feedback, chatbot, video)
  - `home/` - Gallery components (SearchBar, FilterPanel, TagSelector, TagChip, FavoriteButton)
  - `profileDetail/` - Section components for ProfileDetail page (includes ProfileHeader with carousel)
  - `profile/` - Tab components for MyProfile page
  - `settings/` - Settings page components (TagManagement)
  - `upload/` - Progressive analysis UI (ProgressiveHeader, InsightCard)
  - `ui/` - Reusable UI components (Logo, buttons, cards, etc.)

### Key Patterns

**API Layer**: All Anthropic calls go through `src/lib/api/anthropicClient.ts`. Use `callAnthropicForObject<T>()` or `callAnthropicForArray<T>()` - never raw fetch calls.

**JSON Extraction**: AI responses may contain markdown. The `jsonExtractor.ts` uses substring extraction (first `{`/`[` to last `}`/`]`) before parsing. Do not simplify this logic.

**Type System**: Profile analysis uses union type `AnalysisData = ProfileAnalysis | LegacyAnalysis | { raw: string }`. Always use `extractAnalysisFields()` from `lib/utils/profileHelpers.ts` to safely access fields.

**Local-First**: All persistence via Dexie (IndexedDB). No backend database. Schema changes require new `db.version()` with migration.

**Direct Browser API Calls**: Frontend calls Anthropic directly with `anthropic-dangerous-direct-browser-access` header. API key from `.env` as `VITE_ANTHROPIC_API_KEY`.

**Logo Component**: Use `<Logo />` from `src/components/ui/Logo.tsx` for consistent branding. Supports sizes (`sm`, `md`, `lg`, `xl`) and optional `showText`/`showTagline` props.

**Thumbnail Handling**: Use `useThumbnailUrl()` hook from `src/lib/utils/thumbnailUtils.ts` for displaying thumbnails. It handles both Blob (from IndexedDB) and base64 string formats, with proper Object URL lifecycle management.

### Database Schema (Dexie)

Two tables in `AuraDB`:
- `profiles` - Analyzed match profiles
  - `virtues_11` - 11 Virtues compatibility scores
  - `virtueSentence` - Generated one-line personality summary
  - `essenceImage` - DALL-E generated Blob image
  - `essencePrompt` - The prompt used to generate the essence image
  - `isFavorite` - Boolean for bookmarked profiles (v19)
  - `tags` - Array of tag IDs for organization (v19)
  - `moodboardImage` - DALL-E generated lifestyle scene Blob
  - `moodboardPrompt` - The prompt used for mood board generation
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
- **Unit tests** (`*.test.ts` files) - 1237 tests via Vitest
- **E2E tests** (`e2e/*.spec.ts` files) - ~460 tests via Playwright

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
2. **Local-First**: All user-facing storage is client-side IndexedDB. Server-side storage limited to anonymous feedback (ADR-0011)
3. **Video Handling**: Videos processed locally via Canvas, never uploaded
4. **iOS Safari**: Videos must be muted and playsinline for frame extraction

## Hooks System

Claude Code hooks in `.claude/hooks/` automate workflow behaviors:

| Hook | Trigger | Purpose |
|------|---------|---------|
| `git-push-gate.sh` | PreToolUse (Bash) | Star Trek roleplay: reminds to ask "Shall I engage?" before git push |
| `conversation-logger.sh` | Stop | Logs conversation snippets to `.claude/memory/` conceptual heaps |
| `zephyr-init.sh` | SessionStart | Initializes Zephyr orchestration context |
| `teach-darklight-init.sh` | SessionStart | Initializes teaching context |

**Conversation logging** writes to:
- `.claude/memory/daily/` - Daily conversation logs
- `.claude/memory/heaps/` - Conceptual heaps (Sorry, Resonance, Empathy, Architecture, Character)
- `.claude/memory/` is gitignored

## Infrastructure

### Production Hosting (Vercel)
- **URL:** https://aura-xi-ten.vercel.app
- **Repo:** github.com/OMGLASERSPEWPEWPEW/aura
- **Auto-deploy:** Every push to `main` triggers deploy
- **CLI:** `vercel` commands available for logs/debugging

### API Proxy (Supabase Edge Functions)
- **Project:** qaueoxubnifmtdirnxgz
- **Edge Functions:**
  - `anthropic-proxy` at `/functions/v1/anthropic-proxy` - Claude API proxy
  - `dalle-proxy` at `/functions/v1/dalle-proxy` - DALL-E 3 image generation
  - `sora-proxy` at `/functions/v1/sora-proxy` - OpenAI Sora video generation (async: creates job, polls, downloads)
- **Purpose:** Keeps API keys server-side (not in browser bundle)
- **Tier:** Pro (150-second timeout). Free tier has 60-second timeout.

### Supabase Database Tables
- **`feedback`** - Anonymous user feedback/complaints (see ADR-0011)
  - RLS: Anonymous inserts allowed, no client reads
  - Columns: `id`, `type` (complaint/feedback), `message`, `app_version`, `user_agent`, `created_at`

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
| `prd/sorry_help_desk.md` | `src/components/help/HelpDeskPopup.tsx` | Sorry Help Desk expansion (feedback, chatbot, Sora animation) |

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
| [0011](docs/adr/0011-anonymous-feedback-pipeline.md) | Anonymous Feedback Pipeline | Accepted |
| [0012](docs/adr/0012-resonance-vocabulary-system.md) | Resonance Vocabulary System | Accepted |

See `docs/adr/README.md` for the full index and ADR template.
