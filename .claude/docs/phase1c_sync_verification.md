# Phase 1C Sync - Verification Checklist

## Implementation Status: COMPLETE (Pending Verification)

All code has been implemented. This document tracks manual verification.

---

## 1. Sync UI Components

### SyncIndicator (Badge Variant)
- [ ] Green dot + "Synced" when synced
- [ ] Blue pulsing dot + "Syncing" when syncing
- [ ] Gray dot + "Offline" when offline
- [ ] Clickable to trigger manual sync

### SyncIndicator (Detailed Variant)
- [ ] Shows full status message
- [ ] Shows last sync timestamp
- [ ] Shows "Retry" button when error
- [ ] Shows "Sync Now" button when idle
- [ ] Shows pending changes count

### MyProfile Integration
- [ ] SyncIndicator visible on MyProfile page
- [ ] Syncs automatically on profile changes
- [ ] Shows pending changes before sync completes

---

## 2. Sync Flows

### Auto-Sync on Login
- [ ] When user logs in, sync triggers automatically
- [ ] User profile pulled from server (if exists)
- [ ] Match profiles pulled from server
- [ ] Local data pushed to server

### Manual Sync
- [ ] Click SyncIndicator triggers sync
- [ ] Sync button shows loading state
- [ ] Success updates "Synced Xm ago" message

### Profile Changes
- [ ] Edit profile data -> marked as pending
- [ ] Pending count increments
- [ ] Next sync pushes changes to server
- [ ] Server reflects updated data

### Match Profile Sync
- [ ] Upload new match -> syncs to server
- [ ] Delete match locally -> deletes on server
- [ ] Server-deleted match -> removed locally on pull

---

## 3. Offline Behavior

### When Offline
- [ ] SyncIndicator shows "Offline" with gray dot
- [ ] Can still edit data locally
- [ ] Changes queue as pending

### Coming Back Online
- [ ] Browser fires `online` event
- [ ] Pending changes auto-sync
- [ ] Status updates to "Synced"

---

## 4. Database Verification

### User Profiles Table
Check in Supabase Dashboard: `user_profiles`
- [ ] `id` - UUID primary key
- [ ] `user_id` - References auth.users
- [ ] `dating_goals`, `text_inputs`, `manual_entry` - JSONB columns
- [ ] `video_analysis`, `synthesis` - JSONB columns
- [ ] `created_at`, `updated_at` - Timestamps

### Match Profiles Table
Check in Supabase Dashboard: `match_profiles`
- [ ] `id` - UUID primary key
- [ ] `user_id` - References auth.users
- [ ] `name`, `age`, `app_name` - Basic fields
- [ ] `analysis`, `thumbnail_path` - Analysis data
- [ ] RLS policy: users can only access own profiles

### Storage Bucket
Check in Supabase Dashboard: Storage > `user-images`
- [ ] Bucket exists
- [ ] RLS policies configured
- [ ] Users can upload to `{user_id}/*`
- [ ] Users can read own images

---

## 5. Image Sync

### Thumbnail Upload
- [ ] Upload video -> frames extracted
- [ ] Best frame selected as thumbnail
- [ ] Thumbnail uploaded to Storage
- [ ] Path stored in `thumbnail_path` (not base64)

### Image Download
- [ ] Pull profile from server
- [ ] If `thumbnail_path` is storage path, fetch signed URL
- [ ] Image displays correctly

---

## 6. Error Handling

### Network Errors
- [ ] Sync fails gracefully
- [ ] Error message shown to user
- [ ] Retry button available
- [ ] Data preserved locally

### Auth Errors
- [ ] 401 from Supabase -> prompts re-login
- [ ] Session refresh handled automatically

---

## Files Implemented

### New Files (11)

| File | Purpose |
|------|---------|
| `src/lib/sync/types.ts` | TypeScript types for sync |
| `src/lib/sync/index.ts` | Main export barrel |
| `src/lib/sync/syncService.ts` | Core sync state machine |
| `src/lib/sync/imageSync.ts` | Image upload/download utilities |
| `src/lib/sync/profileSync.ts` | Match profile sync logic |
| `src/lib/sync/userProfileSync.ts` | User identity sync logic |
| `src/lib/sync/coachingSync.ts` | Coaching session sync |
| `src/lib/sync/chatSync.ts` | Chat message sync |
| `src/contexts/SyncContext.tsx` | React context for sync state |
| `src/hooks/useSyncStatus.ts` | Hook for accessing sync status |
| `src/components/SyncIndicator.tsx` | Visual sync status indicator |

### Modified Files (4)

| File | Changes |
|------|---------|
| `src/lib/db.ts` | Added sync-related fields to schemas |
| `src/App.tsx` | Added SyncProvider wrapper |
| `src/pages/MyProfile.tsx` | Integrated SyncIndicator |
| `src/pages/Settings.tsx` | Added sync status section |

---

## Supabase Migrations

Migrations applied via Supabase Dashboard/MCP:

| Migration | Purpose |
|-----------|---------|
| Create `user_profiles` table | Store user identity data |
| Create `match_profiles` table | Store analyzed match profiles |
| Create `coaching_sessions` table | Store conversation coaching data |
| Create `match_chats` table | Store chat messages per match |
| Create `user-images` bucket | Store profile thumbnails |
| RLS policies | User can only access own data |

---

## Automated Test Coverage

### Unit Tests Added (39 new tests, 393 total)

Run with: `npm run test:run`

| Test File | Tests | What's Covered |
|-----------|-------|----------------|
| `src/lib/sync/imageSync.test.ts` | 9 | `isStoragePath()` detection for storage paths vs base64 |
| `src/hooks/useSyncStatus.test.ts` | 12 | Status message generation, `useNeedsInitialSync()` |
| `src/components/SyncIndicator.test.tsx` | 18 | Badge/detailed variants, `SyncStatusDot` component |

### What's Automated vs Manual

| Check | Automated? | Notes |
|-------|------------|-------|
| `isStoragePath()` logic | Yes | All edge cases tested |
| Status message formatting | Yes | All states covered |
| Component rendering | Yes | Both variants tested |
| Actual Supabase sync | No | Requires real Supabase |
| RLS policy enforcement | No | Requires real Supabase |
| Image upload/download | No | Requires real Storage |
| Cross-device sync | No | Requires multiple clients |
| Offline behavior | No | Requires network manipulation |

---

## Known Issues / Notes

- Sync only runs when user is authenticated
- First-time users need to create profile locally before it syncs
- Large images are resized to 1MB max before upload
- Storage paths format: `{userId}/thumbnails/{filename}.jpg`
- `base64ToBlob()` is a private function - not directly testable

---

## Next Steps

1. Complete manual verification on production
2. Consider adding E2E tests with Playwright for full sync flow
3. Monitor sync errors in production logs
4. Add sync conflict resolution if needed (currently last-write-wins)
