# Aura Project Map

A comprehensive audit of all pages, routes, features, and components in the Aura dating profile analysis PWA.

---

## Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | Home.tsx | Main gallery of analyzed profiles |
| `/upload` | Upload.tsx | Video upload and streaming AI analysis |
| `/settings` | Settings.tsx | App configuration and preferences |
| `/profile/:id` | ProfileDetail.tsx | Detailed match profile view with tabs |
| `/my-profile` | MyProfile.tsx | User's own profile creation and analysis |
| `/mirror` | MyProfile.tsx | Alias for backward compatibility |

---

## Page-by-Page Feature Breakdown

### 1. Home.tsx (`/`)

**Purpose:** Main dashboard displaying all analyzed match profiles.

**Features:**
- Header with "Aura" branding and flame icon
- "My Profile" button (links to /my-profile)
- Empty state for no profiles (prompts user to add first profile)
- Profile gallery grid (sorted by timestamp, newest first)
- Profile cards displaying:
  - Thumbnail image
  - Name with app badge (Tinder/Bumble/Hinge color-coded)
  - Analysis phase badge (Quick/Complete)
  - Virtue score average badge (if compatibility scored)
  - Date added
  - Age and location
  - Summary quote
  - Delete button with confirmation modal
- FAB (Floating Action Button) linking to /upload

**User Interactions:**
- Click profile card → Navigate to `/profile/:id`
- Click "My Profile" → Navigate to `/my-profile`
- Click FAB → Navigate to `/upload`
- Click delete → Confirmation dialog → Remove from IndexedDB

---

### 2. Upload.tsx (`/upload`)

**Purpose:** Process dating app screen recordings with progressive streaming analysis.

**Features:**
- Back navigation to Home
- VideoUploader component (drag-drop, file picker)
- 4-chunk streaming analysis with progressive UI
- Real-time insight cards as chunks complete
- Auto-save after chunk 1 for data loss prevention
- Abort functionality with save progress option
- Error handling with debug export

**Streaming Analysis Flow:**
1. User uploads screen recording
2. 16 frames extracted (4 chunks of 4 frames each)
3. **Chunk 1 (Basics)**: Name, age, location, app detection → Auto-save
4. **Chunk 2 (Impressions)**: Vibes, archetype, psychological signals
5. **Chunk 3 (Observations)**: Photo analysis, detected prompts
6. **Chunk 4 (Flags)**: Red/green flags, agendas, tactics
7. Profile marked "complete" → Redirect to Home

**Progressive UI Components:**
- `ProgressiveHeader`: Name/age/location as discovered
- `InsightCard`: Reusable card with loading/complete/pending states
- Insight cards for: Basic Info, Vibes, Archetype, Prompts, Flags

**Technical Details:**
- Videos processed locally via Canvas (never uploaded to server)
- Videos must be muted and playsinline for iOS Safari compatibility
- Uses `useStreamingAnalysis` hook for state machine management
- Supports Quick (chunk 1 only) vs Complete (all chunks) analysis phases

---

### 3. ProfileDetail.tsx (`/profile/:id`)

**Purpose:** Comprehensive view of an analyzed match with compatibility, insights, and coaching.

**Structure:** 3-tab interface (Overview | Analysis | Coach)

#### Tab Navigation
- Overview (default) - Compatibility and date planning
- Analysis - Deep psychological breakdown
- Coach - Conversation strategy and response help

---

#### Overview Tab

**Components:**
- **No Profile Warning** - Prompts user to create their profile if missing
- **Generate Compatibility Scores Button** - On-demand scoring (not auto-generated)
- **CompatibilityCard** - Overall score (0-100), summary, strengths, concerns
- **VirtueScoresCard** - 5 partner virtues scored 1-10 with explanations
- **AspectMatchCard** - 23 Aspects system compatibility breakdown
- **TransactionalIndicatorsCard** - Shows if moderate/high transactional signals detected
- **ZodiacSection** - Generate zodiac compatibility analysis
- **DateIdeasSection** - AI-generated date suggestions with local weather integration
- **OpenersSection** - Recommended conversation openers with refresh option
- **AskAboutMatch** - Free-form Q&A input to ask anything about the match

**User Interactions:**
- Generate compatibility (requires user profile)
- Generate zodiac compatibility
- Generate date ideas (fetches local weather)
- Refresh openers for new suggestions
- Ask custom questions about match

---

#### Analysis Tab

**Components:**
- **PhotoBreakdown** - Each photo analyzed for vibe, subtext, what it signals
- **PsychologicalRead** - Archetype summary and personality analysis
- **AgendasSection** - Primary and secondary dating agendas detected
- **TacticsSection** - Presentation tactics and predicted behavioral patterns
- **SubtextAnalysis** - Sexual signaling, power dynamics, attachment indicators
- **PromptsSection** - Dating app prompt answers with analysis and opener suggestions

**Data Displayed:**
- Photo-by-photo breakdown with interpretations
- Psychological archetype classification
- Hidden agendas and motivations
- Communication tactics to expect
- Subtext in photos and bio

---

#### Coach Tab

**Components:**
- **ConversationUploader** - Upload chat screenshot for analysis
- **MatchTacticsCard** - Detected tactics and agenda in conversation
- **ResponseSuggestions** - AI-generated response options
- **ResponseScorer** - Rate user's actual response (paste to score)
- **DateAskGenerator** - Generate date-ask messages tailored to match
- **CoachingHistory** - Past coaching sessions for this match

**User Flow:**
1. Upload conversation screenshot
2. View detected tactics and match's agenda
3. Get AI-suggested responses
4. (Optional) Paste own response to get scored
5. Generate date-ask messages when ready

---

### 4. MyProfile.tsx (`/my-profile`)

**Purpose:** Create and manage user's own dating profile for compatibility matching.

**Structure:** 6 input tabs + AI Synthesis section

#### Tab Navigation
Goals | Data | Text | Video | Photos | Info

---

#### Goals Tab

**Features:**
- Dating goal type selection (casual/serious/exploring)
- Goal description textarea for detailed preferences
- Relationship outcome expectations

---

#### Data Tab (DataExportTab)

**Features:**
- Upload dating app data exports (JSON format)
- Parse Tinder/Hinge/Bumble statistics
- Display:
  - Total match counts
  - Conversation metrics
  - Response rates
  - Usage patterns

**Supported Formats:**
- Tinder data export JSON
- Hinge data export JSON
- Bumble data export JSON

---

#### Text Tab (TextInputTab)

**Features:**
- Multiple labeled text entry fields
- Journal/bio/notes input
- File upload support (.txt, .md)
- Free-form self-description area

---

#### Video Tab

**Features:**
- VideoUploader for self-audit recording
- Frame extraction from own profile recording
- Same Canvas extraction as Upload page

---

#### Photos Tab

**Features:**
- PhotoUploader for direct photo uploads
- Grid display of uploaded photos
- Remove individual photos
- Reorder photos (drag-drop)

---

#### Manual Entry Tab (Info)

**Features:**
- Name input
- Age input
- Occupation input
- Location input
- Interests tags (add/remove)
- Attachment style selection dropdown
- Relationship style preferences
- Relationship history notes

---

#### AI Synthesis Section

**Trigger:** "Run Synthesis" button

**Generated Outputs:**
- Psychological profile summary
- Dating strategy recommendations
- Partner virtues (5 core virtues with scores)
- Neurodivergence trait analysis
- 23 Aspects personal profile
- Archetype classification

**Results Display (UserProfileDisplay):**
- Archetype summary card
- Psychological profile breakdown
- Dating strategy section
- Partner virtues list with descriptions
- Neurodivergence analysis (if applicable)
- AspectConstellationCard (23 Aspects visual)

**Error Handling:**
- Debug download option for failed synthesis
- Retry mechanism

---

### 5. Settings.tsx (`/settings`)

**Purpose:** App configuration and preferences.

**Features:**
- Auto-run compatibility analysis toggle
- When enabled, automatically scores new matches against user's synthesis

---

## Component Inventory

### Profile Detail Components (`src/components/profileDetail/`)

| Component | Purpose |
|-----------|---------|
| ProfileHeader | Thumbnail, name, age, location display |
| CompatibilityCard | Overall compatibility score and summary |
| VirtueScoresCard | 5 partner virtues with 1-10 scores |
| TransactionalIndicatorsCard | Transactional relationship signals |
| AspectMatchCard | 23 Aspects compatibility breakdown |
| AskAboutMatch | Free-form Q&A input |
| ZodiacSection | Zodiac compatibility generator |
| DateIdeasSection | AI date suggestions with weather |
| OpenersSection | Conversation openers with refresh |
| PhotoBreakdown | Per-photo analysis display |
| PsychologicalRead | Archetype and personality summary |
| AgendasSection | Primary/secondary agendas |
| TacticsSection | Presentation and predicted tactics |
| SubtextAnalysis | Hidden signals and dynamics |
| PromptsSection | Prompt answers with analysis |
| DebugSection | Raw analysis data for debugging |
| LegacySection | Support for old analysis format |
| TabNavigation | Tab switching UI |
| OverviewTab | Overview tab container |
| AnalysisTab | Analysis tab container |
| CoachTab | Coach tab container |

### Coach Tab Sub-components

| Component | Purpose |
|-----------|---------|
| ConversationUploader | Chat screenshot upload |
| MatchTacticsCard | Detected conversation tactics |
| ResponseSuggestions | AI response options |
| ResponseScorer | Rate user's response |
| DateAskGenerator | Generate date-ask messages |
| CoachingHistory | Past coaching sessions |

### My Profile Components (`src/components/profile/`)

| Component | Purpose |
|-----------|---------|
| GoalsTab | Dating goals input |
| DataExportTab | App data export upload |
| TextInputTab | Free-form text entries |
| VideoTab | Video upload for self-audit |
| PhotosTab | Photo upload and management |
| ManualEntryTab | Basic info form fields |
| AspectConstellationCard | 23 Aspects visual display |

### Upload Components (`src/components/upload/`)

| Component | Purpose |
|-----------|---------|
| ProgressiveHeader | Display name/age/location as discovered |
| InsightCard | Reusable card with loading/complete/pending/error states |

### Shared Components

| Component | Location | Purpose |
|-----------|----------|---------|
| VideoUploader | `src/components/` | Video upload with drag-drop |
| PhotoUploader | `src/components/` | Photo upload with preview |
| UserProfileDisplay | `src/components/` | User profile results display |
| SectionCard | `src/components/ui/` | Reusable card wrapper |

---

## Custom Hooks (`src/hooks/`)

| Hook | Purpose |
|------|---------|
| useStreamingAnalysis | State machine for 4-chunk progressive analysis |
| useCopyToClipboard | Copy text with feedback |
| useZodiacCompatibility | Generate zodiac analysis |
| useDateIdeas | Generate date suggestions with weather |
| useOpenerRefresh | Refresh conversation openers |
| useConversationCoach | Conversation coaching logic |
| useCompatibilityScores | On-demand compatibility scoring |
| useAskAboutMatch | Free-form Q&A chat persistence |

---

## Core Libraries (`src/lib/`)

### API Layer (`src/lib/api/`)

| File | Purpose |
|------|---------|
| anthropicClient.ts | Claude API client with `callAnthropicForObject<T>()` and `callAnthropicForArray<T>()` |
| config.ts | API configuration and headers |
| jsonExtractor.ts | Extract JSON from markdown AI responses |

### Streaming Analysis (`src/lib/streaming/`)

| File | Purpose |
|------|---------|
| types.ts | Chunk types, AccumulatedProfile, merge strategies |

### Database (`src/lib/db.ts`)

**Tables:**
- `profiles` - Analyzed match profiles (includes `analysisPhase`: 'quick' | 'complete')
- `userIdentity` - Single record (id=1) for user's own profile
- `matchChats` - Chat history for Ask About Match
- `coachingSessions` - Conversation coaching sessions

**Schema:** Dexie.js IndexedDB wrapper

### AI Functions (`src/lib/ai.ts`)

Orchestration layer for all AI calls:
- `analyzeProfileStreaming()` - 4-chunk streaming analysis with merge
- `analyzeProfile()` - Legacy single-call analysis
- `analyzeUserSelf()` - User profile synthesis
- `extractPartnerVirtues()` - Generate partner virtue preferences
- `extractUserAspects()` - Score user on 23 Aspects
- `analyzeNeurodivergence()` - Neurodivergence trait detection
- `scoreMatchVirtues()` - Score match against user virtues
- `scoreMatchAspects()` - Score match on 23 Aspects
- `regenerateOpeners()` - Fresh conversation starters
- `regeneratePromptOpener()` - Opener for specific prompt
- `analyzeConversation()` - Chat coaching analysis
- `scoreUserResponse()` - Message effectiveness score
- `generateDateAsk()` - Date invitation suggestions
- `getZodiacCompatibility()` - Zodiac analysis
- `getDateSuggestions()` - Date ideas with context
- `askAboutMatch()` - Q&A responses

### Prompts (`src/lib/prompts.ts`)

All AI prompt templates for:
- Profile analysis
- Compatibility scoring
- Date idea generation
- Conversation coaching
- User synthesis

### Utilities

| File | Purpose |
|------|---------|
| frameExtraction.ts | Video frame extraction via Canvas |
| weather.ts | Weather API integration for date ideas |
| utils/userContext.ts | User context helpers |
| utils/profileHelpers.ts | Profile data extraction with `extractAnalysisFields()` |

### Virtues System (`src/lib/virtues/`)

23 Aspects system definitions and scoring logic.

---

## Data Flow

### Streaming Analysis Flow (Upload Page)
```
Video Upload → Extract 16 Frames (4 chunks of 4) → Process Chunks
                                                         │
    ┌────────────────────────────────────────────────────┤
    ▼                                                    ▼
Chunk 1 (Basics)                              Chunks 2-4 (Progressive)
Name, Age, App                                Vibes, Flags, Tactics
    │                                                    │
    ▼                                                    ▼
Auto-Save (Quick)                              Merge Results
    │                                                    │
    └──────────────────────┬─────────────────────────────┘
                           ▼
                    Save (Complete)
                           │
                           ▼
                    Profile Gallery
```

### Overall System Flow
```
┌─────────────────────────────────────────────────────────────────┐
│                        USER ACTIONS                              │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  Upload Page  │    │  Profile Page │    │ MyProfile Page│
│               │    │               │    │               │
│ Video → Frames│    │ View Analysis │    │ Input Data    │
│ 4-Chunk Stream│    │ Generate More │    │ Run Synthesis │
│ Progressive UI│    │ Coach Mode    │    │ Save Profile  │
└───────┬───────┘    └───────┬───────┘    └───────┬───────┘
        │                    │                    │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ANTHROPIC API                               │
│       (Claude via Supabase Edge proxy or direct browser)         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        INDEXEDDB                                 │
│    (Dexie.js - profiles, userIdentity, matchChats, coaching)     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         HOME PAGE                                │
│           (Profile Gallery with Quick/Complete badges)           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Type System

**Profile Analysis Union Type:**
```typescript
type AnalysisData = ProfileAnalysis | LegacyAnalysis | { raw: string }
```

Always use `extractAnalysisFields()` from `lib/utils/profileHelpers.ts` to safely access fields across all format versions.

---

## Environment Variables

Required in `.env`:
```
VITE_ANTHROPIC_API_KEY=your_key_here
```

---

## Privacy Model

- **Local-First:** All data stored in IndexedDB, never leaves device
- **Anonymous Frames:** Only extracted video frames sent to AI (no PII metadata)
- **No Backend:** No server database, all persistence client-side
- **Video Handling:** Videos processed locally via Canvas, never uploaded

---

## Browser Compatibility Notes

- **iOS Safari:** Videos must have `muted` and `playsinline` attributes for frame extraction
- **IndexedDB:** Required for all storage (no localStorage fallback)
- **Canvas API:** Required for video frame extraction
