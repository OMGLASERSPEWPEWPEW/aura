# Aura Master Roadmap

**Version**: 1.0
**Date**: January 2026
**Status**: Planning Complete

---

## Executive Summary

This master roadmap synthesizes findings from the documentation sprint to chart Aura's evolution from a local-first PWA to a monetized, cross-platform application. The transformation requires three major phases spanning 14-20 weeks, with a critical security fix (API key exposure) as the immediate priority.

---

## Current State Summary

### Architecture Assessment

| Dimension | Current State | Risk Level |
|-----------|---------------|------------|
| **Security** | API key exposed in frontend bundle | 🔴 CRITICAL |
| **Scalability** | IndexedDB limited to ~300 profiles | 🟡 Medium |
| **Data Integrity** | 6 migrations, union types, no validation | 🟡 Medium |
| **Maintainability** | 3 error handling patterns, hardcoded values | 🟡 Medium |
| **Performance** | Canvas extraction, base64 overhead | 🟢 Acceptable |

### UX Assessment

| Dimension | Current State | Priority |
|-----------|---------------|----------|
| **Upload Flow** | 60-100s wait, no progress indicator | High |
| **Information Density** | 10 sections on Overview, 23 Aspects | Medium |
| **Conditional Features** | Scoring requires profile setup (hidden) | High |
| **Accessibility** | No keyboard nav, small touch targets | Medium |
| **Onboarding** | None | Medium |

### Feature Readiness

- ✅ Core analysis pipeline working
- ✅ Full feature set implemented (23 features)
- 🟡 Settings page minimal
- 🟡 Data export limited to Tinder JSON
- ❌ No user accounts
- ❌ No monetization
- ❌ No native mobile apps

---

## Strategic Recommendations

### Technology Stack Additions

| Layer | Current | Recommended | Rationale |
|-------|---------|-------------|-----------|
| Auth | None | Supabase Auth | Integrated, OAuth support |
| Database | IndexedDB only | Supabase PostgreSQL | Scalable, synced |
| API Gateway | Direct browser calls | Supabase Edge Functions | Secure API key |
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
- 10,000 MAU × 5% paid conversion × $8 ARPU = $4,000/month
- Break-even: ~$500/month (API costs + infrastructure)

---

## Phased Implementation Plan

### Phase 1: Architecture Pivot

**Duration**: 4-6 weeks
**Goal**: Secure the API key and establish backend infrastructure

#### Week 1-2: Supabase Setup + API Proxy

- [ ] Create Supabase project
- [ ] Implement Edge Function for Anthropic proxy
- [ ] Update frontend to use proxy endpoint
- [ ] **Remove API key from frontend bundle** ⚠️ CRITICAL
- [ ] Verify API calls work through proxy
- [ ] Deploy and test in production

#### Week 3-4: Authentication

- [ ] Implement email/password signup
- [ ] Implement Google OAuth
- [ ] Implement Apple OAuth (required for iOS)
- [ ] Add auth state management to frontend
- [ ] Create protected route wrapper
- [ ] Implement session management UI

#### Week 5-6: Data Synchronization

- [ ] Create PostgreSQL schema (profiles, user_profiles)
- [ ] Implement sync service (Dexie ↔ Supabase)
- [ ] Handle conflict resolution (last-write-wins)
- [ ] Test offline scenarios
- [ ] Migrate existing local data for logged-in users
- [ ] Implement data export endpoint

**Phase 1 Exit Criteria**:
- [ ] API key not in frontend bundle
- [ ] Users can create accounts
- [ ] Profile data syncs across devices
- [ ] Existing PWA users can migrate data

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

- [ ] Supabase account created
- [ ] Domain configured for Supabase
- [ ] Development environment set up

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

1. **Immediate**: Review this roadmap with stakeholders
2. **This week**: Set up Supabase project
3. **Next sprint**: Begin Phase 1 implementation
4. **Ongoing**: Weekly progress reviews against milestones

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | January 2026 | Initial roadmap created |
