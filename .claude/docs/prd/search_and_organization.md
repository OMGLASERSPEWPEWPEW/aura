# Product Requirements Document: Profile Search & Organization System

**Document Version:** 1.0
**Last Updated:** 2026-01-28
**Author:** PRD Specialist (via Claude Code)
**Status:** Ready for Implementation

---

## Executive Summary

### Problem Statement

Aura users with 10+ analyzed profiles have no way to find, filter, or organize their matches. This creates a frustrating experience where users must scroll through their entire gallery to find someone they analyzed weeks ago. The absence of search, filters, and organization tools is a **table stakes feature gap** that blocks power users and makes the app feel incomplete.

**Current Pain Points:**
- No way to search for a profile by name
- No ability to filter by dating app (Hinge, Tinder, Bumble)
- No sorting options beyond reverse chronological order
- No favorites/bookmarks for high-priority matches
- No custom tags to track status ("Met IRL", "Second date", "Pass")
- Users report spending 2-3 minutes scrolling to find a specific profile

### Solution Overview

Implement a comprehensive **Search & Organization System** in three phases:

- **Phase A - Basic Search** (1 day): Real-time name search with clear button
- **Phase B - Filters + Sort** (3 days): Multi-dimensional filtering (app, score, date) and sorting options
- **Phase C - Tags + Favorites** (3 days): Custom tagging system with favorites toggle

This phased approach allows for incremental delivery of value while maintaining feature quality.

### Business Impact

**RICE Score:** 9.6 (excellent)

- **Reach:** High (affects all users with 3+ profiles, scales with engagement)
- **Impact:** High (removes friction barrier, enables power user workflows)
- **Confidence:** Very High (table stakes feature, proven patterns)
- **Effort:** Low (1 week total across 3 phases)

**Expected Outcomes:**
- **Reduced search time:** From 2-3 minutes to <5 seconds for finding specific profiles
- **Increased engagement:** Users can manage larger profile collections (20+) without friction
- **Improved retention:** Power users no longer abandon app due to organization limits
- **Platform for future features:** Enables lifecycle tracking (notes, dates) and advanced analytics

### Resource Requirements

**Team:** 1 Frontend Developer
**Timeline:** 7 days (1 day Phase A + 3 days Phase B + 3 days Phase C)
**Dependencies:**
- Dexie database (already in place)
- React 19 + TypeScript
- Tailwind CSS for UI styling

**Budget:** No additional costs (no API calls, no external services)

### Risk Assessment

**Low Risk Profile:**
- Well-established UX patterns (search bars, filter panels, tags)
- No backend changes required (local-first IndexedDB)
- No breaking changes to existing schema
- Rollback strategy: Feature flags per phase

**Potential Risks:**
1. **Performance:** Large profile collections (50+) may slow query speed
   - **Mitigation:** Use Dexie compound indexes, lazy loading for results
2. **UI complexity:** Filter panel may clutter mobile interface
   - **Mitigation:** Collapsible panel, mobile-optimized design
3. **Tag bloat:** Users may create excessive tags
   - **Mitigation:** Suggested common tags, limit to 20 custom tags

---

## Product Overview

### Product Vision

Transform Aura's home gallery from a static profile archive into an **intelligent matchmaking workspace** where users can efficiently search, organize, and prioritize their dating pipeline.

### Target Users

**Primary Persona: Sarah, the Active Dater**
- **Age:** 28, working professional
- **Usage Pattern:** Analyzes 3-5 profiles per week
- **Pain Point:** Has 25+ profiles, can't remember who was compatible
- **Goal:** Quickly find high-compatibility matches when deciding who to message

**Secondary Persona: David, the Selective Power User**
- **Age:** 34, engineer
- **Usage Pattern:** Batch-analyzes 10-15 profiles on weekends
- **Pain Point:** Wants to compare matches by app, filter out low scores
- **Goal:** Organize matches by status (contacted, scheduled, passed)

### Value Proposition

**For active daters** who need to manage multiple analyzed profiles,
**Aura's Search & Organization System** is a **profile management tool**
**that** enables instant search, multi-dimensional filtering, and custom tagging
**unlike** other dating analysis tools that treat profiles as static archives.

### Success Criteria

**Quantitative Metrics:**
- **Adoption:** 60% of users with 5+ profiles use search within 2 weeks
- **Engagement:** 40% of users with 10+ profiles use filters weekly
- **Retention:** 20% reduction in churn for users with 10+ profiles
- **Performance:** Search results return in <300ms for collections up to 100 profiles

**Qualitative Metrics:**
- Users report reduced frustration finding profiles (validated via in-app feedback)
- Net Promoter Score (NPS) increases by 10+ points for power users
- User reviews mention organization features as a key differentiator

### Assumptions

1. **User Behavior:** Users will have 5-50 analyzed profiles within 3 months of active use
2. **Search Patterns:** Most searches will be by name (80%), followed by app name (15%)
3. **Filter Usage:** Compatibility score will be the most-used filter
4. **Tag Adoption:** 30% of users will actively use custom tags within first month
5. **Device Context:** 90% of usage is on mobile (iOS Safari, Android Chrome)

---

## Functional Requirements

### FR-001: Search Bar Component (Phase A)

**Priority:** P0 (Critical)
**Status:** Phase A

**Description:**
Display a persistent search bar at the top of the Home gallery that filters profiles in real-time as the user types.

**User Story:**
As a user with 20+ analyzed profiles,
I want to search for a match by typing their name,
So that I can find their profile in seconds instead of scrolling through the entire gallery.

**Acceptance Criteria:**
- **AC-001.1:** Search bar appears at top of Home page, below header, above profile grid
- **AC-001.2:** Search input has placeholder text: "Search by name..."
- **AC-001.3:** Typing filters profiles in real-time (debounced 300ms)
- **AC-001.4:** Search is case-insensitive (e.g., "alex" matches "Alex")
- **AC-001.5:** Search matches partial strings (e.g., "san" matches "Sandra")
- **AC-001.6:** Clear button (X icon) appears when search has text
- **AC-001.7:** Clicking clear button resets search and shows all profiles
- **AC-001.8:** Empty search state shows message: "No matches found for '[query]'"
- **AC-001.9:** Search persists when navigating away and back (session storage)
- **AC-001.10:** Search works with keyboard (Enter key focuses first result)

**Technical Notes:**
- Use Dexie `.where('name').startsWithIgnoreCase()` for efficient prefix search
- Debounce input with 300ms delay to avoid excessive re-renders
- Store search query in React state, sync to sessionStorage for persistence

**UI Mockup Reference:**
```
┌─────────────────────────────────────────┐
│  [Logo]              [User Menu]         │
│                                          │
│  ┌────────────────────────────────┐     │
│  │ 🔍 Search by name...         X │     │
│  └────────────────────────────────┘     │
│                                          │
│  [Profile Cards Grid]                   │
└─────────────────────────────────────────┘
```

---

### FR-002: Filter by Dating App (Phase B)

**Priority:** P0 (Critical)
**Status:** Phase B

**Description:**
Allow users to filter profiles by source dating app (Hinge, Tinder, Bumble, etc.) using a dropdown or chip selector.

**User Story:**
As a user who uses multiple dating apps,
I want to filter profiles by app (e.g., "Show only Hinge matches"),
So that I can focus on one platform's matches at a time.

**Acceptance Criteria:**
- **AC-002.1:** Filter control displays below search bar, above profile grid
- **AC-002.2:** Default state: "All Apps" (shows all profiles)
- **AC-002.3:** Dropdown shows unique app names from user's profiles (e.g., Hinge, Tinder, Bumble)
- **AC-002.4:** "Unknown" option appears if any profiles have no appName
- **AC-002.5:** Selecting an app filters grid to show only matching profiles
- **AC-002.6:** Filter combines with search (both must match)
- **AC-002.7:** Active filter shows clear badge with count (e.g., "Hinge (12)")
- **AC-002.8:** Filter persists across sessions (localStorage)
- **AC-002.9:** "Clear all filters" button resets app filter and search

**Technical Notes:**
- Query: `db.profiles.where('appName').equals(selectedApp)`
- Store filter state in React Context to share with future filter components
- Generate app list dynamically from existing profiles (no hardcoded list)

**UI Mockup Reference:**
```
┌─────────────────────────────────────────┐
│  🔍 Search                               │
│  ┌──────────┬──────────┬──────────┐     │
│  │ All Apps │  Hinge   │  Tinder  │     │
│  │          │  (12) ✓  │   (8)    │     │
│  └──────────┴──────────┴──────────┘     │
│  [Profile Cards Grid]                   │
└─────────────────────────────────────────┘
```

---

### FR-003: Filter by Compatibility Score (Phase B)

**Priority:** P1 (High)
**Status:** Phase B

**Description:**
Enable filtering profiles by compatibility score range using a dual-thumb range slider or preset buttons.

**User Story:**
As a selective dater,
I want to filter profiles by compatibility score (e.g., "Show only 7+ scores"),
So that I can focus on my best matches.

**Acceptance Criteria:**
- **AC-003.1:** Filter shows preset buttons: "All", "High (7+)", "Medium (5-6)", "Low (<5)"
- **AC-003.2:** Selecting a preset filters profiles by virtue score average
- **AC-003.3:** Profiles without virtue scores default to "Medium" category
- **AC-003.4:** Active filter badge shows: "Score: 7+" or "Score: 5-6"
- **AC-003.5:** Filter combines with search and app filter
- **AC-003.6:** Filter persists across sessions (localStorage)
- **AC-003.7:** Empty state if no profiles match filter: "No profiles in this score range"

**Technical Notes:**
- Calculate average virtue score: `profile.virtue_scores.reduce((sum, v) => sum + v.score, 0) / profile.virtue_scores.length`
- Use in-memory filter (not Dexie) since virtue scores aren't indexed
- Cache score calculations to avoid re-computing on each render

**Score Categorization Logic:**
- **High:** Average score ≥ 7
- **Medium:** Average score 5-6.9
- **Low:** Average score < 5
- **Unknown:** No `virtue_scores` array (legacy profiles)

---

### FR-004: Filter by Date Analyzed (Phase B)

**Priority:** P2 (Medium)
**Status:** Phase B

**Description:**
Allow filtering profiles by analysis date using preset time ranges.

**User Story:**
As a user who analyzes profiles in batches,
I want to filter by "Last 7 days" or "Last 30 days",
So that I can focus on recent matches.

**Acceptance Criteria:**
- **AC-004.1:** Filter shows preset buttons: "All Time", "Last 7 days", "Last 30 days", "Older"
- **AC-004.2:** "Last 7 days" shows profiles where `timestamp` is within 7 days of today
- **AC-004.3:** "Last 30 days" shows profiles within 30 days
- **AC-004.4:** "Older" shows profiles older than 30 days
- **AC-004.5:** Active filter badge shows: "Date: Last 7 days"
- **AC-004.6:** Filter combines with other filters
- **AC-004.7:** Filter persists across sessions (localStorage)

**Technical Notes:**
- Use Dexie range query: `db.profiles.where('timestamp').between(startDate, endDate)`
- Calculate date boundaries at query time (not cached) to ensure "Last 7 days" stays accurate

---

### FR-005: Sort Options (Phase B)

**Priority:** P1 (High)
**Status:** Phase B

**Description:**
Provide sort dropdown to order profiles by different criteria.

**User Story:**
As a user organizing my matches,
I want to sort profiles by "Highest Compatibility" or "Name A-Z",
So that I can prioritize high-value matches.

**Acceptance Criteria:**
- **AC-005.1:** Sort dropdown displays in filter panel with options:
  - Newest First (default)
  - Oldest First
  - Highest Compatibility
  - Lowest Compatibility
  - Name A-Z
  - Name Z-A
- **AC-005.2:** Selecting a sort option re-orders profile grid immediately
- **AC-005.3:** Sort combines with active filters (sorts within filtered results)
- **AC-005.4:** Sort persists across sessions (localStorage)
- **AC-005.5:** Sort indicator shows active option (e.g., "Sorted by: Highest Compatibility")

**Technical Notes:**
- Use Dexie `.orderBy()` for indexed fields (name, timestamp)
- Use in-memory sort for computed fields (compatibility score)
- Default sort: `db.profiles.orderBy('timestamp').reverse()` (newest first)

**Sort Implementation:**
```typescript
const sortProfiles = (profiles: Profile[], sortBy: SortOption) => {
  switch (sortBy) {
    case 'newest': return profiles.sort((a, b) => b.timestamp - a.timestamp);
    case 'oldest': return profiles.sort((a, b) => a.timestamp - b.timestamp);
    case 'highest': return profiles.sort((a, b) => getAvgScore(b) - getAvgScore(a));
    case 'lowest': return profiles.sort((a, b) => getAvgScore(a) - getAvgScore(b));
    case 'name-asc': return profiles.sort((a, b) => a.name.localeCompare(b.name));
    case 'name-desc': return profiles.sort((a, b) => b.name.localeCompare(a.name));
  }
};
```

---

### FR-006: Filter Panel UI (Phase B)

**Priority:** P0 (Critical)
**Status:** Phase B

**Description:**
Design a collapsible filter panel that houses all filter and sort controls in a mobile-optimized layout.

**User Story:**
As a mobile user,
I want filters grouped in a collapsible panel,
So that the interface stays clean when I'm not actively filtering.

**Acceptance Criteria:**
- **AC-006.1:** Filter panel appears below search bar, above profile grid
- **AC-006.2:** Panel has two states: collapsed (default) and expanded
- **AC-006.3:** Collapsed state shows: "Filters & Sort" button with active filter count badge
- **AC-006.4:** Expanded state shows all filter controls (app, score, date, sort)
- **AC-006.5:** Toggle button expands/collapses panel with smooth animation (200ms)
- **AC-006.6:** Active filters show summary chips in collapsed state
- **AC-006.7:** "Clear all filters" button resets all filters and sort to defaults
- **AC-006.8:** Panel state (expanded/collapsed) does NOT persist (resets to collapsed on page load)

**Mobile-First Design Principles:**
- Stack filters vertically on mobile (<640px width)
- Use full-width controls for touch-friendly interaction (44px min height)
- Show 1 filter per row to avoid cramping
- Expanded panel scrolls if content exceeds viewport

**UI Mockup Reference:**
```
┌─────────────────────────────────────────┐
│  🔍 Search                               │
│  ┌──────────────────────────────────┐   │
│  │ Filters & Sort (2 active)     ▼ │   │  <- Collapsed
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  🔍 Search                               │
│  ┌──────────────────────────────────┐   │
│  │ Filters & Sort                ▲ │   │  <- Expanded
│  │                                  │   │
│  │  App: [All ▼] [Hinge ✓] [Tinder]│   │
│  │  Score: [All] [7+] [5-6] [<5]   │   │
│  │  Date: [All Time] [7d] [30d]    │   │
│  │  Sort: [Newest ▼]               │   │
│  │                                  │   │
│  │  [Clear All Filters]            │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

### FR-007: Favorite/Bookmark Toggle (Phase C)

**Priority:** P1 (High)
**Status:** Phase C

**Description:**
Add a favorite/bookmark toggle to profile cards and detail view, allowing users to mark high-priority matches.

**User Story:**
As a user managing multiple matches,
I want to favorite my top 3-5 matches,
So that I can quickly find the people I'm most interested in.

**Acceptance Criteria:**
- **AC-007.1:** Star icon appears in top-right corner of each profile card (Home gallery)
- **AC-007.2:** Tapping star toggles favorite state (filled = favorited, outline = not favorited)
- **AC-007.3:** Favorited profiles show filled gold star icon
- **AC-007.4:** Star icon also appears in ProfileDetail header (same toggle behavior)
- **AC-007.5:** Favorite state persists immediately to Dexie (no save button)
- **AC-007.6:** Filter panel adds "Favorites" checkbox to show only favorited profiles
- **AC-007.7:** Favorited profiles count shows in filter panel badge (e.g., "★ Favorites (3)")
- **AC-007.8:** Tapping star provides haptic feedback (iOS) or vibration (Android)

**Technical Notes:**
- Add `isFavorite?: boolean` field to Profile schema (Dexie migration to v19)
- Use Dexie `.update()` for immediate persistence
- Icon: `<Star />` (outline) vs `<Star fill="currentColor" />` (filled)

**Migration SQL:**
```typescript
// Version 19: Add isFavorite field for favorites/bookmarks
db.version(19).stores({
  profiles: '++id, name, appName, timestamp, analysisPhase, serverId',
  // ... other tables unchanged
});
// No upgrade needed - isFavorite starts as undefined (falsy = not favorited)
```

---

### FR-008: Custom Tags System (Phase C)

**Priority:** P1 (High)
**Status:** Phase C

**Description:**
Allow users to add custom text tags to profiles for flexible organization (e.g., "Met IRL", "Second date", "Pass").

**User Story:**
As a user tracking my dating pipeline,
I want to tag profiles with custom labels like "Coffee planned" or "Ghosted",
So that I can remember the status of each match.

**Acceptance Criteria:**
- **AC-008.1:** Profile cards show tag chips below name/age line (max 3 visible)
- **AC-008.2:** Tapping "+Tag" button opens tag selector modal
- **AC-008.3:** Modal shows:
  - Suggested common tags: "Met IRL", "Date Planned", "Second Date", "Pass", "Maybe Later"
  - User's existing custom tags (alphabetical)
  - Text input to create new custom tag
  - Selected tags for current profile (checkmarks)
- **AC-008.4:** User can select multiple tags per profile (max 10 per profile)
- **AC-008.5:** Creating a new tag adds it to user's global tag library (max 20 custom tags)
- **AC-008.6:** Tags persist immediately to Dexie on selection change
- **AC-008.7:** Tag chips use color coding: Suggested tags = blue, Custom tags = purple
- **AC-008.8:** Tapping tag chip in modal removes it from profile
- **AC-008.9:** ProfileDetail view shows all tags (not limited to 3)
- **AC-008.10:** Filter panel adds "Tags" multi-select to filter by specific tags

**Technical Notes:**
- Add `tags?: string[]` field to Profile schema (Dexie migration to v19)
- Store global tag library in UserIdentity settings (for autocomplete/suggestions)
- Tag names are case-sensitive, max 20 characters, alphanumeric + spaces

**Suggested Common Tags:**
- "Met IRL"
- "Date Planned"
- "Second Date"
- "Pass"
- "Maybe Later"
- "Great Convo"
- "Red Flags"
- "Friends Only"

**UI Mockup Reference:**
```
┌─────────────────────────────────────────┐
│  [Profile Card]                         │
│  Sandra, 28 • Brooklyn                  │
│  [Met IRL] [Date Planned] [+2]         │  <- Tag chips
└─────────────────────────────────────────┘

Tag Selector Modal:
┌─────────────────────────────────────────┐
│  Add Tags                          [✕]  │
│                                          │
│  Suggested:                              │
│  ☐ Met IRL    ☐ Date Planned           │
│  ☐ Second Date  ☐ Pass                  │
│                                          │
│  Your Tags:                              │
│  ☑ Great Convo  ☐ Red Flags            │
│                                          │
│  Create New:                             │
│  [_______________________] [Add]        │
│                                          │
│  [Done]                                  │
└─────────────────────────────────────────┘
```

---

### FR-009: Filter by Tags (Phase C)

**Priority:** P1 (High)
**Status:** Phase C

**Description:**
Enable filtering profiles by one or more tags using a multi-select dropdown.

**User Story:**
As a user with tagged profiles,
I want to filter by tag (e.g., "Show only profiles tagged 'Date Planned'"),
So that I can focus on actionable matches.

**Acceptance Criteria:**
- **AC-009.1:** Filter panel includes "Tags" multi-select dropdown
- **AC-009.2:** Dropdown shows all tags used across user's profiles (suggested + custom)
- **AC-009.3:** User can select multiple tags (OR logic: show profiles with ANY selected tag)
- **AC-009.4:** Active tag filter shows badge: "Tags: Met IRL, Date Planned (5)"
- **AC-009.5:** Profiles without selected tags are hidden
- **AC-009.6:** Tag filter combines with other filters (app, score, date)
- **AC-009.7:** Filter persists across sessions (localStorage)
- **AC-009.8:** Deleting last profile with a tag removes tag from filter dropdown

**Technical Notes:**
- Use in-memory filter: `profiles.filter(p => p.tags?.some(t => selectedTags.includes(t)))`
- Tags aren't indexed in Dexie (not worth compound index complexity for this MVP)
- For 100+ profiles, consider debouncing tag filter to avoid lag

---

### FR-010: Tag Management UI (Phase C)

**Priority:** P2 (Medium)
**Status:** Phase C

**Description:**
Provide a tag management interface where users can rename, delete, or change colors of custom tags.

**User Story:**
As a user with 15+ custom tags,
I want to rename "Coffee" to "First Date" or delete unused tags,
So that my tag library stays organized.

**Acceptance Criteria:**
- **AC-010.1:** Settings page includes "Manage Tags" section
- **AC-010.2:** List shows all custom tags (suggested tags are not editable)
- **AC-010.3:** Each tag row shows: name, usage count (e.g., "Used in 5 profiles"), [Edit] [Delete] buttons
- **AC-010.4:** Tapping [Edit] opens inline text input to rename tag
- **AC-010.5:** Renaming tag updates all profiles using that tag (bulk update)
- **AC-010.6:** Tapping [Delete] shows confirmation: "Remove 'Coffee' from 5 profiles?"
- **AC-010.7:** Deleting tag removes it from all profiles
- **AC-010.8:** Tags with 0 usage show "Unused - [Delete]" (no confirmation needed)
- **AC-010.9:** Changes persist immediately to Dexie

**Technical Notes:**
- Store tag usage count in React state (calculated from profiles query)
- Use Dexie transaction for bulk rename/delete to ensure atomicity
- Maximum 20 custom tags enforced at creation time (not in management UI)

**Future Enhancement (Post-MVP):**
- Tag color picker (8 preset colors)
- Tag icons (emoji picker)
- Import/export tag library

---

### FR-011: Empty State Messaging (All Phases)

**Priority:** P0 (Critical)
**Status:** Phase A, B, C

**Description:**
Display contextual empty states when search/filter returns no results.

**User Story:**
As a user,
I want to see a helpful message when no profiles match my search/filter,
So that I understand why the gallery is empty.

**Acceptance Criteria:**
- **AC-011.1:** No search results: "No matches found for '[query]'. Try a different search term."
- **AC-011.2:** No filter results: "No profiles match your filters. [Clear Filters] to see all profiles."
- **AC-011.3:** No favorites: "No favorites yet. Tap the ★ on profiles you're most interested in."
- **AC-011.4:** No tagged profiles: "No profiles tagged '[tag name]'. Add tags via profile cards."
- **AC-011.5:** Empty states show relevant icon (search glass, filter funnel, star, tag)
- **AC-011.6:** Empty states include actionable button (e.g., "Clear Filters")

---

## Non-Functional Requirements

### NFR-001: Performance

**Requirement:** Search and filter operations must be responsive even with 100+ profiles.

**Benchmarks:**
- Search query (name): <300ms response time (p95)
- Filter application (single filter): <200ms response time (p95)
- Combined filters (3+ active): <500ms response time (p95)
- Tag bulk operations (rename/delete): <1s for 50 affected profiles

**Implementation Notes:**
- Use Dexie indexes for name and timestamp queries
- Debounce search input (300ms) to reduce query frequency
- Cache computed values (virtue score averages) in React state
- Consider virtual scrolling if profile count exceeds 50

---

### NFR-002: Accessibility (WCAG 2.1 AA Compliance)

**Requirement:** All search/filter UI must be keyboard-navigable and screen-reader friendly.

**Standards:**
- Search input has `aria-label="Search profiles by name"`
- Filter controls have semantic HTML (`<button>`, `<select>`)
- Active filters announced to screen readers (e.g., "Filter applied: Hinge, 12 profiles")
- Keyboard shortcuts: `/` focuses search, `Escape` clears search/filters
- Touch targets: 44px minimum (WCAG 2.5.5)
- Color contrast: 4.5:1 minimum for text, 3:1 for UI elements

**Testing:**
- Test with VoiceOver (iOS) and TalkBack (Android)
- Verify keyboard-only navigation (Tab, Shift+Tab, Enter, Escape)

---

### NFR-003: Mobile-First Design

**Requirement:** All features must work seamlessly on mobile devices (primary use case).

**Guidelines:**
- Touch-friendly controls (44px min height/width)
- No hover-dependent interactions (use tap/long-press)
- Stack filters vertically on screens <640px
- Collapsible filter panel to save vertical space
- Smooth animations (200ms transitions) for expand/collapse
- Haptic feedback on favorite toggle (iOS)

**Testing Devices:**
- iPhone 13/14 (iOS Safari)
- Google Pixel 6/7 (Chrome)
- Samsung Galaxy S21+ (Chrome)

---

### NFR-004: Data Persistence

**Requirement:** User filter preferences must persist across sessions without server dependency.

**Storage Strategy:**
- **localStorage:** Filter/sort preferences (survives browser restart)
- **sessionStorage:** Current search query (clears on tab close)
- **Dexie (IndexedDB):** Profile tags, favorites (permanent local storage)

**Data Model:**
```typescript
// localStorage (key: "aura_filter_prefs")
{
  selectedApp: string | null,
  scoreFilter: 'all' | 'high' | 'medium' | 'low',
  dateFilter: 'all' | '7d' | '30d' | 'older',
  sortBy: 'newest' | 'oldest' | 'highest' | 'lowest' | 'name-asc' | 'name-desc',
  selectedTags: string[]
}

// sessionStorage (key: "aura_search_query")
{
  query: string
}
```

---

### NFR-005: Browser Compatibility

**Requirement:** Search/filter features must work in all browsers supporting Aura.

**Supported Browsers:**
- iOS Safari 14+ (primary)
- Chrome Android 90+ (primary)
- Chrome Desktop 90+
- Firefox 88+
- Safari macOS 14+

**Not Supported:**
- Internet Explorer (EOL)
- Opera Mini (no IndexedDB)

---

### NFR-006: Offline Functionality

**Requirement:** Search/filter must work offline (local-first architecture).

**Behavior:**
- All search/filter queries run against local Dexie database
- No network requests required for core functionality
- Offline badge shows in sync indicator (existing feature)

---

## User Experience Specifications

### UX-001: Search Interaction Flow

**Scenario:** User searches for a profile named "Alexandra"

**Flow:**
1. User taps search input at top of Home gallery
2. Keyboard appears, user types "alex"
3. Profile grid updates in real-time (300ms debounce)
4. Gallery shows 2 profiles: "Alexandra" and "Alex"
5. User continues typing → "alexa"
6. Gallery updates to show 1 profile: "Alexandra"
7. User taps "X" clear button
8. Search clears, all profiles reappear

**Debounce Behavior:**
- User types "a" → wait 300ms → query runs
- User types "al" within 300ms → previous query cancelled, wait 300ms → query runs

---

### UX-002: Filter Combination Logic

**Scenario:** User applies multiple filters

**AND Logic (All Must Match):**
- Search + App + Score + Date + Tags → profile must match ALL active filters
- Example: Search "Sara" + Hinge + Score 7+ → only profiles named "Sara*" from Hinge with score ≥7

**OR Logic (Tag Selection):**
- Tags filter uses OR: "Met IRL" OR "Date Planned" → show profiles with EITHER tag
- Future enhancement: Add AND toggle for tags ("Must have ALL selected tags")

---

### UX-003: Filter Persistence Behavior

**Session Persistence (survives page refresh):**
- App filter
- Score filter
- Date filter
- Sort option
- Tag filter

**Does NOT persist:**
- Search query (clears on page load)
- Filter panel expanded state (resets to collapsed)

**Rationale:** Search is contextual (user expects fresh start), while filters represent ongoing organization preferences.

---

### UX-004: Mobile Touch Gestures

**Favorite Star Toggle:**
- **Tap:** Toggle favorite state (filled ↔ outline)
- **Haptic feedback:** Single light tap (iOS), short vibration (Android)

**Tag Chip Interaction:**
- **Tap on profile card:** Opens tag selector modal
- **Tap on filter chip (collapsed state):** Expands filter panel, highlights tag filter
- **Long-press (future):** Quick remove tag

---

### UX-005: Loading States

**Search Results:**
- Typing shows no spinner (instant local query)
- If query takes >1s (pathological case), show subtle shimmer on profile cards

**Filter Application:**
- No spinner needed (local query)
- Grid crossfades to new results (200ms)

---

### UX-006: Keyboard Shortcuts (Desktop)

**Global Shortcuts:**
- `/` → Focus search input
- `Escape` → Clear search, collapse filter panel
- `Cmd/Ctrl + F` → Focus search input

**Filter Panel Shortcuts:**
- `F` → Toggle filter panel
- `Cmd/Ctrl + K` → Clear all filters

---

## Data Model Changes

### Database Schema Update (Dexie v19)

**New Fields Added to Profile Interface:**

```typescript
interface Profile {
  // ... existing fields ...

  // NEW: Search & Organization fields (v19)
  isFavorite?: boolean;  // True if profile is favorited
  tags?: string[];       // Custom tags for organization
}
```

**Migration Script:**

```typescript
// Version 19: Add isFavorite and tags fields for search/organization
db.version(19).stores({
  profiles: '++id, name, appName, timestamp, analysisPhase, serverId',
  userIdentity: '++id, lastUpdated, supabaseUserId, serverId',
  coachingSessions: '++id, profileId, timestamp, serverId',
  matchChats: '++id, profileId, timestamp, serverId',
  inferenceHistory: '++id, timestamp, feature, userId, success'
});
// No upgrade needed - new fields start as undefined
```

**No Indexes Added:**
- `isFavorite` and `tags` are filtered in-memory (acceptable for <100 profiles)
- Future optimization: Add compound index if query performance degrades

---

### UserIdentity Settings Extension

**New Setting for Tag Library:**

```typescript
interface AppSettings {
  // ... existing fields ...

  // NEW: Tag library for autocomplete/suggestions
  customTags?: string[];  // Max 20 custom tags
}
```

**Initialization:**
```typescript
// On first tag creation, initialize empty array
if (!userIdentity.settings?.customTags) {
  await db.userIdentity.update(1, {
    'settings.customTags': []
  });
}
```

---

### Filter State Type Definitions

**TypeScript Interfaces:**

```typescript
// Filter preferences stored in localStorage
interface FilterPreferences {
  selectedApp: string | null;          // null = "All Apps"
  scoreFilter: ScoreFilter;            // 'all' | 'high' | 'medium' | 'low'
  dateFilter: DateFilter;              // 'all' | '7d' | '30d' | 'older'
  sortBy: SortOption;                  // 'newest' | 'oldest' | 'highest' | 'lowest' | 'name-asc' | 'name-desc'
  selectedTags: string[];              // Empty = no tag filter
}

type ScoreFilter = 'all' | 'high' | 'medium' | 'low';
type DateFilter = 'all' | '7d' | '30d' | 'older';
type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest' | 'name-asc' | 'name-desc';

// Default preferences
const DEFAULT_FILTERS: FilterPreferences = {
  selectedApp: null,
  scoreFilter: 'all',
  dateFilter: 'all',
  sortBy: 'newest',
  selectedTags: []
};
```

---

## Implementation Blueprint

### Phase A: Basic Search (1 day)

**Epic:** SEARCH-A
**Story Points:** 5

**Stories:**
1. **SEARCH-A-001:** Implement search bar UI component (2 pts)
   - Create `SearchBar.tsx` component
   - Add to Home page above profile grid
   - Placeholder text, clear button, search icon

2. **SEARCH-A-002:** Wire up real-time search query (2 pts)
   - Debounce input (300ms)
   - Query Dexie: `db.profiles.where('name').startsWithIgnoreCase(query)`
   - Update profile grid based on results

3. **SEARCH-A-003:** Add empty state for no results (1 pt)
   - Display "No matches found" message
   - Show suggestion to try different query

**Acceptance Criteria:**
- User can type in search bar and see results update in real-time
- Clicking "X" clears search and shows all profiles
- Empty state appears when no matches found
- Search persists in sessionStorage across page refreshes

**Testing Checklist:**
- [ ] Search "alex" returns profiles named "Alex", "Alexandra"
- [ ] Search "xyz" shows empty state
- [ ] Clear button resets gallery to all profiles
- [ ] Search works with special characters (O'Brien)
- [ ] Debouncing prevents excessive queries (verify in DevTools)

---

### Phase B: Filters + Sort (3 days)

**Epic:** FILTER-B
**Story Points:** 13

**Stories:**
1. **FILTER-B-001:** Create collapsible filter panel component (3 pts)
   - Build `FilterPanel.tsx` with expand/collapse animation
   - Add "Filters & Sort (X active)" button
   - Show active filter badges in collapsed state

2. **FILTER-B-002:** Implement app filter dropdown (2 pts)
   - Extract unique app names from profiles
   - Add multi-select chip UI
   - Query: `db.profiles.where('appName').equals(selectedApp)`

3. **FILTER-B-003:** Implement score range filter (2 pts)
   - Add preset buttons (All, 7+, 5-6, <5)
   - Calculate virtue score averages in-memory
   - Filter profiles by score category

4. **FILTER-B-004:** Implement date range filter (2 pts)
   - Add preset buttons (All Time, 7d, 30d, Older)
   - Query: `db.profiles.where('timestamp').between(startDate, endDate)`

5. **FILTER-B-005:** Implement sort dropdown (2 pts)
   - Add 6 sort options (newest, oldest, highest, lowest, name A-Z, Z-A)
   - Use Dexie `.orderBy()` for indexed fields
   - Use in-memory sort for computed fields

6. **FILTER-B-006:** Persist filter state to localStorage (1 pt)
   - Save filter preferences on change
   - Load on component mount
   - Add "Clear all filters" button

7. **FILTER-B-007:** Empty states for filtered results (1 pt)
   - Show contextual message when no profiles match filters
   - Include "Clear Filters" button

**Acceptance Criteria:**
- Filter panel collapses/expands smoothly (200ms animation)
- All filters combine with AND logic
- Active filters show in collapsed state badge
- Filter preferences persist across sessions
- "Clear all filters" resets to defaults

**Testing Checklist:**
- [ ] Filter by Hinge shows only Hinge profiles
- [ ] Filter by score 7+ shows only high-compatibility profiles
- [ ] Filter by "Last 7 days" shows only recent profiles
- [ ] Sort by "Highest Compatibility" orders profiles correctly
- [ ] Filter + search combine properly (e.g., search "alex" + Hinge)
- [ ] Empty state appears when no profiles match filters
- [ ] Filter preferences persist after page refresh
- [ ] "Clear all filters" resets to default state

---

### Phase C: Tags + Favorites (3 days)

**Epic:** TAGS-C
**Story Points:** 13

**Stories:**
1. **TAGS-C-001:** Add isFavorite field to Profile schema (1 pt)
   - Create Dexie migration v19
   - Update TypeScript interface
   - Add server sync migration (future)

2. **TAGS-C-002:** Implement favorite star toggle UI (2 pts)
   - Add star icon to profile cards (Home) and ProfileDetail
   - Wire up toggle: `db.profiles.update(id, { isFavorite: !current })`
   - Add haptic feedback on toggle (iOS)

3. **TAGS-C-003:** Add favorites filter to filter panel (1 pt)
   - Add "Favorites" checkbox in filter panel
   - Query: `profiles.filter(p => p.isFavorite)`
   - Show count badge: "★ Favorites (5)"

4. **TAGS-C-004:** Add tags field to Profile schema (1 pt)
   - Update Dexie migration v19 (same version as isFavorite)
   - Update TypeScript interface: `tags?: string[]`

5. **TAGS-C-005:** Implement tag selector modal (3 pts)
   - Build `TagSelector.tsx` modal component
   - Show suggested tags + custom tags + text input
   - Allow multi-select (checkboxes)
   - Save tags to profile on selection change

6. **TAGS-C-006:** Display tag chips on profile cards (2 pts)
   - Add tag chips below name/age line (max 3 visible)
   - Add "+Tag" button that opens modal
   - Color-code chips (blue = suggested, purple = custom)

7. **TAGS-C-007:** Implement tag filter in filter panel (2 pts)
   - Add "Tags" multi-select dropdown
   - Filter profiles: `profiles.filter(p => p.tags?.some(t => selectedTags.includes(t)))`
   - Show badge: "Tags: Met IRL (3)"

8. **TAGS-C-008:** Create tag management UI in Settings (1 pt)
   - List custom tags with usage counts
   - Allow rename (bulk update all profiles)
   - Allow delete (remove from all profiles)

**Acceptance Criteria:**
- User can favorite profiles by tapping star icon
- Favorited profiles show filled gold star
- User can add/remove tags via tag selector modal
- Tag chips appear on profile cards (max 3 visible)
- User can filter by tags in filter panel
- User can manage tags in Settings (rename, delete)

**Testing Checklist:**
- [ ] Tapping star toggles favorite state (filled ↔ outline)
- [ ] Favorite filter shows only favorited profiles
- [ ] Tag selector opens when tapping "+Tag" button
- [ ] Selected tags persist immediately to profile
- [ ] Tag chips display correctly on profile cards
- [ ] Tag filter shows only profiles with selected tags
- [ ] Renaming tag updates all profiles using that tag
- [ ] Deleting tag removes it from all profiles
- [ ] Haptic feedback works on iOS favorite toggle

---

## Quality Assurance Framework

### Acceptance Testing Plan

**Test Environment:**
- **Devices:** iPhone 13 (iOS 17), Pixel 6 (Android 13), Desktop Chrome
- **Test Data:** 50 mock profiles (varied apps, scores, dates)

**Test Scenarios:**

**TS-001: Basic Search**
- Given: User has 20 profiles in gallery
- When: User types "alex" in search bar
- Then: Only profiles with names containing "alex" appear
- And: Search is case-insensitive
- And: Clear button removes filter

**TS-002: App Filter**
- Given: User has 10 Hinge profiles, 5 Tinder profiles
- When: User selects "Hinge" filter
- Then: Only 10 Hinge profiles appear
- And: Badge shows "Hinge (10)"

**TS-003: Score Filter**
- Given: User has 5 profiles with score 7+, 8 with score 5-6
- When: User selects "High (7+)" filter
- Then: Only 5 high-score profiles appear
- And: Badge shows "Score: 7+"

**TS-004: Combined Filters**
- Given: User has 50 diverse profiles
- When: User applies search "sara" + Hinge filter + score 7+ filter
- Then: Only profiles matching ALL criteria appear
- And: Empty state shows if no matches

**TS-005: Favorite Toggle**
- Given: User is viewing a profile card
- When: User taps star icon
- Then: Star fills with gold color
- And: Profile is marked as favorite in database
- And: Haptic feedback occurs (iOS)

**TS-006: Tag Addition**
- Given: User is viewing a profile card
- When: User taps "+Tag" button and selects "Met IRL"
- Then: "Met IRL" chip appears on card
- And: Tag persists to database immediately

**TS-007: Filter Persistence**
- Given: User has applied app filter + score filter
- When: User refreshes page
- Then: Filters remain active
- And: Filtered results still display

**TS-008: Empty States**
- Given: User has 20 profiles
- When: User searches for "zzz" (no matches)
- Then: Empty state appears with message "No matches found"
- And: Clear button resets search

---

### Performance Benchmarks

**Query Performance (p95 latency):**
| Operation | Target | Measured |
|-----------|--------|----------|
| Name search (50 profiles) | <300ms | [TBD] |
| App filter (50 profiles) | <200ms | [TBD] |
| Score filter (50 profiles) | <200ms | [TBD] |
| Combined filters (50 profiles) | <500ms | [TBD] |
| Tag bulk rename (10 profiles) | <1s | [TBD] |

**UI Responsiveness:**
| Interaction | Target | Measured |
|-------------|--------|----------|
| Filter panel expand | <200ms | [TBD] |
| Search input debounce | 300ms | [TBD] |
| Favorite toggle | <100ms | [TBD] |
| Tag modal open | <150ms | [TBD] |

**Load Testing:**
- Test with 10, 50, 100, 500 profiles
- Verify no performance degradation >100 profiles
- If degradation occurs, implement virtual scrolling

---

### Browser/Device Compatibility Testing

**Primary Devices (Must Pass):**
- [ ] iPhone 13/14 (iOS Safari 17)
- [ ] Google Pixel 6/7 (Chrome 120)
- [ ] Desktop Chrome (120+)

**Secondary Devices (Should Pass):**
- [ ] Samsung Galaxy S21+ (Chrome 120)
- [ ] iPad Air (iOS Safari 17)
- [ ] Desktop Firefox (115+)

**Known Limitations:**
- Opera Mini: Not supported (no IndexedDB)
- IE 11: Not supported (EOL)

---

### Accessibility Testing

**Screen Reader Testing:**
- [ ] VoiceOver (iOS): Search input labeled, filter changes announced
- [ ] TalkBack (Android): Tag chips readable, favorite toggle labeled
- [ ] NVDA (Windows): Keyboard navigation works, filter panel accessible

**Keyboard Navigation:**
- [ ] Tab order: Search → Filter panel toggle → Filter controls → Profile cards
- [ ] `/` focuses search input
- [ ] Escape clears search, collapses filter panel
- [ ] Enter activates filter buttons

**Color Contrast:**
- [ ] Search input text: 4.5:1 minimum
- [ ] Filter buttons: 3:1 minimum
- [ ] Tag chips: 3:1 minimum
- [ ] Favorite star (outline): 3:1 minimum

**Touch Targets:**
- [ ] Search clear button: 44px × 44px
- [ ] Filter toggle button: 44px height
- [ ] Favorite star: 44px × 44px
- [ ] Tag chips: 44px height

---

## Success Metrics

### Phase A Success Metrics (Basic Search)

**Adoption:**
- **Target:** 60% of users with 5+ profiles use search within 2 weeks of release
- **Measurement:** Track `search_query_entered` event in analytics
- **Success Threshold:** ≥50% adoption

**Engagement:**
- **Target:** Average 3-5 searches per session for users with 10+ profiles
- **Measurement:** Track `search_query_count` per session
- **Success Threshold:** ≥2 searches per session

**Performance:**
- **Target:** Search query returns results in <300ms (p95)
- **Measurement:** Track `search_query_latency_ms` metric
- **Success Threshold:** p95 <500ms (acceptable), p95 <300ms (ideal)

---

### Phase B Success Metrics (Filters + Sort)

**Adoption:**
- **Target:** 40% of users with 10+ profiles use filters weekly
- **Measurement:** Track `filter_applied` event (app, score, date)
- **Success Threshold:** ≥30% adoption

**Engagement:**
- **Target:** Users with filters enabled view 20% more profiles per session
- **Measurement:** Compare `profiles_viewed_per_session` (filtered vs unfiltered)
- **Success Threshold:** ≥10% increase

**Preference Distribution:**
- **Target:** Understand which filters are most valuable
- **Measurement:** Track frequency of each filter type (app, score, date, sort)
- **Insight:** Inform future filter priorities

---

### Phase C Success Metrics (Tags + Favorites)

**Adoption:**
- **Target:** 30% of users with 5+ profiles use tags within first month
- **Measurement:** Track `tag_added` event
- **Success Threshold:** ≥20% adoption

**Engagement:**
- **Target:** Users with favorites engage 30% more often with favorited profiles
- **Measurement:** Compare `profile_detail_views` (favorited vs non-favorited)
- **Success Threshold:** ≥20% increase

**Tag Usage Patterns:**
- **Target:** Understand common tagging workflows
- **Measurement:** Track most-used tags (suggested vs custom)
- **Insight:** Inform future tag suggestions

---

### Overall System Success (Post-Launch)

**Retention Impact:**
- **Target:** 20% reduction in churn for users with 10+ profiles
- **Measurement:** Compare 30-day retention (before vs after launch)
- **Success Threshold:** ≥10% reduction

**User Satisfaction:**
- **Target:** NPS increase of 10+ points for power users
- **Measurement:** In-app survey: "How likely are you to recommend Aura?"
- **Success Threshold:** ≥5-point increase

**Support Tickets:**
- **Target:** 50% reduction in "can't find profile" support tickets
- **Measurement:** Track support ticket categorization
- **Success Threshold:** ≥30% reduction

---

## Edge Cases & Error Handling

### Edge Case Matrix

| Scenario | Expected Behavior | Handling |
|----------|-------------------|----------|
| User searches with special chars (`O'Brien`) | Search works correctly | Escape special regex chars |
| User has 0 profiles | Search/filter panel hidden | Show empty state: "Analyze your first profile" |
| User has 1 profile | Search/filter panel hidden | Not worth showing for single profile |
| User searches while filters active | Results match BOTH search + filters | AND logic |
| User applies 3+ filters, no results | Empty state appears | Show "No profiles match" + [Clear Filters] |
| User favorites profile, then deletes it | Favorite count decreases | No special handling (automatic) |
| User renames tag to existing tag name | Error: "Tag name already exists" | Show inline error, prevent save |
| User deletes tag used in 20 profiles | Confirmation: "Remove from 20 profiles?" | Bulk delete in transaction |
| User reaches 20 tag limit | Error: "Maximum 20 custom tags" | Show modal explaining limit |
| User tags profile with 10 tags | Warning: "Max 10 tags per profile" | Disable additional selections |
| Browser doesn't support haptic API | Feature degrades gracefully | No error, silent fail |

---

### Error States

**ES-001: Dexie Query Failure**
- **Scenario:** IndexedDB quota exceeded, database corrupted
- **Handling:** Show error toast: "Database error. Try refreshing the page."
- **Fallback:** Display last known results from React state

**ES-002: Filter Preference Load Failure**
- **Scenario:** localStorage corrupted, invalid JSON
- **Handling:** Reset to default filters, log warning to console
- **User Message:** None (silent recovery)

**ES-003: Tag Rename Failure**
- **Scenario:** Dexie transaction fails mid-update
- **Handling:** Rollback transaction, show error toast: "Tag rename failed. Please try again."
- **Retry:** Allow user to retry operation

**ES-004: Search Query Too Long**
- **Scenario:** User pastes 500-character string into search
- **Handling:** Truncate to 50 characters, show warning: "Search limited to 50 characters"

---

### Special Characters & Localization

**Supported Characters:**
- Standard ASCII (A-Z, a-z, 0-9)
- Accented characters (é, ñ, ü)
- Apostrophes (O'Brien)
- Hyphens (Mary-Jane)
- Spaces (De La Cruz)

**Case Sensitivity:**
- Search is case-insensitive
- Tag names are case-sensitive ("Met IRL" ≠ "met irl")

**Future Localization (Post-MVP):**
- Support for CJK characters (Chinese, Japanese, Korean)
- Support for RTL languages (Arabic, Hebrew)

---

## Phased Rollout Plan

### Phase A: Basic Search (Day 1)

**Deliverables:**
1. Search bar UI component (`SearchBar.tsx`)
2. Real-time search query with debouncing
3. Empty state for no results
4. Unit tests for search logic
5. E2E test for search flow

**Acceptance Criteria:**
- [ ] Search bar appears at top of Home gallery
- [ ] Typing filters profiles in real-time (300ms debounce)
- [ ] Clear button resets search
- [ ] Empty state shows when no matches found
- [ ] Search persists in sessionStorage

**User Validation:**
- [ ] Beta test with 5 users (10+ profiles each)
- [ ] Gather feedback on search speed and accuracy

**Go/No-Go Decision:**
- **Go to Phase B if:** Search works reliably, no critical bugs, positive user feedback
- **No-Go if:** Performance issues (>1s query time), frequent crashes

---

### Phase B: Filters + Sort (Days 2-4)

**Deliverables:**
1. Collapsible filter panel component (`FilterPanel.tsx`)
2. App filter dropdown
3. Score range filter (preset buttons)
4. Date range filter (preset buttons)
5. Sort dropdown (6 options)
6. Filter persistence (localStorage)
7. Empty states for filtered results
8. Unit tests for filter logic
9. E2E tests for each filter type

**Acceptance Criteria:**
- [ ] Filter panel expands/collapses smoothly
- [ ] All filters combine with AND logic
- [ ] Active filters show in collapsed state badge
- [ ] Filter preferences persist across sessions
- [ ] "Clear all filters" resets to defaults
- [ ] Empty states appear when no profiles match

**User Validation:**
- [ ] Beta test with 10 users (20+ profiles each)
- [ ] Gather feedback on filter usefulness and UI clarity

**Go/No-Go Decision:**
- **Go to Phase C if:** Filters work correctly, UI is intuitive, performance acceptable (<500ms)
- **No-Go if:** Filter combinations cause bugs, UI too cluttered on mobile

---

### Phase C: Tags + Favorites (Days 5-7)

**Deliverables:**
1. Dexie migration v19 (add `isFavorite`, `tags` fields)
2. Favorite star toggle UI
3. Favorites filter
4. Tag selector modal (`TagSelector.tsx`)
5. Tag chips on profile cards
6. Tag filter
7. Tag management UI in Settings
8. Haptic feedback for favorite toggle (iOS)
9. Unit tests for tag logic
10. E2E tests for tagging workflow

**Acceptance Criteria:**
- [ ] User can favorite profiles by tapping star
- [ ] Favorited profiles show filled gold star
- [ ] User can add/remove tags via modal
- [ ] Tag chips appear on profile cards (max 3 visible)
- [ ] User can filter by tags
- [ ] User can manage tags in Settings (rename, delete)
- [ ] Haptic feedback works on iOS

**User Validation:**
- [ ] Beta test with 15 users (30+ profiles each)
- [ ] Gather feedback on tag utility and UI flow

**Go/No-Go Decision:**
- **Go to Production if:** Tags work reliably, UI is intuitive, no data loss bugs
- **No-Go if:** Tag operations are slow (>1s), modal UI confusing

---

### Post-Launch Monitoring (Weeks 1-4)

**Week 1: Stability & Bug Fixes**
- Monitor error logs for Dexie failures, filter bugs
- Track performance metrics (query latency, UI responsiveness)
- Hotfix critical bugs within 24 hours

**Week 2: Adoption Tracking**
- Measure adoption rates for each phase (search, filters, tags)
- Identify low-adoption features for UX improvements
- Gather qualitative feedback via in-app survey

**Week 3: Performance Optimization**
- Analyze query performance with real user data (100+ profiles)
- Optimize slow queries (add indexes, cache results)
- Test with 500-profile stress test

**Week 4: Feature Iteration**
- Review success metrics vs targets
- Prioritize follow-up improvements (e.g., advanced tag features)
- Plan next phase (lifecycle tracking, notes)

---

## Future Enhancements (Post-MVP)

### FE-001: Advanced Tag Features
- **Tag colors:** Assign 8 preset colors to custom tags
- **Tag icons:** Emoji picker for visual identification
- **Tag groups:** Organize tags into categories (Status, Compatibility, Location)
- **Smart tags:** Auto-suggest tags based on profile analysis (e.g., "High Compatibility" if score ≥7)

### FE-002: Saved Filter Presets
- **Save current filters as preset:** "My Top Matches" (Hinge + 7+ + Favorited)
- **Quick access:** Dropdown shows 5 most-used presets
- **Share presets:** Export/import filter configs (JSON)

### FE-003: Search Autocomplete
- **Show recent searches:** Dropdown below search input
- **Show suggested names:** Top 5 matches as user types
- **Search history:** Clear button to reset recent searches

### FE-004: Filter by Location
- **Extract location from profile basics:** "Brooklyn", "Manhattan", "San Francisco"
- **City/State filter:** Multi-select dropdown
- **Distance filter:** "Within 10 miles" (requires geocoding)

### FE-005: Filter by Date of Last Activity
- **Track last viewed date:** Update `profile.lastViewedAt` on ProfileDetail visit
- **Filter options:** "Viewed this week", "Not viewed in 30 days"
- **Use case:** Re-engage with forgotten matches

### FE-006: Bulk Actions
- **Multi-select mode:** Long-press to enter selection mode
- **Bulk tag:** Add tag to 5 selected profiles at once
- **Bulk favorite:** Mark multiple profiles as favorites
- **Bulk delete:** Remove multiple profiles (with confirmation)

### FE-007: Smart Collections (Auto-Filters)
- **"High Potential":** Auto-collection of profiles with score 7+, not contacted
- **"Recent Favorites":** Favorited in last 7 days
- **"Need Follow-Up":** Tagged "Date Planned" or "Second Date"

### FE-008: Export/Import Tags
- **Export tag library:** JSON file with all custom tags
- **Import tags:** Upload JSON from another device
- **Use case:** Cross-device tag synchronization (pre-auth)

---

## Appendix

### A. Technical Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Home.tsx (Page)                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  SearchBar.tsx                                            │  │
│  │  - Input with debounce (300ms)                            │  │
│  │  - sessionStorage persistence                             │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  FilterPanel.tsx (Collapsible)                            │  │
│  │  ├── AppFilter.tsx (Dropdown)                             │  │
│  │  ├── ScoreFilter.tsx (Preset Buttons)                     │  │
│  │  ├── DateFilter.tsx (Preset Buttons)                      │  │
│  │  ├── SortDropdown.tsx                                     │  │
│  │  └── TagFilter.tsx (Multi-select)                         │  │
│  │  - localStorage persistence                               │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  ProfileGrid (Filtered Results)                           │  │
│  │  ├── ProfileCard (with Star + Tags)                       │  │
│  │  ├── ProfileCard                                          │  │
│  │  └── ...                                                  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
           │                          │
           ▼                          ▼
    ┌──────────────┐          ┌─────────────┐
    │   Dexie DB   │          │ localStorage│
    │  (profiles)  │          │  (filters)  │
    └──────────────┘          └─────────────┘
```

---

### B. Filter Combination Logic Pseudocode

```typescript
function getFilteredProfiles(
  allProfiles: Profile[],
  searchQuery: string,
  selectedApp: string | null,
  scoreFilter: ScoreFilter,
  dateFilter: DateFilter,
  selectedTags: string[],
  sortBy: SortOption
): Profile[] {
  // Step 1: Apply Dexie queries (indexed fields)
  let profiles = allProfiles;

  // Search filter (name)
  if (searchQuery) {
    profiles = profiles.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // App filter
  if (selectedApp) {
    profiles = profiles.filter(p => p.appName === selectedApp);
  }

  // Date filter
  if (dateFilter !== 'all') {
    const now = Date.now();
    const cutoff = dateFilter === '7d' ? now - 7 * 24 * 60 * 60 * 1000
                 : dateFilter === '30d' ? now - 30 * 24 * 60 * 60 * 1000
                 : 0;
    profiles = profiles.filter(p => p.timestamp >= cutoff);
  }

  // Step 2: Apply in-memory filters (computed fields)

  // Score filter
  if (scoreFilter !== 'all') {
    profiles = profiles.filter(p => {
      const avg = getAvgVirtueScore(p);
      return scoreFilter === 'high' ? avg >= 7
           : scoreFilter === 'medium' ? avg >= 5 && avg < 7
           : avg < 5;
    });
  }

  // Tag filter (OR logic)
  if (selectedTags.length > 0) {
    profiles = profiles.filter(p =>
      p.tags?.some(t => selectedTags.includes(t))
    );
  }

  // Step 3: Sort
  profiles = sortProfiles(profiles, sortBy);

  return profiles;
}

function getAvgVirtueScore(profile: Profile): number {
  if (!profile.virtue_scores || profile.virtue_scores.length === 0) {
    return 5; // Default to medium if no scores
  }
  const sum = profile.virtue_scores.reduce((acc, v) => acc + v.score, 0);
  return sum / profile.virtue_scores.length;
}

function sortProfiles(profiles: Profile[], sortBy: SortOption): Profile[] {
  switch (sortBy) {
    case 'newest':
      return profiles.sort((a, b) => b.timestamp - a.timestamp);
    case 'oldest':
      return profiles.sort((a, b) => a.timestamp - b.timestamp);
    case 'highest':
      return profiles.sort((a, b) => getAvgVirtueScore(b) - getAvgVirtueScore(a));
    case 'lowest':
      return profiles.sort((a, b) => getAvgVirtueScore(a) - getAvgVirtueScore(b));
    case 'name-asc':
      return profiles.sort((a, b) => a.name.localeCompare(b.name));
    case 'name-desc':
      return profiles.sort((a, b) => b.name.localeCompare(a.name));
    default:
      return profiles;
  }
}
```

---

### C. Dexie Query Examples

```typescript
// Example 1: Basic name search
const results = await db.profiles
  .where('name')
  .startsWithIgnoreCase(searchQuery)
  .toArray();

// Example 2: App filter + date range
const now = Date.now();
const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

const results = await db.profiles
  .where('appName').equals('Hinge')
  .and(p => p.timestamp >= sevenDaysAgo)
  .toArray();

// Example 3: Sort by timestamp (newest first)
const results = await db.profiles
  .orderBy('timestamp')
  .reverse()
  .toArray();

// Example 4: In-memory filter for tags (not indexed)
const allProfiles = await db.profiles.toArray();
const taggedProfiles = allProfiles.filter(p =>
  p.tags?.includes('Met IRL')
);
```

---

### D. Component File Structure

```
src/
├── pages/
│   └── Home.tsx (main entry point, orchestrates search/filter)
├── components/
│   ├── search/
│   │   └── SearchBar.tsx (Phase A)
│   ├── filters/
│   │   ├── FilterPanel.tsx (Phase B)
│   │   ├── AppFilter.tsx (Phase B)
│   │   ├── ScoreFilter.tsx (Phase B)
│   │   ├── DateFilter.tsx (Phase B)
│   │   ├── SortDropdown.tsx (Phase B)
│   │   └── TagFilter.tsx (Phase C)
│   ├── tags/
│   │   ├── TagSelector.tsx (Phase C)
│   │   ├── TagChip.tsx (Phase C)
│   │   └── TagManagement.tsx (Phase C, in Settings)
│   └── ui/
│       └── EmptyState.tsx (reusable for all empty states)
├── hooks/
│   ├── useProfileSearch.ts (search logic)
│   ├── useProfileFilters.ts (filter state management)
│   └── useProfileTags.ts (tag CRUD operations)
└── lib/
    └── filterHelpers.ts (filter combination logic, score calculations)
```

---

### E. localStorage Schema

```typescript
// Key: "aura_filter_prefs"
// Value: JSON string
{
  "selectedApp": "Hinge",           // string | null
  "scoreFilter": "high",             // 'all' | 'high' | 'medium' | 'low'
  "dateFilter": "7d",                // 'all' | '7d' | '30d' | 'older'
  "sortBy": "highest",               // SortOption enum
  "selectedTags": ["Met IRL", "Date Planned"]  // string[]
}

// Key: "aura_search_query" (sessionStorage, not localStorage)
// Value: JSON string
{
  "query": "alex"  // string
}
```

---

### F. Suggested Common Tags (Hardcoded List)

```typescript
export const SUGGESTED_TAGS = [
  'Met IRL',
  'Date Planned',
  'Second Date',
  'Pass',
  'Maybe Later',
  'Great Convo',
  'Red Flags',
  'Friends Only',
  'High Priority',
  'Low Priority'
];
```

---

### G. Analytics Events

**Event Tracking (for measuring success metrics):**

```typescript
// Phase A: Search
trackEvent('search_query_entered', {
  query_length: number,
  results_count: number,
  user_profile_count: number
});

trackEvent('search_cleared', {
  query_length: number
});

// Phase B: Filters
trackEvent('filter_applied', {
  filter_type: 'app' | 'score' | 'date' | 'sort',
  filter_value: string,
  results_count: number
});

trackEvent('filter_cleared', {
  filters_cleared: string[]  // e.g., ['app', 'score']
});

// Phase C: Tags & Favorites
trackEvent('profile_favorited', {
  profile_id: number,
  is_favorited: boolean
});

trackEvent('tag_added', {
  profile_id: number,
  tag_name: string,
  tag_type: 'suggested' | 'custom'
});

trackEvent('tag_removed', {
  profile_id: number,
  tag_name: string
});

trackEvent('tag_renamed', {
  old_name: string,
  new_name: string,
  affected_profiles: number
});

trackEvent('tag_deleted', {
  tag_name: string,
  affected_profiles: number
});
```

---

### H. References

**Design Inspiration:**
- Tinder: Card-based gallery with swipe gestures
- Notion: Tag system with color coding
- Apple Contacts: Favorites star toggle
- Gmail: Multi-filter combination logic

**Technical References:**
- [Dexie.js Query API](https://dexie.org/docs/Table/Table.where())
- [React 19 Hooks Best Practices](https://react.dev/reference/react)
- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [localStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

**Aura Codebase:**
- `src/pages/Home.tsx` - Current gallery implementation
- `src/lib/db.ts` - Dexie schema and Profile interface
- `src/lib/virtues/virtues.ts` - 11 Virtues scoring system
- `CLAUDE.md` - Project architecture and conventions

---

**End of PRD**

---

[timestamp] 2026-01-28 14:15 PST
