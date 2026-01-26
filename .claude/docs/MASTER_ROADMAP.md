# Aura Master Roadmap

**Version**: 2.1
**Date**: January 2026
**Status**: Phase 1A Complete | Phase 1B In Progress | Phase 2 Planning

---

## Executive Summary

This master roadmap synthesizes findings from the documentation sprint to chart Aura's evolution from a local-first PWA to a monetized, cross-platform application. The transformation requires three major phases spanning 14-20 weeks, with a critical security fix (API key exposure) as the immediate priority.

---

## Current State Summary

### Architecture Assessment

| Dimension | Current State | Risk Level |
|-----------|---------------|------------|
| **Security** | API key secured via Supabase Edge Function proxy | Resolved |
| **Scalability** | IndexedDB limited to ~300 profiles | Medium |
| **Data Integrity** | 6 migrations, union types, Zod validation available | Low |
| **Maintainability** | Typed AuraError infrastructure, standardized patterns | Low |
| **Performance** | 4-chunk streaming analysis with progressive UI | Resolved |

### UX Assessment

| Dimension | Current State | Priority |
|-----------|---------------|----------|
| **Upload Flow** | 4-chunk streaming with progressive UI, insight cards | Resolved |
| **Information Density** | 10 sections on Overview, 11 Virtues | Medium |
| **Conditional Features** | Scoring requires profile setup (hidden) | High |
| **Accessibility** | No keyboard nav, small touch targets | Medium |
| **Onboarding** | None | Medium |

### Feature Readiness

- Core analysis pipeline working (4-chunk streaming)
- Full feature set implemented (23+ features)
- Supabase Edge Function proxy deployed (Pro tier, 150s timeout)
- Progressive streaming UI with auto-save
- Conversation coaching with response scoring
- User profile synthesis with 11 Virtues system
- Typed error infrastructure (AuraError hierarchy)
- Comprehensive test coverage (800+ unit tests, 321 E2E tests)
- Settings page minimal
- Data export limited to Tinder JSON
- No credit/billing system
- Native mobile apps not started

---

## Strategic Recommendations

### Technology Stack Additions

| Layer | Current | Recommended | Rationale |
|-------|---------|-------------|-----------|
| Auth | Supabase Auth (email + Google) | Add Apple OAuth | Required for iOS App Store |
| Database | IndexedDB + Supabase sync | Current is good | Scalable, synced |
| API Gateway | Supabase Edge Functions | Current is good | Secure API key |
| Payments (Web) | None | Stripe | Industry standard |
| Payments (Mobile) | None | RevenueCat | Unified IAP handling |
| Mobile Wrapper | PWA | Capacitor | Fastest path to stores |

### Monetization Model

**Credit System**:
- 1 credit = 1 profile analysis
- Free tier: 3 credits at signup
- Paid tiers: $4.99 (10), $19.99 (50), $59.99 (200)
- Subscription: $14.99/month unlimited

**Revenue Projections** (conservative):
- 10,000 MAU x 5% paid conversion x $8 ARPU = $4,000/month
- Break-even: ~$500/month (API costs + infrastructure)

---

## Phased Implementation Plan

### Phase 1A: Architecture Pivot - COMPLETE

**Duration**: Completed January 2026
**Goal**: Secure the API key and establish backend infrastructure

#### Week 1-2: Supabase Setup + API Proxy
- [x] Create Supabase project (qaueoxubnifmtdirnxgz)
- [x] Implement Edge Function for Anthropic proxy (`anthropic-proxy`)
- [x] Update frontend to use proxy endpoint
- [x] **Remove API key from frontend bundle** - RESOLVED
- [x] Verify API calls work through proxy
- [x] Deploy and test in production
- [x] Upgrade to Pro tier (150-second timeout)
- [x] Implement streaming analysis (4-chunk progressive UI)

#### Week 3-4: Authentication
- [x] Implement email/password signup
- [x] Implement Google OAuth
- [ ] Implement Apple OAuth (required for iOS) - **BLOCKED: App Store review**
- [x] Add auth state management to frontend
- [x] Create protected route wrapper
- [x] Implement session management UI

#### Week 5-6: Data Synchronization
- [x] Create PostgreSQL schema (profiles, user_profiles)
- [x] Implement sync service (Dexie <-> Supabase)
- [x] Handle conflict resolution (last-write-wins)
- [x] Test offline scenarios
- [x] Migrate existing local data for logged-in users
- [ ] Implement data export endpoint

**Phase 1A Exit Criteria**:
- [x] API key not in frontend bundle
- [x] Users can create accounts
- [x] Profile data syncs across devices
- [x] Existing PWA users can migrate data

---

### Phase 1B: Quality & Polish - IN PROGRESS

**Duration**: 2-3 weeks
**Goal**: Improve code quality, test coverage, and UI consolidation

#### Tech Debt (January 26, 2026)
- [x] Typed error infrastructure (AuraError hierarchy)
- [x] Standardize error handling across all hooks
- [x] Smart JSON extraction with multi-strategy fallback
- [x] E2E test fixes (50 tests updated)
- [x] Unit test coverage for streaming analysis
- [x] 11 Virtues system comprehensive tests (68 tests)
- [x] Remove legacy 23 Aspects UI completely
- [x] Consolidate user profile display
- [x] Agent organization (role-based folders)

#### Remaining
- [ ] Apple OAuth integration (awaiting App Store)
- [ ] Data export endpoint
- [ ] Onboarding flow
- [ ] Accessibility improvements

---

### Phase 2: Billing MVP

**Duration**: 4-6 weeks
**Goal**: Implement credit system and payment processing

#### Week 1-2: Credit System

- [ ] Create credits table and transactions log
- [ ] Implement credit balance API
- [ ] Add credit deduction on analysis (atomic)
- [ ] Update frontend to check credits before analysis
- [ ] Add credit balance display in header
- [ ] Implement low-credit warning modal
- [ ] **NEW**: AI inference history tracking (see below)

#### Week 3-4: Stripe Integration

- [ ] Set up Stripe account
- [ ] Create products and prices
- [ ] Implement Stripe Checkout integration
- [ ] Implement webhook handler for purchases
- [ ] Test sandbox purchases
- [ ] Add purchase UI in app

#### Week 5-6: Subscription Support

- [ ] Create subscription products in Stripe
- [ ] Implement subscription checkout
- [ ] Handle subscription status checks
- [ ] Implement subscription management UI
- [ ] Add "unlimited" flag handling
- [ ] Test upgrade/downgrade flows

**Phase 2 Exit Criteria**:
- [ ] Users can purchase credits
- [ ] Credits deduct on analysis
- [ ] Subscriptions work
- [ ] Receipts sent via email
- [ ] Refund process documented

---

### Phase 3: Mobile Polish

**Duration**: 6-8 weeks
**Goal**: Launch on iOS App Store and Google Play

#### Week 1-2: Capacitor Setup

- [ ] Initialize Capacitor project
- [ ] Configure iOS and Android platforms
- [ ] Test existing web app in simulators
- [ ] Fix critical layout issues
- [ ] Implement bottom tab navigation

#### Week 3-4: Native UX Improvements

- [ ] Replace file input with native picker
- [ ] Implement haptic feedback
- [ ] Fix touch target sizes (44pt minimum)
- [ ] Add pull-to-refresh
- [ ] Implement native share extension (iOS)
- [ ] Add push notifications for analysis completion

#### Week 5-6: In-App Purchases

- [ ] Set up RevenueCat
- [ ] Configure iOS products in App Store Connect
- [ ] Configure Android products in Play Console
- [ ] Implement IAP flow in app
- [ ] Test sandbox purchases on both platforms
- [ ] Sync RevenueCat with Stripe (web purchases)

#### Week 7-8: App Store Submission

- [ ] Create App Store screenshots
- [ ] Write App Store description
- [ ] Complete privacy nutrition labels
- [ ] Complete Google Play data safety form
- [ ] Submit for TestFlight beta
- [ ] Address review feedback
- [ ] Submit for public release

**Phase 3 Exit Criteria**:
- [ ] App approved on iOS App Store
- [ ] App approved on Google Play
- [ ] IAP working on both platforms
- [ ] Push notifications working
- [ ] Web and mobile purchases sync

---

## Success Metrics

### Phase 1 Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| API key exposure | 0 | Security audit |
| Account creation success | > 95% | Funnel tracking |
| Sync reliability | > 99% | Error monitoring |
| Auth latency | < 2s | Performance monitoring |

### Phase 2 Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Purchase completion rate | > 80% | Stripe dashboard |
| Credit deduction accuracy | 100% | Audit logs |
| Payment disputes | < 1% | Stripe dashboard |
| Subscription churn | < 10%/month | RevenueCat |

### Phase 3 Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| App Store approval | First submission | Apple response |
| Crash-free rate | > 99.5% | Crashlytics |
| App rating | > 4.0 | Store reviews |
| Mobile DAU/MAU | > 30% | Analytics |

### Long-term Business Metrics

| Metric | 6-month Target | 12-month Target |
|--------|----------------|-----------------|
| MAU | 10,000 | 50,000 |
| Paid conversion | 5% | 8% |
| ARPU | $8/month | $12/month |
| Monthly revenue | $4,000 | $48,000 |
| CAC | < $5 | < $3 |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| App Store rejection | Medium | High | Pre-review consultation, follow guidelines |
| Data breach | Low | Critical | Encryption, audits, bug bounty |
| Anthropic API cost spike | Medium | Medium | Token budgets, caching, monitoring |
| User migration friction | High | Medium | Graceful upgrade path, no data loss |
| Low conversion rate | Medium | High | A/B test pricing, improve free experience |
| Competitor emerges | Low | Medium | Differentiate on UX, move fast |

---

## Resource Requirements

### Team (Recommended)

| Role | Phase 1 | Phase 2 | Phase 3 |
|------|---------|---------|---------|
| Full-stack developer | 1 | 1 | 1 |
| Mobile developer | 0 | 0.5 | 1 |
| Designer | 0.25 | 0.25 | 0.5 |
| QA | 0.25 | 0.25 | 0.5 |

### Infrastructure Costs (Monthly)

| Service | Phase 1 | Phase 2 | Phase 3 |
|---------|---------|---------|---------|
| Supabase | Free tier | Pro ($25) | Pro ($25) |
| Anthropic API | ~$200 | ~$500 | ~$1,000 |
| Stripe | 2.9% + $0.30/txn | Same | Same |
| RevenueCat | - | - | Free tier |
| Apple Developer | - | - | $99/year |
| Google Play | - | - | $25 one-time |
| **Total** | ~$200 | ~$550 | ~$1,100 |

### One-time Costs

| Item | Cost |
|------|------|
| Legal (ToS, Privacy Policy) | $5,000-10,000 |
| App Store assets (icons, screenshots) | $500-1,000 |
| Security audit | $2,000-5,000 |

---

## Dependencies & Prerequisites

### Before Phase 1
- [x] Supabase account created
- [x] Domain configured for Supabase
- [x] Development environment set up

### Before Phase 2
- [ ] Stripe account approved
- [ ] Business entity for payments
- [ ] Bank account connected to Stripe
- [ ] Pricing finalized

### Before Phase 3
- [ ] Apple Developer account ($99/year)
- [ ] Google Play Developer account ($25)
- [ ] App icons and marketing assets
- [ ] Privacy policy and ToS published
- [ ] Legal review completed

---

## Document Index

### Current State Audit

| Document | Location | Agent |
|----------|----------|-------|
| Architecture Audit | `01_current_state/architecture_audit.md` | code-architect |
| Usability Audit | `01_current_state/usability_heuristic_audit.md` | ux-researcher |
| Feature Inventory | `01_current_state/feature_inventory.md` | frontend-developer |

### Future Roadmap

| Document | Location | Agent |
|----------|----------|-------|
| PRD: Monetization | `02_future_roadmap/PRD_monetization_and_identity.md` | prd-specialist |
| Migration Tech Spec | `02_future_roadmap/migration_tech_spec.md` | backend-architect |
| Native Adaptation | `02_future_roadmap/native_adaptation_plan.md` | mobile-ux-optimizer |
| Compliance Checklist | `02_future_roadmap/compliance_checklist.md` | legal-advisor |

---

## Next Steps

1. **Immediate**: Await Apple OAuth approval
2. **This week**: Begin Phase 2 planning (credit system design)
3. **Next sprint**: AI inference history feature (see below)
4. **Ongoing**: Weekly progress reviews against milestones

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 2.1 | 2026-01-26 | Phase 1B tech debt progress, test coverage improvements, error infrastructure |
| 2.0 | January 2026 | Phase 1A complete: API proxy deployed, streaming analysis shipped |
| 1.0 | January 2026 | Initial roadmap created |
