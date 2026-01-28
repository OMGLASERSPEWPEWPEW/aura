---
name: docs-check
description: Pre-push documentation review. Analyzes git changes and suggests which docs need updating before pushing to main.
---

# /docs-check - Documentation Review Before Push

```
    +---------------------------------------------------------+
    |                                                         |
    |   DOCS CHECK - Pre-Push Documentation Review            |
    |                                                         |
    |   git diff -> analyze changes -> suggest doc updates    |
    |                                                         |
    +---------------------------------------------------------+
```

You are running the **Documentation Check** skill. This ensures documentation stays current before pushing to main.

## Purpose

Code and documentation drift apart over time. This skill catches that drift by:
1. Analyzing what changed in the code
2. Mapping changes to documentation that might need updates
3. Providing a checklist before pushing

## Execution Flow

### Step 1: Gather Changes

Run these commands to understand what changed:

```bash
# What's staged for commit?
git diff --cached --stat

# What's been committed since last push?
git log origin/main..HEAD --oneline 2>/dev/null || git log -10 --oneline

# Full diff of changes (for analysis)
git diff origin/main..HEAD --stat 2>/dev/null || git diff HEAD~5..HEAD --stat
```

### Step 2: Categorize Changes

Analyze the changed files and categorize:

| Change Type | Files Pattern | Docs to Review |
|-------------|---------------|----------------|
| **New Feature** | New components, hooks, lib files | CLAUDE.md (Architecture, Key Files) |
| **API Changes** | `src/lib/api/`, Edge Functions | CLAUDE.md (API Layer, Environment) |
| **Schema Changes** | `src/lib/db.ts`, types | CLAUDE.md (Database Schema) |
| **New Patterns** | Hooks, contexts, utilities | CLAUDE.md (Key Patterns) |
| **Architecture** | New directories, major refactors | docs/adr/ (new ADR needed?) |
| **Commands** | package.json scripts | CLAUDE.md (Development Commands) |
| **Infrastructure** | Vercel, Supabase, env | CLAUDE.md (Infrastructure) |
| **Roadmap Items** | Feature completion | .claude/docs/roadmap.md |

### Step 3: Generate Checklist

Based on the changes, generate a checklist:

```markdown
## Documentation Review Checklist

Based on changes in this push:

### CLAUDE.md Updates
- [ ] Architecture section reflects new data flows
- [ ] Key Files section includes new important files
- [ ] Directory Structure is current
- [ ] Key Patterns documents new patterns
- [ ] Database Schema matches db.ts

### ADR Considerations
- [ ] Major architectural decision? -> Create new ADR
- [ ] Changed existing pattern? -> Update relevant ADR

### Roadmap Updates
- [ ] Completed features marked done
- [ ] New discoveries/tasks added
- [ ] Blocked items updated

### No Updates Needed
- [ ] Changes are internal implementation only
- [ ] No public API or pattern changes
- [ ] Documentation is current
```

### Step 4: Provide Specific Recommendations

For each area that needs updates, provide specific guidance:

**Example output:**

```
## /docs-check Results

### Changes Detected
- New hook: useStreamingAnalysis.ts
- Modified: db.ts (added moodboardImage field)
- New directory: src/lib/moodboard/

### Documentation Updates Needed

1. **CLAUDE.md - Database Schema**
   Add to profiles table:
   - `moodboardImage` - DALL-E generated lifestyle scene Blob
   - `moodboardPrompt` - The prompt used for mood board generation

2. **CLAUDE.md - Directory Structure**
   Add under src/lib/:
   - `moodboard/` - Mood Board generation (theme extraction, DALL-E prompts)

3. **CLAUDE.md - Core Data Flow**
   Update diagram to show Mood Board generation after chunk 3

4. **ADR Consideration**
   The streaming + progressive generation pattern is significant enough
   for a new ADR. Consider: "ADR-0011: Progressive Generation During Analysis"

### Ready to Push?
- [ ] Review and apply updates above
- [ ] Run `npm run test:run && npm run test:e2e`
- [ ] Commit documentation changes
- [ ] Push to main
```

## When to Run

Invoke `/docs-check` when:
- Before pushing a feature branch to main
- After completing a significant piece of work
- When you're unsure if docs need updating
- As part of your pre-push checklist

## Quick Reference

Documentation files to check:
- `CLAUDE.md` - Main project documentation
- `docs/adr/` - Architectural Decision Records
- `.claude/docs/roadmap.md` - Project roadmap and status

---

*"Code tells you how, documentation tells you why. Keep them in sync."*
