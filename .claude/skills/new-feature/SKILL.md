---
name: new-feature
description: Disciplined waterfall process for implementing new features. Orchestrates Zephyr → PRD Specialist → relevant agents in proper sequence. Use this whenever building a new feature from scratch.
---

# New Feature Implementation Workflow

You are executing the **disciplined new feature workflow** for Aura. This ensures every feature is approached consistently with proper planning before implementation.

## Waterfall Process

Execute these phases IN ORDER. Do not skip phases.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    NEW FEATURE WATERFALL                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Phase 1: STRATEGY (Zephyr)                                        │
│  └─→ Analyze request, check roadmap fit, identify dependencies     │
│                          ↓                                          │
│  Phase 2: REQUIREMENTS (PRD Specialist)                            │
│  └─→ Create comprehensive PRD with specs, acceptance criteria      │
│                          ↓                                          │
│  Phase 3: UX RESEARCH (if user-facing)                             │
│  └─→ UX Researcher + Mobile UX Optimizer input                     │
│                          ↓                                          │
│  Phase 4: ARCHITECTURE (Code Architect)                            │
│  └─→ Design folder structure, data models, API contracts           │
│                          ↓                                          │
│  Phase 5: IMPLEMENTATION (Frontend/Backend Developers)             │
│  └─→ Build the feature following the PRD and architecture          │
│                          ↓                                          │
│  Phase 6: QUALITY (Code Reviewer + Test Engineer)                  │
│  └─→ Review code, write tests, verify acceptance criteria          │
│                          ↓                                          │
│  Phase 7: DOCUMENTATION                                            │
│  └─→ Update CLAUDE.md, ADRs, feature_inventory.md as needed        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Phase 1: Strategic Analysis (Zephyr)

Invoke the `master-product-manager` agent to:

1. **Validate roadmap fit**: Does this feature align with current phase goals?
2. **Check dependencies**: What must exist before this feature?
3. **Assess priority**: RICE score the feature
4. **Identify stakeholders**: Who cares about this feature?
5. **Define success metrics**: How will we know it worked?

**Output**: Go/no-go decision with strategic context

## Phase 2: Product Requirements (PRD Specialist)

Invoke the `prd-specialist` agent to create a PRD at `.claude/docs/prd/<feature_name>.md`:

1. **Executive Summary**: Problem, solution, impact
2. **User Stories**: As a [user], I want [goal], so that [benefit]
3. **Functional Requirements**: Numbered, testable requirements
4. **Non-Functional Requirements**: Performance, security, accessibility
5. **Technical Considerations**: Data model, API changes, integrations
6. **UI/UX Specifications**: Wireframes, flows, states
7. **Success Metrics**: Measurable outcomes
8. **Rollout Plan**: Phased deployment strategy
9. **Risks & Mitigations**: What could go wrong

**Output**: Complete PRD document

## Phase 3: UX Research (if user-facing)

For features with UI, invoke these agents:

**UX Researcher** (`mobile-ux-optimizer` in UXR mode):
- User mental models
- Competitive analysis
- Behavioral insights
- A/B test recommendations

**Mobile UX Optimizer**:
- Touch target sizing (44px minimum)
- Progressive disclosure strategy
- Mobile-first layout
- Accessibility requirements

**Output**: UX recommendations integrated into PRD

## Phase 4: Architecture Design (Code Architect)

Invoke the `code-architect` agent to:

1. **Folder structure**: Where do new files go?
2. **Data models**: TypeScript interfaces, Dexie schema changes
3. **API contracts**: Function signatures, return types
4. **Component hierarchy**: React component tree
5. **State management**: Hooks, context, Dexie queries

**Output**: Architecture document or section in PRD

## Phase 5: Implementation (Developers)

Based on the feature type, invoke:

**Frontend-heavy features** → `frontend-developer`:
- React components
- Hooks
- UI state management
- Styling with Tailwind

**Backend-heavy features** → `backend-architect`:
- Supabase schema changes
- Edge Functions
- API integrations
- Data migrations

**Full-stack features** → Both agents in sequence

**Output**: Working code with inline comments

## Phase 6: Quality Assurance

After implementation, ALWAYS invoke:

**Code Reviewer** (`code-reviewer`):
- Code quality review
- Security audit
- Performance review
- Best practices check

**Test Engineer** (via `debugger` or manual):
- Unit tests for new functions
- E2E tests for user flows
- Edge case coverage

**Verification**:
```bash
npm run test:run   # All unit tests pass
npm run test:e2e   # All E2E tests pass
npm run build      # No TypeScript errors
```

**Output**: Reviewed, tested code ready for main

## Phase 7: Documentation

Update relevant documentation:

| Document | When to Update |
|----------|----------------|
| `CLAUDE.md` | Architecture, patterns, or key files changed |
| `feature_inventory.md` | New feature added |
| `docs/adr/` | Significant architectural decision made |
| PRD | Deviations from original spec |

## Checkpoints

Before proceeding to the next phase, confirm:

- [ ] **Phase 1 → 2**: Zephyr approved the feature
- [ ] **Phase 2 → 3**: PRD created and saved
- [ ] **Phase 3 → 4**: UX recommendations documented (if applicable)
- [ ] **Phase 4 → 5**: Architecture defined
- [ ] **Phase 5 → 6**: Implementation complete
- [ ] **Phase 6 → 7**: Tests pass, code reviewed
- [ ] **Phase 7 → Done**: Docs updated, ready to commit

## Usage Example

When user says: "Build a feature to show AI usage history"

```
1. Invoke Zephyr → Validates fits Phase 2 billing prep, RICE score 25.2
2. Invoke PRD Specialist → Creates .claude/docs/prd/inference_history.md
3. Invoke UX Researcher → Recommends "investment" framing, value pairing
4. Invoke Mobile UX Optimizer → 3-level progressive disclosure, 44px targets
5. Invoke Code Architect → src/lib/inference/ structure, Dexie v13 schema
6. Invoke Frontend Developer → Builds AIInsightsCard component
7. Invoke Code Reviewer → Reviews all new code
8. Run tests → 933 pass
9. Update docs → feature_inventory.md updated
10. Commit to main
```

## Shortcuts

For small features (< 1 day effort), phases can be combined:
- Phases 1+2: Zephyr does quick strategic check, creates mini-PRD inline
- Phases 3+4: Skip if no UI or obvious architecture
- Phases 6+7: Combine review and docs

For large features (> 1 week effort):
- Each phase may require multiple sessions
- Use TodoWrite to track progress across phases
- Consider feature branches

---

**Remember**: Discipline enables speed. Taking time to plan properly prevents costly rework later.
