# Aura Product Roadmap - Status Report

**Version**: 2.1
**Last Updated**: January 25, 2026
**Current Phase**: Phase 1B (Authentication) - In Progress
**Branch**: `feature/auth`

---

## Quick Status Summary

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 1A: API Security | COMPLETE | 100% |
| Phase 1B: Authentication | IN PROGRESS | ~85% |
| Phase 1C: Data Sync | NOT STARTED | 0% |
| Phase 2: Billing MVP | NOT STARTED | 0% |
| Phase 3: Mobile Polish | NOT STARTED | 0% |

---

## Phase 1A: API Security & Streaming

**Status**: COMPLETE
**Duration**: January 2026

### Completed Features

| Feature | Status | Notes |
|---------|--------|-------|
| Supabase project setup | DONE | Project ID: qaueoxubnifmtdirnxgz |
| Edge Function proxy (`anthropic-proxy`) | DONE | Deployed v4 |
| API key removed from frontend | DONE | Security risk resolved |
| Pro tier upgrade (150s timeout) | DONE | Supports long analyses |
| 4-chunk streaming analysis | DONE | Progressive UI with auto-save |
| Progressive thumbnail selection | DONE | Quality scoring across all 16 frames |
| Early save mechanism | DONE | Auto-saves after chunk 1 |

---

## Phase 1B: Authentication

**Status**: IN PROGRESS (~85% complete)
**Branch**: `feature/auth`

### Completed Features

| Feature | Status | Files | Notes |
|---------|--------|-------|-------|
| Supabase Auth client | DONE | `src/lib/supabase.ts` | Client initialized |
| Auth context provider | DONE | `src/contexts/AuthContext.tsx` | State management |
| Login page | DONE | `src/pages/Login.tsx` | Email/password form |
| Google OAuth | DONE | Login.tsx | Button works, redirect configured |
| Signup page | DONE | `src/pages/Signup.tsx` | Full validation |
| Password validation | DONE | `src/lib/utils/passwordValidation.ts` | 8+ chars, number, special char, match |
| Forgot password page | DONE | `src/pages/ForgotPassword.tsx` | Sends email |
| Reset password page | DONE | `src/pages/ResetPassword.tsx` | Form implemented |
| Protected routes | DONE | `src/components/auth/ProtectedRoute.tsx` | Auth wall working |
| Auth redirect flow | DONE | App.tsx | Unauthenticated users redirect to /login |
| UserMenu component | DONE | `src/components/auth/UserMenu.tsx` | Avatar dropdown in header |
| Header integration | DONE | `src/pages/Home.tsx` | UserMenu displays when logged in |
| Settings account section | DONE | `src/pages/Settings.tsx` | Email, sign-in method, sign out |
| Delete account modal | DONE | `src/components/auth/DeleteAccountModal.tsx` | UI component created |
| JWT verification (Edge Function) | DONE | `supabase/functions/anthropic-proxy/index.ts` | v4 deployed |
| Frontend JWT handling | DONE | `src/lib/api/anthropicClient.ts` | Sends access_token |
| Auth layout component | DONE | `src/components/auth/AuthLayout.tsx` | Consistent auth page styling |
| useRequireAuth hook | DONE | `src/hooks/useRequireAuth.ts` | Auth check utility |
| Session validation utils | DONE | `src/lib/utils/sessionValidation.ts` | Session checks, URL hash parsing |
| Database schema v9 | DONE | `src/lib/db.ts` | Auth fields in UserIdentity |
| Profile analysis (end-to-end) | DONE | - | Fixed JWT token issue |

### Unit Tests Added (52 total)

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `passwordValidation.test.ts` | 25 | Password requirements, email validation |
| `sessionValidation.test.ts` | 19 | Session validity, URL hash parsing, redirects |
| `ProtectedRoute.test.tsx` | 8 | Loading state, redirect behavior |

### Needs Verification / Partial

| Feature | Status | Issue | Action Needed |
|---------|--------|-------|---------------|
| Password reset flow | NEEDS TEST | Email link was redirecting to home instead of /reset-password | Fix deployed - needs re-test on production |
| Sign-in method display | NEEDS TEST | Was showing "unknown" for Google auth | Should show "Google" or "Email" correctly |
| Apple OAuth button | BLOCKED | Waiting Apple Developer approval | Button visible but non-functional |
| Delete account (full) | PARTIAL | UI exists, but Supabase account deletion needs Edge Function | Only clears local data currently |
| IndexedDB auth fields | NEEDS TEST | Should populate supabaseUserId, email, authProvider, linkedAt | Check via DevTools |
| Session persistence | NEEDS TEST | Login should persist across browser close | Manual verification needed |

### Not Started (Phase 1B remaining)

| Feature | Priority | Notes |
|---------|----------|-------|
| Apple OAuth | HIGH | Required for iOS App Store - pending Apple approval |
| Full account deletion | MEDIUM | Need Edge Function to delete Supabase auth record |
| E2E tests (Playwright) | LOW | Would automate OAuth and full flow testing |

---

## Phase 1C: Data Synchronization

**Status**: NOT STARTED
**Blocked by**: Phase 1B completion

### Outstanding Work

| Feature | Priority | Effort | Notes |
|---------|----------|--------|-------|
| PostgreSQL schema design | HIGH | 1 week | profiles, user_profiles tables |
| Sync service (Dexie <-> Supabase) | HIGH | 2 weeks | Bidirectional sync |
| Conflict resolution | HIGH | 1 week | Last-write-wins or manual merge |
| Offline mode handling | MEDIUM | 1 week | Queue changes when offline |
| Data migration for existing users | HIGH | 1 week | Preserve local data on signup |
| Data export endpoint | LOW | 2-3 days | Beyond current Tinder JSON |

### Exit Criteria

- [ ] Users can create accounts and log in
- [ ] Profile data syncs across devices
- [ ] Existing PWA users can migrate local data
- [ ] Offline analysis works, syncs when online

---

## Phase 2: Billing MVP

**Status**: NOT STARTED
**Blocked by**: Phase 1 completion
**Duration**: 4-6 weeks estimated

### Credit System

| Feature | Priority | Notes |
|---------|----------|-------|
| Credits table (PostgreSQL) | HIGH | Balance + transaction log |
| Credit balance API | HIGH | Check/deduct endpoints |
| Atomic credit deduction | HIGH | Deduct before analysis |
| Credit balance UI (header) | HIGH | Show remaining credits |
| Low-credit warning modal | MEDIUM | Prompt before running out |
| Free tier (3 credits at signup) | HIGH | New user onboarding |

### Stripe Integration

| Feature | Priority | Notes |
|---------|----------|-------|
| Stripe account setup | HIGH | Business account required |
| Products and prices | HIGH | $4.99 (10), $19.99 (50), $59.99 (200) |
| Stripe Checkout flow | HIGH | Redirect to Stripe, handle success |
| Webhook handler | HIGH | Process purchase confirmations |
| Purchase UI in app | HIGH | "Buy Credits" button/page |
| Subscription support ($14.99/mo) | MEDIUM | Unlimited tier |
| Subscription management UI | MEDIUM | Upgrade/downgrade/cancel |

### Exit Criteria

- [ ] Users can purchase credits
- [ ] Credits deduct atomically on analysis
- [ ] Subscriptions work (unlimited plan)
- [ ] Receipts sent via email
- [ ] Refund process documented

---

## Phase 3: Mobile Polish

**Status**: NOT STARTED
**Blocked by**: Phase 2 completion
**Duration**: 6-8 weeks estimated

### Capacitor Setup

| Feature | Notes |
|---------|-------|
| Initialize Capacitor project | Configure for iOS + Android |
| Test in simulators | Verify existing web app works |
| Fix critical layout issues | Responsive adjustments |
| Bottom tab navigation | Mobile-native pattern |

### Native UX Improvements

| Feature | Notes |
|---------|-------|
| Native file picker | Replace web file input |
| Haptic feedback | Touch response |
| Touch target sizes | 44pt minimum (Apple HIG) |
| Pull-to-refresh | Standard mobile pattern |
| Native share extension (iOS) | Share from other apps |
| Push notifications | Analysis completion alerts |

### In-App Purchases

| Feature | Notes |
|---------|-------|
| RevenueCat setup | Unified IAP handling |
| iOS products (App Store Connect) | Mirror Stripe products |
| Android products (Play Console) | Mirror Stripe products |
| IAP flow implementation | Purchase within app |
| RevenueCat <-> Stripe sync | Cross-platform purchase history |

### App Store Submission

| Feature | Notes |
|---------|-------|
| App Store screenshots | Marketing assets |
| Store descriptions | Compelling copy |
| Privacy nutrition labels (iOS) | Required disclosure |
| Data safety form (Android) | Required disclosure |
| TestFlight beta | Internal testing |
| Review feedback iteration | Address Apple/Google concerns |
| Public release | Go live |

### Exit Criteria

- [ ] iOS App Store approved
- [ ] Google Play approved
- [ ] IAP working on both platforms
- [ ] Push notifications working
- [ ] Web and mobile purchases sync

---

## Technical Debt & Known Issues

### High Priority

| Issue | Location | Notes |
|-------|----------|-------|
| React Refresh lint warning | AuthContext.tsx | Doesn't affect functionality |
| 6 database migrations | db.ts | Consider consolidation |
| 3 error handling patterns | Various | Standardization needed |
| Hardcoded values | Various | Move to config |

### Medium Priority

| Issue | Location | Notes |
|-------|----------|-------|
| IndexedDB ~300 profile limit | Architecture | Phase 1C sync will help |
| Union types without validation | ProfileAnalysis types | Consider Zod |
| No keyboard navigation | UI components | Accessibility |
| Small touch targets | Various | Mobile readiness |

### Low Priority

| Issue | Notes |
|-------|-------|
| Data export limited to Tinder JSON | Expand to other apps |
| No onboarding flow | New user experience |
| Information density | 10 sections on Overview |

---

## Infrastructure Status

| Component | Status | Notes |
|-----------|--------|-------|
| Vercel (Production) | LIVE | https://aura-xi-ten.vercel.app |
| Supabase Project | LIVE | qaueoxubnifmtdirnxgz |
| Edge Function (anthropic-proxy) | LIVE | v4 with JWT verification |
| Google OAuth | CONFIGURED | Working |
| Apple OAuth | PENDING | Awaiting Apple approval |
| Stripe | NOT STARTED | Phase 2 |
| RevenueCat | NOT STARTED | Phase 3 |
| Apple Developer Account | NOT STARTED | Phase 3 |
| Google Play Account | NOT STARTED | Phase 3 |

---

## Files Modified in Phase 1B

### New Files (16)

| File | Purpose |
|------|---------|
| `src/lib/supabase.ts` | Supabase client |
| `src/contexts/AuthContext.tsx` | Auth state & methods |
| `src/components/auth/AuthLayout.tsx` | Auth page layout |
| `src/components/auth/ProtectedRoute.tsx` | Route guard |
| `src/components/auth/ProtectedRoute.test.tsx` | Route guard tests |
| `src/components/auth/UserMenu.tsx` | Header dropdown |
| `src/components/auth/DeleteAccountModal.tsx` | Delete confirmation |
| `src/pages/Login.tsx` | Login page |
| `src/pages/Signup.tsx` | Registration |
| `src/pages/ForgotPassword.tsx` | Password reset request |
| `src/pages/ResetPassword.tsx` | Set new password |
| `src/hooks/useRequireAuth.ts` | Auth check hook |
| `src/lib/utils/passwordValidation.ts` | Password validation |
| `src/lib/utils/passwordValidation.test.ts` | Password validation tests |
| `src/lib/utils/sessionValidation.ts` | Session validation |
| `src/lib/utils/sessionValidation.test.ts` | Session validation tests |

### Modified Files (6)

| File | Changes |
|------|---------|
| `src/lib/db.ts` | Added auth fields to UserIdentity (v9) |
| `src/lib/api/anthropicClient.ts` | Sends JWT instead of anon key |
| `src/App.tsx` | Added AuthProvider + routes |
| `src/pages/Home.tsx` | Added UserMenu |
| `src/pages/Settings.tsx` | Added Account section |
| `supabase/functions/anthropic-proxy/index.ts` | JWT verification |

---

## Next Actions

### Immediate (This Sprint)

1. **Verify password reset flow** - Test email link on production
2. **Verify sign-in method display** - Check Google auth shows correctly
3. **Test IndexedDB auth fields** - Confirm population on login
4. **Test session persistence** - Close/reopen browser

### After Verification

1. **Merge `feature/auth` to `main`** - Triggers Vercel deploy
2. **Update MASTER_ROADMAP.md** - Mark Phase 1B complete
3. **Plan Phase 1C** - Data synchronization kickoff

### Blocked Items

1. **Apple OAuth** - Waiting Apple Developer approval
2. **Full account deletion** - Needs Edge Function implementation

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-25 | 2.1 | Phase 1B authentication status update - ~85% complete |
| 2026-01-XX | 2.0 | Phase 1A complete - API proxy and streaming |
| 2026-01-XX | 1.0 | Initial roadmap |
