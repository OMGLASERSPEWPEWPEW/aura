# Product Requirements Document: AI Inference History

**Version:** 1.1
**Date:** 2026-01-26
**Author:** PRD Specialist (Claude Code)
**Contributors:** UX Specialist, UX Researcher
**Status:** Draft - UX/UXR Reviewed
**Priority:** High (RICE Score: 25.2)

---

## Executive Summary

### Problem Statement
Aura users currently have zero visibility into their AI usage costs. Every profile analysis, compatibility score, and opener suggestion consumes Anthropic API tokens, translating to real costs. Users cannot:
- Track how much they're "spending" on AI analysis
- Understand which features consume the most tokens
- Debug why certain analyses took longer than expected
- Make informed decisions about feature usage

This creates three critical gaps:
1. **User Trust Gap**: Users can't see what they're paying for in a future paid model
2. **Infrastructure Gap**: No foundation exists for Phase 2 monetization (credits/billing)
3. **Debugging Gap**: Support cannot diagnose API usage anomalies

### Solution Overview
Implement a comprehensive AI inference tracking system that captures token usage, costs, and context for every Anthropic API call. Present this data in a transparent, user-friendly "Usage" dashboard within Settings, establishing the foundation for future billing while providing immediate value through transparency and debugging capabilities.

### Business Impact

**Phase 1 (Immediate - Q1 2026)**
- **Transparency**: Build user trust by showing exactly what AI work is happening
- **Debugging**: Enable support to diagnose anomalies ("Why did my analysis take 5 minutes?")
- **Self-regulation**: Users can moderate usage if they see costs accumulating

**Phase 2 (Future - Q2 2026)**
- **Monetization Foundation**: Required infrastructure for credit-based billing
- **Revenue Enablement**: Connects usage data to Stripe receipts
- **Cost Attribution**: Link server-side API costs to individual users

**Estimated Development Effort**: 2 sprints (Backend: 1 sprint, Frontend: 1 sprint)

### Resource Requirements
- **Frontend Developer**: 40 hours (UI components, Settings page integration)
- **Backend Architect**: 16 hours (API layer modifications, Dexie schema)
- **Code Reviewer**: 8 hours (Quality assurance, test coverage)
- **Debugger**: 4 hours (Edge case testing, error scenarios)

### Risk Assessment
- **Low Risk**: Local-first architecture minimizes privacy/compliance concerns
- **Medium Risk**: Schema migration requires careful IndexedDB upgrade path
- **Low Risk**: Non-blocking feature - failure doesn't impact core functionality

---

## Product Overview

### Product Vision
Aura users have complete transparency into their AI usage, empowering them to understand costs, debug issues, and make informed decisions about feature usage. This foundation enables seamless transition to credit-based billing in Phase 2.

### Target Users

**Primary Persona: Cost-Conscious User**
- **Demographics**: 25-35, tech-savvy, dating app power user
- **Behavior**: Analyzes 5-10 profiles per week
- **Pain Point**: "I don't know if I'm using AI 'too much'"
- **Goal**: Understand and moderate AI usage before billing begins

**Secondary Persona: Power Debugger**
- **Demographics**: Early adopter, provides detailed bug reports
- **Behavior**: Tests edge cases, experiments with features
- **Pain Point**: "My analysis failed but I don't know why"
- **Goal**: Access detailed error logs and usage context

**Tertiary Persona: Future Paying Customer**
- **Demographics**: 30-45, values premium features
- **Behavior**: Will subscribe to unlimited credits
- **Pain Point**: "How do I track what I'm paying for?"
- **Goal**: Receipt-level transparency (Phase 2)

### Value Proposition

**User Value**
- **Transparency**: See exactly what AI work is happening per feature
- **Control**: Self-regulate usage if costs accumulate
- **Debugging**: Understand why analyses fail or take long
- **Trust**: Builds confidence in future billing fairness

**Business Value**
- **Monetization Enablement**: Required infrastructure for Phase 2 billing
- **Support Efficiency**: Reduces debugging time for anomalies
- **User Retention**: Transparency builds trust, reducing churn risk
- **Data-Driven**: Usage patterns inform pricing strategy

### Success Criteria

**Phase 1 (Launch - Q1 2026)**
- ✅ 100% of Anthropic API calls logged with token counts
- ✅ Usage dashboard accessible in Settings with <2s load time
- ✅ By-feature breakdown visible (profile analysis, compatibility, etc.)
- ✅ Total estimated cost displayed in USD
- ✅ Zero PII (prompts, personal data) stored in inference records

**Phase 2 (Billing Integration - Q2 2026)**
- ✅ Usage records sync to Supabase for multi-device view
- ✅ Stripe receipts link to inference records
- ✅ Credit balance decrements on API calls
- ✅ "Out of credits" UX prevents new analyses

**User Engagement Metrics**
- **60%** of users view Usage dashboard within first week after launch
- **<5%** of users contact support about unexpected costs (post-billing)
- **80%** of paying users cite transparency as a trust factor (survey)

### Assumptions
1. **Anthropic API returns token counts**: `usage.input_tokens`, `usage.output_tokens` are always present
2. **Local-first storage**: Inference records stored in IndexedDB, not Supabase (Phase 1)
3. **No user logout**: Inference records persist across sessions (cleared only on account deletion)
4. **Pricing stability**: Anthropic pricing remains ~$3/M input, ~$15/M output tokens (Sonnet)
5. **Opt-out not required**: Users expect AI app to track AI usage (no regulatory compliance issues)

---

## UX Research Findings

### Critical Insight
> **"Transparency builds trust, but framing determines whether it encourages or discourages usage."**

### User Mental Models

Research reveals three distinct mental models for AI costs:

| Mental Model | User Type | Design Response |
|--------------|-----------|-----------------|
| **Tokens** | Technical users | Raw counts in debug view |
| **Credits** | Consumer app users | Abstract units (future Phase 2) |
| **Dollars** | Budget-conscious | USD estimates, secondary display |

**Recommendation**: Hybrid model defaulting to user-friendly language with expandable technical details.

### Language Framing (Critical UX Decision)

| ❌ Avoid (Judgmental) | ✅ Prefer (Empowering) |
|----------------------|------------------------|
| "You spent $X" | "You invested $X in understanding your matches" |
| "You used X credits" | "X insights unlocked" |
| "Usage history" | "Your discovery journey" |
| "Cost breakdown" | "Value delivered" |

**Rationale**: Studies show "heightened uncertainty about AI discourages individuals from engaging with it." However, hidden costs create more anxiety than known costs. The key is **positive framing**.

### Value Pairing Requirement

Every cost display MUST be paired with value received:

```
Profile: Sarah, 28
Investment: ~$0.04
Value Delivered:
  ✓ Compatibility score: 87%
  ✓ 11 Virtues analyzed
  ✓ 5 conversation openers
  ✓ Personalized date ideas
```

This reframes "I spent $0.04" as "I got 4 valuable insights for $0.04."

### User Segmentation (Progressive Disclosure)

| Segment | Need | Default View |
|---------|------|--------------|
| **Casual** | "Is it working?" | Simple summary badge |
| **Cost-Conscious** | Detailed breakdowns | Expandable per-feature costs |
| **Power User** | Debug info | Token counts, model, timestamps |

**Design**: Three-level progressive disclosure:
1. **Level 1 (Default)**: "This month: 12 profiles analyzed"
2. **Level 2 (Tap to expand)**: By-feature breakdown with costs
3. **Level 3 (Tap "Debug")**: Token counts, model version, timestamps

### Visual Design Principles

**Color Strategy** (Non-Alarming):
- ✅ Neutral slate-gray for high usage (informational)
- ❌ Never use red (creates anxiety)
- ✅ Green/amber for low/medium usage tiers

**Cost Display Format**:
```tsx
<div className="space-y-1">
  <div className="flex items-baseline gap-2">
    <span className="text-2xl font-bold text-slate-900">12</span>
    <span className="text-sm text-slate-500">profiles analyzed</span>
  </div>
  <p className="text-xs text-slate-400">≈ $0.50 invested</p>
</div>
```

**Rationale**:
- Value (profiles) primary, cost secondary
- Use "≈" to indicate estimation
- Use "invested" not "spent"

### Mobile-First Requirements

- **Touch targets**: Minimum 44px height/width
- **Expandable sections**: Full-width tap areas, not just icons
- **Swipe gestures**: History items swipeable for details
- **No horizontal scroll**: Stack elements vertically

### Empty State Design

For new users with zero history:
- Encouraging illustration/icon
- "No AI usage yet" (not "No data")
- Clear CTA: "Upload your first profile"
- Gradient background matching Aura brand

### A/B Test Plan (Post-Launch)

| Test | Variant A | Variant B | Measure |
|------|-----------|-----------|---------|
| Framing | "Cost: $0.50" | "Investment: $0.50" | Analysis frequency |
| Placement | Header badge | Settings-only | Usage anxiety |
| Value pairing | Cost only | Cost + insights | User satisfaction |
| Disclosure depth | 2 levels | 3 levels | Support tickets |

### Post-Launch Metrics

| Metric | Target | Rationale |
|--------|--------|-----------|
| Settings page visits | 20% of MAU/month | Interest indicator |
| History expansion rate | <30% expand | Casual majority served |
| Analysis frequency Δ | No decrease >10% | Cost anxiety check |
| Support tickets | <5% about billing | Clarity of display |

---

## Functional Requirements

### Core Features

#### FR-1: Token Usage Capture
**Priority:** P0 (Blocker for all other features)

**Description**: Modify `anthropicClient.ts` to extract and store token usage from every Anthropic API response.

**Acceptance Criteria:**
- ✅ `makeRequest()` function extracts `usage.input_tokens` and `usage.output_tokens` from API response
- ✅ Token counts passed to new `logInference()` function
- ✅ Zero performance impact (<5ms overhead per API call)
- ✅ Handles missing `usage` field gracefully (logs warning, defaults to 0)
- ✅ Works for both proxy and direct API modes

**Technical Specification:**
```typescript
// src/lib/api/anthropicClient.ts
interface AnthropicResponse {
  content: Array<{ type: string; text: string }>;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

async function makeRequest(options: AnthropicRequestOptions, operationName?: string): Promise<string> {
  // ... existing fetch logic ...

  const data: AnthropicResponse = await response.json();

  // NEW: Extract token usage
  if (data.usage) {
    await logInference({
      inputTokens: data.usage.input_tokens,
      outputTokens: data.usage.output_tokens,
      feature: inferFeatureFromOperation(operationName),
      page: getCurrentPage(),
      model: ANTHROPIC_CONFIG.MODEL,
      success: true,
    });
  } else {
    console.warn('API response missing usage field');
  }

  return data.content[0].text;
}
```

---

#### FR-2: Inference Logging
**Priority:** P0 (Blocker)

**Description**: Create a new Dexie table to store inference records with context.

**Acceptance Criteria:**
- ✅ New `inferenceHistory` table added to AuraDB schema
- ✅ Schema includes: id, timestamp, tokens, cost, feature, page, profileId, userId, success, errorType
- ✅ Migration preserves existing data (version 13 upgrade)
- ✅ Records auto-expire after 90 days (optional pruning function)
- ✅ No PII stored (no raw prompts or profile data)

**Data Model:**
```typescript
// src/lib/db.ts
interface InferenceRecord {
  id: number;                    // Auto-increment
  timestamp: Date;               // When the inference occurred

  // Cost tracking
  inputTokens: number;           // Tokens sent to API
  outputTokens: number;          // Tokens received
  estimatedCostUsd: number;      // Calculated from token counts
  model: string;                 // e.g., "claude-sonnet-4-20250514"

  // Context
  feature: InferenceFeature;     // Which feature triggered this
  page: string;                  // Which page the user was on

  // User context (for multi-user future)
  userId?: string;               // Supabase user ID (if logged in)

  // Optional metadata
  profileId?: number;            // If analyzing a specific profile
  success: boolean;              // Did the call succeed?
  errorType?: string;            // If failed, what type of error

  // Sync fields (Phase 2)
  serverId?: string;             // UUID from Supabase inference_history table
}

type InferenceFeature =
  | 'profile_analysis_chunk1'
  | 'profile_analysis_chunk2'
  | 'profile_analysis_chunk3'
  | 'profile_analysis_chunk4'
  | 'profile_analysis_consolidation'
  | 'user_synthesis'
  | 'compatibility_scoring'
  | 'date_ideas'
  | 'opener_suggestions'
  | 'ask_about_match'
  | 'conversation_coaching'
  | 'zodiac_compatibility';

// Dexie schema
db.version(13).stores({
  profiles: '++id, name, appName, timestamp, analysisPhase, serverId',
  userIdentity: '++id, lastUpdated, supabaseUserId, serverId',
  coachingSessions: '++id, profileId, timestamp, serverId',
  matchChats: '++id, profileId, timestamp, serverId',
  inferenceHistory: '++id, timestamp, feature, userId, success', // NEW TABLE
});
```

**Cost Calculation:**
```typescript
// src/lib/inference/costCalculator.ts
const ANTHROPIC_PRICING = {
  'claude-sonnet-4-20250514': {
    inputPerMillion: 3.0,   // $3 per 1M input tokens
    outputPerMillion: 15.0, // $15 per 1M output tokens
  },
};

function calculateCost(inputTokens: number, outputTokens: number, model: string): number {
  const pricing = ANTHROPIC_PRICING[model];
  if (!pricing) {
    console.warn(`Unknown model pricing: ${model}`);
    return 0;
  }

  const inputCost = (inputTokens / 1_000_000) * pricing.inputPerMillion;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPerMillion;

  return inputCost + outputCost;
}
```

---

#### FR-3: Feature Attribution
**Priority:** P0 (Blocker)

**Description**: Automatically detect which feature triggered each API call.

**Acceptance Criteria:**
- ✅ `inferFeatureFromOperation()` maps `operationName` to `InferenceFeature`
- ✅ All 8 AI features correctly attributed
- ✅ Unknown operations default to `'unknown'` with warning log
- ✅ Page context captured via `window.location.pathname`

**Feature Mapping:**
```typescript
// src/lib/inference/featureMapper.ts
function inferFeatureFromOperation(operationName?: string): InferenceFeature {
  if (!operationName) return 'unknown';

  const mapping: Record<string, InferenceFeature> = {
    'analyzeChunk1': 'profile_analysis_chunk1',
    'analyzeChunk2': 'profile_analysis_chunk2',
    'analyzeChunk3': 'profile_analysis_chunk3',
    'analyzeChunk4': 'profile_analysis_chunk4',
    'consolidateProfile': 'profile_analysis_consolidation',
    'generateUserSynthesis': 'user_synthesis',
    'calculateCompatibility': 'compatibility_scoring',
    'generateDateIdeas': 'date_ideas',
    'generateOpeners': 'opener_suggestions',
    'askAboutMatch': 'ask_about_match',
    'coachConversation': 'conversation_coaching',
    'analyzeZodiacCompatibility': 'zodiac_compatibility',
  };

  return mapping[operationName] || 'unknown';
}
```

---

#### FR-4: Usage Dashboard (Settings Page)
**Priority:** P1 (Must-have for launch)

**Description**: Add a "Usage" section to the Settings page showing inference history.

**Acceptance Criteria:**
- ✅ New "AI Usage" card appears in Settings page
- ✅ Summary stats: Total tokens, estimated cost (last 30 days, all-time)
- ✅ By-feature breakdown (bar chart or table)
- ✅ Detailed history list (latest 50 records, expandable)
- ✅ Loads in <2 seconds for users with 500+ records
- ✅ Responsive design (mobile-first)

**UI Components (UX-Reviewed):**

**Level 1: Summary Card (Always Visible)**
```
┌─────────────────────────────────────┐
│ 💡 Your AI Insights                 │
│                                     │
│ This Month                          │
│ ┌─────────────────────────────────┐ │
│ │  12 profiles analyzed            │ │
│ │  ≈ $0.50 invested               │ │
│ │                                 │ │
│ │  Value Delivered:               │ │
│ │  ✓ 132 compatibility scores     │ │
│ │  ✓ 60 opener suggestions       │ │
│ │  ✓ 24 date idea sets           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [View Breakdown ↓]                  │
└─────────────────────────────────────┘
```

**Level 2: By-Feature Breakdown (Expandable)**
```
┌──────────────────────────────────────────┐
│ Insights by Feature                      │
├──────────────────────────────────────────┤
│ Profile Analysis          32 insights    │
│ ████████████████░░░░  ≈ $1.42 invested  │
│                                          │
│ Compatibility Scoring     18 insights    │
│ █████████░░░░░░░░░░░  ≈ $0.58 invested  │
│                                          │
│ Opener Suggestions        14 insights    │
│ ███████░░░░░░░░░░░░░  ≈ $0.24 invested  │
│                                          │
│ Date Ideas                 6 insights    │
│ ███░░░░░░░░░░░░░░░░░  ≈ $0.08 invested  │
│                                          │
│ [View Activity Log ↓]                    │
└──────────────────────────────────────────┘
```

**Level 3: Activity Log (Debug View)**
```
┌──────────────────────────────────────────┐
│ Recent Activity                          │
├──────────────────────────────────────────┤
│ ✓ Profile Analysis                       │
│   Sarah, 28 · 2 mins ago                │
│   Value: Compatibility 87%, 5 openers   │
│   ≈ $0.04 · 4,821 in / 1,843 out tokens │
│                                          │
│ ✓ Compatibility Scoring                  │
│   Emily, 26 · 1 hour ago                │
│   Value: Compatibility 72%              │
│   ≈ $0.03 · 3,200 in / 800 out tokens   │
│                                          │
│ ⚠ User Synthesis (Timeout)               │
│   2 hours ago · Retrying...             │
│   ≈ $0.00 · Connection interrupted      │
│                                          │
│ [Load More...]                           │
└──────────────────────────────────────────┘
```

**Empty State (New Users):**
```
┌─────────────────────────────────────┐
│      ┌───────────────────┐          │
│      │    💡 [icon]      │          │
│      └───────────────────┘          │
│                                     │
│    No insights generated yet        │
│                                     │
│  Upload your first profile to see   │
│  AI analysis stats and value here   │
│                                     │
│      [📤 Upload Profile]            │
└─────────────────────────────────────┘
```

**React Component Structure:**
```tsx
// src/pages/Settings.tsx
import { UsageSummaryCard } from '../components/usage/UsageSummaryCard';
import { UsageHistoryModal } from '../components/usage/UsageHistoryModal';

export default function Settings() {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div>
      {/* Existing settings sections */}

      <UsageSummaryCard onViewHistory={() => setShowHistory(true)} />

      {showHistory && (
        <UsageHistoryModal onClose={() => setShowHistory(false)} />
      )}
    </div>
  );
}
```

---

#### FR-5: Privacy Controls
**Priority:** P1 (Must-have for launch)

**Description**: Ensure no PII is stored in inference records.

**Acceptance Criteria:**
- ✅ No raw prompts stored
- ✅ No profile names/ages stored (only profileId reference)
- ✅ No user messages stored
- ✅ Clear privacy policy statement in Usage dashboard
- ✅ "Export my data" includes inference history

**Privacy Statement (UI):**
```
ℹ️ Privacy Notice
Your AI usage history includes only metadata (timestamps,
token counts, feature names). No personal information from
profiles or messages is stored.
```

---

### User Stories

#### Story 1: View Insights Summary
**As a** curious user
**I want** to see my AI insights and the value delivered
**So that** I understand what I'm getting from my investment

**Acceptance Criteria:**
- **Given** I have analyzed 5 profiles this month
- **When** I navigate to Settings > AI Insights
- **Then** I see "This month: 5 profiles analyzed · ≈ $0.23 invested"
- **And** I see value delivered: "55 compatibility scores, 25 openers generated"

---

#### Story 2: Debug Failed Analysis
**As a** power user
**I want** to see detailed error logs for failed analyses
**So that** I can report issues with context to support

**Acceptance Criteria:**
- **Given** my profile analysis timed out
- **When** I view Usage History
- **Then** I see "Profile Analysis · 5 mins ago · ⚠ Timeout" with timestamp and feature name

---

#### Story 3: Compare Feature Costs
**As a** curious user
**I want** to see which features consume the most tokens
**So that** I can understand where my "budget" goes

**Acceptance Criteria:**
- **Given** I've used multiple AI features
- **When** I view By-Feature Breakdown
- **Then** I see "Profile Analysis: $1.42 (61%)" as the top consumer

---

#### Story 4: Export Usage Data
**As a** privacy-focused user
**I want** to export my AI usage history
**So that** I have a complete record of my data

**Acceptance Criteria:**
- **Given** I navigate to Settings > Data Export
- **When** I click "Export My Data"
- **Then** the downloaded JSON includes `inferenceHistory: [...]`

---

#### Story 5: Monitor Real-Time Usage (Phase 2)
**As a** paying user
**I want** to see my credit balance decrement in real-time
**So that** I know when I'm running low on credits

**Acceptance Criteria:**
- **Given** I have 100 credits remaining
- **When** I analyze a new profile
- **Then** my credit balance updates to 95 credits immediately

---

### User Flows

#### Flow 1: First-Time Usage View
```
1. User completes first profile analysis
2. Toast notification: "✓ Profile analyzed · $0.04 spent"
3. User navigates to Settings
4. User taps "AI Usage" card
5. User sees summary: "All Time: $0.04 · 1 analysis"
6. User taps "View Detailed History"
7. User sees single record: "Profile Analysis · Just now · $0.04"
```

#### Flow 2: Power User Monthly Review
```
1. User analyzes 50 profiles in a month
2. User navigates to Settings > AI Usage
3. User sees "Last 30 days: $22.50 · 500,000 tokens"
4. User taps "By-Feature Breakdown"
5. User sees bar chart: Profile Analysis (80%), Compatibility (15%), Other (5%)
6. User thinks: "Okay, this is reasonable for what I'm getting"
```

#### Flow 3: Debugging Failed Analysis
```
1. User's profile analysis times out
2. Error toast: "⚠ Analysis timed out"
3. User navigates to Settings > AI Usage
4. User taps "View Detailed History"
5. User sees "Profile Analysis · 2 mins ago · ⚠ Timeout"
6. User screenshots record and sends to support
7. Support checks logs, identifies 150-second timeout exceeded
```

---

## Non-Functional Requirements

### Performance

#### NFR-1: Logging Overhead
- **Requirement**: `logInference()` must add <5ms overhead per API call
- **Rationale**: Streaming analysis makes 5+ API calls per profile; 25ms overhead = noticeable delay
- **Validation**: Benchmark with 100 consecutive calls, measure P95 latency increase

#### NFR-2: Dashboard Load Time
- **Requirement**: Usage dashboard loads in <2s for users with 500+ inference records
- **Rationale**: Users check usage frequently; slow load = poor UX
- **Validation**: Seed test database with 1000 records, measure load time

#### NFR-3: IndexedDB Storage
- **Requirement**: Inference records consume <1KB per record (avg 500 bytes)
- **Rationale**: Power users may accumulate 5,000+ records over time
- **Validation**: Measure storage size for 100 test records

---

### Security

#### NFR-4: No PII Storage
- **Requirement**: Inference records MUST NOT contain raw prompts, profile names, user messages, or other PII
- **Rationale**: Privacy compliance, GDPR Article 5 (data minimization)
- **Validation**: Manual audit of logged data, automated PII detection tests

#### NFR-5: Local-First (Phase 1)
- **Requirement**: Inference records stored only in IndexedDB, not synced to Supabase
- **Rationale**: Minimize server-side storage costs, simplify privacy compliance
- **Validation**: Network inspector confirms no `/inference_history` API calls

---

### Usability

#### NFR-6: Clear Cost Display
- **Requirement**: Costs displayed in USD with 2 decimal places (e.g., "$0.04")
- **Rationale**: Users understand dollars, not tokens
- **Validation**: User testing with 10 participants, 100% comprehension rate

#### NFR-7: Mobile-First Design
- **Requirement**: Usage dashboard fully responsive on 375px viewport (iPhone SE)
- **Rationale**: 60% of Aura users on mobile (iOS Safari, Android Chrome)
- **Validation**: Manual testing on 5 device sizes, no horizontal scroll

#### NFR-8: Accessible Color Palette
- **Requirement**: Success/error indicators meet WCAG 2.1 AA contrast ratio (4.5:1)
- **Rationale**: Accessibility for color-blind users
- **Validation**: axe DevTools audit, zero violations

---

### Reliability

#### NFR-9: Graceful Degradation
- **Requirement**: If `logInference()` fails, API call still succeeds (non-blocking)
- **Rationale**: Logging is nice-to-have; core analysis is critical
- **Validation**: Force IndexedDB quota error, verify analysis completes

#### NFR-10: Missing Usage Field Handling
- **Requirement**: If API response lacks `usage` field, log warning and default to 0 tokens
- **Rationale**: Anthropic API contract may change; don't crash
- **Validation**: Mock API response without `usage`, verify graceful handling

---

### Scalability

#### NFR-11: Auto-Pruning (Optional)
- **Requirement**: Records older than 90 days auto-deleted (configurable)
- **Rationale**: Prevent unbounded IndexedDB growth for multi-year users
- **Validation**: Seed 200 old records, run pruning, verify deletion

#### NFR-12: Efficient Queries
- **Requirement**: Dashboard queries use Dexie indexes (timestamp, feature, userId)
- **Rationale**: O(log n) lookups, not O(n) scans
- **Validation**: Explain query plans, verify index usage

---

## Technical Considerations

### Architecture Overview

**Component Diagram:**
```
┌─────────────────────────────────────────────────┐
│ User Trigger (e.g., Upload profile video)       │
└────────────────┬────────────────────────────────┘
                 │
                 v
┌─────────────────────────────────────────────────┐
│ useStreamingAnalysis (State Machine Hook)       │
└────────────────┬────────────────────────────────┘
                 │
                 v
┌─────────────────────────────────────────────────┐
│ ai.ts: analyzeProfileStreaming()                │
└────────────────┬────────────────────────────────┘
                 │
                 v
┌─────────────────────────────────────────────────┐
│ anthropicClient.ts: makeRequest()               │
│ → Extract usage.input_tokens, output_tokens    │
└────────────────┬────────────────────────────────┘
                 │
                 v
┌─────────────────────────────────────────────────┐
│ inference/logger.ts: logInference()             │
│ → Calculate cost, infer feature, save to DB    │
└────────────────┬────────────────────────────────┘
                 │
                 v
┌─────────────────────────────────────────────────┐
│ Dexie: inferenceHistory.add()                   │
│ → IndexedDB storage (local-first)              │
└─────────────────────────────────────────────────┘
```

**Data Flow:**
1. User uploads profile video
2. `useStreamingAnalysis` calls `analyzeProfileStreaming(frames, 1)` (Chunk 1)
3. `analyzeProfileStreaming()` calls `callAnthropicForObjectValidated()`
4. `makeRequest()` receives response, extracts `usage` field
5. `logInference()` calculates cost, maps operationName to feature
6. Record saved to IndexedDB `inferenceHistory` table
7. Repeat for Chunks 2-4, consolidation (total 5 inference records)

---

### Technology Stack

**Backend (Data Layer)**
- **Dexie.js**: IndexedDB wrapper for inference storage
- **TypeScript**: Type-safe inference records

**Frontend (UI Layer)**
- **React 19**: Usage dashboard components
- **Tailwind CSS**: Styling (matches existing design system)
- **Recharts** (optional): Bar chart for by-feature breakdown
- **lucide-react**: Icons (Activity, DollarSign, TrendingUp)

**Testing**
- **Vitest**: Unit tests for `logInference()`, cost calculator
- **Playwright**: E2E test for Settings > Usage flow

---

### Data Model

**Dexie Schema:**
```typescript
// src/lib/db.ts (Version 13 migration)
db.version(13).stores({
  profiles: '++id, name, appName, timestamp, analysisPhase, serverId',
  userIdentity: '++id, lastUpdated, supabaseUserId, serverId',
  coachingSessions: '++id, profileId, timestamp, serverId',
  matchChats: '++id, profileId, timestamp, serverId',
  inferenceHistory: '++id, timestamp, feature, userId, success', // NEW
});
```

**Indexes:**
- `++id`: Auto-increment primary key
- `timestamp`: For date range queries ("last 30 days")
- `feature`: For by-feature breakdown
- `userId`: For multi-user future (Phase 2)
- `success`: For filtering failed inferences

**Sample Record:**
```json
{
  "id": 1,
  "timestamp": "2026-01-26T10:32:14.000Z",
  "inputTokens": 4821,
  "outputTokens": 1843,
  "estimatedCostUsd": 0.042129,
  "model": "claude-sonnet-4-20250514",
  "feature": "profile_analysis_chunk1",
  "page": "/upload",
  "userId": "a8f7b2c1-4e9d-4a2b-8c3d-1e6f9a0b2c4d",
  "profileId": 42,
  "success": true,
  "errorType": null,
  "serverId": null
}
```

---

### API Changes Required

#### Change 1: Modify `makeRequest()` to Extract Usage
**File:** `src/lib/api/anthropicClient.ts`

**Before:**
```typescript
async function makeRequest(options: AnthropicRequestOptions): Promise<string> {
  // ... fetch logic ...
  const data: AnthropicResponse = await response.json();
  return data.content[0].text;
}
```

**After:**
```typescript
async function makeRequest(
  options: AnthropicRequestOptions,
  operationName?: string
): Promise<string> {
  // ... fetch logic ...
  const data: AnthropicResponse = await response.json();

  // NEW: Log token usage
  if (data.usage) {
    await logInference({
      inputTokens: data.usage.input_tokens,
      outputTokens: data.usage.output_tokens,
      feature: inferFeatureFromOperation(operationName),
      page: window.location.pathname,
      model: ANTHROPIC_CONFIG.MODEL,
      success: true,
      profileId: options.profileId, // NEW optional param
    });
  }

  return data.content[0].text;
}
```

---

#### Change 2: Update All AI Function Calls to Pass operationName
**Files:** `src/lib/ai.ts`, `src/hooks/*.ts`, `src/pages/*.tsx`

**Example (Profile Analysis):**
```typescript
// src/lib/ai.ts
export async function analyzeProfileStreaming(
  frames: string[],
  chunkNumber: number,
  accumulated: AccumulatedProfile
): Promise<AccumulatedProfile> {
  const result = await callAnthropicForObjectValidated(
    {
      messages: [textContent(prompt), ...frameContents],
      maxTokens: 4000,
      timeout: TIMEOUTS.PROFILE_ANALYSIS,
      retries: 2,
    },
    ProfileAnalysisChunkSchema,
    `analyzeChunk${chunkNumber}` // NEW: Operation name for tracking
  );

  // ... rest of function
}
```

**All Operations to Update:**
- `analyzeChunk1`, `analyzeChunk2`, `analyzeChunk3`, `analyzeChunk4`
- `consolidateProfile`
- `generateUserSynthesis`
- `calculateCompatibility`
- `generateDateIdeas`
- `generateOpeners`
- `askAboutMatch`
- `coachConversation`
- `analyzeZodiacCompatibility`

---

#### Change 3: Create Inference Logger
**File:** `src/lib/inference/logger.ts` (NEW)

```typescript
import { db } from '../db';
import { calculateCost } from './costCalculator';
import { inferFeatureFromOperation } from './featureMapper';
import { getAccessToken } from '../supabase';

interface LogInferenceParams {
  inputTokens: number;
  outputTokens: number;
  feature: InferenceFeature;
  page: string;
  model: string;
  success: boolean;
  errorType?: string;
  profileId?: number;
}

export async function logInference(params: LogInferenceParams): Promise<void> {
  try {
    const cost = calculateCost(params.inputTokens, params.outputTokens, params.model);

    // Get current user ID if logged in
    const userId = await getUserIdIfLoggedIn();

    await db.inferenceHistory.add({
      timestamp: new Date(),
      inputTokens: params.inputTokens,
      outputTokens: params.outputTokens,
      estimatedCostUsd: cost,
      model: params.model,
      feature: params.feature,
      page: params.page,
      userId,
      profileId: params.profileId,
      success: params.success,
      errorType: params.errorType || null,
    });
  } catch (error) {
    // Non-blocking: if logging fails, don't crash the app
    console.error('Failed to log inference:', error);
  }
}

async function getUserIdIfLoggedIn(): Promise<string | undefined> {
  // Check if user is logged in to Supabase
  const token = await getAccessToken();
  if (!token) return undefined;

  // Decode JWT to extract user ID (simple parse, no verification needed for local logging)
  const payload = JSON.parse(atob(token.split('.')[1]));
  return payload.sub; // Supabase user UUID
}
```

---

### Integration Requirements

#### Integration 1: Settings Page
**File:** `src/pages/Settings.tsx`

**New Section:**
```tsx
{/* AI Usage Section */}
<div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
  <div className="flex items-center gap-2 mb-4">
    <Activity size={18} className="text-violet-500" />
    <h3 className="font-semibold text-slate-900">AI Usage</h3>
  </div>
  <p className="text-sm text-slate-500 mb-4">
    Track your AI analysis usage and estimated costs.
  </p>
  <UsageSummaryCard onViewHistory={() => setShowHistoryModal(true)} />
</div>
```

---

#### Integration 2: Data Export
**File:** `src/lib/utils/dataExport.ts`

**Append to Export JSON:**
```typescript
export async function exportAllUserData(): Promise<string> {
  const profiles = await db.profiles.toArray();
  const userIdentity = await db.userIdentity.get(1);
  const coachingSessions = await db.coachingSessions.toArray();
  const matchChats = await db.matchChats.toArray();
  const inferenceHistory = await db.inferenceHistory.toArray(); // NEW

  return JSON.stringify({
    profiles,
    userIdentity,
    coachingSessions,
    matchChats,
    inferenceHistory, // NEW
    exportedAt: new Date().toISOString(),
  }, null, 2);
}
```

---

### Infrastructure Needs

#### Phase 1 (Local-First)
- **Client-Side Only**: No server changes required
- **IndexedDB Quota**: Assume 50MB available (browser default)
- **Storage Estimate**: 500 bytes/record × 5,000 records = 2.5MB (well within quota)

#### Phase 2 (Supabase Sync)
**Supabase Table: `inference_history`**
```sql
CREATE TABLE inference_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL,
  input_tokens INT NOT NULL,
  output_tokens INT NOT NULL,
  estimated_cost_usd DECIMAL(10, 6) NOT NULL,
  model TEXT NOT NULL,
  feature TEXT NOT NULL,
  page TEXT,
  profile_id UUID REFERENCES match_profiles(id) ON DELETE SET NULL,
  success BOOLEAN NOT NULL,
  error_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_inference_history_user_id ON inference_history(user_id);
CREATE INDEX idx_inference_history_timestamp ON inference_history(timestamp DESC);
CREATE INDEX idx_inference_history_feature ON inference_history(feature);
```

**Row-Level Security (RLS):**
```sql
-- Users can only read their own inference history
CREATE POLICY "Users can view own inferences"
  ON inference_history FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert on behalf of users (via Edge Function)
CREATE POLICY "Authenticated users can insert"
  ON inference_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

## Success Metrics

### Launch Metrics (Week 1)

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Logging Coverage** | 100% of API calls logged | Log sampling, verify every feature |
| **Dashboard Adoption** | 60% of MAU view Usage | Mixpanel event: `usage_dashboard_viewed` |
| **Load Time** | <2s P95 | Real User Monitoring (RUM) |
| **Zero PII Leaks** | 0 violations | Manual audit + automated tests |

### Engagement Metrics (Month 1)

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Repeat Views** | 30% of users view 3+ times | Mixpanel cohort analysis |
| **Feature Discovery** | 40% tap "By-Feature Breakdown" | Event: `usage_breakdown_viewed` |
| **Export Adoption** | 5% export data with inference history | Event: `data_exported` |

### Phase 2 Metrics (Post-Billing Launch)

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Billing Transparency** | 80% survey respondents cite transparency | In-app survey (N=100) |
| **Support Tickets** | <5% about unexpected costs | Zendesk ticket categorization |
| **Credit Awareness** | 90% of users check balance monthly | Event: `credit_balance_viewed` |

---

## Rollout Plan

### Phase 1: Data Capture (Sprint 1 - Weeks 1-2)

**Goals:**
- ✅ Implement token logging infrastructure
- ✅ 100% of API calls tracked
- ✅ No regressions to core features

**Tasks:**
1. **Backend Architect** (16 hours)
   - Create Dexie schema v13 with `inferenceHistory` table
   - Write `logInference()` function with cost calculation
   - Write `inferFeatureFromOperation()` mapper
   - Add `operationName` param to `makeRequest()`
   - Update all AI function calls to pass operation names
   - Write unit tests (100% coverage)

2. **Code Reviewer** (4 hours)
   - Review schema migration safety
   - Review non-blocking error handling
   - Verify zero PII stored

3. **Debugger** (2 hours)
   - Test with 100 consecutive API calls
   - Force IndexedDB quota error, verify graceful degradation
   - Verify all 12 features correctly attributed

**Acceptance Criteria:**
- ✅ 748 existing unit tests still pass
- ✅ 321 E2E tests still pass (no regressions)
- ✅ New unit tests: `logInference.test.ts` (10 tests), `costCalculator.test.ts` (5 tests)
- ✅ Logging adds <5ms overhead (benchmark)

---

### Phase 2: Settings UI (Sprint 2 - Weeks 3-4)

**Goals:**
- ✅ Users can view usage in Settings
- ✅ Mobile-responsive design
- ✅ 60% adoption in first week

**Tasks:**
1. **Frontend Developer** (40 hours)
   - Create `UsageSummaryCard` component (8h)
   - Create `UsageHistoryModal` component (12h)
   - Create `FeatureBreakdownTable` component (8h)
   - Integrate into Settings page (4h)
   - Write Storybook stories for all components (4h)
   - Write E2E test: Settings > Usage flow (4h)

2. **Mobile UX Optimizer** (8 hours)
   - Test on 5 device sizes (iPhone SE, iPhone 15, iPad, Pixel, Galaxy)
   - Optimize table for 375px viewport
   - Ensure touch targets ≥44px
   - Verify no horizontal scroll

3. **Code Reviewer** (4 hours)
   - Review component design (DRY, reusable)
   - Verify WCAG 2.1 AA compliance (axe DevTools)
   - Review query performance (<2s load time)

**Acceptance Criteria:**
- ✅ All existing tests pass (748 unit + 321 E2E)
- ✅ New E2E test: `settings-usage.spec.ts` (5 scenarios)
- ✅ Lighthouse score: Accessibility ≥95
- ✅ Load time <2s for 500 records (manual test)

---

### Phase 3: Soft Launch (Week 5)

**Goals:**
- ✅ Launch to 10% of users (canary release)
- ✅ Monitor for issues
- ✅ Gather qualitative feedback

**Tasks:**
1. **Backend Architect** (2 hours)
   - Add feature flag: `ENABLE_USAGE_TRACKING` (default: false)
   - Deploy to Vercel with flag enabled for 10% traffic

2. **Frontend Developer** (4 hours)
   - Add banner: "New: Track your AI usage in Settings"
   - Implement in-app survey: "Was this usage data helpful?" (1-5 stars)

3. **Master Product Manager** (4 hours)
   - Monitor Mixpanel: `usage_dashboard_viewed` event rate
   - Review 20 user sessions (FullStory/HotJar)
   - Interview 5 canary users (qualitative feedback)

**Rollback Criteria:**
- ❌ Logging causes >10ms overhead (performance regression)
- ❌ IndexedDB quota errors affect >1% of users
- ❌ Dashboard crashes on load for >5% of users

---

### Phase 4: Full Launch (Week 6)

**Goals:**
- ✅ Enable for 100% of users
- ✅ Announce via email + in-app
- ✅ 60% adoption in Week 1

**Tasks:**
1. **Backend Architect** (1 hour)
   - Set `ENABLE_USAGE_TRACKING=true` for 100% traffic

2. **Frontend Developer** (2 hours)
   - Add toast on first profile analysis: "✓ Profile analyzed · $0.04 spent"
   - Update onboarding flow to mention usage tracking

3. **Master Product Manager** (8 hours)
   - Draft launch email: "Introducing AI Usage Transparency"
   - Post to community (Discord, Twitter)
   - Monitor adoption metrics (Mixpanel dashboard)

**Success Metrics (Week 1):**
- ✅ 60% of MAU view Usage dashboard
- ✅ <5 support tickets about confusion
- ✅ 4.2+ star average in-app survey

---

### Phase 5: Phase 2 Prep (Future - Q2 2026)

**Goals:**
- ✅ Sync inference history to Supabase
- ✅ Connect to credit system
- ✅ Link to Stripe receipts

**Tasks:**
1. **Backend Architect** (40 hours)
   - Create Supabase `inference_history` table with RLS
   - Write sync logic (similar to `profileSync.ts`)
   - Add `serverId` field to local records
   - Implement conflict resolution (last-write-wins)

2. **Frontend Developer** (16 hours)
   - Update Usage dashboard to show synced records
   - Add "Sync Now" button
   - Handle offline mode (show local records only)

3. **Payment Integration Specialist** (24 hours)
   - Create `credits` table in Supabase
   - Decrement credits on `logInference()`
   - Link Stripe receipts to inference records
   - Build credit purchase flow

---

## Risks and Mitigations

### Risk 1: Performance Degradation
**Probability:** Low
**Impact:** High (user-facing latency)

**Description**: `logInference()` adds latency to every API call. If poorly implemented, could add 50-100ms overhead, making streaming analysis feel sluggish.

**Mitigation:**
- **Non-blocking writes**: Use `db.inferenceHistory.add()` without `await` in hot path
- **Benchmarking**: Measure P95 latency before/after with 100 consecutive calls
- **Circuit breaker**: If logging fails 3+ times, disable for session (fallback mode)

**Contingency**: If latency increases >10ms, revert and refactor to background worker.

---

### Risk 2: IndexedDB Quota Exceeded
**Probability:** Low
**Impact:** Medium (feature disabled for power users)

**Description**: Power users with 10,000+ records (5 years of usage) may hit 50MB IndexedDB quota, causing writes to fail.

**Mitigation:**
- **Auto-pruning**: Delete records older than 90 days (configurable)
- **Quota check**: Before logging, check `navigator.storage.estimate()`, warn if <5MB remaining
- **Graceful degradation**: If quota exceeded, log warning but don't crash

**Contingency**: If quota issues affect >1% of users, reduce retention to 30 days.

---

### Risk 3: Missing `usage` Field in API Response
**Probability:** Medium
**Impact:** Low (missing data, not breaking)

**Description**: Anthropic API occasionally omits `usage` field (rate limits, server errors). Logging would fail.

**Mitigation:**
- **Defensive coding**: Check `if (data.usage)` before logging
- **Default to 0**: If missing, log with `inputTokens: 0, outputTokens: 0`
- **Warning log**: Console.warn('API response missing usage field')

**Contingency**: If >10% of responses lack `usage`, contact Anthropic support.

---

### Risk 4: Privacy Violation (Accidental PII Storage)
**Probability:** Low
**Impact:** Critical (GDPR violation, user trust loss)

**Description**: Developer accidentally logs raw prompt or profile name in `errorType` or other field.

**Mitigation:**
- **Code review**: Manual audit of all `logInference()` calls
- **Automated tests**: Regex scan for PII patterns (email, phone, name fields)
- **Privacy policy**: Clear statement that only metadata is stored
- **Audit log**: Quarterly manual review of 100 random records

**Contingency**: If PII found, immediately purge affected records, notify users, file GDPR breach report.

---

### Risk 5: Schema Migration Failure
**Probability:** Low
**Impact:** High (IndexedDB corrupted, data loss)

**Description**: Dexie v13 migration fails for users with corrupt IndexedDB state.

**Mitigation:**
- **Testing**: Test migration with 10 seed databases (various states)
- **Rollback**: If migration fails, revert to v12 schema
- **Backup**: Encourage data export before migration (in-app banner)

**Contingency**: If migration fails for >5% of users, pause rollout, investigate, release hotfix.

---

### Risk 6: Feature Misattribution
**Probability:** Medium
**Impact:** Low (inaccurate stats, not breaking)

**Description**: `inferFeatureFromOperation()` maps operation name incorrectly, causing "Profile Analysis" to show as "Unknown".

**Mitigation:**
- **Comprehensive mapping**: Cover all 12 AI features
- **Unknown fallback**: Log warning but continue with `'unknown'`
- **Unit tests**: Test all known operation names

**Contingency**: If >20% of records are "Unknown", add telemetry to identify missing mappings, release patch.

---

## Future Considerations

### Phase 2: Billing Integration (Q2 2026)

**Credit System:**
- Users purchase credits (1 credit = $0.01)
- Each API call deducts credits based on token usage
- "Out of credits" modal prevents new analyses
- Auto-recharge option (Stripe subscription)

**Stripe Integration:**
- Receipt includes inference history: "You used 500 credits on 42 profile analyses"
- Monthly summary email: "January usage: $22.50 across 50 profiles"

**Supabase Sync:**
- Inference records sync to `inference_history` table
- Multi-device view: "Your usage across iPhone, iPad, and desktop"

---

### Phase 3: Cost Optimization Tools (Q3 2026)

**Budget Alerts:**
- "You've spent $20 this month, 80% of your usual $25"
- Push notification when 90% of budget consumed

**Feature Toggles:**
- "Disable auto-compatibility to save 30% on costs"
- "Skip consolidation phase for quicker, cheaper analyses"

**Batch Pricing:**
- "Analyze 10 profiles at once for 20% discount"
- Amortize consolidation cost across multiple profiles

---

### Phase 4: Advanced Analytics (Q4 2026)

**Trend Charts:**
- "Your usage is up 40% this month vs last"
- Weekly/monthly sparklines

**Per-Profile Cost:**
- "This profile cost $0.18 to analyze (3x average)"
- Why? "12 photos, complex prompts"

**Cost Benchmarking:**
- "You spend $15/month, 60th percentile of users"
- "Power users average $45/month"

---

### Phase 5: Enterprise Features (2027)

**Team Dashboards:**
- "Your dating coach team used 5,000 credits this week"
- Per-coach usage breakdown

**Admin Controls:**
- Set per-user credit limits
- Audit logs for compliance

**Bulk Discounts:**
- "Analyze 1,000 profiles for $0.03/each (40% off)"

---

## Appendix

### A. Feature Mapping Reference

| Operation Name | Feature Enum | Avg Tokens In | Avg Tokens Out | Avg Cost |
|----------------|--------------|---------------|----------------|----------|
| `analyzeChunk1` | `profile_analysis_chunk1` | 4,800 | 1,200 | $0.032 |
| `analyzeChunk2` | `profile_analysis_chunk2` | 5,200 | 1,400 | $0.037 |
| `analyzeChunk3` | `profile_analysis_chunk3` | 5,400 | 1,500 | $0.039 |
| `analyzeChunk4` | `profile_analysis_chunk4` | 5,600 | 1,600 | $0.041 |
| `consolidateProfile` | `profile_analysis_consolidation` | 8,000 | 2,500 | $0.062 |
| `generateUserSynthesis` | `user_synthesis` | 12,000 | 3,500 | $0.089 |
| `calculateCompatibility` | `compatibility_scoring` | 3,200 | 800 | $0.022 |
| `generateDateIdeas` | `date_ideas` | 2,400 | 600 | $0.016 |
| `generateOpeners` | `opener_suggestions` | 2,800 | 700 | $0.019 |
| `askAboutMatch` | `ask_about_match` | 1,800 | 400 | $0.011 |
| `coachConversation` | `conversation_coaching` | 3,600 | 900 | $0.024 |
| `analyzeZodiacCompatibility` | `zodiac_compatibility` | 1,200 | 300 | $0.008 |

**Total for Full Profile Analysis**: ~$0.211 (5 chunks + consolidation)

---

### B. Anthropic Pricing Reference (2026)

**Claude Sonnet 4 (`claude-sonnet-4-20250514`)**:
- Input: $3.00 per 1M tokens
- Output: $15.00 per 1M tokens

**Example Calculation:**
- Input: 5,000 tokens → (5,000 / 1,000,000) × $3.00 = $0.015
- Output: 2,000 tokens → (2,000 / 1,000,000) × $15.00 = $0.030
- **Total**: $0.045 per profile

**Monthly Usage Scenarios:**
- **Light user** (5 profiles/month): $0.23
- **Regular user** (20 profiles/month): $0.90
- **Power user** (100 profiles/month): $4.50

---

### C. Privacy Policy Addition

**Recommended Language for Settings > Privacy:**

> **AI Usage Tracking**
>
> Aura logs metadata about AI analysis to provide usage transparency and support future billing features. This includes:
> - Timestamps of when analyses occurred
> - Token counts (how much AI processing was used)
> - Estimated costs in USD
> - Feature names (e.g., "Profile Analysis", "Compatibility Scoring")
>
> **We do NOT store:**
> - Raw AI prompts
> - Profile names, ages, or personal details
> - Your messages or conversations
> - Any other personally identifiable information (PII)
>
> Your usage history is stored locally on your device and is included in data exports. After signing in, usage may sync to secure cloud storage for multi-device access.

---

### D. Test Scenarios

**Unit Tests (Vitest):**
```typescript
// src/lib/inference/logger.test.ts
describe('logInference', () => {
  it('calculates cost correctly for Sonnet 4', async () => {
    await logInference({
      inputTokens: 5000,
      outputTokens: 2000,
      model: 'claude-sonnet-4-20250514',
      feature: 'profile_analysis_chunk1',
      page: '/upload',
      success: true,
    });

    const record = await db.inferenceHistory.toArray();
    expect(record[0].estimatedCostUsd).toBeCloseTo(0.045, 3);
  });

  it('handles missing usage field gracefully', async () => {
    // Should not throw
    await logInference({
      inputTokens: 0,
      outputTokens: 0,
      model: 'unknown-model',
      feature: 'unknown',
      page: '/test',
      success: false,
      errorType: 'missing_usage_field',
    });
  });

  it('stores no PII', async () => {
    await logInference({
      inputTokens: 1000,
      outputTokens: 500,
      model: 'claude-sonnet-4-20250514',
      feature: 'profile_analysis_chunk1',
      page: '/upload',
      success: true,
      profileId: 42,
    });

    const record = await db.inferenceHistory.toArray();
    expect(record[0]).not.toHaveProperty('prompt');
    expect(record[0]).not.toHaveProperty('profileName');
    expect(record[0]).not.toHaveProperty('userMessage');
  });
});
```

**E2E Tests (Playwright):**
```typescript
// e2e/settings-usage.spec.ts
test('View usage summary in Settings', async ({ page }) => {
  // Seed database with 5 profile analyses
  await seedInferenceHistory(page, 5, 'profile_analysis_chunk1');

  await page.goto('/settings');
  await page.click('text=AI Usage');

  // Should show summary
  await expect(page.locator('text=Total Cost:')).toBeVisible();
  await expect(page.locator('text=$0.23')).toBeVisible(); // 5 × $0.045

  // Should show by-feature breakdown
  await page.click('text=View Detailed History');
  await expect(page.locator('text=Profile Analysis')).toBeVisible();
});
```

---

### E. Glossary

- **Inference**: A single API call to Anthropic Claude
- **Token**: Unit of text processing (roughly 4 characters per token)
- **Input tokens**: Text sent to the AI (prompt + images)
- **Output tokens**: Text received from the AI (response)
- **Feature**: Aura capability that uses AI (e.g., Profile Analysis)
- **Operation**: Specific AI function call (e.g., `analyzeChunk1`)
- **Cost**: Estimated USD spent on tokens (not actual billing yet)
- **PII**: Personally Identifiable Information (names, emails, etc.)

---

## Approval and Sign-off

**Document Owner**: PRD Specialist (Claude Code)
**Stakeholders**:
- Master Product Manager (Zephyr) - Strategic approval
- Backend Architect - Technical feasibility
- Frontend Developer - UI/UX feasibility
- Code Reviewer - Quality assurance
- Debugger - Edge case validation

**Approval Status**: ⏳ Pending Review

**Next Steps**:
1. Review PRD with stakeholders (async via document comments)
2. Refine based on feedback (1-2 iterations)
3. Break down into Jira epics/stories
4. Assign to Sprint 15 (Q1 2026)
5. Begin implementation (Phase 1: Data Capture)

---

**Document Version History**:
- v1.0 (2026-01-26): Initial draft by PRD Specialist
