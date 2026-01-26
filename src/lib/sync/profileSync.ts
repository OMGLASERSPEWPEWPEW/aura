// src/lib/sync/profileSync.ts
// Handles sync for match_profiles (local profiles table)

import { supabase } from '../supabase';
import { db, type Profile } from '../db';
import { uploadImage, deleteImage, needsUpload, downloadImageAsBlob } from './imageSync';
import type { ServerMatchProfile } from './types';
import { ImageSyncError, SyncError } from '../errors';

/**
 * Converts a local Profile to server format for insert/update
 */
function localToServer(
  profile: Profile,
  userId: string,
  thumbnailPath?: string
): Omit<ServerMatchProfile, 'id' | 'created_at' | 'updated_at'> {
  return {
    user_id: userId,
    name: profile.name,
    age: profile.age ?? null,
    app_name: profile.appName ?? null,
    analysis: profile.analysis,
    thumbnail_path: thumbnailPath ?? profile.thumbnailPath ?? null,
    analysis_phase: profile.analysisPhase ?? 'complete',
    compatibility: profile.compatibility ?? null,
    zodiac_compatibility: profile.zodiac_compatibility ?? null,
    date_suggestions: profile.date_suggestions ?? null,
    virtue_scores: profile.virtue_scores ?? null,
    aspect_scores: profile.aspect_scores ?? null,
  };
}

/**
 * Converts server data to local Profile format
 */
function serverToLocal(
  server: ServerMatchProfile,
  existingLocalId?: number
): Omit<Profile, 'id'> & { id?: number; serverId: string } {
  return {
    id: existingLocalId,
    serverId: server.id,
    name: server.name,
    age: server.age ?? undefined,
    appName: server.app_name ?? undefined,
    timestamp: new Date(server.created_at),
    analysis: server.analysis as Profile['analysis'],
    thumbnail: '', // Will be populated from thumbnailPath or downloaded
    thumbnailPath: server.thumbnail_path ?? undefined,
    analysisPhase: (server.analysis_phase as Profile['analysisPhase']) ?? 'complete',
    compatibility: server.compatibility as Profile['compatibility'],
    zodiac_compatibility: server.zodiac_compatibility as Profile['zodiac_compatibility'],
    date_suggestions: server.date_suggestions as Profile['date_suggestions'],
    virtue_scores: server.virtue_scores as Profile['virtue_scores'],
    aspect_scores: server.aspect_scores as Profile['aspect_scores'],
  };
}

/**
 * Pushes a new profile to the server
 * @returns The server-assigned UUID
 */
export async function pushProfile(
  profile: Profile,
  userId: string
): Promise<string> {
  let thumbnailPath: string | undefined;

  // Upload thumbnail if it's base64 or Blob (not already a storage path)
  if (profile.thumbnail && needsUpload(profile.thumbnail)) {
    const result = await uploadImage(
      userId,
      profile.thumbnail,
      `thumbnails/${crypto.randomUUID()}.jpg`
    );
    thumbnailPath = result.path;
  } else if (profile.thumbnailPath) {
    thumbnailPath = profile.thumbnailPath;
  }

  const serverData = localToServer(profile, userId, thumbnailPath);

  const { data, error } = await supabase
    .from('match_profiles')
    .insert(serverData)
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to push profile: ${error.message}`);
  }

  // Update local record with serverId and thumbnailPath
  await db.profiles.update(profile.id!, {
    serverId: data.id,
    thumbnailPath,
  });

  return data.id;
}

/**
 * Updates an existing profile on the server
 */
export async function updateProfileOnServer(
  profile: Profile,
  userId: string
): Promise<void> {
  if (!profile.serverId) {
    throw new Error('Cannot update profile without serverId');
  }

  let thumbnailPath = profile.thumbnailPath;

  // Upload new thumbnail if it's base64 or Blob (not already synced to storage)
  if (profile.thumbnail && needsUpload(profile.thumbnail) && !profile.thumbnailPath) {
    const result = await uploadImage(
      userId,
      profile.thumbnail,
      `thumbnails/${profile.serverId}.jpg`
    );
    thumbnailPath = result.path;

    // Update local record with thumbnailPath
    await db.profiles.update(profile.id!, { thumbnailPath });
  }

  const serverData = localToServer(profile, userId, thumbnailPath);

  const { error } = await supabase
    .from('match_profiles')
    .update(serverData)
    .eq('id', profile.serverId);

  if (error) {
    throw new Error(`Failed to update profile on server: ${error.message}`);
  }
}

/**
 * Deletes a profile from the server
 */
export async function deleteProfileFromServer(
  serverId: string,
  thumbnailPath?: string
): Promise<void> {
  // Delete thumbnail from storage if it exists
  if (thumbnailPath) {
    try {
      await deleteImage(thumbnailPath);
    } catch (e) {
      // Non-critical: log typed error but continue with profile deletion
      const imageError = new ImageSyncError('delete', {
        imagePath: thumbnailPath,
        cause: e instanceof Error ? e : undefined,
      });
      console.log('profileSync:', imageError.code, imageError.message);
    }
  }

  const { error } = await supabase
    .from('match_profiles')
    .delete()
    .eq('id', serverId);

  if (error) {
    throw new Error(`Failed to delete profile from server: ${error.message}`);
  }
}

/**
 * Pulls all profiles from the server for a user
 * @param userId - The Supabase user ID
 * @returns Map of serverId -> profile data
 */
export async function pullProfiles(userId: string): Promise<Map<string, ServerMatchProfile>> {
  const { data, error } = await supabase
    .from('match_profiles')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to pull profiles: ${error.message}`);
  }

  const map = new Map<string, ServerMatchProfile>();
  for (const profile of data || []) {
    map.set(profile.id, profile as ServerMatchProfile);
  }
  return map;
}

/**
 * Syncs profiles from server to local database
 * This is the main "pull" operation during login
 */
export async function syncProfilesFromServer(userId: string): Promise<void> {
  const serverProfiles = await pullProfiles(userId);

  // Get existing local profiles with serverIds
  const localProfiles = await db.profiles.toArray();
  const localByServerId = new Map<string, Profile>();
  for (const p of localProfiles) {
    if (p.serverId) {
      localByServerId.set(p.serverId, p);
    }
  }

  // Track profiles that need thumbnail downloads
  const profilesToDownloadThumbnails: Array<{ id: number; thumbnailPath: string }> = [];

  // Process each server profile
  for (const [serverId, serverProfile] of serverProfiles) {
    const existingLocal = localByServerId.get(serverId);

    if (existingLocal) {
      // Update existing local record
      const localData = serverToLocal(serverProfile, existingLocal.id);
      // Keep the local thumbnail if we have it
      if (existingLocal.thumbnail && !localData.thumbnail) {
        localData.thumbnail = existingLocal.thumbnail;
      }
      await db.profiles.update(existingLocal.id!, localData);

      // If we don't have a thumbnail but have a path, queue for download
      if (!existingLocal.thumbnail && serverProfile.thumbnail_path) {
        profilesToDownloadThumbnails.push({
          id: existingLocal.id!,
          thumbnailPath: serverProfile.thumbnail_path,
        });
      }
    } else {
      // Insert new local record
      const localData = serverToLocal(serverProfile);
      const newId = await db.profiles.add(localData as Profile);

      // If we have a thumbnail path, queue for download
      if (serverProfile.thumbnail_path) {
        profilesToDownloadThumbnails.push({
          id: newId,
          thumbnailPath: serverProfile.thumbnail_path,
        });
      }
    }
  }

  // Delete local profiles that don't exist on server (unless they have no serverId)
  for (const local of localProfiles) {
    if (local.serverId && !serverProfiles.has(local.serverId)) {
      await db.profiles.delete(local.id!);
    }
  }

  // Download thumbnails for profiles that need them
  // Do this in parallel for better performance
  // Store as Blob for storage efficiency (~33% savings vs base64)
  if (profilesToDownloadThumbnails.length > 0) {
    await Promise.all(
      profilesToDownloadThumbnails.map(async ({ id, thumbnailPath }) => {
        try {
          const blob = await downloadImageAsBlob(thumbnailPath);
          await db.profiles.update(id, { thumbnail: blob });
        } catch (error) {
          // Non-critical: log typed error but continue with other profiles
          const imageError = new ImageSyncError('download', {
            imagePath: thumbnailPath,
            context: { profileId: id },
            cause: error instanceof Error ? error : undefined,
          });
          console.log('profileSync:', imageError.code, imageError.message);
        }
      })
    );
  }
}

/**
 * Pushes all local profiles without serverIds to the server
 * This handles migration of existing local-only data
 */
export async function pushUnsyncedProfiles(userId: string): Promise<void> {
  const unsyncedProfiles = await db.profiles
    .filter(p => !p.serverId)
    .toArray();

  for (const profile of unsyncedProfiles) {
    try {
      await pushProfile(profile, userId);
    } catch (error) {
      const syncError = new SyncError(
        `Failed to push profile ${profile.id}: ${error instanceof Error ? error.message : String(error)}`,
        {
          operation: 'push',
          context: { profileId: profile.id },
          cause: error instanceof Error ? error : undefined,
        }
      );
      console.log('profileSync:', syncError.code, syncError.message);
      throw syncError;
    }
  }
}

/**
 * Saves a profile - creates on server if new, updates if existing
 * This is the main entry point for saving profiles with sync
 */
export async function saveProfileWithSync(
  profile: Omit<Profile, 'id'> & { id?: number },
  userId: string
): Promise<{ localId: number; serverId: string }> {
  // First save locally to get an ID
  let localId: number;
  if (profile.id) {
    await db.profiles.update(profile.id, profile);
    localId = profile.id;
  } else {
    localId = await db.profiles.add(profile as Profile);
  }

  // Get the full profile with ID
  const fullProfile = await db.profiles.get(localId);
  if (!fullProfile) {
    throw new Error('Failed to get profile after save');
  }

  // Push to server
  let serverId: string;
  if (fullProfile.serverId) {
    // Update existing
    await updateProfileOnServer(fullProfile, userId);
    serverId = fullProfile.serverId;
  } else {
    // Create new
    serverId = await pushProfile(fullProfile, userId);
  }

  return { localId, serverId };
}

// ============================================
// Safe variants with Result pattern and retry
// ============================================

import { withRetry, wrapSync, type RetryOptions } from './syncUtils';
import type { Result, AuraError } from '../errors';

/**
 * Push a profile to server with automatic retry.
 * Returns a Result instead of throwing.
 */
export async function pushProfileSafe(
  profile: Profile,
  userId: string,
  options?: RetryOptions
): Promise<Result<string, AuraError>> {
  return withRetry(() => pushProfile(profile, userId), {
    ...options,
    onRetry: (attempt, error) => {
      console.log(`Retry ${attempt} for pushProfile: ${error.message}`);
      options?.onRetry?.(attempt, error);
    },
  });
}

/**
 * Update a profile on server with automatic retry.
 * Returns a Result instead of throwing.
 */
export async function updateProfileOnServerSafe(
  profile: Profile,
  userId: string,
  options?: RetryOptions
): Promise<Result<void, AuraError>> {
  return withRetry(() => updateProfileOnServer(profile, userId), options);
}

/**
 * Delete a profile from server with automatic retry.
 * Returns a Result instead of throwing.
 */
export async function deleteProfileFromServerSafe(
  serverId: string,
  thumbnailPath?: string,
  options?: RetryOptions
): Promise<Result<void, AuraError>> {
  return withRetry(() => deleteProfileFromServer(serverId, thumbnailPath), options);
}

/**
 * Sync profiles from server with automatic retry.
 * Returns a Result instead of throwing.
 */
export async function syncProfilesFromServerSafe(
  userId: string,
  options?: RetryOptions
): Promise<Result<void, AuraError>> {
  return withRetry(() => syncProfilesFromServer(userId), options);
}

/**
 * Save a profile with sync, wrapped to return Result.
 * This is the recommended way to save profiles with error handling.
 */
export const saveProfileWithSyncSafe = wrapSync(
  saveProfileWithSync,
  'push'
) as (
  profile: Omit<Profile, 'id'> & { id?: number },
  userId: string
) => Promise<Result<{ localId: number; serverId: string }, AuraError>>;
