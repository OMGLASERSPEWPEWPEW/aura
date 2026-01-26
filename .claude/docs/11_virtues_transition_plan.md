# 11 Virtues Transition Plan

## Executive Summary

This document outlines the phased migration from Aura's current dual-system approach (23 Aspects + 5 Partner Virtues) to the unified 11 Virtues system. The new system introduces a "Mixing Board" UI metaphor with delta-based compatibility scoring.

**Current State**: Two overlapping systems that confuse users
- 23 Aspects: Complex, realm-based (Vitality/Connection/Structure)
- 5 Partner Virtues: Eudaimonia-based, custom-generated per user

**Target State**: Single unified 11 Virtues system
- 3 Realms: Biological (Chemistry), Emotional (Connection), Cerebral (Mind)
- 11 Spectrums (0-100 scale) with delta-based compatibility
- "Mixing Board" fader UI instead of radar charts

---

## The 11 Virtues System

### Realm I: Biological (Chemistry) - Binary, Low Delta Required

| # | Virtue | Low End (0) | High End (100) | Delta Tolerance |
|---|--------|-------------|----------------|-----------------|
| 1 | **Vitality** | Restorative | High Voltage | LOW (<20) |
| 2 | **Lust** | Reserved | Voracious | LOW (<20) |
| 3 | **Play** | Serious | Absurd | MEDIUM (complementary) |

### Realm II: Emotional (Connection) - How You Fight/Bond

| # | Virtue | Low End (0) | High End (100) | Delta Tolerance |
|---|--------|-------------|----------------|-----------------|
| 4 | **Warmth** | Cool | Radiant | MEDIUM (20-40 dangerous) |
| 5 | **Voice** | Diplomatic | Blunt | LOW (<20) |
| 6 | **Space** | Merged | Autonomous | **CRITICAL** (20-40 dangerous) |
| 7 | **Anchor** | Fluid | Structured | MEDIUM (complementary) |

### Realm III: Cerebral (Mind) - Long-term Conversation

| # | Virtue | Low End (0) | High End (100) | Delta Tolerance |
|---|--------|-------------|----------------|-----------------|
| 8 | **Wit** | Earnest | Intellectual | LOW (<20) |
| 9 | **Drive** | Content | Relentless | FLEXIBLE |
| 10 | **Curiosity** | Traditional | Explorer | LOW (<20) |
| 11 | **Soul** | Pragmatic | Idealist | FLEXIBLE |

### Compatibility Logic

```typescript
type DeltaCategory = 'low' | 'medium_dangerous' | 'medium_magic' | 'flexible';
type Verdict = 'sympatico' | 'friction' | 'danger';

const DELTA_RULES: Record<string, DeltaCategory> = {
  vitality: 'low',
  lust: 'low',
  play: 'medium_magic',
  warmth: 'medium_dangerous',
  voice: 'low',
  space: 'medium_dangerous', // CRITICAL
  anchor: 'medium_magic',
  wit: 'low',
  drive: 'flexible',
  curiosity: 'low',
  soul: 'flexible',
};

function calculateVerdict(delta: number, category: DeltaCategory): Verdict {
  switch (category) {
    case 'low':
      return delta < 20 ? 'sympatico' : delta < 35 ? 'friction' : 'danger';
    case 'medium_dangerous':
      return delta < 15 ? 'sympatico' : delta < 30 ? 'friction' : 'danger';
    case 'medium_magic':
      // Complementary - moderate delta is actually good
      return delta < 10 ? 'friction' : delta < 40 ? 'sympatico' : 'danger';
    case 'flexible':
      return delta < 40 ? 'sympatico' : 'friction';
  }
}
```

---

## Files Requiring Changes

### 1. Data Layer (Database & Types)

| File | Changes Required | Priority |
|------|------------------|----------|
| `src/lib/db.ts` | New types, migration script | P0 |
| `src/lib/virtues/types.ts` | Replace with 11 Virtues types | P0 |
| `src/lib/virtues/aspects.ts` | Replace with 11 Virtues definitions | P0 |
| `src/lib/virtues/index.ts` | Update exports | P0 |

### 2. AI/Prompt Layer

| File | Changes Required | Priority |
|------|------------------|----------|
| `src/lib/prompts.ts` | New USER_VIRTUES_PROMPT, MATCH_VIRTUES_PROMPT | P0 |
| `src/lib/ai.ts` | Replace scoreMatchAspects, scoreMatchVirtues with scoreMatchVirtues11 | P1 |

### 3. Hooks

| File | Changes Required | Priority |
|------|------------------|----------|
| `src/hooks/useCompatibilityScores.ts` | Simplify to single virtues system | P1 |
| `src/hooks/useCompatibilityScores.test.ts` | Update tests | P1 |

### 4. UI Components

| File | Changes Required | Priority |
|------|------------------|----------|
| `src/components/profileDetail/VirtueScoresCard.tsx` | Replace with MixingBoard | P1 |
| `src/components/profileDetail/AspectMatchCard.tsx` | DELETE (merged into MixingBoard) | P1 |
| `src/components/profileDetail/OverviewTab.tsx` | Update to use new card | P2 |
| `src/components/profileDetail/index.ts` | Update exports | P2 |
| `src/components/profile/AspectConstellationCard.tsx` | Replace with UserMixingBoard | P1 |
| `src/components/UserProfileDisplay.tsx` | Update to use new components | P2 |

### 5. Sync Layer (Supabase)

| File | Changes Required | Priority |
|------|------------------|----------|
| `src/lib/sync/types.ts` | Update sync types | P2 |
| `src/lib/sync/profileSync.ts` | Update for new field names | P2 |
| `src/lib/sync/userProfileSync.ts` | Update for new field names | P2 |

### 6. Pages

| File | Changes Required | Priority |
|------|------------------|----------|
| `src/pages/MyProfile.tsx` | Update synthesis flow | P2 |
| `src/pages/Home.tsx` | Minor updates if showing compatibility | P3 |

---

## Phase 1: Data Structure Migration

### 1.1 New Type Definitions

**File: `src/lib/virtues/types.ts`**

```typescript
// src/lib/virtues/types.ts
// Type definitions for the 11 Virtues System

export type RealmType = 'biological' | 'emotional' | 'cerebral';

export interface VirtueDefinition {
  id: string;
  name: string;
  realm: RealmType;
  lowLabel: string;      // e.g., "Restorative"
  highLabel: string;     // e.g., "High Voltage"
  description: string;
  deltaCategory: 'low' | 'medium_dangerous' | 'medium_magic' | 'flexible';
  critical?: boolean;    // true for Space
}

export interface VirtueScore {
  virtue_id: string;
  score: number;         // 0-100
  evidence?: string;
}

export interface RealmSummary {
  biological: string;
  emotional: string;
  cerebral: string;
}

// User's virtue profile
export interface UserVirtueProfile {
  scores: VirtueScore[];
  realm_summary: RealmSummary;
  lastUpdated: Date;
}

// Compatibility verdict for a single virtue
export type CompatibilityVerdict = 'sympatico' | 'friction' | 'danger';

export interface VirtueCompatibility {
  virtue_id: string;
  virtue_name: string;
  user_score: number;
  match_score: number;
  delta: number;
  verdict: CompatibilityVerdict;
  note?: string;
}

// Match's virtue compatibility (stored in Profile)
export interface MatchVirtueCompatibility {
  scores: VirtueScore[];
  compatibility: VirtueCompatibility[];
  realm_scores: {
    biological: number;  // 0-100 average compatibility
    emotional: number;
    cerebral: number;
  };
  overall_score: number; // 0-100
  danger_count: number;  // Number of 'danger' verdicts
  critical_issues: string[]; // e.g., ["Space mismatch: You need autonomy, they need merger"]
}

export interface RealmConfig {
  id: RealmType;
  name: string;
  subtitle: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  icon: string; // Lucide icon name
}
```

### 1.2 New Virtue Definitions

**File: `src/lib/virtues/virtues.ts`** (new file, replaces aspects.ts)

```typescript
// src/lib/virtues/virtues.ts
// The 11 Virtues data

import type { VirtueDefinition, RealmConfig, CompatibilityVerdict } from './types';

export const REALMS: RealmConfig[] = [
  {
    id: 'biological',
    name: 'Biological Realm',
    subtitle: 'Chemistry - Binary needs, low tolerance for mismatch',
    colorClass: 'text-rose-600',
    bgClass: 'bg-rose-50',
    borderClass: 'border-rose-200',
    icon: 'Heart',
  },
  {
    id: 'emotional',
    name: 'Emotional Realm',
    subtitle: 'Connection - How you fight and bond',
    colorClass: 'text-amber-600',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
    icon: 'Users',
  },
  {
    id: 'cerebral',
    name: 'Cerebral Realm',
    subtitle: 'Mind - Long-term conversation potential',
    colorClass: 'text-indigo-600',
    bgClass: 'bg-indigo-50',
    borderClass: 'border-indigo-200',
    icon: 'Brain',
  },
];

export const VIRTUES: VirtueDefinition[] = [
  // === BIOLOGICAL REALM ===
  {
    id: 'vitality',
    name: 'Vitality',
    realm: 'biological',
    lowLabel: 'Restorative',
    highLabel: 'High Voltage',
    description: 'Energy levels and lifestyle pace',
    deltaCategory: 'low',
  },
  {
    id: 'lust',
    name: 'Lust',
    realm: 'biological',
    lowLabel: 'Reserved',
    highLabel: 'Voracious',
    description: 'Physical intimacy needs and expression',
    deltaCategory: 'low',
  },
  {
    id: 'play',
    name: 'Play',
    realm: 'biological',
    lowLabel: 'Serious',
    highLabel: 'Absurd',
    description: 'Silliness tolerance and playfulness',
    deltaCategory: 'medium_magic',
  },

  // === EMOTIONAL REALM ===
  {
    id: 'warmth',
    name: 'Warmth',
    realm: 'emotional',
    lowLabel: 'Cool',
    highLabel: 'Radiant',
    description: 'Emotional expression and affection style',
    deltaCategory: 'medium_dangerous',
  },
  {
    id: 'voice',
    name: 'Voice',
    realm: 'emotional',
    lowLabel: 'Diplomatic',
    highLabel: 'Blunt',
    description: 'Communication directness',
    deltaCategory: 'low',
  },
  {
    id: 'space',
    name: 'Space',
    realm: 'emotional',
    lowLabel: 'Merged',
    highLabel: 'Autonomous',
    description: 'Independence vs togetherness needs',
    deltaCategory: 'medium_dangerous',
    critical: true,
  },
  {
    id: 'anchor',
    name: 'Anchor',
    realm: 'emotional',
    lowLabel: 'Fluid',
    highLabel: 'Structured',
    description: 'Need for order vs spontaneity',
    deltaCategory: 'medium_magic',
  },

  // === CEREBRAL REALM ===
  {
    id: 'wit',
    name: 'Wit',
    realm: 'cerebral',
    lowLabel: 'Earnest',
    highLabel: 'Intellectual',
    description: 'Banter and debate style',
    deltaCategory: 'low',
  },
  {
    id: 'drive',
    name: 'Drive',
    realm: 'cerebral',
    lowLabel: 'Content',
    highLabel: 'Relentless',
    description: 'Ambition and achievement orientation',
    deltaCategory: 'flexible',
  },
  {
    id: 'curiosity',
    name: 'Curiosity',
    realm: 'cerebral',
    lowLabel: 'Traditional',
    highLabel: 'Explorer',
    description: 'Novelty seeking and openness',
    deltaCategory: 'low',
  },
  {
    id: 'soul',
    name: 'Soul',
    realm: 'cerebral',
    lowLabel: 'Pragmatic',
    highLabel: 'Idealist',
    description: 'Meaning, spirituality, and values depth',
    deltaCategory: 'flexible',
  },
];

// Helper functions
export function getVirtueById(id: string): VirtueDefinition | undefined {
  return VIRTUES.find(v => v.id === id);
}

export function getVirtuesByRealm(realm: RealmType): VirtueDefinition[] {
  return VIRTUES.filter(v => v.realm === realm);
}

export function getRealmConfig(realmId: RealmType): RealmConfig | undefined {
  return REALMS.find(r => r.id === realmId);
}

export function calculateVerdict(
  delta: number,
  category: VirtueDefinition['deltaCategory']
): CompatibilityVerdict {
  switch (category) {
    case 'low':
      return delta < 20 ? 'sympatico' : delta < 35 ? 'friction' : 'danger';
    case 'medium_dangerous':
      return delta < 15 ? 'sympatico' : delta < 30 ? 'friction' : 'danger';
    case 'medium_magic':
      // Complementary - moderate delta can be good
      return delta < 10 ? 'friction' : delta < 40 ? 'sympatico' : 'danger';
    case 'flexible':
      return delta < 40 ? 'sympatico' : 'friction';
  }
}

export function getVerdictEmoji(verdict: CompatibilityVerdict): string {
  switch (verdict) {
    case 'sympatico': return '✅';
    case 'friction': return '⚠️';
    case 'danger': return '🚨';
  }
}

export function getVerdictLabel(verdict: CompatibilityVerdict): string {
  switch (verdict) {
    case 'sympatico': return 'Sympatico';
    case 'friction': return 'Friction';
    case 'danger': return 'Danger Zone';
  }
}
```

### 1.3 Database Migration

**File: `src/lib/db.ts`** - Add new version with migration

```typescript
// Add after existing interfaces:

// NEW: 11 Virtues types (imported from virtues/types)
import type {
  UserVirtueProfile,
  MatchVirtueCompatibility,
  VirtueScore as VirtueScore11,
} from './virtues/types';

// Update Profile interface:
interface Profile {
  // ... existing fields ...

  // DEPRECATED: Old systems (keep for migration)
  virtue_scores?: VirtueScore[];      // Old 5 virtues
  aspect_scores?: MatchAspectScores;  // Old 23 aspects

  // NEW: 11 Virtues system
  virtues_11?: MatchVirtueCompatibility;
}

// Update UserSynthesis interface:
interface UserSynthesis {
  // ... existing fields ...

  // DEPRECATED: Old systems (keep for migration)
  partner_virtues?: PartnerVirtue[];   // Old 5 virtues
  aspect_profile?: UserAspectProfile;  // Old 23 aspects

  // NEW: 11 Virtues system
  virtue_profile?: UserVirtueProfile;
}

// Add db version 11 with migration:
db.version(11).stores({
  profiles: '++id, name, appName, timestamp, analysisPhase, serverId',
  userIdentity: '++id, lastUpdated, supabaseUserId, serverId',
  coachingSessions: '++id, profileId, timestamp, serverId',
  matchChats: '++id, profileId, timestamp, serverId'
}).upgrade(async tx => {
  // Migration: Convert existing aspect_profile to virtue_profile
  await tx.table('userIdentity').toCollection().modify(identity => {
    if (identity.synthesis?.aspect_profile) {
      identity.synthesis.virtue_profile = migrateAspectProfileToVirtues(
        identity.synthesis.aspect_profile
      );
    }
  });

  // Migration: Convert existing aspect_scores to virtues_11
  await tx.table('profiles').toCollection().modify(profile => {
    if (profile.aspect_scores) {
      profile.virtues_11 = migrateAspectScoresToVirtues(profile.aspect_scores);
    }
  });
});
```

### 1.4 Migration Mapping

```typescript
// src/lib/virtues/migration.ts

// Map old 23 aspects to new 11 virtues
const ASPECT_TO_VIRTUE_MAP: Record<string, string> = {
  // Biological
  vigor: 'vitality',
  sensuality: 'lust',
  play: 'play',

  // Emotional
  vulnerability: 'warmth',
  directness: 'voice',
  autonomy: 'space',
  order: 'anchor',
  spontaneity: 'anchor', // inverse

  // Cerebral
  wit: 'wit',
  ambition: 'drive',
  curiosity: 'curiosity',
  purpose: 'soul',
};

// Aspects that don't map directly (will be averaged or dropped)
const UNMAPPED_ASPECTS = [
  'adventure', 'presence', 'grit',      // Vitality realm
  'devotion', 'empathy', 'grace', 'tribe',  // Connection realm
  'sanctuary', 'aesthetic', 'protection', 'tradition'  // Structure realm
];

export function migrateAspectProfileToVirtues(
  aspectProfile: UserAspectProfile
): UserVirtueProfile {
  const virtueScores: VirtueScore[] = [];

  for (const virtue of VIRTUES) {
    // Find matching aspect scores
    const matchingAspects = Object.entries(ASPECT_TO_VIRTUE_MAP)
      .filter(([_, virtueId]) => virtueId === virtue.id)
      .map(([aspectId]) => aspectId);

    const aspectScores = aspectProfile.scores
      .filter(s => matchingAspects.includes(s.aspect_id))
      .map(s => s.score);

    // Average the matching aspects (or use 50 as default)
    const score = aspectScores.length > 0
      ? Math.round(aspectScores.reduce((a, b) => a + b, 0) / aspectScores.length)
      : 50;

    virtueScores.push({
      virtue_id: virtue.id,
      score,
      evidence: `Migrated from ${matchingAspects.join(', ')} aspects`,
    });
  }

  return {
    scores: virtueScores,
    realm_summary: {
      biological: aspectProfile.realm_summary?.vitality || '',
      emotional: aspectProfile.realm_summary?.connection || '',
      cerebral: aspectProfile.realm_summary?.structure || '',
    },
    lastUpdated: new Date(),
  };
}
```

---

## Phase 2: AI Prompt Updates

### 2.1 New User Virtues Prompt

**Add to `src/lib/prompts.ts`:**

```typescript
export const USER_VIRTUES_11_PROMPT = `
You are an expert relationship psychologist using the "11 Virtues of Love" framework to analyze romantic compatibility.

## THE 11 VIRTUES SYSTEM

Score the user on each virtue (0-100 scale):

### BIOLOGICAL REALM (Chemistry) - Must align closely
1. **Vitality** (Restorative 0 ↔ 100 High Voltage) - Energy and lifestyle pace
2. **Lust** (Reserved 0 ↔ 100 Voracious) - Physical intimacy needs
3. **Play** (Serious 0 ↔ 100 Absurd) - Silliness and humor style

### EMOTIONAL REALM (Connection) - How you fight and bond
4. **Warmth** (Cool 0 ↔ 100 Radiant) - Emotional expression
5. **Voice** (Diplomatic 0 ↔ 100 Blunt) - Communication directness
6. **Space** (Merged 0 ↔ 100 Autonomous) - Independence needs [CRITICAL]
7. **Anchor** (Fluid 0 ↔ 100 Structured) - Order vs spontaneity

### CEREBRAL REALM (Mind) - Long-term conversation
8. **Wit** (Earnest 0 ↔ 100 Intellectual) - Banter and debate
9. **Drive** (Content 0 ↔ 100 Relentless) - Ambition level
10. **Curiosity** (Traditional 0 ↔ 100 Explorer) - Novelty seeking
11. **Soul** (Pragmatic 0 ↔ 100 Idealist) - Meaning and spirituality

---

## USER'S PROFILE DATA

{user_profile_data}

---

## SCORING GUIDELINES

- 0-20: Strong lean toward low end
- 21-40: Moderate lean toward low end
- 41-60: Balanced / middle ground
- 61-80: Moderate lean toward high end
- 81-100: Strong lean toward high end

Return a JSON object:
{
  "scores": [
    {
      "virtue_id": "vitality",
      "score": 75,
      "evidence": "Mentions daily running, active weekend plans"
    }
    // ... all 11 virtues
  ],
  "realm_summary": {
    "biological": "High energy person who values physical connection and playful humor",
    "emotional": "Values independence but expresses warmth openly. Direct communicator.",
    "cerebral": "Intellectually curious with moderate ambition. Values meaningful conversation."
  }
}

IMPORTANT:
- Score ALL 11 virtues
- Provide specific evidence from the profile
- Be honest - don't default everything to 50

Do not include markdown formatting. Return only the raw JSON object.
`;

export const MATCH_VIRTUES_11_PROMPT = `
You are an expert relationship psychologist comparing a match's profile against a user's 11 Virtues profile.

## THE 11 VIRTUES SYSTEM

### BIOLOGICAL REALM (Low Delta Required: <20 is ideal)
1. Vitality (Restorative ↔ High Voltage)
2. Lust (Reserved ↔ Voracious)
3. Play (Serious ↔ Absurd) - COMPLEMENTARY OK

### EMOTIONAL REALM (Medium Delta Dangerous: 20-40 is risky)
4. Warmth (Cool ↔ Radiant)
5. Voice (Diplomatic ↔ Blunt) - LOW DELTA REQUIRED
6. Space (Merged ↔ Autonomous) - CRITICAL VIRTUE
7. Anchor (Fluid ↔ Structured) - COMPLEMENTARY OK

### CEREBRAL REALM (More Flexible)
8. Wit (Earnest ↔ Intellectual) - LOW DELTA REQUIRED
9. Drive (Content ↔ Relentless) - FLEXIBLE
10. Curiosity (Traditional ↔ Explorer) - LOW DELTA REQUIRED
11. Soul (Pragmatic ↔ Idealist) - FLEXIBLE

---

## USER'S VIRTUE PROFILE

{user_virtues}

---

## MATCH'S PROFILE

Name: {match_name}
{match_analysis}

---

## TASK

1. Score the MATCH on all 11 virtues (0-100)
2. Calculate delta (|user - match|) for each virtue
3. Determine verdict based on delta tolerance rules:
   - low: <20 sympatico, 20-34 friction, 35+ danger
   - medium_dangerous: <15 sympatico, 15-29 friction, 30+ danger
   - medium_magic: <10 friction (too similar), 10-39 sympatico, 40+ danger
   - flexible: <40 sympatico, 40+ friction

Return a JSON object:
{
  "scores": [
    { "virtue_id": "vitality", "score": 65, "evidence": "Active photos but mentions recovery days" }
  ],
  "compatibility": [
    {
      "virtue_id": "vitality",
      "virtue_name": "Vitality",
      "user_score": 80,
      "match_score": 65,
      "delta": 15,
      "verdict": "sympatico",
      "note": "Both active, slight difference in pace is manageable"
    }
  ],
  "realm_scores": {
    "biological": 78,
    "emotional": 62,
    "cerebral": 85
  },
  "overall_score": 75,
  "danger_count": 1,
  "critical_issues": [
    "Space: You value autonomy (85) but they prefer merger (35). Discuss boundaries early."
  ]
}

IMPORTANT:
- Score ALL 11 virtues for the match
- Calculate exact deltas
- Flag ALL danger verdicts in critical_issues
- Space is CRITICAL - always call out if delta > 25

Do not include markdown formatting. Return only the raw JSON object.
`;
```

---

## Phase 3: New UI Components

### 3.1 Mixing Board Component (Match View)

**File: `src/components/profileDetail/VirtueMixingBoard.tsx`**

```tsx
// Core concept: Dual faders showing user vs match scores
// Visual: Two vertical faders per virtue, with delta indicator

interface VirtueMixingBoardProps {
  compatibility: MatchVirtueCompatibility;
  matchName?: string;
}

// Each virtue shows:
// - Virtue name + realm color
// - User score (left fader) + Match score (right fader)
// - Delta number + verdict badge (Sympatico/Friction/Danger)
// - Critical warning for Space if applicable

// Header shows:
// - Overall score (0-100)
// - Danger count badge if > 0
// - Realm mini-scores (Bio/Emo/Cer)

// Footer shows:
// - Critical issues list (expandable)
```

### 3.2 User Virtue Profile Component

**File: `src/components/profile/VirtueProfileCard.tsx`**

```tsx
// Simplified single-fader view for user's own profile
// Shows spectrum with low/high labels
// Realm groupings with summaries

interface VirtueProfileCardProps {
  virtueProfile: UserVirtueProfile;
}
```

### 3.3 Design Mockup (ASCII)

```
┌────────────────────────────────────────────────────────────┐
│  🎛️ Virtue Compatibility              Overall: 72/100     │
│     with Sarah                        ⚠️ 1 Danger Zone    │
├────────────────────────────────────────────────────────────┤
│  ┌─────────┬─────────┬─────────┐                          │
│  │ Bio: 78 │ Emo: 62 │ Cer: 85 │                          │
│  └─────────┴─────────┴─────────┘                          │
├────────────────────────────────────────────────────────────┤
│  BIOLOGICAL REALM                                         │
│  ─────────────────────────────────────────────────────    │
│                                                           │
│  Vitality    Restorative ├──●────────●──┤ High Voltage   │
│              You: 80      Match: 65    Δ15 ✅ Sympatico  │
│                                                           │
│  Lust        Reserved ├────●────────●────┤ Voracious     │
│              You: 55      Match: 60     Δ5 ✅ Sympatico  │
│                                                           │
│  Play        Serious ├─●──────────────●─┤ Absurd         │
│              You: 30      Match: 70    Δ40 ✅ Complementary│
├────────────────────────────────────────────────────────────┤
│  EMOTIONAL REALM                                          │
│  ─────────────────────────────────────────────────────    │
│                                                           │
│  Space ⚠️    Merged ├────●──────────●────┤ Autonomous    │
│  CRITICAL    You: 85      Match: 35   Δ50 🚨 DANGER      │
│  "You need independence, they want togetherness"          │
│                                                           │
│  ... [more virtues]                                       │
└────────────────────────────────────────────────────────────┘
```

---

## Phase 4: Implementation Tasks

### Sprint 1: Foundation (Week 1)

| Task | Owner | Estimate | Dependencies |
|------|-------|----------|--------------|
| Create new type definitions | backend-architect | 2h | - |
| Create virtue definitions | backend-architect | 2h | Types |
| Write migration functions | backend-architect | 4h | Definitions |
| Add DB version 11 | backend-architect | 2h | Migration |
| Write migration tests | backend-architect | 2h | Migration |

### Sprint 2: AI Layer (Week 1-2)

| Task | Owner | Estimate | Dependencies |
|------|-------|----------|--------------|
| Add USER_VIRTUES_11_PROMPT | backend-architect | 2h | Types |
| Add MATCH_VIRTUES_11_PROMPT | backend-architect | 2h | Types |
| Implement scoreMatchVirtues11 | backend-architect | 4h | Prompts |
| Implement generateUserVirtues11 | backend-architect | 4h | Prompts |
| Update useCompatibilityScores | frontend-developer | 3h | AI functions |
| Write AI function tests | backend-architect | 4h | AI functions |

### Sprint 3: UI Components (Week 2-3)

| Task | Owner | Estimate | Dependencies |
|------|-------|----------|--------------|
| Build VirtueMixingBoard | frontend-developer | 8h | Types |
| Build VirtueProfileCard | frontend-developer | 4h | Types |
| Create verdict badges | frontend-developer | 2h | - |
| Create fader component | frontend-developer | 4h | - |
| Add animations | frontend-developer | 2h | Components |

### Sprint 4: Integration (Week 3)

| Task | Owner | Estimate | Dependencies |
|------|-------|----------|--------------|
| Update ProfileDetail page | frontend-developer | 4h | MixingBoard |
| Update UserProfileDisplay | frontend-developer | 4h | ProfileCard |
| Update MyProfile synthesis | frontend-developer | 3h | AI functions |
| Remove old components | frontend-developer | 2h | New components |
| E2E testing | frontend-developer | 4h | All |

### Sprint 5: Cleanup & Polish (Week 4)

| Task | Owner | Estimate | Dependencies |
|------|-------|----------|--------------|
| Remove deprecated code | backend-architect | 2h | Integration |
| Update sync layer | backend-architect | 3h | Types |
| Update CLAUDE.md | backend-architect | 1h | All |
| Performance optimization | frontend-developer | 2h | All |
| Accessibility audit | frontend-developer | 2h | UI |

---

## Rollout Strategy

### Phase A: Soft Launch (Week 4)

1. Deploy with feature flag
2. New users get 11 Virtues
3. Existing users keep old system
4. Monitor for issues

### Phase B: Migration (Week 5)

1. Enable auto-migration for existing users
2. Show "Try New System" prompt
3. Keep old data as backup

### Phase C: Sunset (Week 6+)

1. Remove feature flag
2. Remove old components
3. Clean up deprecated code
4. Update documentation

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data loss during migration | HIGH | Keep old fields, test extensively |
| User confusion with new UI | MEDIUM | In-app tutorial, clear labels |
| AI prompt quality | MEDIUM | Test with diverse profiles |
| Performance regression | LOW | Profile virtuoso scoring |
| Breaking sync | MEDIUM | Test sync thoroughly before deploy |

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Migration completion | 100% | DB query |
| User engagement with Mixing Board | +20% vs old | Analytics |
| Compatibility accuracy feedback | >75% positive | In-app feedback |
| Page load time | <2s | Performance monitoring |
| Bug reports | <5 critical | Support tickets |

---

## Open Questions

1. **Should we show delta numerically or just as verdict?**
   - Proposal: Show both (number + emoji badge)

2. **How to handle partial profiles (missing virtues)?**
   - Proposal: Show "Not enough data" placeholder

3. **Should Space always be shown first given criticality?**
   - Proposal: Yes, with visual emphasis

4. **Re-generation: Allow users to re-score matches?**
   - Proposal: Yes, with cooldown to prevent API abuse

---

*Document created by Zephyr, Master Product Manager*
*Last updated: 2026-01-25*
