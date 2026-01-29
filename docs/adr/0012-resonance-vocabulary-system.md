# ADR-0012: Resonance Vocabulary System

## Status
Accepted

## Date
2026-01-28

## Context

The app previously displayed compatibility scores using numeric values (e.g., "8/10") with traffic-light color coding (green/amber/red). This approach had several documented problems:

1. **Dehumanizing**: Reducing people to numeric scores encourages objectification and transactional thinking
2. **Gamifiable**: Narcissists and game-players optimize scores ("How do I get a 10?"), gaming the system rather than building genuine connection
3. **Judgment-focused**: Frames compatibility as "Are THEY good enough?" rather than "Is this worth MY time?"
4. **Shame-triggering**: Red/low scores trigger rejection panic in anxious attachment styles, reinforcing trauma patterns
5. **Red = danger signaling**: Red coloring unconsciously implies the other person is "bad" or "dangerous" when in fact they're just incompatible

The psychological reframe we wanted: **"It's not about judging them, it's about protecting YOUR time. Is this worth my investment?"**

## Decision

Replace all numeric compatibility displays with a 3-tier mystical/resonance vocabulary system designed to:
- Eliminate numbers entirely (no optimization target for narcissists)
- Use symmetric language (describes both people, not a ranking)
- Eliminate red coloring (no shame triggers)
- Preserve curiosity (low compatibility scores don't close doors)

### Display Mapping

| Score Range | Old Display | New Display | Icon | Color | Use Case |
|-------------|-------------|-------------|------|-------|----------|
| 7-10 | Green "8/10" | **Strong Resonance** | Sparkles ✨ | `violet-400` | High compatibility, worth exploring |
| 5-6 | Amber "6/10" | **Paths Converging** | Moon 🌙 | `amber-400` | Moderate compatibility, intrigue possible |
| 1-4 | Red "4/10" | **Different Frequencies** | Waves 〰️ | `slate-400` | Low compatibility, but doesn't close doors |

### Implementation Details

**Centralized display logic** in `src/lib/virtues/resonanceDisplay.ts`:
```typescript
export function getResonanceDisplay(score: number): ResonanceDisplay {
  // Returns: { label, icon, colors, description, tooltip }
  // Single source of truth for all resonance displays
}
```

**Applied locations:**
- `src/pages/Home.tsx` - Gallery profile badges (compact label + icon)
- `src/components/profileDetail/CompatibilityCard.tsx` - Detail view with full description
- Any other score display updates automatically when logic changes

**Design principles:**
- **No red anywhere**: Red = danger/bad. We never say someone is bad, just incompatible.
- **Mystical vocabulary**: Matches Aura's brand identity and feels less transactional
- **3 tiers only**: Mystical language works in broad emotional bands, not fine-grained granularity
- **Curiosity-preserving**: Even "Different Frequencies" invites wondering "but maybe we could surprise each other?"

## Consequences

### Positive

- **Narcissist/game-player filter**: No numbers to optimize. "Woo-woo" vocabulary is boring to manipulators and doesn't feed optimization loops.
- **Anxious attachment safe**: "Different Frequencies" doesn't trigger rejection panic. Symmetric language prevents shame spirals.
- **Avoidant attachment engagement**: Can't easily dismiss ("the label sounds interesting"). Invites curiosity rather than snap judgment.
- **Shame-free for all**: Both parties described as "different" — symmetric, no ranking, no "you're not good enough"
- **Brand alignment**: Mystical vocabulary reinforces Aura's identity as psychology-informed and spiritual, not transactional dating mechanics
- **Reduced comparison behavior**: No way to compare scores numerically ("they're an 8 and this person is a 6")

### Negative

- **Precision loss**: Users who want exact percentages or granular scores (7 vs 8) get no such detail
- **Abstraction learning curve**: "Resonance" vocabulary requires user education (mitigated by FAQ/onboarding)
- **Three-tier collapsing**: A score of 5 and 6 both show "Paths Converging" (intentional trade-off for simplicity)
- **Less "scientific" feeling**: Some users may perceive this as less rigorous (actually more psychologically sound)
- **Requires consistent application**: If scores still appear elsewhere (analytics, export), confusion results (must audit all score displays)

## Related Decisions

- **ADR-0007**: Eleven Virtues System - Provides the underlying 1-10 compatibility scores that get translated to resonance displays
- **ADR-0009**: Typed Error Infrastructure - Error handling around score calculation and display edge cases

## Implementation Reference

| File | Purpose |
|------|---------|
| `src/lib/virtues/resonanceDisplay.ts` | Core logic: `getResonanceDisplay(score)` function |
| `src/lib/virtues/resonanceDisplay.test.ts` | Test coverage: 17 tests validating all tiers, edge cases, color safety |
| `src/pages/Home.tsx` | Gallery badge display using resonance labels and icons |
| `src/components/profileDetail/CompatibilityCard.tsx` | Detail view: full description, icon, and resonance context |
| `docs/user-guides/compatibility.md` | User-facing explanation of resonance system (if created) |

## Notes

- All numeric score values (1-10) remain in the database and are calculated correctly; we only change the *presentation layer*
- The system is easily reversible if needed (just swap the display function)
- Future iterations could add tooltips explaining what "Strong Resonance" means psychologically
- Analytics can still track raw scores, but user-facing UI exclusively uses resonance language
