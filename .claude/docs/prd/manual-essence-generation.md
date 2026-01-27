# Product Requirements Document: Manual Essence Generation (Cost Control)

**Status:** Draft
**Author:** Claude (PRD Specialist)
**Created:** 2026-01-27
**Version:** 1.0

---

## Executive Summary

### Problem Statement
Essence image generation via DALL-E 3 currently auto-triggers for every analyzed profile, costing approximately $0.04 per generation. This automatic cost accumulation is problematic for users who:
- Analyze many profiles but may not want essence images for all
- Want to preview profile analysis before committing to additional AI costs
- Need visibility and control over when AI generation costs are incurred

### Solution Overview
Convert essence image generation from automatic to manual user-triggered action while maintaining the free, always-available virtue sentence teaser. The mood board feature remains automatic (free tier justification for AI value demonstration). Users will explicitly trigger DALL-E image generation via a clearly labeled button showing the associated cost.

### Business Impact
**Benefits:**
- Improved user trust through cost transparency and control
- Reduced involuntary spend, lowering user acquisition friction
- Maintains AI value proposition through free mood board + virtue sentence
- Creates intentional engagement moment when users choose to generate essence

**Costs/Resources:**
- Engineering: 1-2 days development + testing
- No infrastructure changes required
- Minimal API/database schema changes

**Success Metrics:**
- Essence generation conversion rate (% of profiles that get essence generated)
- User feedback on cost transparency
- Reduction in essence generation failures/retries (due to more intentional triggers)

### Risk Assessment
**Low Risk:**
- No breaking changes to existing profiles (backward compatible)
- No payment/billing integration complexity
- Isolated feature scope with clear rollback path

**Mitigations:**
- Comprehensive testing of locked state UI
- Clear messaging to prevent user confusion about "locked" content
- Database queries remain unchanged (only UI/trigger logic changes)

---

## Product Overview

### Product Vision
Aura provides AI-powered dating profile analysis with full user control over costs. Users understand exactly what they're getting, when they're getting it, and what it costs before committing to AI-generated content.

### Target Users
**Primary:**
- Privacy-conscious dating app users who want control over data and costs
- Budget-aware users who analyze many profiles but only want premium features for select matches

**Secondary:**
- Power users who batch-analyze profiles and selectively generate deeper insights

### Value Proposition
**For users:**
- Free analysis baseline (mood board, virtue sentence) demonstrates AI quality
- Transparent cost display ($0.04) before generation commitment
- Manual trigger prevents surprise costs

**For product:**
- Maintains value demonstration without forcing costs
- Creates intentional engagement moment (button click = commitment)
- Positions essence as premium optional feature

### Success Criteria
1. **User Clarity:** 90%+ of users understand what "Generate Essence" does before clicking
2. **Technical Success:** Zero essence images auto-generated post-deployment
3. **No Breaking Changes:** Existing profiles with essence images display correctly
4. **Performance:** Essence generation completes within 10 seconds of button click

### Assumptions
1. Users understand the difference between "Lifestyle" (mood board) and "Essence" (abstract personality)
2. The virtue sentence alone is compelling enough to tease the full essence value
3. $0.04 cost is small enough that users won't hesitate if they're interested
4. No payment processing needed (developer absorbs cost as part of free tier demo)

---

## Functional Requirements

### FR-1: Remove Auto-Generation of Essence Images
**Priority:** P0 (Critical)
**Description:** Essence image generation must NEVER trigger automatically after profile analysis.

**User Stories:**
- **US-1.1:** As a user analyzing a profile, I want the analysis to complete without automatically generating the essence image, so I can control when costs are incurred.
  - **Acceptance Criteria:**
    - Given a profile analysis completes successfully
    - When the consolidation phase finishes
    - Then NO call to `generateAndSaveEssenceImage()` is made
    - And the virtue sentence IS still generated and saved
    - And the mood board image IS still auto-generated (existing behavior)

**Technical Details:**
- **Files to Modify:**
  - `src/hooks/useStreamingAnalysis.ts:566` - Remove `startEssenceGeneration()` call
  - `src/pages/ProfileDetail.tsx:57-93` - Remove auto-generation useEffect
- **Preserve:**
  - Virtue sentence generation (`generateAndSaveVirtueSentence()`) - remains automatic
  - Mood board generation - remains automatic
- **Database Impact:** None (schema already supports null `essenceImage`)

**Business Rules:**
- Virtue sentence generation is free and always runs
- Mood board generation is automatic (demonstrates AI value without cost)
- Essence image generation is manual-only (user-triggered)

### FR-2: Locked Placeholder UI State
**Priority:** P0 (Critical)
**Description:** When essence image has not been generated, display a locked/placeholder state in the carousel with virtue sentence teaser.

**User Stories:**
- **US-2.1:** As a user viewing a profile without essence generated, I want to see a locked placeholder with the virtue sentence, so I understand what I'm missing and can decide if I want to generate it.
  - **Acceptance Criteria:**
    - Given a profile has `virtueSentence` but NOT `essenceImage`
    - When I swipe to the essence position in the carousel
    - Then I see a locked placeholder with:
      - Lock icon or "locked" visual indicator
      - The virtue sentence text (e.g., "A curious explorer with radiant warmth")
      - Clear label "Essence (Locked)"
      - No DALL-E image displayed

- **US-2.2:** As a user viewing a profile with essence generated, I want to see the full essence image, so I can enjoy the premium AI-generated content.
  - **Acceptance Criteria:**
    - Given a profile has both `virtueSentence` AND `essenceImage`
    - When I swipe to the essence position
    - Then I see the full DALL-E image with "Essence" badge (existing behavior)
    - And the virtue sentence is displayed as caption/overlay (optional enhancement)

**Technical Details:**
- **Files to Modify:**
  - `src/components/profileDetail/ProfileHeader.tsx` - Update carousel logic
- **UI Components:**
  - Locked state card with:
    - Gradient background (purple theme, matching essence badge color)
    - Lock icon (from `lucide-react`)
    - Virtue sentence text (large, readable font)
    - Subtle "Unlock with Generate Essence" hint
  - Unlocked state (existing):
    - DALL-E image display
    - "Essence" badge (purple)

**Design Specifications:**
```tsx
// Locked State Pseudocode
<div className="w-full h-full bg-gradient-to-br from-purple-600 to-purple-800 flex flex-col items-center justify-center p-8 text-white">
  <Lock size={48} className="mb-4 opacity-80" />
  <p className="text-xl font-medium text-center mb-2">{profile.virtueSentence}</p>
  <p className="text-sm opacity-70">Generate to reveal abstract essence</p>
</div>
```

**Integration Points:**
- Must check `if (profile.virtueSentence && !profile.essenceImage)` to show locked state
- Must preserve existing carousel swipe/touch behavior
- Dot indicators should include locked essence position

### FR-3: Generate Essence Button with Cost Display
**Priority:** P0 (Critical)
**Description:** Add a prominent button to trigger essence generation, displaying the exact cost to the user.

**User Stories:**
- **US-3.1:** As a user viewing a profile, I want to see a "Generate Essence" button with the cost displayed, so I can decide if I want to pay for this feature.
  - **Acceptance Criteria:**
    - Given a profile does NOT have `essenceImage` generated
    - When I view the ProfileDetail page
    - Then I see a button labeled "Generate Essence (~$0.04)"
    - And the button is positioned prominently (near carousel or section header)
    - And the button is enabled (clickable) if `virtues_11` exists

- **US-3.2:** As a user who has already generated essence, I want the button to be hidden or show "Generated" status, so I know I've already unlocked this content.
  - **Acceptance Criteria:**
    - Given a profile has `essenceImage` already generated
    - When I view the ProfileDetail page
    - Then the "Generate Essence" button is hidden OR shows "✓ Essence Generated" (disabled state)

**Technical Details:**
- **Files to Modify:**
  - `src/components/profileDetail/ProfileHeader.tsx` - Add button near carousel
  - OR `src/pages/ProfileDetail.tsx` - Add button in section container
- **Button Placement Options:**
  1. **Inside Locked Placeholder** (recommended) - Button appears on the locked card itself
  2. **Below Carousel** - Persistent button below image carousel
  3. **Floating Action Button** - Fixed position overlay when essence not generated

**Design Specifications:**
```tsx
// Button Component (inside locked placeholder)
<button
  onClick={handleGenerateEssence}
  disabled={isGenerating || !profile.virtues_11}
  className="mt-6 px-6 py-3 bg-white text-purple-700 rounded-full font-semibold shadow-lg hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
>
  {isGenerating ? 'Generating...' : 'Generate Essence (~$0.04)'}
</button>
```

**Business Rules:**
- Button only appears if `essenceImage` is null/undefined
- Button requires `virtues_11` to be computed (disabled otherwise)
- Cost display uses `formatCost()` from `src/lib/inference/costCalculator.ts` for consistency
- Button click triggers `generateAndSaveEssenceImage(profileId)`

**Integration Points:**
- Import `generateAndSaveEssenceImage` from `src/lib/essence/essenceGenerator.ts`
- Update profile state after generation completes
- Handle errors gracefully (show error message, allow retry)

### FR-4: Loading State During Generation
**Priority:** P1 (High)
**Description:** Display clear loading/progress indicator while DALL-E generates the essence image.

**User Stories:**
- **US-4.1:** As a user who clicked "Generate Essence", I want to see a loading indicator, so I know the system is working and approximately how long to wait.
  - **Acceptance Criteria:**
    - Given I clicked "Generate Essence"
    - When the DALL-E API call is in progress
    - Then I see:
      - Button changes to "Generating..." (disabled)
      - Loading spinner/animation appears
      - Optional: Progress message (e.g., "Creating your essence image...")
    - And the carousel locked state shows loading overlay
    - And I cannot navigate away without confirmation

- **US-4.2:** As a user waiting for generation, I want to see the result immediately when it completes, so I can enjoy the new content without refreshing.
  - **Acceptance Criteria:**
    - Given essence generation completes successfully
    - When the image is saved to IndexedDB
    - Then the carousel automatically updates to show the new image
    - And the locked placeholder disappears
    - And the "Generate Essence" button hides or shows "Generated" state
    - And I receive a subtle success notification (optional toast)

**Technical Details:**
- **Files to Modify:**
  - `src/pages/ProfileDetail.tsx` OR `src/components/profileDetail/ProfileHeader.tsx` - Add loading state
- **State Management:**
  ```tsx
  const [isGeneratingEssence, setIsGeneratingEssence] = useState(false);

  const handleGenerateEssence = async () => {
    setIsGeneratingEssence(true);
    try {
      const result = await generateAndSaveEssenceImage(profile.id);
      if (result.success) {
        // Refresh profile from DB to get new essenceImage
        const updated = await db.profiles.get(profile.id);
        setProfile(updated);
      } else {
        // Show error
        alert(`Failed: ${result.error}`);
      }
    } finally {
      setIsGeneratingEssence(false);
    }
  };
  ```

**Design Specifications:**
- Loading overlay on locked placeholder:
  ```tsx
  {isGeneratingEssence && (
    <div className="absolute inset-0 bg-purple-900/80 flex items-center justify-center">
      <div className="text-center text-white">
        <Loader2 className="animate-spin mx-auto mb-2" size={32} />
        <p>Creating your essence...</p>
      </div>
    </div>
  )}
  ```

**Error Handling:**
- Network timeout: Show "Try again" button after 30 seconds
- DALL-E API error: Display user-friendly message (not raw error)
- Retry logic: Existing `generateAndSaveEssenceImage()` has built-in retry (1 attempt)

**Integration Points:**
- Must refresh profile from database after save completes
- Must handle race condition if user navigates away during generation
- Consider using existing `isGeneratingEssence` prop on ProfileHeader (if passing from parent)

### FR-5: Virtue Sentence Always Available
**Priority:** P0 (Critical)
**Description:** Virtue sentence must be generated and saved during profile analysis (free, automatic) as teaser for essence feature.

**User Stories:**
- **US-5.1:** As a user who just analyzed a profile, I want to see the virtue sentence immediately, so I can get a quick personality summary without paying for the full essence.
  - **Acceptance Criteria:**
    - Given profile analysis completes successfully
    - When consolidation phase finishes
    - Then `virtueSentence` field is populated in the database
    - And the sentence is visible in the locked essence placeholder
    - And NO DALL-E API call was made

**Technical Details:**
- **No Changes Required** - Existing behavior already correct
- **Validation:**
  - Confirm `generateAndSaveVirtueSentence()` is called during consolidation
  - Confirm virtue sentence appears in locked placeholder UI
- **Function:**
  - `src/lib/essence/essenceGenerator.ts:generateAndSaveVirtueSentence()`
  - Called from: Analysis consolidation phase (TODO: verify call location)

**Business Rules:**
- Virtue sentence is derived from `virtues_11` scores (no API cost)
- Sentence is ALWAYS generated if virtues exist
- Sentence serves as free "preview" of essence quality

---

## Non-Functional Requirements

### NFR-1: Performance
**Requirement:** Essence image generation must complete within 10 seconds under normal network conditions.

**Metrics:**
- DALL-E API latency: Target <8 seconds (P95)
- Database save time: <500ms
- UI update after save: <100ms

**Technical Constraints:**
- DALL-E 3 API timeout: 60 seconds (Supabase Edge Function)
- Retry logic: 1 automatic retry with 2-second delay
- Image size: 1024x1024, standard quality (minimizes generation time)

### NFR-2: Cost Transparency
**Requirement:** Users must see exact estimated cost before triggering essence generation.

**Implementation:**
- Display cost on button: "Generate Essence (~$0.04)"
- Use `formatCost()` utility for consistent formatting
- Include cost in inference logging for tracking
- Future: Link to Settings > AI Insights to see cumulative spend

**Validation:**
- Cost displayed matches `DALLE_COST_USD` constant (0.04)
- Cost is visible before ANY user interaction triggers generation

### NFR-3: Backward Compatibility
**Requirement:** Existing profiles with essence images must display correctly without changes.

**Validation:**
- Profiles with `essenceImage` Blob show unlocked essence in carousel
- Profiles without `essenceImage` show locked placeholder
- Database schema unchanged (nullable `essenceImage` field already exists)
- No migration required

**Test Cases:**
- Legacy profile with essence → Shows unlocked
- New profile without essence → Shows locked
- Profile mid-generation (edge case) → Shows loading state

### NFR-4: Usability
**Requirement:** Locked state must clearly communicate value and action required.

**Heuristics:**
- **Visibility:** Locked state is visually distinct from generated essence
- **Clarity:** Virtue sentence teaser demonstrates quality
- **Affordance:** Button clearly labeled with action and cost
- **Feedback:** Loading state shows progress, success shows updated carousel

**User Testing Prompts:**
- "What do you think will happen if you tap 'Generate Essence'?"
- "How much will this cost you?"
- "Can you explain the difference between Lifestyle and Essence?"

### NFR-5: Reliability
**Requirement:** Essence generation failures must not block user from viewing profile analysis.

**Error Handling:**
- Generation failure: Show error message, allow retry
- Network timeout: Provide "Try Again" button
- Partial save failure: Log error, preserve profile state
- Locked state always fallback: If essenceImage missing, show locked (never crash)

**Logging:**
- All generation attempts logged via `logInference()`
- Failures include error type, retry count, profile ID
- Success logged with cost, duration, profile ID

---

## Technical Considerations

### Architecture Overview
**Data Flow (Before - Auto Generation):**
```
Analysis Complete → Virtues Computed → Auto-trigger Essence Gen → DALL-E → Save Image
```

**Data Flow (After - Manual Generation):**
```
Analysis Complete → Virtues Computed → Save Virtue Sentence
                                     → [User Views Profile]
                                     → [User Clicks Button]
                                     → DALL-E → Save Image
```

**Key Difference:** DALL-E call moves from automatic (post-analysis) to explicit user action.

### Technology Stack
**Frontend:**
- React 19 + TypeScript
- State management: React hooks (`useState`, `useEffect`)
- UI library: Tailwind CSS + lucide-react icons

**Backend/APIs:**
- DALL-E 3 via Supabase Edge Function (`/functions/v1/dalle-proxy`)
- OpenAI API (proxied)
- IndexedDB via Dexie.js

**Storage:**
- Dexie table: `profiles`
- Fields modified: None (only update triggers change)
- Fields read: `virtueSentence`, `essenceImage`, `virtues_11`

### Data Model
**Profile Schema (Relevant Fields):**
```typescript
interface Profile {
  id: number;
  virtues_11?: MatchVirtueCompatibility;  // 11 Virtues scores
  virtueSentence?: string;                // Free virtue sentence
  essenceImage?: Blob;                    // DALL-E image (nullable)
  essencePrompt?: string;                 // Prompt used for generation
  moodboardImage?: Blob;                  // Auto-generated lifestyle scene
  // ... other fields
}
```

**No Schema Changes Required:**
- All fields already exist and are nullable
- `essenceImage` being null is the "not yet generated" state

### Integration Requirements

#### 1. Remove Auto-Triggers
**File:** `src/hooks/useStreamingAnalysis.ts`
```typescript
// REMOVE this block around line 566:
startEssenceGeneration(profileId).catch(err => {
  console.log('useStreamingAnalysis: Essence generation deferred:', err);
});
```

**File:** `src/pages/ProfileDetail.tsx`
```typescript
// REMOVE this useEffect (lines 57-93):
useEffect(() => {
  if (profile?.id && compatibilityScores.virtues11 && ...) {
    generateFullEssence(profile.id); // DELETE THIS
  }
}, [...]);
```

#### 2. Add Locked Placeholder
**File:** `src/components/profileDetail/ProfileHeader.tsx`
```typescript
// Modify images array building logic (around line 83):
const images: ImageItem[] = [];

if (moodboardImageUrl) {
  images.push({ src: moodboardImageUrl, label: 'Lifestyle', type: 'moodboard' });
}

// CHANGE THIS SECTION:
if (profile.virtueSentence) {
  if (essenceImageUrl) {
    // Unlocked: show generated image
    images.push({ src: essenceImageUrl, label: 'Essence', type: 'essence' });
  } else {
    // Locked: show placeholder with virtue sentence
    images.push({
      src: null, // Special null state
      label: 'Essence (Locked)',
      type: 'essence-locked',
      virtueSentence: profile.virtueSentence
    });
  }
}

if (thumbnailUrl) {
  images.push({ src: thumbnailUrl, label: 'Photo', type: 'photo' });
}
```

**Render Logic:**
```tsx
{currentImage.type === 'essence-locked' ? (
  <div className="w-full h-full bg-gradient-to-br from-purple-600 to-purple-800 flex flex-col items-center justify-center p-8 text-white">
    <Lock size={48} className="mb-4 opacity-80" />
    <p className="text-xl font-medium text-center mb-2 leading-relaxed">
      {currentImage.virtueSentence}
    </p>
    <p className="text-sm opacity-70 mb-6">Generate to reveal abstract essence</p>

    {onGenerateEssence && (
      <button
        onClick={onGenerateEssence}
        disabled={isGeneratingEssence}
        className="px-6 py-3 bg-white text-purple-700 rounded-full font-semibold shadow-lg hover:bg-purple-50 disabled:opacity-50 transition-all"
      >
        {isGeneratingEssence ? (
          <span className="flex items-center gap-2">
            <Loader2 className="animate-spin" size={16} />
            Generating...
          </span>
        ) : (
          'Generate Essence (~$0.04)'
        )}
      </button>
    )}
  </div>
) : currentImage.type === 'essence' ? (
  // Existing unlocked essence rendering
  <img src={currentImage.src} alt="Essence" className="w-full h-full object-cover" />
) : ...}
```

#### 3. Add Generation Handler
**File:** `src/pages/ProfileDetail.tsx` (or ProfileHeader if encapsulated)
```typescript
import { generateAndSaveEssenceImage } from '../lib/essence/essenceGenerator';

const [isGeneratingEssence, setIsGeneratingEssence] = useState(false);

const handleGenerateEssence = useCallback(async () => {
  if (!profile?.id) return;

  setIsGeneratingEssence(true);

  try {
    const result = await generateAndSaveEssenceImage(profile.id);

    if (result.success) {
      console.log('[ProfileDetail] Essence generated successfully');

      // Refresh profile from DB to get updated essenceImage
      const updatedProfile = await db.profiles.get(profile.id);
      setProfile(updatedProfile || profile);

      // Optional: Show success toast
      // toast.success('Essence generated!');
    } else {
      console.error('[ProfileDetail] Essence generation failed:', result.error);
      alert(`Failed to generate essence: ${result.error}\n\nPlease try again.`);
    }
  } catch (err) {
    console.error('[ProfileDetail] Unexpected error during essence generation:', err);
    alert('An unexpected error occurred. Please try again.');
  } finally {
    setIsGeneratingEssence(false);
  }
}, [profile?.id]);

// Pass to ProfileHeader:
<ProfileHeader
  profile={profile}
  basics={basics}
  isGeneratingEssence={isGeneratingEssence}
  onGenerateEssence={handleGenerateEssence}
/>
```

#### 4. Update ProfileHeader Props
**File:** `src/components/profileDetail/ProfileHeader.tsx`
```typescript
interface ProfileHeaderProps {
  profile: Profile;
  basics: ProfileBasics;
  isGeneratingEssence?: boolean;
  isGeneratingMoodboard?: boolean;
  onGenerateEssence?: () => void;  // NEW: Generation handler
}
```

### Infrastructure Needs
**No Changes Required:**
- Supabase Edge Function (`dalle-proxy`) already exists
- Dexie schema supports nullable `essenceImage`
- Cost logging infrastructure (`logInference`) already exists

**Validation:**
- Confirm Supabase Pro tier timeout (150 seconds) sufficient for retries
- Confirm `formatCost()` utility handles $0.04 display correctly

---

## User Story Development

### Epic: Manual Essence Generation
**Epic ID:** EPIC-001
**Epic Description:** Convert essence image generation from automatic to user-triggered manual action with cost transparency, while preserving free virtue sentence teaser.

---

### Story 1: Remove Auto-Generation Triggers
**Story ID:** US-001
**Priority:** P0 (Critical)
**Estimate:** 2 story points

**Story:**
As a developer, I want to remove all automatic essence generation triggers, so that essence images are only created when explicitly requested by the user.

**Acceptance Criteria:**
1. **Given** a profile analysis completes successfully
   **When** the consolidation phase finishes
   **Then** NO call to `generateAndSaveEssenceImage()` is made
   **And** the virtue sentence IS still generated (free)

2. **Given** a user navigates to ProfileDetail page
   **When** the profile loads
   **Then** NO automatic essence generation occurs
   **And** existing `essenceImage` (if present) displays correctly

**Technical Tasks:**
- [ ] Remove `startEssenceGeneration()` call from `useStreamingAnalysis.ts:566`
- [ ] Remove auto-generation `useEffect` from `ProfileDetail.tsx:57-93`
- [ ] Verify virtue sentence generation still runs via `generateAndSaveVirtueSentence()`
- [ ] Add unit test confirming no auto-generation occurs

**Dependencies:** None

**Testing:**
- Unit test: Mock analysis completion, assert DALL-E never called
- E2E test: Analyze profile, verify no essence image generated automatically
- Regression test: Verify mood board still auto-generates

---

### Story 2: Locked Placeholder UI
**Story ID:** US-002
**Priority:** P0 (Critical)
**Estimate:** 5 story points

**Story:**
As a user viewing a profile, I want to see a locked placeholder with the virtue sentence when essence has not been generated, so I understand what content is available and how to unlock it.

**Acceptance Criteria:**
1. **Given** a profile has `virtueSentence` but NOT `essenceImage`
   **When** I swipe to the essence position in the carousel
   **Then** I see:
   - Gradient purple background (matching essence theme)
   - Lock icon
   - Virtue sentence text (large, readable)
   - "Generate to reveal abstract essence" hint
   - Dot indicator showing locked position exists

2. **Given** a profile has both `virtueSentence` AND `essenceImage`
   **When** I swipe to the essence position
   **Then** I see the full DALL-E image with "Essence" badge (existing behavior)

3. **Given** a profile does NOT have `virtueSentence` yet
   **When** I view the profile
   **Then** the essence position is NOT shown in the carousel (no locked state without teaser)

**Technical Tasks:**
- [ ] Define new `ImageItem` type with `type: 'essence-locked'` variant
- [ ] Modify `ProfileHeader.tsx` carousel building logic (line ~83)
- [ ] Add locked state rendering with gradient, lock icon, virtue sentence
- [ ] Preserve existing unlocked state rendering
- [ ] Update dot indicators to handle locked state
- [ ] Add CSS animations for smooth transitions

**Dependencies:** None

**Design:**
- Use `bg-gradient-to-br from-purple-600 to-purple-800` (matches essence badge purple)
- Lock icon: `lucide-react` `Lock` component, size 48px, opacity 80%
- Virtue sentence: `text-xl font-medium text-center mb-2 leading-relaxed`
- Hint text: `text-sm opacity-70`

**Testing:**
- Visual test: Locked state matches design spec
- Interaction test: Swipe gestures work with locked state
- Accessibility test: Lock icon has proper ARIA label
- Regression test: Unlocked state unchanged

---

### Story 3: Generate Essence Button
**Story ID:** US-003
**Priority:** P0 (Critical)
**Estimate:** 3 story points

**Story:**
As a user, I want to click a "Generate Essence (~$0.04)" button to create the essence image, so I have control over when this cost is incurred.

**Acceptance Criteria:**
1. **Given** a profile does NOT have `essenceImage` generated
   **When** I view the locked essence placeholder
   **Then** I see a button labeled "Generate Essence (~$0.04)"
   **And** the button is enabled if `virtues_11` exists
   **And** the button is disabled if `virtues_11` does NOT exist

2. **Given** I click the "Generate Essence" button
   **When** generation is in progress
   **Then** the button shows "Generating..." with spinner
   **And** the button is disabled (prevents duplicate clicks)

3. **Given** a profile already has `essenceImage` generated
   **When** I view the essence position
   **Then** the button is NOT shown (or shows "✓ Essence Generated" disabled state)

**Technical Tasks:**
- [ ] Add button to locked placeholder rendering
- [ ] Implement `onGenerateEssence` prop callback on ProfileHeader
- [ ] Add `isGeneratingEssence` state to parent component (ProfileDetail)
- [ ] Wire button click to essence generation handler
- [ ] Import `formatCost()` utility for cost display (if dynamic)
- [ ] Add disabled state styling and logic

**Dependencies:** US-002 (Locked Placeholder UI)

**Design:**
```tsx
<button
  onClick={onGenerateEssence}
  disabled={isGeneratingEssence || !profile.virtues_11}
  className="px-6 py-3 bg-white text-purple-700 rounded-full font-semibold shadow-lg hover:bg-purple-50 disabled:opacity-50 transition-all"
>
  {isGeneratingEssence ? 'Generating...' : 'Generate Essence (~$0.04)'}
</button>
```

**Testing:**
- Unit test: Button click triggers handler exactly once
- Integration test: Disabled states prevent clicks when appropriate
- Visual test: Button styling matches design system
- A11y test: Button has proper focus state and keyboard navigation

---

### Story 4: Essence Generation Handler
**Story ID:** US-004
**Priority:** P0 (Critical)
**Estimate:** 5 story points

**Story:**
As a developer, I want to implement the essence generation handler that calls DALL-E and updates the profile, so the user can successfully generate essence images on demand.

**Acceptance Criteria:**
1. **Given** the user clicks "Generate Essence"
   **When** the handler executes
   **Then** `generateAndSaveEssenceImage(profileId)` is called
   **And** loading state is set to `true`
   **And** the locked placeholder shows loading overlay

2. **Given** DALL-E generation completes successfully
   **When** the image is saved to IndexedDB
   **Then** the profile is refreshed from the database
   **And** the carousel updates to show the new essence image
   **And** the locked placeholder disappears
   **And** loading state is set to `false`

3. **Given** DALL-E generation fails
   **When** the error is returned
   **Then** an error message is shown to the user
   **And** the "Generate Essence" button remains enabled (allow retry)
   **And** loading state is set to `false`

**Technical Tasks:**
- [ ] Implement `handleGenerateEssence` async function in ProfileDetail
- [ ] Add `isGeneratingEssence` state management
- [ ] Call `generateAndSaveEssenceImage()` from `src/lib/essence/essenceGenerator.ts`
- [ ] Refresh profile from database after successful generation
- [ ] Handle errors with user-friendly messages
- [ ] Add loading overlay to locked placeholder during generation
- [ ] Log generation attempt via `logInference()`

**Dependencies:** US-003 (Generate Essence Button)

**Error Handling:**
- Network timeout (30s): Show "Generation timed out. Try again?"
- DALL-E API error: Show "Failed to generate essence: {error}. Try again?"
- Unexpected error: Show generic "An error occurred. Try again?"

**Testing:**
- Integration test: Successful generation updates UI correctly
- Integration test: Failed generation shows error, allows retry
- E2E test: Click button → see loading → see generated image
- E2E test: Generation failure → error message → retry succeeds

---

### Story 5: Loading State UI
**Story ID:** US-005
**Priority:** P1 (High)
**Estimate:** 3 story points

**Story:**
As a user waiting for essence generation, I want to see a clear loading indicator with progress message, so I know the system is working and approximately how long to wait.

**Acceptance Criteria:**
1. **Given** I clicked "Generate Essence"
   **When** DALL-E generation is in progress
   **Then** I see:
   - Button text changes to "Generating..."
   - Spinner icon appears in button
   - Loading overlay on locked placeholder with message "Creating your essence..."
   - Carousel remains swipeable but locked position shows loading

2. **Given** generation completes successfully
   **When** the image is saved
   **Then** the loading state disappears immediately
   **And** the carousel shows the new essence image
   **And** I can swipe/interact normally

3. **Given** generation takes longer than 10 seconds
   **When** the timeout threshold is reached
   **Then** I see an updated message "Still generating, please wait..."
   **And** loading continues (no hard timeout, relies on Supabase 150s limit)

**Technical Tasks:**
- [ ] Add loading overlay component to locked placeholder
- [ ] Show spinner in button during generation
- [ ] Add "Creating your essence..." message
- [ ] Optional: Add progress message update after 10s threshold
- [ ] Ensure loading state clears on success AND failure
- [ ] Add fade-in animation for generated image reveal

**Dependencies:** US-004 (Generation Handler)

**Design:**
```tsx
{isGeneratingEssence && (
  <div className="absolute inset-0 bg-purple-900/80 flex flex-col items-center justify-center">
    <Loader2 className="animate-spin mb-4 text-white" size={48} />
    <p className="text-white text-lg font-medium">Creating your essence...</p>
    <p className="text-white/70 text-sm mt-2">This may take up to 10 seconds</p>
  </div>
)}
```

**Testing:**
- Visual test: Loading overlay appears on button click
- Visual test: Loading state clears on completion
- Interaction test: User cannot spam-click button during loading
- E2E test: Full flow from click → loading → reveal

---

### Story 6: Virtue Sentence Preservation
**Story ID:** US-006
**Priority:** P0 (Critical)
**Estimate:** 2 story points

**Story:**
As a developer, I want to ensure virtue sentence generation remains automatic and free, so users always get a personality teaser without cost.

**Acceptance Criteria:**
1. **Given** profile analysis completes successfully
   **When** virtues are computed
   **Then** `generateAndSaveVirtueSentence(profileId)` is called automatically
   **And** the `virtueSentence` field is populated in the database
   **And** NO DALL-E API call is made

2. **Given** a user views a profile immediately after analysis
   **When** the ProfileDetail page loads
   **Then** the virtue sentence is visible in the locked placeholder
   **And** the sentence accurately reflects the profile's `virtues_11` scores

**Technical Tasks:**
- [ ] Verify `generateAndSaveVirtueSentence()` is called during analysis consolidation
- [ ] Confirm virtue sentence appears in locked placeholder (covered by US-002)
- [ ] Add unit test confirming virtue sentence generation is free (no DALL-E call)
- [ ] Verify virtue sentence persists across page refreshes

**Dependencies:** None (existing behavior validation)

**Testing:**
- Unit test: Virtue sentence generation does NOT call DALL-E
- Integration test: Virtue sentence saved to DB after analysis
- Regression test: Virtue sentence quality unchanged from before
- E2E test: Analyze profile → virtue sentence appears in locked state

---

### Story 7: Backward Compatibility
**Story ID:** US-007
**Priority:** P1 (High)
**Estimate:** 2 story points

**Story:**
As a user with existing profiles, I want profiles that already have essence images to continue displaying correctly, so I don't lose access to previously generated content.

**Acceptance Criteria:**
1. **Given** a profile has `essenceImage` already generated (before this feature)
   **When** I view the ProfileDetail page
   **Then** the essence image displays in the carousel (unlocked state)
   **And** the "Essence" badge appears
   **And** NO "Generate Essence" button is shown

2. **Given** a profile does NOT have `essenceImage` (before this feature)
   **When** I view the ProfileDetail page
   **Then** the locked placeholder appears (if `virtueSentence` exists)
   **And** the "Generate Essence" button is shown
   **And** clicking the button generates the image successfully

**Technical Tasks:**
- [ ] Test existing profiles with essenceImage display correctly
- [ ] Test existing profiles without essenceImage show locked state
- [ ] Verify no database migration required
- [ ] Add regression tests for legacy profile rendering

**Dependencies:** US-002 (Locked Placeholder), US-003 (Button)

**Testing:**
- Regression test: Load legacy profile with essence → displays unlocked
- Regression test: Load legacy profile without essence → displays locked
- Database test: No schema changes required
- E2E test: Existing profiles unaffected by feature deployment

---

### Story 8: Error Handling & Retry
**Story ID:** US-008
**Priority:** P1 (High)
**Estimate:** 3 story points

**Story:**
As a user experiencing a generation failure, I want clear error messages and the ability to retry, so I can successfully generate the essence without losing progress.

**Acceptance Criteria:**
1. **Given** DALL-E generation fails (network error, API error, timeout)
   **When** the error is returned
   **Then** I see a user-friendly error message (not raw API error)
   **And** the "Generate Essence" button remains enabled
   **And** clicking the button retries the generation

2. **Given** generation fails multiple times
   **When** I retry 3+ times
   **Then** I see a suggestion to check network connection or try again later
   **And** the failure is logged for debugging

3. **Given** generation fails during save (rare)
   **When** the image generation succeeds but database save fails
   **Then** I see an error message
   **And** the system retries the save automatically (existing retry logic)
   **And** if retry fails, I can regenerate without cost (cached image - future enhancement)

**Technical Tasks:**
- [ ] Implement user-friendly error message mapping
- [ ] Preserve button enabled state after error
- [ ] Log all failures via `logInference()` with error type
- [ ] Add retry count tracking (optional, for telemetry)
- [ ] Test common error scenarios (network timeout, API error, save failure)

**Dependencies:** US-004 (Generation Handler)

**Error Messages:**
- Network timeout: "Generation timed out. Check your connection and try again."
- DALL-E API error: "Failed to generate essence. Please try again in a moment."
- Save failure: "Image generated but failed to save. Retrying..."
- Unknown error: "An unexpected error occurred. Please try again."

**Testing:**
- Integration test: Mock network failure → error message shown
- Integration test: Mock API error → retry succeeds
- E2E test: Disconnect network → click button → error shown → reconnect → retry succeeds

---

### Story 9: Cost Logging & Analytics
**Story ID:** US-009
**Priority:** P2 (Medium)
**Estimate:** 2 story points

**Story:**
As a developer, I want all essence generation attempts logged with cost tracking, so I can monitor usage, debug failures, and track cumulative spend.

**Acceptance Criteria:**
1. **Given** a user clicks "Generate Essence"
   **When** DALL-E generation is triggered
   **Then** an inference log record is created with:
   - Feature: `essence_image_generation`
   - Model: `dall-e-3`
   - Cost: `$0.04` (if successful)
   - Profile ID
   - Success/failure status
   - Error type (if failed)

2. **Given** generation completes (success or failure)
   **When** I view Settings > AI Insights
   **Then** I see the essence generation logged under feature breakdown
   **And** the cost contributes to total spend metrics

**Technical Tasks:**
- [ ] Verify `logInference()` is called in `generateAndSaveEssenceImage()`
- [ ] Confirm cost is logged correctly ($0.04 for success, $0 for failure)
- [ ] Verify inference appears in Settings > AI Insights breakdown
- [ ] Add feature label for `essence_image_generation` if missing

**Dependencies:** None (logging already exists in `essenceGenerator.ts:66`)

**Testing:**
- Integration test: Generate essence → verify log record created
- Integration test: Failed generation → verify $0 cost logged
- E2E test: View Settings > AI Insights → essence generation appears

---

## Quality Assurance

### PRD Completeness Checklist
- [x] Executive Summary with problem, solution, impact, risks
- [x] Product Overview with vision, users, value proposition, success criteria
- [x] Functional Requirements (FR-1 through FR-5) with user stories
- [x] Non-Functional Requirements (performance, cost, compatibility, usability, reliability)
- [x] Technical Considerations (architecture, data model, integration points)
- [x] User Stories (US-001 through US-009) with acceptance criteria, tasks, testing
- [ ] Test Plan (below)
- [ ] Rollout Plan (below)
- [x] Risk Assessment and Mitigations

### Test Plan

#### Unit Tests
**Coverage Target:** 90%+ for modified files

**Key Test Cases:**
1. **essenceGenerator.ts:**
   - `generateProfileVirtueSentence()` returns correct sentence from virtue scores
   - `generateProfileVirtueSentence()` returns undefined if no virtue scores
   - `generateAndSaveEssenceImage()` skips if essenceImage already exists
   - `generateAndSaveEssenceImage()` logs inference on success
   - `generateAndSaveEssenceImage()` logs $0 cost on failure

2. **ProfileHeader.tsx:**
   - Carousel builds images array with locked state when essenceImage missing
   - Carousel builds images array with unlocked state when essenceImage exists
   - Locked state renders virtue sentence correctly
   - Button appears only when essenceImage is null
   - Button is disabled when virtues_11 is missing

3. **ProfileDetail.tsx:**
   - `handleGenerateEssence()` calls `generateAndSaveEssenceImage()`
   - `handleGenerateEssence()` refreshes profile after success
   - `handleGenerateEssence()` shows error on failure
   - `isGeneratingEssence` state toggles correctly

#### Integration Tests
**Test Environment:** Local dev with mocked DALL-E API

**Key Test Cases:**
1. **End-to-End Generation Flow:**
   - Click "Generate Essence" → loading state appears → image generated → carousel updates
   - Click "Generate Essence" → network error → error shown → retry succeeds

2. **State Management:**
   - Profile with virtue sentence but no essenceImage → locked state shown
   - Profile with essenceImage → unlocked state shown
   - Profile without virtue sentence → no essence position in carousel

3. **Error Handling:**
   - DALL-E timeout → user-friendly error message
   - DALL-E API error → error message + retry button enabled
   - Save failure → auto-retry → success

#### E2E Tests (Playwright)
**Test Environment:** Full production build, real DALL-E API (test account)

**Key Test Cases:**
1. **Happy Path:**
   ```
   - Analyze profile (wait for completion)
   - Navigate to ProfileDetail
   - Swipe to essence position
   - Verify locked placeholder with virtue sentence
   - Click "Generate Essence (~$0.04)"
   - Verify loading state
   - Wait for generation (max 15s)
   - Verify essence image appears
   - Verify button disappears
   - Refresh page → essence still displayed
   ```

2. **Backward Compatibility:**
   ```
   - Load existing profile WITH essenceImage
   - Navigate to ProfileDetail
   - Swipe to essence position
   - Verify unlocked essence displayed
   - Verify no "Generate Essence" button
   ```

3. **Error Recovery:**
   ```
   - Navigate to ProfileDetail
   - Disconnect network
   - Click "Generate Essence"
   - Verify error message after timeout
   - Reconnect network
   - Click "Generate Essence" (retry)
   - Verify successful generation
   ```

#### Visual Regression Tests
**Tool:** Playwright visual snapshots

**Key Snapshots:**
1. Locked essence placeholder (desktop + mobile)
2. Essence generation loading state
3. Unlocked essence display (no changes from current)
4. Error message state

### Rollout Plan

#### Phase 1: Development & Testing (1-2 days)
- [ ] Implement all user stories (US-001 through US-009)
- [ ] Run unit tests (target: 90% coverage, all pass)
- [ ] Run integration tests (all pass)
- [ ] Run E2E tests (all pass)
- [ ] Code review (Argus agent or peer review)

#### Phase 2: Staging Validation (0.5 days)
- [ ] Deploy to staging environment (Vercel preview branch)
- [ ] Manual QA testing:
  - Test locked state UI on mobile + desktop
  - Test generation flow (success path)
  - Test error handling (force API failure)
  - Test backward compatibility (legacy profiles)
- [ ] Performance validation (generation completes <10s)
- [ ] Cost validation (verify $0.04 cost logged correctly)

#### Phase 3: Production Deployment (0.5 days)
- [ ] Merge to main branch
- [ ] Auto-deploy to production (Vercel)
- [ ] Post-deployment validation:
  - Smoke test: Analyze new profile → verify locked state
  - Smoke test: Generate essence → verify success
  - Verify Settings > AI Insights shows new generations
- [ ] Monitor error logs for 24 hours (check for unexpected failures)

#### Phase 4: User Communication (1 day)
- [ ] Update any user-facing documentation (if exists)
- [ ] Optional: In-app changelog/announcement (future)
- [ ] Monitor user feedback channels for confusion or issues

#### Rollback Plan
**Trigger Conditions:**
- Essence generation success rate <80% (indicates API issue)
- Locked state UI causing app crashes (unlikely but critical)
- User reports widespread confusion about feature

**Rollback Steps:**
1. Revert main branch to previous commit (before feature merge)
2. Redeploy to production (Vercel auto-deploys)
3. Verify existing profiles still work (should be unaffected)
4. Investigate failure cause before re-attempting deployment

**Risk Mitigation:**
- Feature is isolated (no breaking schema changes)
- Rollback is safe (previous auto-generation behavior restored)
- No data loss risk (essenceImage field remains nullable)

---

## Appendix

### Glossary

| Term | Definition |
|------|------------|
| **Essence** | AI-generated abstract art representing a person's personality, derived from 11 Virtues scores |
| **Virtue Sentence** | One-line personality summary (e.g., "A curious explorer with radiant warmth") derived from virtue scores |
| **Mood Board** | Lifestyle scene image generated from profile interests (auto-generated, free) |
| **11 Virtues** | Personality framework with 3 realms (Mental, Spiritual, Physical) used for compatibility scoring |
| **DALL-E 3** | OpenAI's image generation AI, accessed via Supabase Edge Function proxy |
| **Locked Placeholder** | UI state showing virtue sentence teaser when essence image not yet generated |
| **Auto-Generation** | Previous behavior where essence image was created automatically after analysis |
| **Manual Trigger** | New behavior where user explicitly clicks button to generate essence image |

### Open Questions

**Q: Should we show a progress bar during generation?**
A: NO - DALL-E generation time is unpredictable (3-10 seconds). Spinner + message is sufficient. Future enhancement: If we switch to streaming generation, add progress bar.

**Q: Should we cache failed generation attempts to prevent re-charging user?**
A: NO for MVP - Existing retry logic handles transient failures. Future enhancement: Cache generated image temporarily if save fails, allow re-save without re-generation.

**Q: Should we allow users to regenerate essence if they don't like it?**
A: NO for MVP - Each generation costs $0.04. Future enhancement: Add "Regenerate Essence" button with confirmation + cost warning.

**Q: Should we show the virtue sentence as a caption on the unlocked essence image?**
A: OPTIONAL - Good enhancement but not required for MVP. Add as post-launch improvement if user feedback requests it.

**Q: Should we implement batch generation (generate essence for all profiles at once)?**
A: NO - Scope creep. Manual trigger is per-profile. Future enhancement: Add "Generate All" button on Home page with bulk cost estimate.

### Future Enhancements

**Post-MVP Improvements:**
1. **Essence Regeneration:** Allow users to regenerate essence with confirmation + cost warning
2. **Virtue Sentence as Caption:** Show virtue sentence overlaid on unlocked essence image
3. **Batch Generation:** "Generate essence for all profiles" with total cost estimate
4. **Progressive Generation:** Stream partial image if DALL-E API supports it (show low-res preview first)
5. **Cost Estimates:** Show estimated total spend on Home page based on locked essences
6. **Generation History:** Track all generations in Settings with thumbnails and costs
7. **Cached Retry:** If image generation succeeds but save fails, cache image for retry without re-generation

**Analytics to Track:**
- Essence generation conversion rate (% of profiles that get essence generated)
- Time-to-generation (how long after analysis do users click button?)
- Retry rate (how many generations fail and require retry?)
- Cumulative spend per user (via Settings > AI Insights)

---

**End of PRD**

---

[timestamp] 2026-01-27 11:45 PST
