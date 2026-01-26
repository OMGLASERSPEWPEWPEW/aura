# ADR-0007: Eleven Virtues System

## Status
Accepted

## Date
2025-01-25

## Context
Aura's psychological analysis framework evolved through several iterations:

1. **Initial**: Free-form AI analysis with no structure
2. **23 Aspects**: Detailed aspect-based scoring (too granular, overwhelming)
3. **11 Virtues**: Balanced framework with three realms

The 23 Aspects system had issues:
- Too many dimensions to display meaningfully
- Aspects overlapped conceptually
- Difficult to compute meaningful compatibility scores
- UI became cluttered with 23 score bars

We needed a framework that was:
- Psychologically meaningful
- Visually presentable
- Suitable for compatibility scoring
- Grounded in established personality theory

## Decision
We implemented the **11 Virtues System** organized into three realms:

**Realm of Mind (Intellectual)**
1. Curiosity - Desire to learn and explore
2. Creativity - Novel thinking and expression
3. Wisdom - Judgment and life experience

**Realm of Heart (Emotional)**
4. Compassion - Care for others' wellbeing
5. Authenticity - Genuine self-expression
6. Resilience - Emotional strength and recovery
7. Humor - Playfulness and levity

**Realm of Spirit (Existential)**
8. Purpose - Direction and meaning
9. Growth - Commitment to self-improvement
10. Connection - Desire for deep relationships
11. Presence - Mindfulness and engagement

**Compatibility Scoring:**
```typescript
// virtues.ts
function calculateCompatibility(user: VirtueProfile, match: VirtueProfile): number {
  // Weight by realm importance (user preference)
  // Calculate variance within realms
  // Return 0-100 compatibility score
}
```

**Migration Path:**
Existing profiles with 23 Aspects auto-migrate via mapping table:
```typescript
// migration.ts
const ASPECT_TO_VIRTUE_MAP = {
  'intellectual-curiosity': 'curiosity',
  'emotional-depth': 'compassion',
  // ... etc
};
```

## Consequences

### Positive
- **Clearer UI**: 11 virtues fit cleanly in card layouts
- **Three realms**: Natural grouping for visual hierarchy
- **Compatibility math**: Meaningful scoring algorithm
- **Theoretical grounding**: Based on virtue ethics tradition
- **User understanding**: Easier to comprehend than 23 aspects

### Negative
- **Migration complexity**: Legacy profiles need conversion
- **Lost granularity**: Some nuance from 23 aspects lost
- **Reanalysis needed**: Old profiles may need fresh analysis
- **Documentation**: New framework requires explanation

## Related
- Git commit: `194f9e5` (11 Virtues implementation)
- `src/lib/virtues/virtues.ts` - Virtue definitions and scoring
- `src/lib/virtues/migration.ts` - 23 Aspects to 11 Virtues migration
- `.claude/docs/virtue_system.md` - Framework design document
