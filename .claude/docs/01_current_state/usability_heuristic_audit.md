# Usability Heuristic Audit

**Agent Persona**: UX Researcher
**Date**: January 2026
**Methodology**: Nielsen's 10 Heuristics + Neurodivergent Accessibility Review

---

## Executive Summary

Aura demonstrates thoughtful progressive disclosure and clear visual hierarchy, but suffers from upload flow anxiety, information density overload on detail pages, and missing loading state management. This audit identifies 23 specific friction points across 6 categories.

---

## Heuristic Analysis

### H1: Visibility of System Status

**Score**: 6/10

**Strengths**:
- Status cards during upload show pipeline progress
- Clear "Analyzing..." states with visual indicators
- Gallery shows profile count

**Weaknesses**:
- **Long processing waits (30-90 seconds)** for AI analysis with no progress percentage
- No estimated time remaining
- Multiple status cards during analysis may feel like incomplete work
- No background processing indicator when leaving page

**Recommendation**: Add deterministic progress bar (fake or real), estimated completion time, and background task notification.

### H2: Match Between System and Real World

**Score**: 8/10

**Strengths**:
- "Gallery" metaphor for saved profiles
- "Match" terminology from dating apps
- Zodiac compatibility uses familiar astrological language
- "Virtues" naming aligns with personal growth framing

**Weaknesses**:
- "Synthesis" for user profile creation is jargon
- "23 Aspects" system naming is opaque
- Some AI-generated terminology may confuse users

### H3: User Control and Freedom

**Score**: 7/10

**Strengths**:
- Can delete profiles from gallery
- Can regenerate specific sections (openers, date ideas)
- Clear navigation back to home

**Weaknesses**:
- **No auto-save during upload** - must click "Save to Gallery"
- No undo after delete
- Cannot pause/resume long analysis
- No draft/incomplete state management

### H4: Consistency and Standards

**Score**: 7/10

**Strengths**:
- Consistent card-based UI throughout
- Uniform button styling
- Tab navigation pattern consistent

**Weaknesses**:
- 3 tabs on ProfileDetail vs 6 tabs on MyProfile (inconsistent complexity)
- Some features use accordions, others use tabs
- Refresh icons inconsistent across sections

### H5: Error Prevention

**Score**: 5/10

**Weaknesses**:
- No validation before starting expensive AI analysis
- No warning before using last credit (future)
- Can upload non-video files
- **Conditional features (virtues, compatibility) silently unavailable** without user profile

**Critical Gap**: User discovers scoring requires profile setup *after* uploading match.

### H6: Recognition Rather Than Recall

**Score**: 8/10

**Strengths**:
- All profile data visible without memorization
- Copy buttons for openers (no need to remember)
- Gallery thumbnails for recognition

**Weaknesses**:
- 23 Aspects names must be learned
- Virtue definitions not inline

### H7: Flexibility and Efficiency of Use

**Score**: 6/10

**Strengths**:
- Direct upload from home screen
- Quick access to recent profiles
- Refresh individual sections

**Weaknesses**:
- No batch operations
- No keyboard shortcuts
- No quick actions on gallery cards
- Cannot compare multiple profiles

### H8: Aesthetic and Minimalist Design

**Score**: 5/10

**Weaknesses**:
- **ProfileDetail Overview: 10 sections** on single scroll
- **Analysis Tab: Dense information architecture**
- **MyProfile: 6 input tabs** (potentially overwhelming)
- **Coach Tab: 5 main feature areas**
- Multiple disclosure levels fighting for attention

**Information Density Issues**:
| Page | Sections/Elements |
|------|-------------------|
| ProfileDetail Overview | 10 cards/sections |
| ProfileDetail Analysis | 23 aspects + charts |
| ProfileDetail Coach | 5 feature areas |
| MyProfile | 6 input tabs |
| Upload | 4+ status cards |

### H9: Help Users Recognize, Diagnose, and Recover from Errors

**Score**: 6/10

**Strengths**:
- Toast notifications for errors
- Clear API error messages (when they occur)

**Weaknesses**:
- **No recovery path for failed analyses** - just retry
- Video extraction failures give generic message
- No troubleshooting guidance

### H10: Help and Documentation

**Score**: 4/10

**Weaknesses**:
- No onboarding flow
- No feature tooltips
- No FAQ or help section
- Settings page is single toggle
- No explanation of AI capabilities/limitations

---

## Upload Flow Anxiety Analysis

### Timeline Pain Points

```
[Select Video] → [Frame Extraction: 5-10s] → [Upload Animation: 2-3s] →
[Basic Analysis: 15-30s] → [Deep Analysis: 30-60s] → [Save Prompt]
```

**Total Wait**: 60-100 seconds with user watching

### Anxiety Triggers

1. **Uncertainty**: "Is it working?" during long waits
2. **Sunk Cost Fear**: "What if it fails after all this waiting?"
3. **FOMO**: "Am I missing something while I wait?"
4. **Regret Potential**: Cannot undo or pause investment

### Status Card Overwhelm

During analysis, user sees:
- Video thumbnail card
- Frame extraction status
- Analysis progress card
- Profile preview card
- Save action card

**Cognitive Load**: 5 simultaneous status elements competing for attention.

---

## Neurodivergent User Considerations

### Positive Patterns

| Pattern | Benefit |
|---------|---------|
| Progressive disclosure | Reduces overwhelm (options appear when data exists) |
| Clear visual hierarchy | Easy scanning on Home page |
| Consistent card layouts | Predictable interaction model |
| Copy-to-clipboard | Reduces transcription effort |
| Persistent chat history | No need to remember context |

### Areas for Improvement

| Issue | Impact | Affected Users |
|-------|--------|----------------|
| Dense Analysis tab | Information overload | ADHD, Autism |
| Long uninterruptible waits | Anxiety, task switching | ADHD, Anxiety |
| No loading state reassurance | Uncertainty anxiety | Anxiety, Autism |
| Multiple tabs without overview | Navigation confusion | ADHD, Executive dysfunction |
| No keyboard navigation | Accessibility barrier | Motor disabilities |
| Small touch targets | Precision difficulty | Motor disabilities, tremors |

### Recommended Additions

1. **"Relax Mode"**: Minimal UI during analysis with reassuring animation
2. **Summary View**: Single-page profile overview option
3. **Keyboard Navigation**: Full keyboard accessibility
4. **Larger Touch Targets**: 44pt minimum (iOS guideline)
5. **Reduced Motion Option**: Disable animations

---

## Friction Points Inventory

### Critical (Blocks Core Flow)

| ID | Location | Issue | Impact |
|----|----------|-------|--------|
| F1 | Upload | No auto-save | Data loss risk |
| F2 | Upload | Long wait, no progress | Abandonment |
| F3 | ProfileDetail | Conditional scoring hidden | Confusion |

### High (Degrades Experience)

| ID | Location | Issue | Impact |
|----|----------|-------|--------|
| F4 | ProfileDetail | 10 Overview sections | Cognitive overload |
| F5 | MyProfile | 6 input tabs | Setup overwhelm |
| F6 | Analysis | 23 Aspects dense display | Scanning difficulty |
| F7 | Coach | 5 feature areas | Decision paralysis |
| F8 | General | No onboarding | New user confusion |

### Medium (Causes Frustration)

| ID | Location | Issue | Impact |
|----|----------|-------|--------|
| F9 | Gallery | No batch operations | Inefficiency |
| F10 | ProfileDetail | No profile comparison | Missed utility |
| F11 | Upload | No pause/resume | Inflexibility |
| F12 | Settings | Single toggle only | Limited control |

### Low (Polish Items)

| ID | Location | Issue | Impact |
|----|----------|-------|--------|
| F13 | General | No keyboard shortcuts | Power user limitation |
| F14 | Gallery | No sorting options | Organization difficulty |
| F15 | Analysis | No data export | Portability gap |

---

## Recommendations by Priority

### Immediate (Pre-Launch)

1. **Add progress indicators** with fake progress and time estimates
2. **Auto-save drafts** during upload flow
3. **Surface conditional requirements** before upload starts

### Short-term (Post-Launch)

1. **Collapsible sections** on Overview tab
2. **"Quick View" mode** for profiles (summary only)
3. **Onboarding tooltips** for first-time users

### Medium-term (Growth Phase)

1. **Profile comparison view**
2. **Batch operations** in gallery
3. **Full keyboard accessibility**
4. **Reduced motion preference**

### Long-term (Scale)

1. **Personalization settings** (density, theme)
2. **Guided flows** for complex features
3. **Contextual help system**

---

## Appendix: Page Complexity Scores

| Page | Elements | Interactions | Score |
|------|----------|--------------|-------|
| Home | 12 | 4 | Low |
| Upload | 15 | 6 | Medium |
| ProfileDetail | 45+ | 15+ | **High** |
| MyProfile | 30+ | 18+ | **High** |
| Settings | 3 | 1 | Low |

Target: No page should exceed 25 primary elements or 10 primary interactions.
