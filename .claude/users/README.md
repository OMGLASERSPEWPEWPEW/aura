# User Personas

This directory contains user personas that guide Aura's product development. Personas help ensure we build for real user needs, not abstract features.

## How to Use Personas

When designing or implementing features, consider:

1. **Which persona does this serve?** If it doesn't clearly serve one of our primary personas, question whether we should build it.
2. **Does this conflict with any persona's needs?** Features that help one persona but hurt another need careful design.
3. **Does this serve the anti-persona?** If yes, reconsider - we're optimizing for depth, not volume.

## Persona Overview

| Persona | Archetype | Core Need | Killer Features |
|---------|-----------|-----------|-----------------|
| [Analytical Systemizer](personas/analytical-systemizer.md) | Data-Driven Decoder | Objective data to reduce dating uncertainty | 11 Virtues, deep analysis, keyboard navigation |
| [Anxious Validator](personas/anxious-validator.md) | Reassurance Seeker | External validation and safety confirmation | Red/green flags, coaching, compatibility scores |
| [Casual Swiper](personas/anti-persona-casual-swiper.md) | Volume Optimizer | Speed and efficiency | **ANTI-PERSONA: DO NOT BUILD FOR** |

## Primary Personas

### Analytical Systemizer
The user who treats dating like a research project. They want data, patterns, and frameworks to reduce the chaos of human connection. Often tech-savvy, possibly neurodivergent, definitely systematic.

**Build for them when:** Creating features that provide depth, structure, and objective analysis.

### Anxious Validator
The user who needs external confirmation that they're making good choices. Dating triggers their anxiety, and they seek tools that help them feel safe and confident. Emotional intelligence over pure data.

**Build for them when:** Creating features that provide reassurance, safety checks, and guidance.

## Anti-Persona

### Casual Swiper
The user who wants to swipe through as many profiles as possible with minimal friction. They prioritize quantity over quality and don't want to slow down for analysis.

**DO NOT build for them.** Aura's value proposition is depth over breadth. Optimizing for speed would dilute our core offering and attract users who won't find value in what we actually provide.

## Persona-Feature Matrix

| Feature | Analytical Systemizer | Anxious Validator | Casual Swiper (Anti) |
|---------|----------------------|-------------------|---------------------|
| 11 Virtues system | HIGH | Medium | Low |
| Compatibility scores | HIGH | HIGH | Medium |
| Red/green flags | Medium | HIGH | Low |
| Conversation coaching | Medium | HIGH | Low |
| Quick analysis mode | Medium | Medium | HIGH (Don't build) |
| Detailed breakdowns | HIGH | Medium | Low (Don't build) |
| Keyboard shortcuts | HIGH | Low | N/A |
| Progress indicators | HIGH | HIGH | N/A |

## Updating Personas

Personas should evolve based on:
- User research and interviews
- Usage analytics patterns
- Customer support themes
- Feature request patterns

When updating, ensure:
1. Changes are grounded in evidence, not assumptions
2. Development Priorities section stays actionable
3. Anti-persona remains clearly differentiated
