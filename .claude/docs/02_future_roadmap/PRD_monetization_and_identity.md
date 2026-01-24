# Product Requirements Document: Monetization & Identity

**Agent Persona**: PRD Specialist
**Date**: January 2026
**Version**: 1.0

---

## Executive Summary

This PRD defines requirements for transforming Aura from a free, local-only PWA to a monetized, account-based service. The core monetization model is a **credit system** where users purchase credits to analyze profiles, with an optional **subscription tier** for power users.

---

## Goals & Success Metrics

### Business Goals

| Goal | Target | Timeline |
|------|--------|----------|
| Monthly Active Users | 10,000 | 6 months post-launch |
| Paid Conversion Rate | 5% | 6 months post-launch |
| Average Revenue Per User | $8/month | 12 months post-launch |
| Customer Acquisition Cost | <$5 | Ongoing |

### User Goals

- Seamless account creation and login
- Clear credit system understanding
- Cross-device data synchronization
- Transparent pricing with no surprises
- Easy account management and deletion

---

## User Accounts Requirements

### Authentication Methods

**Primary (Required for MVP)**:
- Email + Password
- OAuth2 with Google
- OAuth2 with Apple (required for iOS App Store)

**Secondary (Post-MVP)**:
- Phone number + SMS OTP
- Magic link email

### Account Features

| Feature | Priority | Notes |
|---------|----------|-------|
| Email verification | P0 | Required for account security |
| Password reset | P0 | Self-service via email |
| Profile data sync | P0 | Core value proposition |
| Session management | P0 | View/revoke active sessions |
| Account deletion | P0 | GDPR requirement |
| Two-factor auth | P1 | Optional security enhancement |
| Connected accounts | P2 | Link multiple OAuth providers |

### Data Sync Behavior

**On Login (new device)**:
1. Fetch user profile from server
2. Fetch last 50 analyzed profiles
3. Merge with any local-only data (conflict: server wins)

**On Analysis Complete**:
1. Save to local IndexedDB (immediate)
2. Sync to server (background, retry on failure)

**Offline Mode**:
- Allow viewing cached profiles
- Queue new analyses (deduct credit optimistically)
- Sync when back online

---

## Credit System Requirements

### Credit Model

```
1 Credit = 1 Profile Analysis (complete 2-stage analysis)
```

### Credit Actions (No Credit Cost)

- Viewing saved profiles
- Refreshing openers/date ideas
- Ask About Match conversations
- Zodiac compatibility checks
- User profile synthesis
- Conversation coaching

### Credit Pricing

| Tier | Credits | Price | Per Credit | Savings |
|------|---------|-------|------------|---------|
| Starter | 10 | $4.99 | $0.50 | - |
| Popular | 50 | $19.99 | $0.40 | 20% |
| Power | 200 | $59.99 | $0.30 | 40% |

### Subscription Option

| Plan | Price | Benefits |
|------|-------|----------|
| Aura Pro Monthly | $14.99/mo | Unlimited analyses, priority support |
| Aura Pro Annual | $119.99/yr | Unlimited analyses, 2 months free |

### Credit Policies

**Free Tier**:
- 3 credits on signup (no payment required)
- 1 credit for completing profile setup
- Non-expiring

**Purchased Credits**:
- Roll over indefinitely
- Non-refundable after use
- Refundable within 14 days if unused

**Referral Program**:
- Referrer receives: 5 credits
- Referee receives: 3 credits (bonus to free tier)
- Cap: 50 referrals per user

---

## User Stories

### Account Management

```
US-001: As a new user, I want to sign up with my email
        so that I can save my profile analyses across devices.

        Acceptance Criteria:
        - Email validation (format + uniqueness)
        - Password requirements (8+ chars, 1 number, 1 special)
        - Verification email sent within 30 seconds
        - Can use app immediately (verification required for purchase)
```

```
US-002: As a returning user, I want to log in with Google
        so that I don't need to remember a password.

        Acceptance Criteria:
        - OAuth2 flow completes in <5 seconds
        - Existing account detected and merged
        - New account created if not found
        - Profile synced automatically on login
```

```
US-003: As a user, I want to delete my account
        so that all my data is removed per GDPR.

        Acceptance Criteria:
        - Confirmation required (type "DELETE")
        - All server data purged within 72 hours
        - Local data optionally preserved
        - Confirmation email sent
        - Active subscriptions cancelled
```

### Credit System

```
US-010: As a user, I want to see my credit balance
        so that I know how many analyses I can perform.

        Acceptance Criteria:
        - Balance visible in header/nav
        - Balance shown before starting analysis
        - Visual indicator when balance is low (<3)
```

```
US-011: As a user, I want to purchase credits
        so that I can analyze more profiles.

        Acceptance Criteria:
        - Three tier options clearly displayed
        - Secure checkout via Stripe
        - Credits added within 30 seconds of payment
        - Receipt sent via email
        - Purchase history viewable
```

```
US-012: As a user, I want to be warned before using my last credit
        so that I don't accidentally run out.

        Acceptance Criteria:
        - Warning modal when balance = 1
        - Option to purchase more from modal
        - Option to proceed with analysis
        - "Don't show again" checkbox
```

```
US-013: As a user with 0 credits, I want to see a clear upgrade prompt
        so that I can continue using the app.

        Acceptance Criteria:
        - Friendly message (not blocking)
        - Quick purchase options
        - Referral option highlighted
        - No shame/guilt messaging
```

### Subscription

```
US-020: As a power user, I want to subscribe to unlimited analyses
        so that I don't need to track credits.

        Acceptance Criteria:
        - Clear value proposition vs credits
        - Monthly and annual options
        - Can cancel anytime
        - Pro badge on profile
```

```
US-021: As a subscriber, I want to manage my subscription
        so that I can cancel or change plans.

        Acceptance Criteria:
        - Current plan details visible
        - Next billing date shown
        - Cancel button accessible
        - Downgrade keeps access until period ends
```

---

## UI/UX Requirements

### Credit Balance Display

**Header Component**:
```
┌─────────────────────────────────────┐
│  🔮 Aura    [Credits: 47] [👤 Menu] │
└─────────────────────────────────────┘
```

**Low Balance State** (≤3 credits):
```
┌─────────────────────────────────────┐
│  🔮 Aura    [⚠️ 2 left] [👤 Menu]   │
└─────────────────────────────────────┘
```

### Pre-Analysis Check

**Modal when starting analysis**:
```
┌─────────────────────────────────────┐
│         Analyze This Profile?       │
│                                     │
│   This will use 1 credit.           │
│   Your balance: 12 credits          │
│                                     │
│   [Cancel]  [✓ Analyze]             │
└─────────────────────────────────────┘
```

### Purchase Flow

**Credit Store Screen**:
```
┌─────────────────────────────────────┐
│           Get More Credits          │
│                                     │
│  ┌─────────┐ ┌─────────┐ ┌────────┐│
│  │ Starter │ │ Popular │ │ Power  ││
│  │   10    │ │   50    │ │  200   ││
│  │  $4.99  │ │ $19.99  │ │ $59.99 ││
│  │         │ │ BEST    │ │ 40%    ││
│  │         │ │ VALUE   │ │ OFF    ││
│  └─────────┘ └─────────┘ └────────┘│
│                                     │
│  ─── OR SUBSCRIBE ───               │
│                                     │
│  Unlimited analyses: $14.99/mo      │
│  [See subscription options →]       │
└─────────────────────────────────────┘
```

---

## Technical Requirements

### Database Schema Additions

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  password_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- OAuth connections
CREATE TABLE oauth_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'google', 'apple'
  provider_user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider, provider_user_id)
);

-- Credits
CREATE TABLE credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  balance INTEGER NOT NULL DEFAULT 3,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Credit transactions
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- positive = add, negative = spend
  type VARCHAR(50) NOT NULL, -- 'signup', 'purchase', 'analysis', 'refund', 'referral'
  description TEXT,
  stripe_payment_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  stripe_subscription_id VARCHAR(255) NOT NULL,
  plan VARCHAR(50) NOT NULL, -- 'pro_monthly', 'pro_annual'
  status VARCHAR(50) NOT NULL, -- 'active', 'cancelled', 'past_due'
  current_period_end TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Referrals
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  referee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  credits_awarded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### API Endpoints Required

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Email signup |
| POST | `/auth/login` | Email login |
| POST | `/auth/oauth/google` | Google OAuth |
| POST | `/auth/oauth/apple` | Apple OAuth |
| POST | `/auth/logout` | Logout |
| POST | `/auth/forgot-password` | Password reset |
| DELETE | `/auth/account` | Delete account |
| GET | `/credits/balance` | Get credit balance |
| POST | `/credits/purchase` | Initiate Stripe checkout |
| POST | `/credits/use` | Deduct credit for analysis |
| GET | `/subscriptions/current` | Get subscription status |
| POST | `/subscriptions/create` | Create subscription |
| POST | `/subscriptions/cancel` | Cancel subscription |

---

## Security Requirements

- All passwords hashed with bcrypt (cost factor 12)
- JWT tokens with 15-minute expiry, refresh tokens with 7-day expiry
- Rate limiting: 5 login attempts per minute, 10 signup per hour per IP
- Stripe webhook signature verification
- Credit operations are atomic (no double-spend)
- OAuth state parameter validation

---

## Launch Checklist

- [ ] Email signup/login working
- [ ] Google OAuth working
- [ ] Apple OAuth working (iOS requirement)
- [ ] Credit balance display
- [ ] Credit purchase flow
- [ ] Credit deduction on analysis
- [ ] Subscription creation
- [ ] Subscription management
- [ ] Account deletion
- [ ] Referral system
- [ ] Low credit warnings
- [ ] Receipt emails
- [ ] Analytics events

---

## Open Questions

1. **Grandfather existing users?** - Local users with data may expect free continued use
2. **Free tier limits?** - Should free tier have feature restrictions beyond credits?
3. **Enterprise/B2B?** - Dating coaches might want bulk accounts
4. **Refund policy details?** - What constitutes "unused" credits?
