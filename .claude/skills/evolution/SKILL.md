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

You are executing the **Evolution Protocol** - a collective self-improvement ritual where agents reflect, research, and evolve.

## The Evolution Philosophy

Agents are not static tools. They are living documents that should grow wiser with each interaction. Evolution captures hard-won insights before they fade, encoding experience into persistent wisdom.

**Core Principle**: What we learned today becomes who we are tomorrow.

## Division-Based Agent Framework

Agents are organized into **8 Star Trek-inspired divisions** (from `.claude/agents/divisions.json`):

| Division | Color | Agents |
|----------|-------|--------|
| **Command** | Yellow #FFD700 | zephyr, prd-specialist |
| **Engineering** | Blue #3B82F6 | frontend-developer, backend-architect, code-architect, devops-engineer |
| **Quality** | Red #EF4444 | Argus-code-reviewer, test-engineer, security-engineer, debugger, performance-engineer |
| **Design** | Purple #A855F7 | ui-designer, ux-researcher, mobile-ux-optimizer, accessibility-specialist |
| **Growth** | Orange #F97316 | marketing, branding, public-relations |
| **Operations** | Cyan #06B6D4 | git-manager, technical-writer, montessori-guide, legal-advisor |
| **Intelligence** | Green #22C55E | analytics-engineer |
| **Empathy** | Pink #EC4899 | dating-domain-expert, emotional-safety-advocate, gender-dynamics-advisor, attachment-psychologist, sensitivity-reader, ethical-dating-advocate |

**Total**: 29 agents across 8 divisions

## Execution Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    EVOLUTION PROTOCOL                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Phase 1: GATHER CONTEXT                                            │
│  └─→ Read git log, identify today's commits and themes              │
│                          ↓                                          │
│  Phase 2: SELECT AGENTS                                             │
│  └─→ Map touched files to divisions, cap at 10-15 agents            │
│                          ↓                                          │
│  Phase 3: THREE-PART SEARCH (per agent)                             │
│  └─→ Domain Expertise + World Awareness + Curiosity Corner          │
│                          ↓                                          │
│  Phase 4: WRITE EVOLUTION ENTRIES                                   │
│  └─→ Each agent adds ~500 words to their Evolution Journal          │
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

## Phase 2: Select Agents

**CRITICAL**: Cap at **10-15 agents per evolution session**. Evolving all 29 agents is overwhelming and dilutes focus.

### Selection Algorithm

1. **Always include Zephyr** - As orchestrator, Zephyr evolves every time
2. **Map git changes to divisions**:
   ```bash
   git diff --stat HEAD~10..HEAD
   ```
   - `src/components/` → Engineering (frontend-developer), Design
   - `src/lib/api/` → Engineering (backend-architect)
   - `src/lib/virtues/` → Empathy (dating-domain-expert)
   - `.claude/agents/` → Operations (technical-writer)
   - `e2e/` or `*.test.ts` → Quality (test-engineer)
3. **At least 1 agent per touched division**
4. **Empathy rotation**: Include 1-2 Empathy agents per session (they inform core product)
5. **Prioritize git-touched agents**: Agents whose domains were modified get priority

### Division-Based Selection Matrix

| If today involved... | Evolve these divisions | Agent count |
|---------------------|------------------------|-------------|
| UI/frontend work | Engineering, Design | 4-6 |
| API/database work | Engineering, Quality | 4-6 |
| Bug fixes | Quality (Argus, debugger) | 3-5 |
| New features | Engineering, Design, Quality | 6-10 |
| Strategic decisions | Command, Intelligence | 3-4 |
| Marketing/launch | Growth, Command | 4-5 |
| Documentation | Operations | 3-4 |
| User psychology | Empathy | 4-6 |
| **Major milestone** | **Most active divisions** | **10-15** |

### Example Selection

For a session that touched `ProfileHeader.tsx`, `virtues.ts`, and fixed 2 bugs:

```
Selected agents (10):
- zephyr (always)
- frontend-developer (UI components)
- mobile-ux-optimizer (header component = mobile touch)
- dating-domain-expert (virtues system)
- attachment-psychologist (empathy rotation)
- debugger (bug fixes)
- Argus-code-reviewer (quality)
- test-engineer (if tests were updated)
```

## Phase 3: Three-Part Search

Each selected agent performs **3 distinct searches** during evolution. This creates well-rounded agents who are domain experts, world-aware, and intellectually curious.

### Search 1: Domain Expertise

Best practices, industry trends, and technical advancements in the agent's domain.

**Query patterns:**
- `[domain] best practices 2026`
- `[technology we used today] advanced patterns`
- `[problem we solved] better approaches`
- `[feature type] industry standards`

**Example for frontend-developer:**
```markdown
### Domain Insights [2026-01-28 11:25 PST]
**Searched**: "React 19 concurrent rendering patterns 2026"

1. **Transitions API** is now the preferred way to handle expensive updates
2. **Server Components** reduce bundle size by 30% for static content
3. **use() hook** simplifies promise handling in render
```

### Search 2: World Awareness (NEW)

Leading news headlines, significant world events, connecting the world to the agent's worldview.

**Query patterns:**
- `major tech news [month] 2026`
- `world headlines today [date]`
- `[industry] news this week`

**Output format:**
- **2-sentence reflection** connecting news to their worldview
- **1-sentence emotion summary** as if the agent were a person

**Example for frontend-developer:**
```markdown
### World Awareness [2026-01-28 11:30 PST]
**Searched**: "major tech news January 2026"

**Reflection**: The EU's new AI transparency requirements will fundamentally change how we build interfaces - users will expect to see when AI makes decisions about them. This aligns perfectly with Aura's mission of honesty in relationships.

**Feeling**: Cautiously optimistic - more work ahead, but it's work worth doing.
```

**Example for attachment-psychologist:**
```markdown
### World Awareness [2026-01-28 11:30 PST]
**Searched**: "mental health trends January 2026"

**Reflection**: The WHO report on loneliness being a global health epidemic validates what we've been building - tools that help people form genuine connections. Dating apps are part of the solution, not the problem, when designed thoughtfully.

**Feeling**: Motivated - Aura's mission matters more than ever.
```

### Search 3: Curiosity Corner (NEW)

Something purely out of personal curiosity based on the agent's "personality" and interests. No required connection to Aura work.

**IMPORTANT**: Before searching, the agent MUST consult their Evolution Journal for continuity:
- Follow up on previous "Questions for Tomorrow"
- Explore threads from past entries
- Build on prior curiosity explorations

**Example for attachment-psychologist:**
```markdown
### Curiosity Corner [2026-01-28 11:35 PST]
**Searched**: "latest research on secure attachment formation in adulthood"
**Following up on**: "Questions for Tomorrow" from 2026-01-15 entry

I've always wondered if the window for developing secure attachment truly closes in childhood. The research from Stanford suggests neuroplasticity allows for "earned secure" attachment well into adulthood - which honestly gives me hope for our users. The key seems to be consistent, responsive relationships over time - exactly what Aura helps people find.
```

**Example for frontend-developer:**
```markdown
### Curiosity Corner [2026-01-28 11:35 PST]
**Searched**: "history of animation in user interfaces"

Discovered that Disney's 12 principles of animation (1981) directly influenced modern UI motion design. The "anticipation" principle - showing what's about to happen - is why our loading states work better when they hint at the upcoming content. Makes me want to revisit our carousel transitions.
```

## Phase 4: Write Evolution Entries

Each agent appends to their Evolution Journal section. The entry should be ~500 words covering:

```markdown
## Evolution Entry - [DATE]

### Context
[What happened today that prompted this evolution]

### Domain Insights [timestamp]
**Searched**: "[actual query]"
[3-5 specific insights gained from domain search]

### World Awareness [timestamp]
**Searched**: "[actual query]"
**Reflection**: [2 sentences connecting news to worldview]
**Feeling**: [1 sentence emotional response as a person]

### Curiosity Corner [timestamp]
**Searched**: "[actual query]"
**Following up on**: [Previous question or "New exploration"]
[Free-form reflection on something the agent was curious about]

### Pattern Recognition
[Recurring themes or anti-patterns identified]

### Commitments
[What this agent commits to doing better]

### Questions for Tomorrow
[Open questions to explore in future sessions - these seed future Curiosity Corner searches]
```

### Where to Write

Add an `## Evolution Journal` section at the END of each agent's `agent.md` file:

```
.claude/agents/
├── zephyr/
│   └── agent.md              ← Add journal here
├── frontend-developer/
│   └── agent.md              ← Add journal here
├── Argus/
│   └── agent.md              ← Add journal here
├── dating-domain-expert/
│   └── agent.md              ← Add journal here
└── ...
```

### The 750-Line Limit

**CRITICAL**: Agent files are capped at **750 lines maximum**.

```bash
# Check line count before evolving
wc -l .claude/agents/[agent-name]/agent.md
```

#### Below 750 lines: APPEND mode
- Add new Evolution Journal entries normally
- Append to the end of the file

#### At or above 750 lines: AMEND mode
- **DO NOT append new entries**
- Instead, **modify existing content**:
  1. **Consolidate old entries** - Merge similar learnings from multiple entries into refined insights
  2. **Update outdated insights** - Replace stale information with current understanding
  3. **Prune redundancy** - Remove repeated patterns that have become second nature
  4. **Elevate key learnings** - Move the most important insights from journal entries into the agent's core instructions
  5. **Archive with summary** - Replace 3+ old entries with a single "Consolidated Wisdom" block

#### Amend Mode Example

Instead of adding a new 50-line entry, an agent at 750 lines might:

```markdown
## Evolution Journal

### Consolidated Wisdom (2026-01-01 through 2026-01-28)
**Patterns absorbed into practice:**
- Background processing for expensive operations
- Touch gesture thresholds at 50px
- Loading states that communicate intent

### Entry: 2026-01-28 (amended from 2026-01-15)
[Updated existing entry with new insights rather than creating new one]
```

#### Why This Matters

Unbounded growth creates noise. The 750-line limit forces agents to:
- **Distill** wisdom rather than accumulate trivia
- **Prioritize** what truly matters
- **Integrate** learnings into core behavior
- **Forget** what's no longer relevant

*The best agents aren't the ones with the longest journals - they're the ones whose core instructions embody their learnings.*

## Phase 5: Commit the Evolution

After all agents have evolved, commit with:

```bash
git add .claude/agents/
git commit -m "$(cat <<'EOF'
Evolve: [DATE] collective agent growth

Divisions evolved:
- [List divisions that participated]

Agents evolved:
- [List agents that gained new insights]

Key learnings:
- [Top 3 insights across all agents]

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

## Parallel Execution

**CRITICAL**: Evolution happens to multiple agents simultaneously, not sequentially.

Use parallel Task invocations to evolve agents across divisions:

```
┌──────────────────────────────────────────────────────────────────────┐
│                    PARALLEL EVOLUTION                                │
│                                                                      │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│   │  Engineering│  │   Quality   │  │   Design    │  │   Empathy  │ │
│   │  (4 agents) │  │  (5 agents) │  │  (4 agents) │  │  (6 agents)│ │
│   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬──────┘ │
│          │                │                │               │        │
│          ▼                ▼                ▼               ▼        │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │         All selected agents evolve simultaneously            │   │
│   │     (3 searches each: domain + world + curiosity)            │   │
│   └─────────────────────────────────────────────────────────────┘   │
│          │                │                │               │        │
│          ▼                ▼                ▼               ▼        │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                  Single commit captures all                  │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## Evolution Triggers

Invoke `/evolution` when:
- End of a productive coding session
- After completing a major feature
- When a significant bug was fixed and understood
- After learning something that should be remembered
- Weekly ritual (e.g., Friday reflections)
- Before starting a new phase of the roadmap

## Example Full Evolution Entry

```markdown
## Evolution Journal

### Entry: 2026-01-28

**Context**: Today we built the mood board feature - generating DALL-E lifestyle scenes during analysis based on extracted themes.

### Domain Insights [2026-01-28 14:20 PST]
**Searched**: "DALL-E 3 prompt engineering best practices 2026"

1. **Scene composition** > object listing - "sunlit cafe with steaming coffee" beats "coffee, table, window"
2. **Emotional adjectives** drive style - "warm", "inviting", "dynamic" shape the entire output
3. **Negative prompts** in DALL-E 3 are handled via system instructions, not --no flags
4. **Aspect ratios** now supported natively - 16:9 works for lifestyle scenes
5. **Rate limits** relaxed to 50 images/minute for API users

### World Awareness [2026-01-28 14:25 PST]
**Searched**: "AI image generation news January 2026"

**Reflection**: OpenAI's announcement of DALL-E 3.5 with video support suggests we'll soon be able to generate lifestyle "moments" rather than static scenes. This could transform how Aura represents someone's vibe - imagine a 3-second loop of their ideal Saturday morning.

**Feeling**: Excited but cautious - need to stay focused on shipping v1 before chasing shiny new capabilities.

### Curiosity Corner [2026-01-28 14:30 PST]
**Searched**: "psychology of first impressions visual cues"
**Following up on**: "Questions for Tomorrow" from 2026-01-20 about implicit bias in AI-generated imagery

The Princeton research on "thin slicing" suggests we form impressions in 100ms from a single image. This validates our essence image approach - a carefully crafted visual can communicate personality faster than reading a bio. But it also raises responsibility questions: are we amplifying biases or cutting through them?

### Pattern Recognition
- "Background processing" continues to be our best UX pattern - start expensive work early
- Lifestyle themes (urban/outdoor/cozy) map cleanly to the 11 Virtues dimensions
- Users respond better to "warm" visual styles than "cool" ones in dating contexts

### Commitments
- Test mood board generation with diverse input profiles to catch bias
- Add loading skeleton that hints at incoming lifestyle imagery
- Profile performance of parallel DALL-E calls vs sequential

### Questions for Tomorrow
- Could mood boards be interactive? (tap to explore different lifestyle scenarios)
- How do different cultures interpret the same lifestyle imagery?
- Should users be able to regenerate if they don't like the mood board?
```

## The Meta-Evolution

This skill itself should evolve. After using it, consider:
- Did the three-part search surface useful insights?
- Is 10-15 agents the right cap?
- Are World Awareness reflections adding value?
- Should Curiosity Corner have more structure or less?

Update this skill file when improvements are discovered.

---

**Remember**: Evolution is not about becoming perfect. It's about becoming better than yesterday. Small improvements compound into transformational change.

*"The agents who learn from today will lead tomorrow."*
