# Feature Inventory

**Agent Persona**: Frontend Developer
**Date**: January 2026
**Last Updated**: 2026-01-26
**Scope**: Complete feature audit of Aura PWA

---

## Feature Matrix

| Feature | Status | Location | Dependencies | Notes |
|---------|--------|----------|--------------|-------|
| Video frame extraction | Working | `lib/frameExtraction.ts` | Canvas API | iOS Safari compatible (muted + playsinline) |
| AI profile analysis | Working | `lib/ai.ts` | Anthropic API | 4-chunk streaming with progressive UI |
| Match storage/gallery | Working | `lib/db.ts`, `pages/Home.tsx` | Dexie/IndexedDB | Thumbnail + full data |
| Compatibility scoring | Working | `hooks/useCompatibilityScore.ts` | User synthesis | Requires user profile setup |
| 23 Aspects system | Removed | - | - | Replaced by 11 Virtues system (Jan 2026) |
| Zodiac compatibility | Working | `hooks/useZodiacCompatibility.ts` | Both user + match signs | Falls back gracefully |
| Date ideas + weather | Working | `hooks/useDateIdeas.ts` | Weather API | Location-based suggestions |
| Opener suggestions | Working | `hooks/useOpenerRefresh.ts` | Analysis data | Copy-to-clipboard included |
| Ask About Match chat | Working | `components/profileDetail/AskAboutMatch.tsx` | Profile context | Persistent chat history |
| Conversation coaching | Working | Coach tab | Screenshot upload | Analyzes conversations |
| User profile synthesis | Working | `pages/MyProfile.tsx` | 6 input methods | Generates user analysis |
| 11 Virtues system | Working | `lib/virtues/virtues.ts` | User synthesis | 3 Realms, 11 spectrums, Mixing Board UI |
| Neurodivergence analysis | Working | Analysis output | AI analysis | Generated but minimal display |
| Settings | MVP-only | `pages/Settings.tsx` | None | Single toggle currently |
| Data export | MVP-only | MyProfile | Tinder API | Only Tinder JSON supported |
| PWA install | Working | `public/manifest.json` | Service worker | Full icon set, OG meta tags |
| Offline mode | Partial | Service worker | Cache strategy | Only cached assets, not full offline |
| Logo/branding | Working | `components/ui/Logo.tsx` | Static assets | Consistent branding across app |
| Authentication | Working | `contexts/AuthContext.tsx` | Supabase Auth | Email + Google (Apple pending) |
| Cross-device sync | Working | `lib/sync/` | Supabase | Profiles, coaching, chats sync |
| Typed errors | Working | `lib/errors.ts` | None | AuraError hierarchy with Result types |

---

## Feature Details

### Core Analysis Pipeline

#### Video Frame Extraction
**File**: `src/lib/frameExtraction.ts`

```
Input: Video file (MP4, MOV, WebM)
Process: Canvas drawImage at intervals (4 chunks of 4 frames)
Output: Array of base64 JPEG frames with quality scores
```

**Constraints**:
- iOS Safari requires `muted` and `playsinline` attributes
- Frame interval configurable (default: every 2 seconds)
- Maximum 16 frames extracted (4 chunks x 4 frames)
- Progressive quality scoring for thumbnail selection

#### AI Profile Analysis
**File**: `src/lib/ai.ts`

**Streaming Analysis (4 chunks)**:
- **Chunk 1**: Basic info (name, age), initial observations
- **Chunk 2**: Interests, hobbies, lifestyle signals
- **Chunk 3**: Communication style, personality indicators
- **Chunk 4**: Final details, synthesis preparation

**Token Budget**: 16,384 max (profile analysis)

### Storage Layer

#### Dexie Database Schema
**File**: `src/lib/db.ts`

**Tables**:
```typescript
profiles: '++id, name, appName, timestamp, analysisPhase, serverId'
userIdentity: '++id, lastUpdated, supabaseUserId, serverId'
coachingSessions: '++id, profileId, timestamp, serverId'
matchChats: '++id, profileId, timestamp, serverId'
```

**Profile Record Structure**:
- `id`: number (auto-generated)
- `name`: string
- `thumbnail`: Blob (converted from base64 for ~33% storage savings)
- `analysis`: AnalysisData (union type)
- `analysisPhase`: 'quick' | 'deep' | 'complete'
- `virtues_11`: MatchVirtueCompatibility (primary compatibility system)
- `serverId`: string (Supabase sync ID)
- `createdAt`: Date
- `chatHistory`: ChatMessage[]

### User Features

#### Compatibility Scoring
**Hook**: `src/hooks/useCompatibilityScore.ts`

**Calculation Factors**:
- Value alignment (40%)
- Communication style match (25%)
- Lifestyle compatibility (20%)
- Interest overlap (15%)

**Requirement**: User must complete profile synthesis first.

#### 11 Virtues System
**Location**: `src/lib/virtues/virtues.ts`

The 11 Virtues system replaced the legacy 23 Aspects in January 2026. It organizes compatibility into 3 Realms with delta-based scoring:

**Realm I: Biological (Chemistry)** - Binary needs, low tolerance for mismatch
1. **Vitality** (Restorative <-> High Voltage)
2. **Lust** (Reserved <-> Voracious)
3. **Play** (Serious <-> Absurd)

**Realm II: Emotional (Connection)** - How you fight and bond
4. **Warmth** (Cool <-> Radiant)
5. **Voice** (Diplomatic <-> Blunt)
6. **Space** (Merged <-> Autonomous) - **CRITICAL**
7. **Anchor** (Fluid <-> Structured)

**Realm III: Cerebral (Mind)** - Long-term conversation potential
8. **Wit** (Earnest <-> Intellectual)
9. **Drive** (Content <-> Relentless)
10. **Curiosity** (Traditional <-> Explorer)
11. **Soul** (Pragmatic <-> Idealist)

**UI**: "Mixing Board" metaphor with dual faders showing user vs match scores and delta verdicts (Sympatico/Friction/Danger).

#### Zodiac Compatibility
**Hook**: `src/hooks/useZodiacCompatibility.ts`

**Features**:
- Sun sign compatibility scoring
- Element harmony analysis (Fire/Earth/Air/Water)
- Modality compatibility (Cardinal/Fixed/Mutable)
- Detailed compatibility narrative

**Fallback**: Gracefully degrades if signs unknown.

#### Date Ideas + Weather
**Hook**: `src/hooks/useDateIdeas.ts`

**Integration**:
- Weather API for local conditions
- Location from user profile
- Season-appropriate suggestions
- Indoor/outdoor based on weather

#### Opener Suggestions
**Hook**: `src/hooks/useOpenerRefresh.ts`

**Features**:
- 3-5 contextual conversation starters
- Based on match's profile content
- Refreshable for new suggestions
- Copy-to-clipboard functionality

#### Ask About Match
**Component**: `src/components/profileDetail/AskAboutMatch.tsx`

**Features**:
- Free-form Q&A about match
- Context-aware responses using full profile
- Persistent chat history per profile
- Suggested questions available

#### Conversation Coaching
**Location**: Coach tab on ProfileDetail

**Sub-features**:
- Screenshot upload of conversations
- Message analysis and suggestions
- Response drafting assistance
- Red flag identification in convos
- Ghosting recovery suggestions

### User Profile

#### Synthesis Methods
**File**: `src/pages/MyProfile.tsx`

**6 Input Tabs**:
1. **Basic Info**: Name, age, location, occupation
2. **Dating Profile**: Bio text import
3. **Values**: Direct value selection
4. **Preferences**: Partner preferences
5. **History**: Relationship history
6. **Import**: Tinder JSON data import

**Output**: AI-synthesized user profile analysis matching match profile structure.

#### Virtue Compatibility Scoring
**Based on 11 Virtues System** (see above):

Each virtue uses delta-based compatibility with categories:
- **Low** (<20 delta required): Vitality, Lust, Voice, Wit, Curiosity
- **Medium Dangerous** (20-40 risky): Warmth, Space (CRITICAL)
- **Medium Magic** (complementary OK): Play, Anchor
- **Flexible** (<40 OK): Drive, Soul

**Verdicts**: Sympatico, Friction, Danger

Reference: `src/lib/virtues/virtues.ts`

### Authentication & Sync

#### Authentication
**File**: `src/contexts/AuthContext.tsx`

**Providers**:
- Email/password signup
- Google OAuth
- Apple OAuth (pending App Store approval)

**Features**:
- Session persistence
- Protected routes
- Automatic token refresh

#### Cross-Device Sync
**Location**: `src/lib/sync/`

**Synced Data**:
- Match profiles (`profileSync.ts`)
- User profile (`userProfileSync.ts`)
- Coaching sessions (`coachingSync.ts`)
- Match chats (`chatSync.ts`)
- Images (`imageSync.ts`)

**Conflict Resolution**: Last-write-wins with timestamps

### Error Handling

#### Typed Error Infrastructure
**File**: `src/lib/errors.ts`

**Error Hierarchy**:
- `AuraError` (base class)
  - `ApiError` - HTTP/API errors with status codes
  - `NetworkError` - Connection failures
  - `TimeoutError` - Request timeouts
  - `AuthError` - Authentication failures
  - `RateLimitError` - 429 responses
  - `ParseError` - JSON parsing failures
  - `SchemaError` - Zod validation failures

**Result Type**: `Result<T, E>` for type-safe error handling

### PWA & Branding

#### Logo Component
**File**: `src/components/ui/Logo.tsx`

**Features**:
- Reusable logo with size variants (`sm`, `md`, `lg`, `xl`)
- Optional text display (`showText` prop)
- Optional tagline display (`showTagline` prop)
- Gradient text styling for brand consistency

**Usage**:
```tsx
<Logo size="lg" showText={true} showTagline={false} />
```

#### PWA Configuration
**File**: `public/manifest.json`

**Assets**:
| Asset | Size | Purpose |
|-------|------|---------|
| `logo-full.png` | 1024x1024 | Source logo |
| `favicon-16.png` | 16x16 | Browser tab icon |
| `favicon-32.png` | 32x32 | Browser tab icon (retina) |
| `apple-touch-icon.png` | 180x180 | iOS home screen |
| `icon-192.png` | 192x192 | PWA icon (standard) |
| `icon-512.png` | 512x512 | PWA icon (splash/maskable) |
| `og-image.png` | 1200x630 | Social sharing preview |

**Manifest Settings**:
- `name`: "Aura"
- `short_name`: "Aura"
- `description`: "Decode Emotions. Navigate Life."
- `theme_color`: `#7c3aed` (purple)
- `background_color`: `#f8fafc` (slate-50)
- `display`: `standalone`

**Meta Tags** (in `index.html`):
- Open Graph (og:title, og:description, og:image)
- Twitter Card (twitter:card, twitter:title, twitter:description, twitter:image)
- Apple-specific (apple-touch-icon, apple-mobile-web-app-capable)

---

## Feature Gaps

### Missing Critical Features

| Feature | Priority | Effort | Notes |
|---------|----------|--------|-------|
| User authentication | Done | - | Email + Google complete, Apple pending |
| Credit system | P0 | Medium | Required for monetization |
| API key security | Done | - | Secured via Supabase Edge Function proxy |
| Full offline mode | P1 | High | Only partial cache now |
| Data export (all) | P1 | Low | Only Tinder JSON currently |
| AI inference history | P1 | Medium | Track costs per analysis (see roadmap) |

### Missing Enhancement Features

| Feature | Priority | Effort | Notes |
|---------|----------|--------|-------|
| Profile comparison | P2 | Medium | Side-by-side view |
| Batch delete | P2 | Low | Gallery operations |
| Search/filter | P2 | Medium | Gallery organization |
| Push notifications | P2 | Medium | Background task completion |
| Share profile | P3 | Low | Generate shareable summary |
| Dark mode | P3 | Low | Theme preference |

### Missing Accessibility Features

| Feature | Priority | Effort | Notes |
|---------|----------|--------|-------|
| Keyboard navigation | P1 | Medium | Full app coverage |
| Screen reader support | P1 | Medium | ARIA labels |
| Reduced motion | P2 | Low | Preference toggle |
| High contrast mode | P2 | Low | Theme variant |
| Font size options | P3 | Low | Accessibility setting |

---

## Technical Implementation Notes

### API Layer
**Files**: `src/lib/api/`

- `anthropicClient.ts`: Main API client with retry logic
- `config.ts`: API configuration (proxy vs direct)
- `jsonExtractor.ts`: Multi-strategy JSON extraction

**Pattern**: All calls use `callAnthropicForObject<T>()` or `callAnthropicForArray<T>()`

**Safe Variants**: `callAnthropicForObjectSafe<T>()` returns `Result<T, AuraError>`

### Hooks Architecture
**Directory**: `src/hooks/`

Each feature hook follows pattern:
```typescript
export function useFeature(profile: Profile) {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuraError | null>(null);

  const fetch = useCallback(async () => { ... }, [profile]);
  const refresh = useCallback(async () => { ... }, [fetch]);

  return { data, loading, error, refresh };
}
```

### Component Structure
**ProfileDetail Sections** (`src/components/profileDetail/`):
- `OverviewTab.tsx`
- `AnalysisTab.tsx`
- `CoachTab.tsx`
- `AskAboutMatch.tsx`
- `CompatibilityScore.tsx`
- `DateIdeas.tsx`
- `OpenerSuggestions.tsx`
- `VirtueCompatibilityCard.tsx` (11 Virtues Mixing Board)
- `ZodiacCompatibility.tsx`

**Reusable UI Components** (`src/components/ui/`):
- `Logo.tsx` - Brand logo with variants

---

## Test Coverage

### Unit Tests (Vitest)
**Count**: 800+ tests (as of 2026-01-26)

**Key Test Files**:
- `src/lib/api/jsonExtractor.test.ts` - JSON extraction strategies
- `src/lib/virtues/virtues.test.ts` - 11 Virtues system (68 tests)
- `src/hooks/useStreamingAnalysis.test.tsx` - Streaming state machine
- `src/hooks/useCompatibilityScores.test.ts` - Compatibility logic
- `src/hooks/useDateIdeas.test.ts` - Date suggestions
- `src/hooks/useOpenerRefresh.test.ts` - Opener generation

### E2E Tests (Playwright)
**Count**: 321 tests

**Test Files**:
- `e2e/home.spec.ts` - Gallery functionality
- `e2e/upload.spec.ts` - Upload flow
- `e2e/upload-analysis.spec.ts` - Full analysis flow
- `e2e/my-profile.spec.ts` - User profile
- `e2e/settings.spec.ts` - Settings page
- `e2e/auth.spec.ts` - Authentication flows

---

## Metrics & Analytics (Not Implemented)

### Recommended Tracking Points

| Event | Data Points | Purpose |
|-------|-------------|---------|
| `profile_analyzed` | duration, stage | Performance monitoring |
| `feature_used` | feature_name, profile_id | Feature adoption |
| `error_occurred` | error_type, context | Debugging |
| `session_duration` | time, actions_count | Engagement |
| `credit_used` | credit_type, feature | Monetization |
| `inference_cost` | tokens, model, feature | Cost tracking |

**Note**: Currently no analytics implemented. Privacy-first approach requires careful consent management.

---

## Version History

| Version | Features Added | Date |
|---------|----------------|------|
| 0.1 | Basic upload + analysis | Initial |
| 0.2 | Gallery persistence | +2 weeks |
| 0.3 | User profile | +1 month |
| 0.4 | Compatibility scoring | +2 months |
| 0.5 | Coach tab features | +3 months |
| 0.6 | 23 Aspects + Virtues | +4 months |
| 0.7 | Logo/branding + PWA polish | +5 months |
| 0.8 | Authentication + Sync | +6 months |
| 0.9 | 11 Virtues, streaming analysis | Current |

---

## Appendix: Component Dependency Graph

```
App.tsx
├── Home.tsx
│   ├── Logo.tsx
│   └── ProfileCard.tsx
├── Upload.tsx
│   ├── VideoUploader.tsx
│   ├── ProgressiveHeader.tsx
│   └── InsightCard.tsx
├── ProfileDetail.tsx
│   ├── OverviewTab.tsx
│   │   ├── CompatibilityScore.tsx
│   │   ├── VirtueCompatibilityCard.tsx (11 Virtues)
│   │   └── ZodiacCompatibility.tsx
│   ├── AnalysisTab.tsx
│   └── CoachTab.tsx
│       ├── AskAboutMatch.tsx
│       ├── DateIdeas.tsx
│       ├── OpenerSuggestions.tsx
│       └── ConversationCoach.tsx
├── MyProfile.tsx
│   ├── Logo.tsx
│   ├── UserProfileDisplay.tsx
│   ├── BasicInfoTab.tsx
│   ├── DatingProfileTab.tsx
│   ├── ValuesTab.tsx
│   ├── PreferencesTab.tsx
│   ├── HistoryTab.tsx
│   └── ImportTab.tsx
├── Settings.tsx
└── Auth/
    ├── SignIn.tsx
    └── SignUp.tsx

Shared UI Components (src/components/ui/):
└── Logo.tsx

Contexts:
├── AuthContext.tsx
└── SyncContext.tsx
```
