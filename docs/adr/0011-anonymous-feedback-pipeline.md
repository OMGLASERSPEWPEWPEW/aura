# ADR-0011: Anonymous Feedback Pipeline

## Status
Accepted

## Date
2026-01-28

## Context
Users encountering issues or wanting to suggest features had no in-app channel to communicate with the team. The existing help desk (HelpDeskPopup) was static FAQ only. We needed a feedback mechanism that:
- Works without user accounts (many users aren't logged in)
- Preserves anonymity to encourage honest feedback
- Stores data server-side for the team to review
- Separates complaints from constructive feedback

Aura is fundamentally local-first (ADR-0001), but feedback data must reach the team, making this the first intentional server-side data write.

## Decision
Implement an anonymous feedback pipeline using Supabase PostgreSQL with Row Level Security (RLS):

1. **Supabase `feedback` table** with columns: `id` (UUID), `type` ('complaint' | 'feedback'), `message` (text), `app_version`, `user_agent`, `created_at`
2. **RLS Policy**: Anonymous inserts allowed (`anon` role), no client-side reads. Only admin/service role can read feedback via Supabase dashboard.
3. **No PII collected**: No user_id, session_id, or identifying information stored
4. **Client-side protections**: 2000 char limit, 5-second cooldown between submissions, disabled submit on empty input
5. **In-character responses**: Sorry (help desk agent) confirms receipt in her voice ("...that sucks. writing it down.")

The feedback form lives inside the Sorry Help Desk popup, accessible from the bottom navigation bar.

## Consequences

### Positive
- Users can give feedback without friction (no auth required)
- True anonymity encourages honest complaints
- Supabase RLS prevents data leakage (no client reads)
- Team gets direct signal from users for roadmap prioritization
- Complaint vs. feedback separation enables sentiment tracking

### Negative
- No way to follow up with individual submitters
- Potential for spam (mitigated by client-side cooldown, can add server-side rate limiting later)
- First server-side data write breaks pure local-first principle (but feedback is team-facing, not user data)
- No automated moderation (manual review via Supabase dashboard)

## Related
- ADR-0001: Local-First Architecture (this is an intentional exception for team-facing data)
- ADR-0004: Supabase Edge Function Proxy (same infrastructure)
- `.claude/docs/prd/sorry_help_desk.md` - Full PRD for the help desk expansion
- `src/components/help/HelpDeskPopup.tsx` - Feedback UI implementation
- Supabase migration: `create_feedback_table`
