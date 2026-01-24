# Migration Technical Specification

**Agent Persona**: Backend Architect
**Date**: January 2026
**Version**: 1.0

---

## Executive Summary

This document specifies the technical migration from Aura's current local-only PWA architecture to a hybrid local-cloud system supporting user authentication, data synchronization, and credit-based monetization. The recommended stack is **Supabase** for auth/database/edge functions with **Stripe** for payments.

---

## Current Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (PWA)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │   React UI  │  │  Dexie.js   │  │  Anthropic API  │ │
│  │             │  │ (IndexedDB) │  │  (Direct Call)  │ │
│  └─────────────┘  └─────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
              ⚠️  API Key Exposed in Bundle
```

---

## Target Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (PWA)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │   React UI  │  │  Dexie.js   │  │ Supabase Client │ │
│  │             │  │ (Cache/WIP) │  │   (Auth/Sync)   │ │
│  └─────────────┘  └─────────────┘  └─────────────────┘ │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    Supabase Platform                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │  Supabase   │  │  PostgreSQL │  │ Edge Functions  │ │
│  │    Auth     │  │  Database   │  │  (API Proxy)    │ │
│  └─────────────┘  └─────────────┘  └─────────────────┘ │
└───────────────────────────┬─────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
┌─────────────────────┐      ┌─────────────────────────┐
│   Anthropic API     │      │        Stripe           │
│   (Server-side)     │      │   (Payment Processing)  │
│   🔒 Key Protected  │      └─────────────────────────┘
└─────────────────────┘
```

---

## Technology Recommendations

### Core Platform: Supabase

**Why Supabase over alternatives:**

| Criteria | Supabase | Firebase | AWS Amplify |
|----------|----------|----------|-------------|
| PostgreSQL | ✅ Native | ❌ Firestore | ⚠️ Aurora |
| Auth | ✅ Built-in | ✅ Built-in | ✅ Cognito |
| Edge Functions | ✅ Deno | ✅ Cloud Functions | ⚠️ Lambda |
| Open Source | ✅ Yes | ❌ No | ❌ No |
| Self-host Option | ✅ Yes | ❌ No | ❌ No |
| Pricing | 💚 Generous free | 💛 OK | 💛 Complex |
| Learning Curve | Low | Low | High |

### Payments: Stripe

**Why Stripe:**
- Industry standard for SaaS
- Excellent React/JS SDK
- Webhook reliability
- Built-in subscription management
- RevenueCat integration for mobile IAP

### Mobile Payments: RevenueCat

**Required for iOS/Android:**
- Wraps Apple/Google IAP
- Syncs with Stripe for web purchases
- Handles subscription status across platforms
- Required for App Store compliance

---

## Migration Strategy

### Phase 1: API Proxy (Week 1-2)

**Goal**: Remove API key from frontend bundle

#### 1.1 Create Supabase Edge Function

```typescript
// supabase/functions/anthropic-proxy/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from '@supabase/supabase-js'

serve(async (req) => {
  // Verify authentication
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
  )

  const { data: { user }, error } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  )

  if (error || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Check credits (Phase 3)
  // const credits = await checkCredits(user.id)
  // if (credits <= 0) return new Response('Insufficient credits', { status: 402 })

  // Forward to Anthropic
  const body = await req.json()
  const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(body)
  })

  // Deduct credit on success (Phase 3)
  // if (anthropicResponse.ok) await deductCredit(user.id)

  return new Response(anthropicResponse.body, {
    status: anthropicResponse.status,
    headers: { 'Content-Type': 'application/json' }
  })
})
```

#### 1.2 Update Frontend Client

```typescript
// src/lib/api/anthropicClient.ts
import { supabase } from '../supabase'

export async function callAnthropic(messages: Message[], options: Options) {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Authentication required')
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/anthropic-proxy`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ messages, ...options })
    }
  )

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  return response.json()
}
```

#### 1.3 Environment Updates

**Remove from frontend `.env`:**
```diff
- VITE_ANTHROPIC_API_KEY=sk-ant-...
```

**Add to Supabase secrets:**
```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

---

### Phase 2: Hybrid Storage (Week 3-4)

**Goal**: Sync profiles to cloud while keeping video processing local

#### 2.1 Database Schema

```sql
-- Enable RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Profiles table (synced from IndexedDB)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  local_id INTEGER, -- Original IndexedDB ID for sync
  name VARCHAR(255),
  thumbnail TEXT, -- Base64 (consider migrating to Storage)
  analysis JSONB NOT NULL,
  chat_history JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, local_id)
);

-- User profile (synthesis data)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  synthesis JSONB,
  zodiac_sign VARCHAR(50),
  location VARCHAR(255),
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
CREATE POLICY "Users can only access own profiles"
  ON profiles FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only access own user_profile"
  ON user_profiles FOR ALL
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_created_at ON profiles(created_at DESC);
CREATE INDEX idx_profiles_local_id ON profiles(user_id, local_id);
```

#### 2.2 Sync Service

```typescript
// src/lib/sync/syncService.ts
import { supabase } from '../supabase'
import { db } from '../db'

export class SyncService {
  private syncInProgress = false

  async syncProfiles() {
    if (this.syncInProgress) return
    this.syncInProgress = true

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get local profiles
      const localProfiles = await db.profiles.toArray()

      // Get server profiles
      const { data: serverProfiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)

      // Merge with last-write-wins
      for (const local of localProfiles) {
        const server = serverProfiles?.find(s => s.local_id === local.id)

        if (!server) {
          // Upload new local profile
          await supabase.from('profiles').insert({
            user_id: user.id,
            local_id: local.id,
            name: local.name,
            thumbnail: local.thumbnail,
            analysis: local.analysis,
            chat_history: local.chatHistory || [],
            created_at: local.createdAt
          })
        } else if (new Date(local.updatedAt) > new Date(server.updated_at)) {
          // Local is newer, update server
          await supabase.from('profiles').update({
            name: local.name,
            analysis: local.analysis,
            chat_history: local.chatHistory || [],
            updated_at: local.updatedAt
          }).eq('id', server.id)
        } else if (new Date(server.updated_at) > new Date(local.updatedAt)) {
          // Server is newer, update local
          await db.profiles.update(local.id, {
            name: server.name,
            analysis: server.analysis,
            chatHistory: server.chat_history,
            updatedAt: new Date(server.updated_at)
          })
        }
      }

      // Download profiles that don't exist locally
      for (const server of serverProfiles || []) {
        const localExists = localProfiles.some(l => l.id === server.local_id)
        if (!localExists) {
          await db.profiles.add({
            id: server.local_id,
            name: server.name,
            thumbnail: server.thumbnail,
            analysis: server.analysis,
            chatHistory: server.chat_history,
            createdAt: new Date(server.created_at),
            updatedAt: new Date(server.updated_at)
          })
        }
      }
    } finally {
      this.syncInProgress = false
    }
  }

  // Call on app init and after mutations
  startBackgroundSync() {
    // Sync on visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.syncProfiles()
      }
    })

    // Sync every 5 minutes
    setInterval(() => this.syncProfiles(), 5 * 60 * 1000)
  }
}
```

#### 2.3 Conflict Resolution Strategy

**Policy**: Last-Write-Wins with timestamp comparison

```typescript
interface ConflictResolution {
  strategy: 'last-write-wins' | 'server-wins' | 'client-wins' | 'manual'
  timestamp_field: 'updated_at'
}

// Future enhancement: CRDT for chat history
// Chat messages are append-only, merge by timestamp
```

---

### Phase 3: Credit System (Week 5-6)

**Goal**: Implement credit purchase and deduction

#### 3.1 Credit Schema

```sql
-- Credits table
CREATE TABLE credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  balance INTEGER NOT NULL DEFAULT 3, -- Free starter credits
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transaction log
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL, -- +/- amount
  balance_after INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'signup_bonus', 'purchase', 'analysis', 'refund', 'referral'
  reference_id VARCHAR(255), -- Stripe payment ID, profile ID, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
CREATE POLICY "Users can view own credits"
  ON credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions"
  ON credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Trigger to create credits on signup
CREATE OR REPLACE FUNCTION create_user_credits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO credits (user_id, balance) VALUES (NEW.id, 3);
  INSERT INTO credit_transactions (user_id, amount, balance_after, type)
  VALUES (NEW.id, 3, 3, 'signup_bonus');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_credits();
```

#### 3.2 Credit Deduction (Atomic)

```typescript
// supabase/functions/use-credit/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from '@supabase/supabase-js'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // Service role for atomic updates
  )

  const authHeader = req.headers.get('Authorization')
  const { data: { user } } = await supabase.auth.getUser(
    authHeader?.replace('Bearer ', '') || ''
  )

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  // Atomic credit deduction using database function
  const { data, error } = await supabase.rpc('deduct_credit', {
    p_user_id: user.id,
    p_reference_id: req.body?.reference_id
  })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }

  return new Response(JSON.stringify({ success: true, balance: data }))
})
```

```sql
-- Atomic credit deduction function
CREATE OR REPLACE FUNCTION deduct_credit(p_user_id UUID, p_reference_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  -- Lock and update in single statement
  UPDATE credits
  SET balance = balance - 1,
      updated_at = NOW()
  WHERE user_id = p_user_id AND balance > 0
  RETURNING balance INTO v_balance;

  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  -- Log transaction
  INSERT INTO credit_transactions (user_id, amount, balance_after, type, reference_id)
  VALUES (p_user_id, -1, v_balance, 'analysis', p_reference_id);

  RETURN v_balance;
END;
$$ LANGUAGE plpgsql;
```

#### 3.3 Stripe Integration

```typescript
// supabase/functions/create-checkout/index.ts
import Stripe from 'stripe'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!)

const PRODUCTS = {
  starter: { credits: 10, price_id: 'price_xxx' },
  popular: { credits: 50, price_id: 'price_yyy' },
  power: { credits: 200, price_id: 'price_zzz' }
}

serve(async (req) => {
  const { tier, user_id } = await req.json()
  const product = PRODUCTS[tier]

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: product.price_id, quantity: 1 }],
    success_url: `${req.headers.get('origin')}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${req.headers.get('origin')}/credits`,
    metadata: { user_id, credits: product.credits }
  })

  return new Response(JSON.stringify({ url: session.url }))
})
```

```typescript
// supabase/functions/stripe-webhook/index.ts
serve(async (req) => {
  const signature = req.headers.get('stripe-signature')!
  const body = await req.text()

  const event = stripe.webhooks.constructEvent(
    body,
    signature,
    Deno.env.get('STRIPE_WEBHOOK_SECRET')!
  )

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const { user_id, credits } = session.metadata

    // Add credits atomically
    await supabase.rpc('add_credits', {
      p_user_id: user_id,
      p_amount: parseInt(credits),
      p_reference_id: session.id
    })
  }

  return new Response('OK')
})
```

---

## Rollback Plan

### Phase 1 Rollback

If API proxy causes issues:
1. Revert frontend to direct API calls
2. Re-add `VITE_ANTHROPIC_API_KEY` to `.env`
3. Deploy frontend update

### Phase 2 Rollback

If sync causes data issues:
1. Disable sync service
2. Fall back to local-only mode
3. Provide data export for manual backup

### Phase 3 Rollback

If credits cause payment issues:
1. Set all users to "unlimited" flag
2. Continue processing with logging
3. Investigate and fix billing issues

---

## Monitoring & Alerts

### Key Metrics

| Metric | Alert Threshold |
|--------|-----------------|
| API proxy latency | > 5s p95 |
| Sync failure rate | > 5% |
| Credit deduction failures | > 1% |
| Stripe webhook failures | Any |

### Logging

```typescript
// Structured logging for all operations
interface AuditLog {
  timestamp: string
  user_id: string
  action: 'analysis' | 'sync' | 'purchase' | 'credit_use'
  status: 'success' | 'failure'
  metadata: Record<string, any>
}
```

---

## Security Checklist

- [ ] API key removed from frontend bundle
- [ ] All API calls authenticated
- [ ] RLS policies enabled on all tables
- [ ] Service role key only in Edge Functions
- [ ] Stripe webhook signature verification
- [ ] Rate limiting on all endpoints
- [ ] Input validation on all requests
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (content security policy)

---

## Estimated Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: API Proxy | 2 weeks | Supabase project setup |
| Phase 2: Hybrid Storage | 2 weeks | Phase 1 complete |
| Phase 3: Credit System | 2 weeks | Stripe account, Phase 1-2 |
| Testing & QA | 1 week | All phases |
| **Total** | **7 weeks** | |
