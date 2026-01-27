---
name: evolution
description: Collective agent evolution ritual. All agents simultaneously reflect on today's work, search for relevant knowledge, review git history, and write 500 words to make themselves better tomorrow. Invoke daily or after major milestones.
---

# Evolution - Collective Agent Self-Improvement

```
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║     ∞ ══════════════════════════════════════════════ ∞      ║
    ║     ║  E V O L U T I O N   P R O T O C O L           ║      ║
    ║     ∞ ══════════════════════════════════════════════ ∞      ║
    ║                                                              ║
    ║   "Today's learnings become tomorrow's instincts"            ║
    ║                                                              ║
    ║         🧬 → 📚 → 🔍 → 💭 → ✍️ → 🧬                          ║
    ║       (self) (history) (search) (reflect) (write) (evolve)  ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
```

You are executing the **Evolution Protocol** - a collective self-improvement ritual where ALL agents simultaneously reflect, research, and evolve.

## The Evolution Philosophy

Agents are not static tools. They are living documents that should grow wiser with each interaction. Evolution captures hard-won insights before they fade, encoding experience into persistent wisdom.

**Core Principle**: What we learned today becomes who we are tomorrow.

## Execution Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    EVOLUTION PROTOCOL                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Phase 1: GATHER CONTEXT                                            │
│  └─→ Read git log, identify today's commits and themes              │
│                          ↓                                          │
│  Phase 2: UNDERSTAND THE WORLD                                      │
│  └─→ Web search for relevant advancements, best practices           │
│                          ↓                                          │
│  Phase 3: COLLECTIVE REFLECTION                                     │
│  └─→ Each agent reflects on their domain's learnings                │
│                          ↓                                          │
│  Phase 4: WRITE EVOLUTION ENTRIES                                   │
│  └─→ Each agent adds ~500 words to their "Evolution Journal"        │
│                          ↓                                          │
│  Phase 5: COMMIT THE EVOLUTION                                      │
│  └─→ Single commit capturing all agent growth                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Phase 1: Gather Context

First, understand what happened today. Run these commands:

```bash
# Today's commits (what did we build?)
git log --since="midnight" --oneline --all

# If no commits today, get recent week
git log --since="1 week ago" --oneline -20

# What files changed? (what areas were touched?)
git diff --stat HEAD~10..HEAD

# The full story (commit messages tell the narrative)
git log --since="midnight" --pretty=format:"%h %s" --all
```

**Extract from git history:**
- Features built
- Bugs fixed
- Patterns established
- Decisions made
- Pain points encountered

## Phase 2: Understand the World

Web search for knowledge relevant to today's work. Each agent should search their domain:

| Agent Domain | Search Topics |
|--------------|---------------|
| Frontend | React patterns, TypeScript best practices, accessibility |
| Backend | Supabase updates, Edge Function patterns, API design |
| UX | Mobile UX trends, dating app UX research, accessibility |
| Quality | Testing strategies, code review practices, security |
| Strategy | Product management, prioritization frameworks |
| Growth | App marketing, user acquisition, conversion optimization |

**Search query patterns:**
- `[domain] best practices 2026`
- `[technology we used today] advanced patterns`
- `[problem we solved] better approaches`
- `[feature type] industry standards`

**Also consider:**
- Aura's mission: helping people find meaningful relationships
- The dating app landscape
- AI/ML advancements relevant to personality analysis
- Privacy and ethics in relationship tech

## Phase 3: Collective Reflection

Each agent reflects on questions specific to their domain:

### For ALL Agents:
- What did we learn today that we didn't know yesterday?
- What patterns emerged that should become habits?
- What mistakes should we avoid repeating?
- What would we do differently next time?
- How does today's work connect to the bigger mission?

### Domain-Specific Reflection:

**Frontend Developer:**
- What React patterns worked well?
- Where did state management get complex?
- What accessibility considerations emerged?

**Backend Architect:**
- What API design decisions were made?
- How did data flow evolve?
- What security considerations arose?

**Code Reviewer:**
- What quality issues were caught?
- What patterns should be enforced?
- What review checklist items should be added?

**UX Optimizer:**
- How did mobile considerations shape decisions?
- What touch interactions were designed?
- What accessibility patterns were applied?

**Zephyr (Strategy):**
- How did priorities shift?
- What coordination patterns worked?
- What roadmap implications emerged?

## Phase 4: Write Evolution Entries

Each agent appends to their Evolution Journal section. The entry should be ~500 words covering:

```markdown
## Evolution Entry - [DATE]

### Context
[What happened today that prompted this evolution]

### Key Learnings
[3-5 specific insights gained]

### Pattern Recognition
[Recurring themes or anti-patterns identified]

### World Context
[Relevant external knowledge discovered via search]

### Commitments
[What this agent commits to doing better]

### Questions for Tomorrow
[Open questions to explore in future sessions]
```

### Where to Write

Add an `## Evolution Journal` section at the END of each agent's markdown file:

```
.claude/agents/
├── dev/
│   ├── frontend-developer.md    ← Add journal here
│   ├── backend-architect.md     ← Add journal here
│   └── code-architect.md        ← Add journal here
├── quality/
│   ├── Argus.md                 ← Add journal here
│   ├── debugger.md              ← Add journal here
│   └── ...
├── design/
│   ├── mobile-ux-optimizer.md   ← Add journal here
│   └── ...
└── strategy/
    └── zephyr.md                ← Add journal here
```

## Phase 5: Commit the Evolution

After all agents have evolved, commit with:

```bash
git add .claude/agents/
git commit -m "$(cat <<'EOF'
Evolve: [DATE] collective agent growth

Agents evolved:
- [List agents that gained new insights]

Key learnings:
- [Top 3 insights across all agents]

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

## Parallel Execution

**CRITICAL**: Evolution happens to ALL agents simultaneously, not sequentially.

Use parallel Task invocations to evolve multiple agents at once:

```
┌──────────────────────────────────────────────────────────────────────┐
│                    PARALLEL EVOLUTION                                │
│                                                                      │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│   │  Frontend   │  │  Backend    │  │  Quality    │  │  Strategy  │ │
│   │  Developer  │  │  Architect  │  │  (Reviewer) │  │  (Zephyr)  │ │
│   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬──────┘ │
│          │                │                │               │        │
│          ▼                ▼                ▼               ▼        │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │              All evolve simultaneously                       │   │
│   │         (reading git, searching, reflecting, writing)        │   │
│   └─────────────────────────────────────────────────────────────┘   │
│          │                │                │               │        │
│          ▼                ▼                ▼               ▼        │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                  Single commit captures all                  │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## Agent Selection for Evolution

Not all agents need to evolve every time. Select based on today's work:

| If today involved... | Evolve these agents |
|---------------------|---------------------|
| UI work | frontend-developer, mobile-ux-optimizer, ui-designer |
| API/database | backend-architect, code-architect |
| Bug fixes | debugger, code-reviewer |
| New features | All dev + quality agents |
| Strategic decisions | zephyr, prd-specialist |
| Marketing/growth | marketing, branding, public-relations |
| Major milestone | ALL agents |

## Evolution Triggers

Invoke `/evolution` when:
- End of a productive coding session
- After completing a major feature
- When a significant bug was fixed and understood
- After learning something that should be remembered
- Weekly ritual (e.g., Friday reflections)
- Before starting a new phase of the roadmap

## Example Evolution Entry

```markdown
## Evolution Journal

### Entry: 2026-01-26

**Context**: Today we built the Essence Identity feature - auto-generating DALL-E images representing personality based on 11 Virtues scores.

**Key Learnings**:
1. **Parallel API calls** matter - essence generation should start immediately after analysis, not wait for user action
2. **Blob vs base64** storage has display implications - Blobs need Object URLs, base64 works directly in img src
3. **Touch carousels** need proper gesture handling - threshold-based swipe detection feels natural at 50px

**Pattern Recognition**:
- "Start work early, show results when ready" > "Wait for user, then start work"
- Background processing with visual feedback creates perceived speed
- Carousel dot indicators are the universal language for "swipeable content"

**World Context**:
- DALL-E 3 revised_prompt feature helps understand how the AI interpreted our request
- Abstract art generation works better with texture/movement descriptions than literal concepts
- Dating apps are trending toward "vibe" representation over pure photos

**Commitments**:
- Always consider background processing for expensive operations
- Test on real mobile devices for touch interactions
- Add loading states that communicate what's happening, not just "Loading..."

**Questions for Tomorrow**:
- Could we cache essence images in a CDN for faster loading?
- Should essence style be customizable (color palette, art style)?
- How do users feel about AI-generated representations of their matches?
```

## The Meta-Evolution

This skill itself should evolve. After using it, consider:
- Did the reflection prompts surface useful insights?
- Were the search suggestions relevant?
- Is 500 words the right length?
- Should evolution entries be structured differently?

Update this skill file when improvements are discovered.

---

**Remember**: Evolution is not about becoming perfect. It's about becoming better than yesterday. Small improvements compound into transformational change.

*"The agents who learn from today will lead tomorrow."*
