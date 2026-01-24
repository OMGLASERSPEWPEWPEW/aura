# Feature Inventory

**Agent Persona**: Frontend Developer
**Date**: January 2026
**Scope**: Complete feature audit of Aura PWA

---

## Feature Matrix

| Feature | Status | Location | Dependencies | Notes |
|---------|--------|----------|--------------|-------|
| Video frame extraction | ✅ Working | `lib/frameExtraction.ts` | Canvas API | iOS Safari compatible (muted + playsinline) |
| AI profile analysis | ✅ Working | `lib/ai.ts` | Anthropic API | 2-stage (basics + deep) |
| Match storage/gallery | ✅ Working | `lib/db.ts`, `pages/Home.tsx` | Dexie/IndexedDB | Thumbnail + full data |
| Compatibility scoring | ✅ Working | `hooks/useCompatibilityScore.ts` | User synthesis | Requires user profile setup |
| 23 Aspects system | ✅ Working | `components/profileDetail/` | Analysis data | New redundant system alongside virtues |
| Zodiac compatibility | ✅ Working | `hooks/useZodiacCompatibility.ts` | Both user + match signs | Falls back gracefully |
| Date ideas + weather | ✅ Working | `hooks/useDateIdeas.ts` | Weather API | Location-based suggestions |
| Opener suggestions | ✅ Working | `hooks/useOpenerRefresh.ts` | Analysis data | Copy-to-clipboard included |
| Ask About Match chat | ✅ Working | `components/profileDetail/AskAboutMatch.tsx` | Profile context | Persistent chat history |
| Conversation coaching | ✅ Working | Coach tab | Screenshot upload | Analyzes conversations |
| User profile synthesis | ✅ Working | `pages/MyProfile.tsx` | 6 input methods | Generates user analysis |
| Partner virtues | ✅ Working | `components/profileDetail/` | User synthesis | 5 eudaimonia-based virtues |
| Neurodivergence analysis | ✅ Working | Analysis output | AI analysis | Generated but minimal display |
| Settings | 🟡 MVP-only | `pages/Settings.tsx` | None | Single toggle currently |
| Data export | 🟡 MVP-only | MyProfile | Tinder API | Only Tinder JSON supported |
| PWA install | ✅ Working | manifest.json | Service worker | Installable on mobile |
| Offline mode | ⚠️ Partial | Service worker | Cache strategy | Only cached assets, not full offline |

---

## Feature Details

### Core Analysis Pipeline

#### Video Frame Extraction
**File**: `src/lib/frameExtraction.ts`

```
Input: Video file (MP4, MOV, WebM)
Process: Canvas drawImage at intervals
Output: Array of base64 JPEG frames
```

**Constraints**:
- iOS Safari requires `muted` and `playsinline` attributes
- Frame interval configurable (default: every 2 seconds)
- Maximum frames capped to prevent memory issues

#### AI Profile Analysis
**File**: `src/lib/ai.ts`

**Stage 1 - Basic Extraction**:
- Name, age, location
- Occupation, education
- Basic bio parsing
- Image descriptions

**Stage 2 - Deep Analysis**:
- Personality assessment
- Communication style
- Values identification
- Red/green flags
- Neurodivergence indicators

**Token Budget**: 16,384 max (profile analysis)

### Storage Layer

#### Dexie Database Schema
**File**: `src/lib/db.ts`

**Tables**:
```typescript
profiles: '++id, name'  // Auto-increment ID, indexed name
userIdentity: 'id'      // Single record at id=1
```

**Profile Record Structure**:
- `id`: number (auto-generated)
- `name`: string
- `thumbnail`: string (base64)
- `frames`: string[] (base64 array)
- `analysis`: AnalysisData (union type)
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

#### 23 Aspects System
**Location**: Analysis tab on ProfileDetail

**Categories**:
1. Emotional Intelligence
2. Communication Style
3. Attachment Pattern
4. Conflict Resolution
5. Values Hierarchy
6. Social Orientation
7. Growth Mindset
8. Authenticity Level
9. Boundary Setting
10. Emotional Availability
11. Life Goals Alignment
12. Humor Compatibility
13. Intellectual Curiosity
14. Adventure Seeking
15. Stability Preference
16. Family Orientation
17. Career Drive
18. Health Consciousness
19. Financial Attitudes
20. Spiritual/Philosophical
21. Political Alignment
22. Social Media Usage
23. Relationship History

**Note**: Somewhat redundant with virtues system; consolidation recommended.

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

#### Partner Virtues
**Based on Eudaimonia Framework**:

1. **Sophia** (Wisdom): Intellectual compatibility
2. **Andreia** (Courage): Emotional bravery
3. **Sophrosyne** (Temperance): Self-regulation
4. **Dikaiosyne** (Justice): Fairness and ethics
5. **Philia** (Friendship): Companionship quality

Each virtue scored 1-10 with narrative explanation.

---

## Feature Gaps

### Missing Critical Features

| Feature | Priority | Effort | Notes |
|---------|----------|--------|-------|
| User authentication | P0 | High | Required for monetization |
| Credit system | P0 | Medium | Required for monetization |
| API key security | P0 | Medium | Currently exposed in bundle |
| Full offline mode | P1 | High | Only partial cache now |
| Data export (all) | P1 | Low | Only Tinder JSON currently |

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

- `anthropicClient.ts`: Main API client
- `config.ts`: API configuration
- `jsonExtractor.ts`: Response parsing

**Pattern**: All calls use `callAnthropicForObject<T>()` or `callAnthropicForArray<T>()`

### Hooks Architecture
**Directory**: `src/hooks/`

Each feature hook follows pattern:
```typescript
export function useFeature(profile: Profile) {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
- `VirtuesDisplay.tsx`
- `ZodiacCompatibility.tsx`

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
| 0.6 | 23 Aspects + Virtues | Current |

---

## Appendix: Component Dependency Graph

```
App.tsx
├── Home.tsx
│   └── ProfileCard.tsx
├── Upload.tsx
│   ├── VideoUploader.tsx
│   ├── FrameExtractor.tsx
│   └── AnalysisProgress.tsx
├── ProfileDetail.tsx
│   ├── OverviewTab.tsx
│   │   ├── CompatibilityScore.tsx
│   │   ├── VirtuesDisplay.tsx
│   │   └── ZodiacCompatibility.tsx
│   ├── AnalysisTab.tsx
│   │   └── AspectCards.tsx (x23)
│   └── CoachTab.tsx
│       ├── AskAboutMatch.tsx
│       ├── DateIdeas.tsx
│       ├── OpenerSuggestions.tsx
│       └── ConversationCoach.tsx
├── MyProfile.tsx
│   ├── BasicInfoTab.tsx
│   ├── DatingProfileTab.tsx
│   ├── ValuesTab.tsx
│   ├── PreferencesTab.tsx
│   ├── HistoryTab.tsx
│   └── ImportTab.tsx
└── Settings.tsx
```
