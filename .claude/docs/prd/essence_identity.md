# Product Requirements Document: Essence Identity

**Version:** 1.0
**Date:** 2026-01-26
**Author:** PRD Specialist (Claude Code)
**Status:** Draft
**Priority:** Medium (RICE Score: 18.5)

---

## Executive Summary

### Problem Statement
Current profile thumbnails are frame grabs from screen recordings - often cut off, poorly lit, or showing UI chrome instead of the person. Users lack a visual representation that captures personality beyond just physical appearance. The 11 Virtues system provides rich psychological insights, but no visual counterpart exists to represent a match's essence.

### Solution Overview
Introduce **Essence Identity** - a dual enhancement to match profiles:
1. **Virtue Sentence**: Auto-generated one-liner derived from 11 Virtues scores (e.g., "A curious explorer with radiant warmth and autonomous spirit")
2. **Essence Image**: AI-generated abstract/artistic visualization representing their personality (via DALL-E 3)

Both features leverage existing analysis data or run as non-blocking background operations, adding personality depth without disrupting core workflows.

### Business Impact

**User Value**
- **Better first impressions**: Virtue sentence provides instant personality snapshot
- **Visual personality**: Essence image offers creative representation beyond screenshots
- **Gallery differentiation**: Easier to remember matches by their essence vs similar photos

**Technical Value**
- **No analysis delay**: Virtue sentence is free (derived data); essence image generates in background
- **Storage efficiency**: Blob storage for essence images (~100KB each)
- **Incremental feature**: Non-breaking addition to existing Profile schema

**Estimated Development Effort**: 1.5 sprints (Backend: 1 sprint, Frontend: 0.5 sprint)

### Resource Requirements
- **Backend Architect**: 24 hours (DALL-E integration, prompt engineering, schema update)
- **Frontend Developer**: 20 hours (Image carousel, virtue sentence UI, gallery updates)
- **Code Reviewer**: 6 hours (Quality assurance, test coverage)
- **Mobile UX Optimizer**: 4 hours (Carousel UX, touch interactions)

### Risk Assessment
- **Low Risk**: Non-critical feature - failure doesn't impact core analysis
- **Medium Risk**: DALL-E API cost ($0.04-0.08 per image) requires cost tracking
- **Low Risk**: Schema migration adds optional fields only

---

## Product Overview

### Product Vision
Every match profile has a unique essence beyond their physical appearance. Aura surfaces this essence through AI-generated visuals and virtue-based summaries, helping users connect with personality before pixels.

### Target Users

**Primary Persona: Profile Gallery Browser**
- **Behavior**: Scrolls through 20+ profiles quickly, struggles to remember individuals
- **Pain Point**: "All the screenshots look the same after a while"
- **Goal**: Quickly identify personality differences at a glance

**Secondary Persona: Deep Profile Viewer**
- **Behavior**: Reads full profile analysis, studies compatibility scores
- **Pain Point**: "I want to see their essence, not just a cropped screenshot"
- **Goal**: Richer understanding of who this person really is

### Value Proposition

**For Gallery Browsing:**
- Virtue sentence acts as personality subtitle (like a tagline)
- Differentiates profiles in grid view beyond name/age

**For Profile Detail:**
- Essence image offers creative visualization of personality
- Swipe between thumbnail and essence for dual perspectives
- Visual complement to 11 Virtues compatibility analysis

### Success Criteria

**Launch Metrics (Week 1)**
- ✅ 100% of new profiles generate virtue sentence during consolidation
- ✅ 80% of essence image generations succeed within 30 seconds
- ✅ Essence images stored as Blob (<150KB average size)
- ✅ Gallery UI shows virtue sentence for all profiles with virtue scores

**Engagement Metrics (Month 1)**
- ✅ 60% of users interact with image carousel (swipe/tap)
- ✅ 40% of users view essence image within 24h of profile creation
- ✅ Average time on profile detail increases by 15% (indicates engagement)

**Cost Metrics**
- ✅ Average DALL-E cost per profile: $0.04-0.08
- ✅ Total monthly cost for 500 profiles: $20-40
- ✅ Cost tracking integrated with inference history

### Assumptions
1. **DALL-E 3 availability**: API remains accessible via OpenAI endpoint
2. **Prompt engineering**: Abstract/artistic style prompts work reliably
3. **Non-blocking generation**: Users don't wait for essence image before viewing profile
4. **Storage capacity**: IndexedDB supports storing 100KB Blobs per profile
5. **Existing analysis**: Profiles already have 11 Virtues scores (virtues_11 field)

---

## Functional Requirements

### Core Features

#### FR-1: Virtue Sentence Generation
**Priority:** P0 (Core feature)

**Description**: Generate a one-sentence personality summary from 11 Virtues scores during consolidation phase.

**Acceptance Criteria:**
- ✅ Virtue sentence generated during consolidation phase (no extra API call)
- ✅ Sentence structure: "[Virtue adjective] [archetype] with [virtue trait] and [virtue trait]"
- ✅ Uses top 3 virtues by score (highest prominence)
- ✅ Stored in `profile.virtueSentence` field (string)
- ✅ Displayed as subtitle in gallery cards and profile header

**Technical Specification:**
```typescript
// Example consolidation prompt addition:
Based on the 11 Virtues scores, generate a one-sentence essence:
- Use top 3 virtues by score
- Format: "[Virtue adjective] [archetype] with [virtue trait] and [virtue trait]"
- Example: "A curious explorer with radiant warmth and autonomous spirit"

Return as "virtue_sentence" field.
```

**Example Outputs:**
- Curiosity 85, Warmth 78, Space 72 → "A curious explorer with radiant warmth and autonomous spirit"
- Wit 82, Drive 75, Lust 70 → "An intellectual achiever with sharp wit and voracious energy"
- Play 80, Vitality 76, Warmth 68 → "An absurd spirit with high voltage and radiant kindness"

---

#### FR-2: Essence Image Generation
**Priority:** P0 (Core feature)

**Description**: Generate abstract/artistic AI image representing the match's personality via DALL-E 3.

**Acceptance Criteria:**
- ✅ Generation triggered AFTER analysis completes (non-blocking)
- ✅ Uses virtue scores + virtue sentence as prompt context
- ✅ DALL-E 3 API called via new Edge Function (keeps API key server-side)
- ✅ Image returned as base64, converted to Blob, stored in `profile.essenceImage`
- ✅ Generation failure logged but doesn't break profile
- ✅ Retry logic (1 retry on failure)

**Technical Specification:**
```typescript
// New field in Profile schema
interface Profile {
  // ... existing fields ...
  virtueSentence?: string;      // One-line essence
  essenceImage?: Blob;          // AI-generated abstract image
  essencePrompt?: string;       // Prompt used (for regeneration)
}

// Generation flow
async function generateEssenceImage(profile: Profile): Promise<void> {
  if (!profile.virtues_11) return; // Requires virtues

  const prompt = buildEssencePrompt(profile.virtues_11, profile.virtueSentence);

  try {
    const imageBase64 = await callDalleAPI(prompt);
    const imageBlob = base64ToBlob(imageBase64);

    await db.profiles.update(profile.id, {
      essenceImage: imageBlob,
      essencePrompt: prompt,
    });
  } catch (error) {
    console.error('Essence generation failed:', error);
    // Non-blocking - profile still usable
  }
}
```

**Prompt Engineering Strategy:**
```typescript
function buildEssencePrompt(
  virtues: MatchVirtueCompatibility,
  virtueSentence?: string
): string {
  const topVirtues = getTopVirtues(virtues.scores, 3);

  // Abstract/artistic style, not realistic portrait
  return `
    Create an abstract, artistic visualization representing a person's essence.

    Personality traits:
    - ${topVirtues[0].virtue_name}: ${topVirtues[0].match_score}/100
    - ${topVirtues[1].virtue_name}: ${topVirtues[1].match_score}/100
    - ${topVirtues[2].virtue_name}: ${topVirtues[2].match_score}/100

    Essence: ${virtueSentence || 'A unique individual'}

    Style: Abstract, colorful, non-representational. Think flowing shapes,
    gradients, and textures that evoke personality rather than depict it.
    No faces, no text, no photorealistic elements.
  `;
}
```

---

#### FR-3: Image Carousel UI
**Priority:** P1 (Must-have for launch)

**Description**: Allow users to swipe/toggle between thumbnail and essence image in ProfileHeader.

**Acceptance Criteria:**
- ✅ ProfileHeader shows image carousel (thumbnail | essence)
- ✅ Swipe gesture switches between images (mobile)
- ✅ Tap dots/arrows to switch (desktop)
- ✅ Current image indicator (dot navigation)
- ✅ Graceful fallback: if no essence image, show thumbnail only
- ✅ Badge: "Essence Available" when essence image exists

**UI Component:**
```tsx
// src/components/profileDetail/ProfileHeader.tsx
export function ProfileHeader({ profile, basics }: ProfileHeaderProps) {
  const [currentImage, setCurrentImage] = useState<'thumbnail' | 'essence'>('thumbnail');
  const thumbnailUrl = useThumbnailUrl(profile.thumbnail);
  const essenceUrl = profile.essenceImage ? URL.createObjectURL(profile.essenceImage) : null;

  const images = [
    { type: 'thumbnail', url: thumbnailUrl, label: 'Photo' },
    essenceUrl ? { type: 'essence', url: essenceUrl, label: 'Essence' } : null,
  ].filter(Boolean);

  return (
    <div className="relative h-64 bg-slate-900">
      {/* Image Display */}
      <ImageCarousel images={images} onImageChange={setCurrentImage} />

      {/* Essence Badge (when available) */}
      {essenceUrl && (
        <div className="absolute top-6 right-6 bg-violet-500/90 text-white px-3 py-1 rounded-full text-xs">
          ✨ Essence
        </div>
      )}

      {/* Name + Virtue Sentence */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80">
        <h1 className="text-3xl font-bold text-white">{basics.name}</h1>
        {profile.virtueSentence && (
          <p className="text-white/90 italic text-sm mt-1">{profile.virtueSentence}</p>
        )}
      </div>
    </div>
  );
}
```

---

#### FR-4: Gallery Card Virtue Sentence
**Priority:** P1 (Must-have for launch)

**Description**: Display virtue sentence as subtitle in gallery cards.

**Acceptance Criteria:**
- ✅ Gallery card shows virtue sentence below name/age
- ✅ Truncate to 60 characters with ellipsis
- ✅ Only show if `profile.virtueSentence` exists
- ✅ Italic style to distinguish from other text

**UI Example:**
```tsx
// src/components/GalleryCard.tsx
<div className="p-4">
  <h3 className="font-bold text-lg">{profile.name}, {basics.age}</h3>

  {profile.virtueSentence && (
    <p className="text-sm text-slate-600 italic truncate mt-1">
      {profile.virtueSentence}
    </p>
  )}

  {/* Existing compatibility score, etc */}
</div>
```

---

#### FR-5: Cost Tracking Integration
**Priority:** P1 (Must-have for launch)

**Description**: Track DALL-E API costs in inference history (similar to Anthropic tracking).

**Acceptance Criteria:**
- ✅ New inference feature: `'essence_image_generation'`
- ✅ Cost calculated based on DALL-E 3 pricing ($0.040-0.080 per image)
- ✅ Token counts N/A (images don't use tokens) - log as 0
- ✅ Success/failure logged for debugging
- ✅ Visible in Settings > AI Usage dashboard

**Technical Specification:**
```typescript
// After DALL-E API call
await logInference({
  inputTokens: 0,  // N/A for image generation
  outputTokens: 0,
  estimatedCostUsd: 0.04, // DALL-E 3 standard quality
  model: 'dall-e-3',
  feature: 'essence_image_generation',
  page: '/profile-detail',
  profileId: profile.id,
  success: true,
});
```

---

### User Stories

#### Story 1: View Essence in Profile
**As a** curious user
**I want** to see an artistic visualization of my match's personality
**So that** I understand their essence beyond physical appearance

**Acceptance Criteria:**
- **Given** a profile with an essence image
- **When** I view the profile detail page
- **Then** I see a carousel with thumbnail and essence image
- **And** I can swipe/tap to toggle between them

---

#### Story 2: Quick Personality Scan in Gallery
**As a** profile browser
**I want** to see a one-line personality summary in the gallery
**So that** I can quickly differentiate matches

**Acceptance Criteria:**
- **Given** profiles with virtue sentences
- **When** I view the gallery
- **Then** I see virtue sentences as subtitles below names
- **And** sentences are unique per profile (based on their virtues)

---

#### Story 3: Background Generation Doesn't Block
**As a** user uploading a profile
**I want** essence generation to happen in the background
**So that** I can view the profile immediately

**Acceptance Criteria:**
- **Given** I complete a profile analysis
- **When** analysis finishes
- **Then** profile is immediately viewable (with thumbnail)
- **And** essence image generates in background
- **And** UI updates when essence becomes available

---

### User Flows

#### Flow 1: New Profile with Essence
```
1. User completes profile analysis (consolidation phase)
2. Virtue sentence generated (added to profile)
3. Analysis marked complete, user navigates to profile detail
4. ProfileHeader shows thumbnail + virtue sentence
5. Background: Essence image generation begins
6. 15-30 seconds later: Essence image appears, carousel updates
7. User swipes to view essence image
8. Badge shows "✨ Essence" when on essence view
```

#### Flow 2: Gallery Browsing
```
1. User views Home gallery (20 profiles)
2. Each card shows:
   - Thumbnail
   - Name, Age
   - Virtue sentence (italic, subtle)
   - Compatibility score
3. User thinks: "Oh, 'curious explorer' vs 'intellectual achiever' - different vibes"
4. User taps profile to view details
5. Carousel reveals essence image (abstract visualization)
```

---

## Non-Functional Requirements

### Performance

#### NFR-1: Non-Blocking Generation
- **Requirement**: Essence image generation MUST NOT block profile viewing
- **Rationale**: Analysis is complete, user expects immediate access
- **Validation**: Profile detail page loads in <1s even while essence generates

#### NFR-2: Generation Timeout
- **Requirement**: DALL-E API timeout set to 30 seconds
- **Rationale**: Prevent indefinite hangs; fail gracefully
- **Validation**: Test with mocked slow API, verify timeout handling

#### NFR-3: Storage Efficiency
- **Requirement**: Essence images stored as Blob, average <150KB
- **Rationale**: 500 profiles × 150KB = 75MB (acceptable IndexedDB usage)
- **Validation**: Measure 20 generated images, verify average size

---

### Security

#### NFR-4: API Key Protection
- **Requirement**: OpenAI API key MUST be stored server-side (Supabase Edge Function)
- **Rationale**: Never expose API keys in browser bundle
- **Validation**: Network inspector confirms no API key in client code

#### NFR-5: Safe Prompt Content
- **Requirement**: Essence prompts MUST NOT include user PII
- **Rationale**: Privacy compliance, prevent prompt injection
- **Validation**: Audit prompts, verify only virtue scores + sentence used

---

### Usability

#### NFR-6: Graceful Fallback
- **Requirement**: If essence generation fails, profile remains fully functional
- **Rationale**: Non-critical feature shouldn't break core experience
- **Validation**: Force DALL-E error, verify profile still loads

#### NFR-7: Mobile-First Carousel
- **Requirement**: Swipe gesture works smoothly on 375px viewport (iPhone SE)
- **Rationale**: 60% of users on mobile
- **Validation**: Manual testing on 5 device sizes

#### NFR-8: Virtue Sentence Readability
- **Requirement**: Sentences are 40-60 characters, readable at 14px font size
- **Rationale**: Gallery cards have limited space
- **Validation**: Test with 20 generated sentences, verify all readable

---

### Reliability

#### NFR-9: Retry Logic
- **Requirement**: DALL-E API retries once on failure (network errors, rate limits)
- **Rationale**: Transient errors shouldn't permanently block essence
- **Validation**: Mock network failure, verify retry attempt

#### NFR-10: Cost Ceiling
- **Requirement**: Daily essence generation capped at 100 images (dev control)
- **Rationale**: Prevent runaway costs during bugs/testing
- **Validation**: Config flag `MAX_ESSENCE_PER_DAY=100`

---

## Technical Considerations

### Architecture Overview

**Data Flow:**
```
1. Profile analysis completes (consolidation phase)
2. Virtue sentence generated (in same API call, free)
3. Profile saved with virtueSentence field
4. User views profile detail
5. Background: generateEssenceImage() called
6. DALL-E API request via Supabase Edge Function
7. Image returned as base64
8. Converted to Blob, stored in profile.essenceImage
9. UI updates (carousel shows essence option)
```

**Component Diagram:**
```
ProfileDetail Page
  ↓
ProfileHeader Component
  ↓ (checks profile.essenceImage)
ImageCarousel Component
  ↓ (swipe/tap interaction)
[Thumbnail | Essence Image] Display
```

---

### Technology Stack

**Backend**
- **Supabase Edge Function**: OpenAI API proxy (keeps key server-side)
- **DALL-E 3 API**: Image generation (standard quality, 1024x1024)
- **Dexie.js**: Store essenceImage as Blob

**Frontend**
- **React 19**: ImageCarousel component
- **Tailwind CSS**: Carousel styling, dot navigation
- **lucide-react**: Icons (Sparkles for essence badge)

**Testing**
- **Vitest**: Unit tests for buildEssencePrompt(), generation logic
- **Playwright**: E2E test for carousel interaction

---

### Data Model

**Dexie Schema Update:**
```typescript
// Version 14: Add essence fields
db.version(14).stores({
  profiles: '++id, name, appName, timestamp, analysisPhase, serverId',
  userIdentity: '++id, lastUpdated, supabaseUserId, serverId',
  coachingSessions: '++id, profileId, timestamp, serverId',
  matchChats: '++id, profileId, timestamp, serverId',
  inferenceHistory: '++id, timestamp, feature, userId, success',
});
// No upgrade needed - new fields start as undefined

// Updated Profile interface
interface Profile {
  // ... existing fields ...
  virtueSentence?: string;      // "A curious explorer with radiant warmth"
  essenceImage?: Blob;          // Abstract AI-generated image
  essencePrompt?: string;       // Prompt used (for debugging/regeneration)
}
```

**Sample Record:**
```json
{
  "id": 42,
  "name": "Sarah",
  "virtueSentence": "A curious explorer with radiant warmth and autonomous spirit",
  "essenceImage": Blob { size: 142038, type: "image/png" },
  "essencePrompt": "Create an abstract visualization... [full prompt]"
}
```

---

### API Integration

#### New Edge Function: `dalle-proxy`
**File:** `supabase/functions/dalle-proxy/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const { prompt } = await req.json();

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      response_format: 'b64_json',
    }),
  });

  const data = await response.json();
  return new Response(JSON.stringify({ image: data.data[0].b64_json }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

**Client Call:**
```typescript
// src/lib/api/dalleClient.ts
export async function generateEssenceImage(prompt: string): Promise<string> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/dalle-proxy`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });

  const { image } = await response.json();
  return image; // base64
}
```

---

### Infrastructure Needs

**Supabase Edge Function:**
- Deploy `dalle-proxy` function
- Add `OPENAI_API_KEY` environment variable
- Estimated cost: $0.04-0.08 per image × 500 profiles/month = $20-40/month

**IndexedDB Storage:**
- Essence images: ~150KB × 500 profiles = 75MB
- Total IndexedDB usage: ~100MB (well within 500MB quota)

---

## Success Metrics

### Launch Metrics (Week 1)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Virtue sentence generation | 100% of new profiles | Schema audit |
| Essence image success rate | 80% | Inference history logs |
| Average essence image size | <150KB | Storage measurement |
| Gallery UI shows sentences | 100% of eligible profiles | Manual QA |

### Engagement Metrics (Month 1)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Carousel interaction rate | 60% | Event: `essence_carousel_swiped` |
| Essence view rate | 40% within 24h | Event: `essence_image_viewed` |
| Time on profile (Δ) | +15% | Analytics comparison |

### Cost Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Average cost per image | $0.04-0.08 | Inference history |
| Monthly cost (500 profiles) | $20-40 | Aggregate inference costs |
| Failed generations | <20% | Error logs |

---

## Rollout Plan

### Phase 1: Backend (Sprint 1 - Week 1-2)

**Tasks:**
1. **Backend Architect** (16h)
   - Update Profile schema (v14 migration)
   - Implement `buildEssencePrompt()` function
   - Create `generateEssenceImage()` function
   - Deploy `dalle-proxy` Edge Function
   - Add cost tracking integration
   - Unit tests (10 tests)

2. **Code Reviewer** (4h)
   - Review prompt engineering safety
   - Verify non-blocking implementation
   - Check error handling

**Acceptance Criteria:**
- ✅ Schema migration passes (zero data loss)
- ✅ Edge Function deploys successfully
- ✅ Test essence generation (5 examples)
- ✅ Cost tracking logs to inference history

---

### Phase 2: Frontend (Sprint 2 - Week 3)

**Tasks:**
1. **Frontend Developer** (20h)
   - Create ImageCarousel component (8h)
   - Update ProfileHeader with carousel (6h)
   - Add virtue sentence to gallery cards (4h)
   - E2E test: carousel interaction (2h)

2. **Mobile UX Optimizer** (4h)
   - Test swipe gesture on 5 devices
   - Optimize carousel for mobile
   - Ensure touch targets ≥44px

**Acceptance Criteria:**
- ✅ Carousel works on desktop + mobile
- ✅ Virtue sentence appears in gallery
- ✅ E2E test passes (carousel navigation)
- ✅ No regressions to existing tests

---

### Phase 3: Soft Launch (Week 4)

**Tasks:**
1. **Master Product Manager** (4h)
   - Enable for 20% of users (feature flag)
   - Monitor engagement metrics
   - Gather user feedback (5 interviews)

**Rollback Criteria:**
- ❌ Essence generation fails >50% of time
- ❌ Profile load time increases >2s
- ❌ IndexedDB quota errors affect >5% of users

---

### Phase 4: Full Launch (Week 5)

**Tasks:**
1. Enable for 100% of users
2. Announce via in-app banner
3. Monitor cost metrics (stay within $40/month budget)

---

## Risks and Mitigations

### Risk 1: DALL-E Cost Overrun
**Probability:** Medium | **Impact:** Medium

**Description**: 1,000 profiles × $0.08 = $80/month (over budget)

**Mitigation:**
- Cap daily generation at 100 images
- Monitor weekly costs, adjust cap if needed
- Consider batch pricing or lower quality setting

**Contingency**: Disable new essence generation if monthly cost >$50, alert dev team.

---

### Risk 2: Prompt Quality Issues
**Probability:** Medium | **Impact:** Low

**Description**: Generated images don't match personality well

**Mitigation:**
- Iterate on prompt templates (A/B test)
- Add user feedback: "Does this essence match?" thumbs up/down
- Store `essencePrompt` for debugging

**Contingency**: If <50% thumbs up, refine prompt engineering, regenerate batch.

---

### Risk 3: Generation Failures
**Probability:** Low | **Impact:** Low

**Description**: DALL-E API rate limits or timeouts

**Mitigation:**
- Retry logic (1 retry)
- Graceful fallback (profile still works)
- Queue system (defer to low-traffic hours)

**Contingency**: If failures >30%, disable feature, investigate API issues.

---

## Future Considerations

### Phase 2: User Profile Essence (Q2 2026)
- Generate essence for user's own profile
- Use in "Compare" feature (user essence vs match essence)

### Phase 3: Regeneration Button (Q2 2026)
- "Regenerate Essence" button in profile detail
- Useful if first generation doesn't resonate

### Phase 4: Style Preferences (Q3 2026)
- User chooses essence style: Abstract | Geometric | Watercolor | Cosmic
- Stored in user settings, applied to all essences

---

## Appendix

### A. Example Virtue Sentences

| Top 3 Virtues | Virtue Sentence |
|---------------|----------------|
| Curiosity 85, Warmth 78, Space 72 | "A curious explorer with radiant warmth and autonomous spirit" |
| Wit 82, Drive 75, Lust 70 | "An intellectual achiever with sharp wit and voracious energy" |
| Play 80, Vitality 76, Warmth 68 | "An absurd spirit with high voltage and radiant kindness" |
| Space 88, Drive 72, Anchor 65 | "An autonomous force with relentless drive and fluid spontaneity" |
| Lust 90, Play 78, Warmth 66 | "A voracious soul with absurd playfulness and warm connection" |

### B. DALL-E Pricing Reference (2026)

**DALL-E 3 Pricing:**
- Standard quality (1024x1024): $0.040 per image
- HD quality (1024x1024): $0.080 per image

**Recommended Setting:** Standard quality (sufficient for abstract art)

**Monthly Cost Scenarios:**
- 100 profiles/month: $4.00
- 500 profiles/month: $20.00
- 1,000 profiles/month: $40.00

### C. Prompt Template

```
Create an abstract, artistic visualization representing a person's essence.

Personality traits (from 11 Virtues):
- [Virtue 1]: [Score]/100 - [Description]
- [Virtue 2]: [Score]/100 - [Description]
- [Virtue 3]: [Score]/100 - [Description]

Essence summary: [Virtue Sentence]

Style requirements:
- Abstract, non-representational art
- Flowing shapes, gradients, textures
- Vibrant colors that evoke the personality traits
- NO faces, NO text, NO photorealistic elements
- Think: emotional resonance > literal representation

Output: 1024x1024 abstract visualization
```

---

## Approval and Sign-off

**Document Owner**: PRD Specialist (Claude Code)

**Stakeholders**:
- Master Product Manager (Zephyr) - Strategic approval
- Backend Architect - Technical feasibility
- Frontend Developer - UI/UX feasibility
- Code Reviewer - Quality assurance
- Mobile UX Optimizer - Mobile experience validation

**Approval Status**: ⏳ Pending Review

**Next Steps**:
1. Review PRD with stakeholders
2. Refine prompt engineering (test 10 examples)
3. Break down into tasks
4. Assign to Sprint 16 (Q1 2026)
5. Begin Phase 1: Backend implementation
