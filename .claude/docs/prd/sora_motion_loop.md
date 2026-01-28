# Product Requirements Document: Sora Motion Loop + Carousel UX Fixes

**Version:** 1.0
**Date:** 2026-01-28
**Status:** Draft
**Owner:** PRD Specialist

---

## Executive Summary

### Problem Statement
Aura currently displays AI-generated visuals (Mood Board, Essence) and profile photos in a carousel, but suffers from three critical UX issues:
1. **Generate button placement**: Button is inside carousel overlay behind the profile name, making it unclickable
2. **Placeholder visibility**: Essence and Sora placeholders only appear after virtues_11 computation completes, creating delayed visual feedback
3. **Moodboard flicker**: Defensive Blob URL caching prevents clearing URLs when profile re-fetches, causing "?" image display

Additionally, users want a richer visual representation of matches through motion. Static images lack the dynamism to convey personality traits like energy, playfulness, or intensity.

### Solution Overview
1. **New Sora Motion Loop feature**: Add 3-second looping video carousel item generated via OpenAI Sora API (~$0.30 per generation)
2. **Contextual button UI**: Replace embedded button with single contextual button below carousel that changes based on carousel position
3. **Early placeholder display**: Show locked placeholders for Essence and Sora immediately when profile loads, not just after virtues_11 completes
4. **Stable Blob URL handling**: Ensure Moodboard images don't flicker when profile state updates

### Business Impact
- **User Value**: Richer, more engaging profile visualization with motion portraits
- **Engagement**: Increased time spent evaluating profiles due to compelling visuals
- **Differentiation**: Unique motion loop feature not available in competing dating analysis apps
- **Cost Control**: Manual trigger prevents uncontrolled spending (~$0.30 per video)
- **Revenue Opportunity**: Premium feature potential for future monetization

### Resource Requirements
- **Engineering**: 3-5 days implementation
  - 1 day: Sora API integration via Supabase Edge Function
  - 1 day: Database schema migration (soraVideo, soraPrompt fields)
  - 1 day: Contextual button UI refactor
  - 1 day: Video player component with looping support
  - 0.5 day: Early placeholder system
  - 0.5 day: Testing and QA
- **Design**: 1 day for motion loop prompt design, placeholder states, and button positioning
- **Infrastructure**: Supabase Edge Function deployment (Pro tier for 150s timeout)

### Risk Assessment
- **High Cost per Generation**: $0.30 per video (7.5x more than DALL-E). Mitigation: Manual trigger only, clear cost warning
- **Sora API Rate Limits**: OpenAI Sora may have strict rate limiting. Mitigation: Implement exponential backoff, queue system for retries
- **Large Video File Size**: Videos may be 2-5MB each. Mitigation: Use Blob storage, implement compression if needed
- **Browser Compatibility**: Video playback on iOS Safari requires specific attributes. Mitigation: Use `playsinline`, `muted`, `loop` attributes
- **Generation Time**: Sora may take 30-60 seconds per video. Mitigation: Clear loading state, allow navigation away without blocking

---

## Product Overview

### Product Vision
Aura provides the most visually rich, psychologically insightful dating profile analysis available. By combining AI-generated abstract essence imagery, lifestyle mood boards, and now dynamic motion portraits, users gain a multi-dimensional understanding of potential matches that static photos and text cannot convey.

### Target Users
- **Primary**: Dating app users (25-40 years old) analyzing match profiles
- **Secondary**: Users seeking deeper psychological insights beyond surface-level attraction

### Value Proposition
**For dating app users** who want to understand matches beyond surface photos, **Aura** is a profile analysis PWA **that** provides AI-generated visual representations of personality through abstract essence images, lifestyle mood boards, and motion portraits. **Unlike** basic screenshot analysis tools, **our product** creates a comprehensive visual identity system that reveals psychological depth and personality dynamics.

### Success Criteria
1. **Feature Adoption**: 40%+ of users generate at least one Sora motion loop within first week
2. **Engagement**: Average time on ProfileDetail page increases by 25%
3. **Cost Efficiency**: Average Sora generation cost per active user stays under $2.00/month
4. **UX Quality**: Zero reported issues with button unclickability or placeholder flicker
5. **Performance**: Sora video generation completes in under 60 seconds for 90% of requests

### Assumptions
- OpenAI Sora API is stable and production-ready by implementation date
- Current Supabase Pro tier timeout (150s) is sufficient for Sora generation
- Users understand and accept ~$0.30 cost for motion loop generation
- IndexedDB can efficiently store 2-5MB video Blobs per profile
- Mobile browsers (especially iOS Safari) support HTML5 video with autoplay muted + loop

---

## User Stories

### US-01: Generate Sora Motion Loop (Manual Trigger)
**As a** user analyzing a match profile
**I want** to generate a 3-second looping motion portrait after seeing their essence
**So that** I can visualize their personality through dynamic movement, not just static images

**Acceptance Criteria:**
- **Given** I am viewing a profile with virtues_11 computed
- **When** I swipe to the Sora locked placeholder in the carousel
- **Then** I see a teal/cyan gradient background with lock icon and "Motion portrait" teaser text
- **And** a "Generate Motion (~$0.30)" button appears below the carousel
- **When** I click the button
- **Then** button text changes to "Generating..." with animated icon
- **And** generation completes within 60 seconds
- **And** video automatically displays in carousel with looping playback
- **And** button disappears (no regeneration without explicit action)

**Priority:** P0 (Core feature)

---

### US-02: View Sora Motion Loop in Carousel
**As a** user viewing a profile with generated Sora video
**I want** the motion loop to play automatically when I swipe to it
**So that** I experience the dynamic personality visualization without manual interaction

**Acceptance Criteria:**
- **Given** profile has soraVideo Blob saved
- **When** I navigate to the profile
- **Then** carousel includes Sora item in position 3 (after Mood Board, Essence, before Photo)
- **And** Sora item displays teal "Motion" badge
- **When** I swipe to the Sora carousel position
- **Then** 3-second video plays automatically in loop
- **And** video is muted (no audio)
- **And** playback is smooth with no buffering (60fps target)
- **And** no button appears below carousel (already generated)

**Priority:** P0 (Core feature)

---

### US-03: Contextual Button Changes Based on Carousel Position
**As a** user navigating the profile carousel
**I want** a single button below the carousel that adapts to the current image
**So that** I always know what action is available and the button is always clickable

**Acceptance Criteria:**
- **Given** I am viewing the ProfileHeader carousel
- **When** I am on Mood Board position
- **Then** no button appears (auto-generated, no action needed)
- **When** I swipe to Essence locked placeholder
- **Then** "Generate Essence (~$0.04)" button appears below carousel
- **When** I swipe to Essence image (already generated)
- **Then** button disappears
- **When** I swipe to Sora locked placeholder
- **Then** "Generate Motion (~$0.30)" button appears below carousel
- **When** I swipe to Sora video (already generated)
- **Then** button disappears
- **When** I swipe to Photo
- **Then** button disappears
- **And** button is always positioned between carousel and job/school tags
- **And** button is never obscured by carousel overlay elements

**Priority:** P0 (Core UX fix)

---

### US-04: Early Placeholder Display
**As a** user uploading a new profile for analysis
**I want** to see locked Essence and Sora placeholders immediately
**So that** I understand these features exist and will unlock after analysis completes

**Acceptance Criteria:**
- **Given** I just saved a new profile (virtues_11 does NOT exist yet)
- **When** I navigate to ProfileDetail
- **Then** carousel shows: [Mood Board OR placeholder], [Essence locked placeholder], [Sora locked placeholder], [Photo]
- **And** Essence locked placeholder shows "Analyze to unlock" text (no virtue sentence yet)
- **And** Sora locked placeholder shows "Motion portrait" text
- **When** I swipe to either locked placeholder
- **Then** no button appears (virtues_11 required first)
- **When** virtues_11 computation completes
- **Then** Essence placeholder updates to show virtue sentence
- **And** "Generate Essence (~$0.04)" button appears when on Essence placeholder
- **And** "Generate Motion (~$0.30)" button appears when on Sora placeholder

**Priority:** P1 (Enhances feature discovery)

---

### US-05: No Moodboard Flicker on Profile Refetch
**As a** user viewing a profile with generated mood board
**I want** the mood board image to remain stable when profile data refreshes
**So that** I don't see confusing "?" placeholders or image flicker

**Acceptance Criteria:**
- **Given** profile has moodboardImage Blob saved
- **When** ProfileHeader component re-renders due to profile object reference change
- **Then** Blob URL is cached in ref and not cleared
- **And** image displays continuously without flicker or "?" placeholder
- **And** only on unmount should URL be revoked (not on re-render)

**Priority:** P1 (Quality of life fix)

---

### US-06: Sora Generation Error Handling
**As a** user attempting to generate a motion loop
**I want** clear feedback when generation fails
**So that** I understand what went wrong and can retry if appropriate

**Acceptance Criteria:**
- **Given** I click "Generate Motion (~$0.30)"
- **When** Sora API returns an error (rate limit, timeout, invalid prompt)
- **Then** button reverts to "Generate Motion (~$0.30)" state
- **And** error alert displays: "Failed to generate motion: [error message]. Please try again."
- **And** error is logged to inferenceHistory with success=false, errorType field
- **When** generation times out after 150 seconds
- **Then** error message: "Generation timed out. Please try again later."
- **And** no partial video is saved to database

**Priority:** P1 (Robustness)

---

## Functional Requirements

### FR-01: Sora API Integration via Supabase Edge Function
**Description:** Create a new Supabase Edge Function `sora-proxy` that accepts a prompt and returns a base64-encoded video.

**Details:**
- **Endpoint:** `POST /functions/v1/sora-proxy`
- **Request body:**
  ```json
  {
    "prompt": "Abstract motion portrait: [virtue-based description]",
    "duration": 3,
    "resolution": "1080x1920" // Portrait orientation for mobile
  }
  ```
- **Response body (success):**
  ```json
  {
    "success": true,
    "video": "<base64-encoded-mp4>",
    "revised_prompt": "Sora's interpretation of prompt"
  }
  ```
- **Response body (failure):**
  ```json
  {
    "success": false,
    "error": {
      "message": "Rate limit exceeded",
      "type": "rate_limit_error"
    }
  }
  ```
- **Timeout:** 150 seconds (Supabase Pro tier)
- **Security:** Supabase anon key authentication, API key stored server-side
- **Pattern:** Follow existing `dalle-proxy` architecture

**Dependencies:** OpenAI Sora API access

---

### FR-02: Sora Prompt Builder
**Description:** Create a prompt generation system that converts 11 Virtues scores into cinematic motion portrait prompts.

**Details:**
- **Location:** `src/lib/sora/promptBuilder.ts`
- **Function signature:**
  ```typescript
  export function buildSoraPrompt(
    virtueScores: VirtueScore11[],
    virtueSentence?: string
  ): string
  ```
- **Prompt structure:**
  - Opening: "Create a 3-second looping abstract motion portrait"
  - Virtue mapping: High scores → fast/bright/expansive motion; Low scores → slow/muted/contained motion
  - Style directives: "Cinematic, ethereal, non-representational"
  - Loop constraint: "Seamless loop, first frame = last frame"
- **Example output:**
  ```
  Create a 3-second looping abstract motion portrait. High intellectual curiosity: swirling particles of light, expanding fractals. Radiant warmth: golden hues, gentle pulsing glow. Moderate adventure: steady forward drift. Low intensity: slow, deliberate movements. Style: Cinematic, ethereal, non-representational. Seamless loop.
  ```

**Dependencies:** `src/lib/virtues/virtues.ts` for virtue definitions

---

### FR-03: Sora Client Library
**Description:** TypeScript client for calling the Sora Edge Function, mirroring `dalleClient.ts` pattern.

**Details:**
- **Location:** `src/lib/sora/soraClient.ts`
- **Functions:**
  - `generateVideo(prompt, options): Promise<SoraGenerationResult>`
  - `base64ToVideoBlob(base64, mimeType): Blob`
- **Types:**
  ```typescript
  interface SoraGenerationResult {
    success: boolean;
    video?: string; // base64 encoded MP4
    revised_prompt?: string;
    error?: string;
  }
  ```
- **Error handling:** Catch network errors, timeouts, invalid responses
- **Logging:** Console logs for debugging, inference logging for cost tracking

**Dependencies:** Supabase Edge Function `sora-proxy`

---

### FR-04: Sora Generator Orchestration
**Description:** High-level function to generate and save Sora video to profile, following `essenceGenerator.ts` pattern.

**Details:**
- **Location:** `src/lib/sora/soraGenerator.ts`
- **Functions:**
  - `generateProfileSoraVideo(profile): Promise<SoraGenerationResult>`
  - `generateAndSaveSoraVideo(profileId, retries): Promise<SoraGenerationResult>`
- **Flow:**
  1. Validate virtues_11 exists
  2. Build Sora prompt from virtues + virtue sentence
  3. Call `soraClient.generateVideo()`
  4. Convert base64 to Blob
  5. Save to `db.profiles.update({ soraVideo, soraPrompt })`
  6. Log inference (cost, model, feature, success)
- **Cost tracking:**
  - Estimated cost: $0.30 per video
  - Feature tag: `sora_motion_generation`
  - Model: `sora-1.0`
- **Retry logic:** 1 retry with 2-second delay on failure

**Dependencies:** `soraClient.ts`, `db.ts`, `inference.ts`

---

### FR-05: Database Schema Migration (Version 17)
**Description:** Add `soraVideo` and `soraPrompt` fields to `profiles` table.

**Details:**
- **Location:** `src/lib/db.ts`
- **New fields in Profile interface:**
  ```typescript
  interface Profile {
    // ... existing fields
    soraVideo?: Blob;        // AI-generated 3-second motion loop via Sora
    soraPrompt?: string;     // Prompt used for generation (debugging/regeneration)
  }
  ```
- **Migration version:** `db.version(17)`
- **Upgrade logic:**
  ```typescript
  db.version(17).stores({
    profiles: '++id, name, appName, timestamp, analysisPhase, serverId',
    // ... other tables
  });
  // No upgrade function needed - fields start as undefined
  ```

**Dependencies:** Dexie schema versioning system

---

### FR-06: Contextual Button Component
**Description:** New component that renders a single button below the carousel, changing text/action based on current carousel position.

**Details:**
- **Location:** `src/components/profileDetail/ContextualGenerateButton.tsx`
- **Props:**
  ```typescript
  interface ContextualGenerateButtonProps {
    carouselPosition: 'moodboard' | 'essence-locked' | 'essence' | 'sora-locked' | 'sora' | 'photo';
    isGeneratingEssence: boolean;
    isGeneratingSora: boolean;
    onGenerateEssence: () => void;
    onGenerateSora: () => void;
  }
  ```
- **Rendering logic:**
  - `moodboard` → null (hidden)
  - `essence-locked` → "Generate Essence (~$0.04)" button
  - `essence` → null (hidden)
  - `sora-locked` → "Generate Motion (~$0.30)" button
  - `sora` → null (hidden)
  - `photo` → null (hidden)
- **Styling:**
  - Position: Below carousel, above job/school tags
  - Classes: `px-6 py-3 bg-gradient-to-r rounded-full font-medium shadow-lg transition-all`
  - Essence: Purple gradient (`from-purple-600 to-purple-500`)
  - Sora: Teal gradient (`from-teal-600 to-cyan-500`)
- **Loading states:**
  - Disabled state while generating
  - Spinner icon + "Generating..." text

**Dependencies:** `Sparkles`, `Film` icons from lucide-react

---

### FR-07: Sora Locked Placeholder Component
**Description:** Visual placeholder for Sora motion loop before generation, similar to `EssencePlaceholder.tsx`.

**Details:**
- **Location:** `src/components/profileDetail/SoraPlaceholder.tsx`
- **Visual design:**
  - Gradient: Teal to cyan (`bg-gradient-to-br from-teal-600 via-cyan-700 to-cyan-900`)
  - Icon: Film or Play icon (40px, 80% opacity)
  - Text: "Motion portrait" (text-sm, 70% opacity)
  - Lock icon: Displayed in top-right corner
- **Props:**
  ```typescript
  interface SoraPlaceholderProps {
    hasVirtues: boolean; // Show "Analyze to unlock" if false
  }
  ```
- **Conditional text:**
  - `hasVirtues=true`: "Motion portrait"
  - `hasVirtues=false`: "Complete analysis to unlock"

**Dependencies:** `Lock`, `Film` icons from lucide-react

---

### FR-08: Video Player Component
**Description:** HTML5 video player component with autoplay, muted, loop, and mobile-optimized attributes.

**Details:**
- **Location:** Inline in `ProfileHeader.tsx` (not separate component due to simplicity)
- **Video element attributes:**
  ```tsx
  <video
    src={videoUrl}
    autoPlay
    muted
    loop
    playsInline
    controls={false}
    className="w-full h-full object-cover"
  />
  ```
- **Blob URL management:**
  - Create Object URL on mount when `profile.soraVideo` exists
  - Store URL in ref to prevent re-creation on re-render
  - Revoke URL only on unmount
- **Fallback:**
  - If video fails to load, display error message: "Video unavailable"

**Dependencies:** Native HTML5 video

---

### FR-09: ProfileHeader Carousel Refactor
**Description:** Update `ProfileHeader.tsx` to include Sora in carousel order and remove embedded button.

**Details:**
- **New carousel order:**
  1. Mood Board (if exists) - amber badge "Lifestyle"
  2. Essence (if exists) OR Essence locked placeholder - purple badge
  3. Sora (if exists) OR Sora locked placeholder - teal badge "Motion"
  4. Photo (if exists) - no badge
- **Changes to `images` array construction:**
  ```typescript
  const images: CarouselImage[] = [];

  // Mood Board
  if (moodboardImageUrl) {
    images.push({ src: moodboardImageUrl, label: 'Lifestyle', type: 'moodboard' });
  }

  // Essence
  if (essenceImageUrl) {
    images.push({ src: essenceImageUrl, label: 'Essence', type: 'essence' });
  } else {
    images.push({ label: 'Essence', type: 'essence-locked', virtueSentence: profile.virtueSentence });
  }

  // Sora (NEW)
  if (soraVideoUrl) {
    images.push({ src: soraVideoUrl, label: 'Motion', type: 'sora' });
  } else {
    images.push({ label: 'Motion', type: 'sora-locked' });
  }

  // Photo
  if (thumbnailUrl) {
    images.push({ src: thumbnailUrl, label: 'Photo', type: 'photo' });
  }
  ```
- **Remove embedded generate button:** Delete button from inside carousel overlay (lines 169-183 in current code)
- **New props:**
  ```typescript
  interface ProfileHeaderProps {
    profile: Profile;
    basics: ProfileBasics;
    isGeneratingEssence?: boolean;
    isGeneratingSora?: boolean; // NEW
    onGenerateEssence?: () => void;
    onGenerateSora?: () => void; // NEW
    currentCarouselIndex: number; // NEW - for contextual button
  }
  ```

**Dependencies:** `ContextualGenerateButton`, `SoraPlaceholder`

---

### FR-10: ProfileDetail Page Integration
**Description:** Update `ProfileDetail.tsx` to orchestrate Sora generation and pass props to ProfileHeader.

**Details:**
- **New state:**
  ```typescript
  const [isGeneratingSora, setIsGeneratingSora] = useState(false);
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  ```
- **New handler:**
  ```typescript
  const handleGenerateSora = useCallback(async () => {
    if (!profile?.id) return;

    setIsGeneratingSora(true);
    try {
      // Ensure virtues_11 is saved first
      if (compatibilityScores.virtues11) {
        await db.profiles.update(profile.id, {
          virtues_11: compatibilityScores.virtues11,
        });
      }

      const result = await generateAndSaveSoraVideo(profile.id);
      if (result.success) {
        console.log('[ProfileDetail] Sora video generated successfully');
      } else {
        console.error('[ProfileDetail] Sora generation failed:', result.error);
        alert(`Failed to generate motion: ${result.error}`);
      }
    } catch (err) {
      console.error('[ProfileDetail] Sora generation error:', err);
      alert('Failed to generate motion video. Please try again.');
    } finally {
      setIsGeneratingSora(false);
    }
  }, [profile?.id, compatibilityScores.virtues11]);
  ```
- **Updated ProfileHeader call:**
  ```tsx
  <ProfileHeader
    profile={profile}
    basics={basics}
    isGeneratingEssence={isGeneratingEssence}
    isGeneratingSora={isGeneratingSora}
    onGenerateEssence={handleGenerateEssence}
    onGenerateSora={handleGenerateSora}
    currentCarouselIndex={currentCarouselIndex}
  />
  ```
- **Carousel index tracking:** ProfileHeader must expose `onCarouselChange` callback to sync index with parent

**Dependencies:** `generateAndSaveSoraVideo` from `src/lib/sora/soraGenerator.ts`

---

### FR-11: Early Placeholder Display Logic
**Description:** Show Essence and Sora locked placeholders immediately, even before virtues_11 exists.

**Details:**
- **Current behavior:** Essence placeholder only appears when `profile.virtueSentence` exists
- **New behavior:** Essence and Sora placeholders ALWAYS appear, with conditional text:
  - **Before virtues_11:** "Analyze to unlock" (no virtue sentence yet)
  - **After virtues_11:** Show virtue sentence + enable generate button
- **Implementation in ProfileHeader:**
  ```typescript
  // ALWAYS show Essence placeholder if no image
  if (essenceImageUrl) {
    images.push({ src: essenceImageUrl, label: 'Essence', type: 'essence' });
  } else {
    images.push({
      label: 'Essence',
      type: 'essence-locked',
      virtueSentence: profile.virtueSentence, // may be undefined
      hasVirtues: !!profile.virtues_11, // NEW
    });
  }

  // ALWAYS show Sora placeholder if no video
  if (soraVideoUrl) {
    images.push({ src: soraVideoUrl, label: 'Motion', type: 'sora' });
  } else {
    images.push({
      label: 'Motion',
      type: 'sora-locked',
      hasVirtues: !!profile.virtues_11, // NEW
    });
  }
  ```
- **ContextualGenerateButton logic:**
  - Only render button if `hasVirtues=true` AND on locked placeholder

**Dependencies:** None (pure logic change)

---

### FR-12: Inference Logging for Sora
**Description:** Track Sora API usage in `inferenceHistory` table for cost monitoring.

**Details:**
- **Function:** `logInference()` from `src/lib/inference.ts`
- **Fields:**
  ```typescript
  {
    inputTokens: 0, // N/A for video generation
    outputTokens: 0,
    estimatedCostUsd: 0.30, // Fixed cost per video
    model: 'sora-1.0',
    feature: 'sora_motion_generation',
    page: '/profile-detail',
    profileId: number,
    success: boolean,
    errorType?: string, // 'rate_limit_error' | 'timeout' | 'api_error'
  }
  ```
- **Call location:** Inside `soraGenerator.ts` after API call completes

**Dependencies:** Existing `inferenceHistory` table from db version 13

---

## Non-Functional Requirements

### NFR-01: Performance
- **Sora generation time:** 90th percentile < 60 seconds
- **Video playback:** Smooth 60fps loop with no buffering
- **Carousel swipe latency:** < 100ms response time
- **IndexedDB write time:** < 500ms for video Blob save
- **Page load time:** < 2 seconds for ProfileDetail with existing Sora video

### NFR-02: Security
- **API key protection:** OpenAI Sora API key stored server-side in Supabase Edge Function, never exposed to client
- **Authentication:** Supabase anon key required for Edge Function calls
- **Input validation:** Prompt length limited to 1000 characters, sanitized for injection attacks
- **Rate limiting:** Respect OpenAI Sora rate limits (TBD based on API tier)

### NFR-03: Usability
- **Cost transparency:** Button text always shows cost estimate (~$0.30)
- **Loading feedback:** Clear spinner + "Generating..." text during 30-60s generation
- **Error messages:** Human-readable error explanations with actionable next steps
- **Accessibility:** Video has `aria-label="Motion portrait"`, placeholders have descriptive text
- **Mobile optimization:** Touch-friendly button size (min 44x44px), portrait video aspect ratio

### NFR-04: Reliability
- **Error handling:** Graceful fallback if Sora API unavailable (locked placeholder remains, error alert shown)
- **Retry logic:** 1 automatic retry with exponential backoff on transient failures
- **Blob storage integrity:** Verify video Blob saves correctly to IndexedDB before marking success
- **Video validation:** Check video duration = 3 seconds ± 0.5s, file size < 10MB

### NFR-05: Scalability
- **Storage efficiency:** Video Blobs stored directly in IndexedDB (no double storage)
- **Blob URL lifecycle:** Object URLs properly revoked on unmount to prevent memory leaks
- **Concurrent generation:** Support multiple profiles generating Sora videos simultaneously (separate loading states)
- **Database schema:** Migration system allows future fields without breaking existing data

### NFR-06: Maintainability
- **Code organization:** Sora system isolated in `src/lib/sora/` directory (promptBuilder, soraClient, soraGenerator)
- **Pattern consistency:** Follow existing Essence and Moodboard architecture for predictable codebase
- **Logging:** Comprehensive console logs for debugging generation failures
- **Type safety:** Full TypeScript types for all Sora-related interfaces
- **Documentation:** Inline comments for non-obvious Blob URL caching logic

---

## Technical Considerations

### Architecture Overview
```
User Action (Button Click)
    ↓
ProfileDetail.handleGenerateSora()
    ↓
soraGenerator.generateAndSaveSoraVideo()
    ↓
soraClient.generateVideo() → Supabase Edge Function `sora-proxy`
    ↓
OpenAI Sora API (30-60s generation)
    ↓
Base64 video → Blob conversion
    ↓
db.profiles.update({ soraVideo, soraPrompt })
    ↓
ProfileHeader re-renders with soraVideoUrl
    ↓
Video autoplay loop in carousel
```

### Technology Stack
- **Frontend:** React 19, TypeScript, Dexie.js (IndexedDB)
- **API:** OpenAI Sora API (via Supabase Edge Function proxy)
- **Database:** IndexedDB (Dexie) for Blob storage
- **Infrastructure:** Supabase Edge Functions (Pro tier, 150s timeout)
- **Video format:** MP4 (H.264 codec), portrait orientation (1080x1920)

### Data Model
**Profile table (Dexie schema):**
```typescript
interface Profile {
  // ... existing fields
  virtues_11?: MatchVirtueCompatibility;
  virtueSentence?: string;
  essenceImage?: Blob;
  essencePrompt?: string;
  moodboardImage?: Blob;
  moodboardPrompt?: string;

  // NEW fields
  soraVideo?: Blob;        // 3-second looping video, ~2-5MB
  soraPrompt?: string;     // Prompt used for generation
}
```

**Migration:**
- Version 17: Add `soraVideo` and `soraPrompt` fields (no upgrade logic needed, fields start undefined)

### Integration Requirements
1. **OpenAI Sora API:** Requires API key with Sora access (currently limited beta)
2. **Supabase Edge Function:** Deploy `sora-proxy` function to `/functions/v1/sora-proxy`
3. **Environment Variables:** Add `OPENAI_SORA_API_KEY` to Supabase Edge Function secrets
4. **Mobile Browser Support:** iOS Safari 15+, Chrome Android 90+, Edge Android 90+

### Video Storage Considerations
- **File size:** Sora videos estimated 2-5MB per 3-second loop at 1080p
- **Storage limit:** IndexedDB quota varies by browser (50MB-2GB typical), monitor via `navigator.storage.estimate()`
- **Compression:** If videos exceed 5MB, consider client-side compression via `ffmpeg.wasm`
- **Cleanup:** Implement optional "Delete Motion" button in future to reclaim storage

### Prompt Engineering
**Virtue to Motion Mapping:**
| Virtue | High Score (7-10) | Low Score (1-3) |
|--------|-------------------|-----------------|
| Intellectual Curiosity | Swirling particles, expanding fractals | Static geometric patterns |
| Emotional Warmth | Golden hues, gentle pulsing glow | Cool blues, minimal motion |
| Adventure Seeking | Fast zoom, dynamic transitions | Slow drift, steady movement |
| Intensity | High contrast, rapid shifts | Muted tones, gradual fades |
| Presence | Centered forms, strong focal point | Dispersed elements, peripheral motion |
| Communicative Openness | Flowing waves, interconnected shapes | Isolated forms, minimal interaction |
| Playfulness | Bouncy, erratic motion | Serious, deliberate motion |
| Collaboration | Converging elements, synchronized motion | Independent elements, asynchronous motion |
| Depth | Layered, three-dimensional space | Flat, two-dimensional plane |
| Sensuality | Smooth curves, fluid transitions | Sharp angles, abrupt cuts |
| Confidence | Bold, assertive movements | Hesitant, tentative movements |

**Example Prompt:**
```
Create a 3-second looping abstract motion portrait. High intellectual curiosity (9/10): rapidly swirling particles of light forming expanding fractals. Radiant emotional warmth (8/10): golden and amber hues with gentle pulsing glow. Moderate adventure seeking (5/10): steady forward drift. Low intensity (3/10): slow, deliberate movements with muted tones. Style: Cinematic, ethereal, non-representational, dreamlike. Technical: Seamless loop, first frame matches last frame, 60fps, portrait aspect ratio.
```

### Error Scenarios
| Error Type | Cause | User Message | Recovery |
|------------|-------|--------------|----------|
| Rate limit | Too many requests | "Generation limit reached. Try again in 1 hour." | Retry after cooldown |
| Timeout | Generation > 150s | "Generation timed out. Try again later." | Retry (may succeed) |
| API error | Invalid prompt | "Failed to generate: Invalid request." | Check prompt, retry |
| Network error | No internet | "Network error. Check connection." | Retry when online |
| Blob save error | IndexedDB failure | "Failed to save video. Storage full?" | Clear space, retry |

### iOS Safari Considerations
**Video attributes required:**
- `autoPlay` - Start playing without user interaction (requires `muted`)
- `muted` - No audio (iOS blocks autoplay with sound)
- `loop` - Seamless repeat
- `playsInline` - Prevent fullscreen takeover
- `controls={false}` - Hide native controls

**Example:**
```tsx
<video
  src={videoUrl}
  autoPlay
  muted
  loop
  playsInline
  controls={false}
  className="w-full h-full object-cover"
  aria-label="Motion portrait"
/>
```

---

## UI/UX Specifications

### Carousel Order and Badges
**Final carousel order:**
1. **Mood Board** - Amber badge "Lifestyle", auto-generated after chunk 3
2. **Essence** - Purple badge "Essence", manual trigger (~$0.04)
3. **Sora** - Teal badge "Motion", manual trigger (~$0.30)
4. **Photo** - No badge, original thumbnail

**Badge styling:**
- Position: Top-right corner of carousel image
- Size: `px-3 py-1.5`, font-size `text-sm`
- Colors:
  - Mood Board: `bg-amber-500/90`
  - Essence: `bg-purple-500/90`
  - Sora: `bg-teal-500/90`
- Icon: 14px size, 1.5 gap from text

### Locked Placeholder States
**Essence Locked Placeholder:**
- Gradient: `bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900`
- Icon: Lock (40px, 80% opacity) centered
- Text (center):
  - Line 1: `"{virtueSentence}"` (text-lg, font-medium) OR "Complete analysis to unlock" if no virtues
  - Line 2: "Generate to reveal abstract essence" (text-sm, 70% opacity)
- Badge: `bg-purple-500/60` with lock icon

**Sora Locked Placeholder:**
- Gradient: `bg-gradient-to-br from-teal-600 via-cyan-700 to-cyan-900`
- Icon: Film (40px, 80% opacity) centered
- Text (center):
  - Line 1: "Motion portrait" (text-lg, font-medium) OR "Complete analysis to unlock" if no virtues
  - Line 2: "Dynamic personality visualization" (text-sm, 70% opacity)
- Badge: `bg-teal-500/60` with lock icon

### Contextual Button Design
**Button position:**
- Below carousel (16px gap)
- Above job/school tags section (16px gap)
- Horizontally centered
- Width: Auto with padding `px-6 py-3`

**Button variants:**
| Carousel Position | Button Text | Gradient | Icon |
|-------------------|-------------|----------|------|
| Mood Board | (hidden) | N/A | N/A |
| Essence locked (with virtues) | "Generate Essence (~$0.04)" | `from-purple-600 to-purple-500` | Sparkles |
| Essence locked (no virtues) | (hidden) | N/A | N/A |
| Essence | (hidden) | N/A | N/A |
| Sora locked (with virtues) | "Generate Motion (~$0.30)" | `from-teal-600 to-cyan-500` | Film |
| Sora locked (no virtues) | (hidden) | N/A | N/A |
| Sora | (hidden) | N/A | N/A |
| Photo | (hidden) | N/A | N/A |

**Loading state:**
- Button disabled: `disabled:opacity-50 disabled:cursor-not-allowed`
- Text: "Generating..." with animated spinner icon
- Icon animates with `animate-pulse` class

**Button transitions:**
- Fade in/out: `transition-all duration-300`
- Smooth color transition when changing carousel position

### Video Playback States
**Loading state (before video ready):**
- Show Sora locked placeholder
- No skeleton loader (placeholder is sufficient)

**Playing state:**
- Autoplay starts immediately when carousel swipes to Sora
- No user interaction required
- No visible controls
- Smooth loop (3 seconds)

**Error state:**
- If video fails to load, show error message overlay:
  - Text: "Video unavailable"
  - Background: `bg-slate-900/80`
  - Center aligned

### Mobile Optimization
**Touch targets:**
- Button min height: 44px (iOS Human Interface Guidelines)
- Carousel swipe threshold: 50px horizontal drag
- Dot indicators: 8px diameter, 16px touch target

**Responsive design:**
- Portrait video fills carousel height (256px)
- Button text truncates on small screens: "Generate (~$0.30)"
- Badge text responsive: full text on 375px+ width

**Loading indicators:**
- Spinner size: 16px (inside button)
- Animation: `animate-pulse` for smooth, non-jarring effect

### Accessibility
- **ARIA labels:**
  - Video: `aria-label="Motion portrait"`
  - Button: `aria-label="Generate motion portrait for {profile.name}"`
  - Locked placeholder: `aria-label="Motion portrait locked, complete analysis to unlock"`
- **Keyboard navigation:**
  - Button focusable via Tab key
  - Enter/Space triggers generation
- **Screen reader announcements:**
  - "Generating motion portrait" when loading starts
  - "Motion portrait generated" on success
  - Error message read aloud on failure

---

## Success Metrics

### Primary Metrics (P0)
1. **Feature Adoption Rate:** 40%+ of active users generate at least one Sora motion loop within first week of launch
2. **Engagement Time:** Average time on ProfileDetail page increases by 25% (from ~45s to ~56s baseline)
3. **Generation Success Rate:** 95%+ of Sora generation attempts complete successfully without errors
4. **Cost Efficiency:** Average Sora spend per active user < $2.00/month (6-7 generations/user/month)

### Secondary Metrics (P1)
5. **UX Quality:** Zero reported issues with button unclickability or carousel navigation blocking
6. **Performance:** 90th percentile Sora generation time < 60 seconds
7. **Retention:** Users who generate Sora videos have 15% higher 7-day retention vs. non-generators
8. **Placeholder Discovery:** 80%+ of new users see locked placeholders before virtues_11 completes (validates early placeholder display)

### Technical Metrics (P2)
9. **Error Rate:** < 5% of Sora API calls fail (rate limits, timeouts, API errors)
10. **Video Playback Errors:** < 2% of loaded videos fail to play (codec issues, storage corruption)
11. **Storage Impact:** Average IndexedDB usage increase < 15MB per active user (3 profiles × 5MB/video)
12. **Mobile Compatibility:** 98%+ success rate on iOS Safari 15+, Chrome Android 90+

### Measurement Plan
- **Analytics events:**
  - `sora_generate_clicked` (profileId, hasVirtues)
  - `sora_generation_completed` (profileId, duration, success, errorType)
  - `sora_video_viewed` (profileId, viewDuration)
  - `carousel_position_changed` (from, to)
- **Inference logging:** All Sora API calls logged to `inferenceHistory` table with cost, model, success
- **A/B testing:** Compare engagement metrics for users with Sora access vs. control group (first 2 weeks)

---

## Risks and Mitigations

### Risk 1: High Cost per Generation ($0.30)
**Likelihood:** High | **Impact:** High
**Description:** Users may generate videos excessively, leading to unexpected costs.

**Mitigation:**
- **Manual trigger only:** No auto-generation, user must explicitly click button
- **Cost transparency:** Button text always shows "~$0.30" estimate
- **Usage monitoring:** Track per-user generation count, implement soft cap (e.g., 10/day) if needed
- **Future monetization:** Convert to premium feature if costs become unsustainable

---

### Risk 2: Sora API Rate Limits
**Likelihood:** Medium | **Impact:** High
**Description:** OpenAI Sora may have strict rate limits, causing frequent generation failures.

**Mitigation:**
- **Exponential backoff:** Retry with 2s, 4s, 8s delays on rate limit errors
- **Queue system:** If rate limits common, implement client-side queue with staggered requests
- **User feedback:** Clear error message: "Generation limit reached. Try again in X minutes."
- **Fallback:** Locked placeholder remains, user can retry later

---

### Risk 3: Large Video File Size (2-5MB each)
**Likelihood:** Medium | **Impact:** Medium
**Description:** Videos consume significant IndexedDB storage, potentially hitting quota limits.

**Mitigation:**
- **Compression:** Evaluate `ffmpeg.wasm` for client-side video compression (target 1-2MB)
- **Storage monitoring:** Check `navigator.storage.estimate()` before saving, warn if < 50MB free
- **Cleanup UI:** Add "Delete Motion" option in future to reclaim space
- **Progressive loading:** Don't preload all profile videos, only load when carousel reaches Sora position

---

### Risk 4: Long Generation Time (30-60s)
**Likelihood:** High | **Impact:** Medium
**Description:** Users may abandon page during long generation, losing context or causing incomplete saves.

**Mitigation:**
- **Clear loading state:** "Generating..." text with animated spinner
- **Allow navigation:** User can leave ProfileDetail page, video saves in background
- **Background task UI:** Show toast notification when generation completes (future enhancement)
- **Retry mechanism:** If user closes page mid-generation, allow re-trigger without duplicate cost

---

### Risk 5: iOS Safari Video Playback Issues
**Likelihood:** Medium | **Impact:** High
**Description:** iOS Safari has strict autoplay policies and may block video or force fullscreen.

**Mitigation:**
- **Required attributes:** `autoPlay`, `muted`, `loop`, `playsInline`, `controls={false}`
- **Testing:** Extensive QA on iOS 15, 16, 17 (Safari and Chrome)
- **Fallback:** If autoplay fails, show "Tap to play" overlay
- **Video format:** Use H.264 codec (widely supported) instead of VP9 or AV1

---

### Risk 6: Prompt Quality Varies by Profile
**Likelihood:** Medium | **Impact:** Medium
**Description:** Some virtue profiles may generate poor prompts, leading to low-quality videos.

**Mitigation:**
- **Prompt testing:** Manual review of 50+ generated prompts before launch
- **Prompt refinement:** Iterate on virtue-to-motion mapping based on user feedback
- **Fallback prompt:** If all virtues are mid-range (4-6), use generic "balanced personality" prompt
- **Regeneration option:** Add "Regenerate Motion" button in future if video quality is poor

---

### Risk 7: Moodboard Flicker Still Occurs
**Likelihood:** Low | **Impact:** Medium
**Description:** Defensive Blob URL caching may not fully resolve flicker if profile object deeply changes.

**Mitigation:**
- **Ref-based caching:** Store Blob URL in ref, only recreate if Blob instance changes
- **Unmount-only cleanup:** Revoke URLs only on component unmount, not on re-render
- **Testing:** Test with rapid profile state updates (e.g., virtues_11 save) to validate stability
- **Logging:** Add console logs for Blob URL lifecycle to debug any remaining flicker

---

## Dependencies and Constraints

### External Dependencies
- **OpenAI Sora API:** Currently in limited beta, may require waitlist approval
- **Supabase Pro tier:** Required for 150-second Edge Function timeout (Free tier = 60s, insufficient)
- **Browser support:** iOS Safari 15+, Chrome 90+, Edge 90+ (older browsers may not support H.264 autoplay)

### Technical Constraints
- **Video format:** MP4/H.264 only (Sora default output), no VP9 or AV1 due to browser compatibility
- **Video duration:** Fixed 3 seconds (Sora minimum, cannot be shorter)
- **Resolution:** 1080x1920 portrait (mobile-optimized, cannot be landscape)
- **IndexedDB quota:** Varies by browser (50MB-2GB), must monitor storage usage

### Timeline Constraints
- **Sora API access:** Requires approval from OpenAI, may take 1-2 weeks
- **Edge Function deployment:** Requires Supabase Pro tier subscription active
- **Testing time:** Allow 2 days for cross-device QA (iOS, Android, desktop)

---

## Open Questions

1. **Sora API access:** Do we have confirmed access to Sora API, or still on waitlist?
2. **Video resolution:** Should we support landscape (1920x1080) in addition to portrait, or portrait-only?
3. **Regeneration:** Should we add "Regenerate Motion" button if user dislikes the video, or one-time generation only?
4. **Cost cap:** Should we implement hard cap (e.g., 10 Sora generations per user per month) or soft monitoring only?
5. **Video compression:** Should we compress videos client-side with `ffmpeg.wasm` (adds 2MB bundle size) or accept 2-5MB raw videos?
6. **Fallback prompt:** If virtues_11 is missing or all mid-range (4-6 scores), should we generate default video or disable Sora entirely?
7. **Background generation:** Should Sora generation continue in background if user navigates away, or cancel/queue for later?
8. **Sync strategy:** For future Supabase sync, should videos upload to Storage bucket or stay local-only?

---

## Appendix

### Relevant Files for Implementation
- **Database:** `src/lib/db.ts` - Add soraVideo/soraPrompt fields, version 17 migration
- **Sora API:** `src/lib/sora/soraClient.ts` - API client for Edge Function
- **Prompt builder:** `src/lib/sora/promptBuilder.ts` - Virtue-to-motion mapping
- **Generator:** `src/lib/sora/soraGenerator.ts` - Orchestration and saving
- **Edge Function:** `supabase/functions/sora-proxy/index.ts` - New Edge Function (create)
- **Header component:** `src/components/profileDetail/ProfileHeader.tsx` - Carousel refactor
- **Button component:** `src/components/profileDetail/ContextualGenerateButton.tsx` - New component
- **Placeholder:** `src/components/profileDetail/SoraPlaceholder.tsx` - New component
- **Page:** `src/pages/ProfileDetail.tsx` - Orchestration logic

### Existing Patterns to Follow
- **DALL-E integration:** `src/lib/essence/dalleClient.ts` - API client pattern
- **Essence generation:** `src/lib/essence/essenceGenerator.ts` - Generator pattern
- **Moodboard generation:** `src/lib/moodboard/moodboardGenerator.ts` - Trigger after chunk 3
- **Blob URL management:** `ProfileHeader.tsx` lines 36-77 - Ref-based caching
- **Inference logging:** `src/lib/inference/index.ts` - Cost tracking

### Future Enhancements (Out of Scope)
- Landscape video support (1920x1080 for desktop users)
- "Regenerate Motion" button with revised prompt
- Background generation with toast notifications
- Client-side video compression (`ffmpeg.wasm`)
- Storage quota monitoring UI with cleanup options
- Supabase Storage sync for videos (cross-device access)
- A/B test: Autoplay Sora on profile load vs. manual trigger only

---

**End of PRD**

---
[timestamp] 2026-01-28 15:30 PST
