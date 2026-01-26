# ADR-0008: Authentication & Cross-Device Sync

## Status
Accepted

## Date
2025-01-25

## Context
ADR-0001 established our local-first architecture, but this created a limitation: users couldn't access their profiles from multiple devices. As Aura matured, users requested:

1. Access profiles from phone and computer
2. Not lose data when switching devices
3. Backup their analyzed profiles

We needed to add optional cloud sync while preserving the local-first philosophy. The key principle: **local-first with optional sync**, not cloud-first with local cache.

## Decision
We implemented **Supabase Authentication** with **selective sync**:

**Authentication:**
- Supabase Auth with email/password and OAuth providers
- Anonymous usage still fully supported (no account required)
- Account creation is opt-in, prompted after first analysis

**Sync Architecture:**
```
Device A (Local DB) ←→ Supabase (Cloud) ←→ Device B (Local DB)
                         ↑
                    User chooses
                    what to sync
```

**Sync Strategy:**
- **Profiles**: Synced with conflict resolution (last-write-wins)
- **User Identity**: Synced across devices
- **Thumbnails**: Stored as base64 in profile record
- **Videos**: Never synced (too large, re-extract if needed)

**Conflict Resolution:**
```typescript
// sync.ts
async function resolveConflict(local: Profile, remote: Profile): Profile {
  // Last-write-wins based on updatedAt timestamp
  return local.updatedAt > remote.updatedAt ? local : remote;
}
```

**Privacy Preserved:**
- Sync is encrypted in transit (HTTPS) and at rest (Supabase)
- Users can delete cloud data anytime
- App works fully offline, sync happens when online

## Consequences

### Positive
- **Cross-device access**: Profiles available everywhere
- **Data backup**: Cloud copy protects against device loss
- **Optional**: Users can stay anonymous if preferred
- **Local-first maintained**: App works offline, sync is background

### Negative
- **Complexity**: Conflict resolution, sync state management
- **Privacy tradeoff**: Data now exists on server (encrypted)
- **Supabase dependency**: Another vendor to manage
- **Cost**: Database storage costs scale with users

## Related
- Git commits: `3b93520` (Auth), `5bc75cf` (Sync)
- `src/lib/auth.ts` - Authentication hooks
- `src/lib/sync.ts` - Sync logic and conflict resolution
- `src/components/auth/` - Login/signup UI
- ADR-0001: Local-First Architecture
- ADR-0004: Supabase Edge Function Proxy
