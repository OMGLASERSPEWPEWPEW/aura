// src/lib/sync/userProfileSync.ts
// Handles sync for user_profiles (local userIdentity table)

import { supabase } from '../supabase';
import { db, type UserIdentity } from '../db';
import type { ServerUserProfile } from './types';

/**
 * Converts a local UserIdentity to server format
 */
function localToServer(
  identity: UserIdentity,
  userId: string
): Omit<ServerUserProfile, 'id' | 'created_at' | 'updated_at'> {
  return {
    user_id: userId,
    dating_goals: identity.datingGoals ? {
      type: identity.datingGoals.type,
      description: identity.datingGoals.description,
    } : null,
    data_exports: (identity.dataExports || []).map(exp => ({
      source: exp.source,
      rawStats: exp.rawStats,
      uploadedAt: exp.uploadedAt.toISOString(),
    })),
    text_inputs: (identity.textInputs || []).map(input => ({
      content: input.content,
      label: input.label,
      addedAt: input.addedAt.toISOString(),
    })),
    video_analysis: identity.videoAnalysis ? {
      frames: identity.videoAnalysis.frames,
      thumbnailIndex: identity.videoAnalysis.thumbnailIndex,
      extractedAt: identity.videoAnalysis.extractedAt?.toISOString(),
      analyzedAt: identity.videoAnalysis.analyzedAt?.toISOString(),
    } : null,
    manual_entry: identity.manualEntry || {},
    synthesis: identity.synthesis ? {
      meta: {
        lastUpdated: identity.synthesis.meta.lastUpdated.toISOString(),
        inputsUsed: identity.synthesis.meta.inputsUsed,
      },
      basics: identity.synthesis.basics,
      photos: identity.synthesis.photos,
      psychological_profile: identity.synthesis.psychological_profile,
      dating_strategy: identity.synthesis.dating_strategy,
      behavioral_insights: identity.synthesis.behavioral_insights,
      partner_virtues: identity.synthesis.partner_virtues,
      neurodivergence: identity.synthesis.neurodivergence,
      aspect_profile: identity.synthesis.aspect_profile,
    } : null,
    insight_feedback: (identity.insightFeedback || []).map(fb => ({
      insightKey: fb.insightKey,
      rating: fb.rating,
      timestamp: fb.timestamp.toISOString(),
    })),
    settings: identity.settings || {},
  };
}

/**
 * Converts server data to local UserIdentity format
 */
function serverToLocal(
  server: ServerUserProfile,
  existingLocal?: UserIdentity
): Partial<UserIdentity> {
  const parseDate = (str: string | undefined | null) => str ? new Date(str) : undefined;

  return {
    serverId: server.id,
    datingGoals: server.dating_goals ? {
      type: server.dating_goals.type,
      description: server.dating_goals.description,
    } : undefined,
    dataExports: (server.data_exports || []).map(exp => ({
      source: exp.source,
      rawStats: exp.rawStats,
      uploadedAt: new Date(exp.uploadedAt),
    })),
    textInputs: (server.text_inputs || []).map(input => ({
      content: input.content,
      label: input.label,
      addedAt: new Date(input.addedAt),
    })),
    videoAnalysis: server.video_analysis ? {
      frames: server.video_analysis.frames,
      thumbnailIndex: server.video_analysis.thumbnailIndex,
      extractedAt: parseDate(server.video_analysis.extractedAt),
      analyzedAt: parseDate(server.video_analysis.analyzedAt),
    } : undefined,
    manualEntry: server.manual_entry || {},
    synthesis: server.synthesis ? {
      meta: {
        lastUpdated: new Date(server.synthesis.meta.lastUpdated),
        inputsUsed: server.synthesis.meta.inputsUsed,
      },
      basics: server.synthesis.basics,
      photos: server.synthesis.photos,
      psychological_profile: server.synthesis.psychological_profile,
      dating_strategy: server.synthesis.dating_strategy,
      behavioral_insights: server.synthesis.behavioral_insights,
      partner_virtues: server.synthesis.partner_virtues as NonNullable<UserIdentity['synthesis']>['partner_virtues'],
      neurodivergence: server.synthesis.neurodivergence as NonNullable<UserIdentity['synthesis']>['neurodivergence'],
      aspect_profile: server.synthesis.aspect_profile as NonNullable<UserIdentity['synthesis']>['aspect_profile'],
    } : undefined,
    insightFeedback: (server.insight_feedback || []).map(fb => ({
      insightKey: fb.insightKey,
      rating: fb.rating,
      timestamp: new Date(fb.timestamp),
    })),
    settings: server.settings?.autoCompatibility !== undefined ? {
      autoCompatibility: server.settings.autoCompatibility,
    } : undefined,
    lastUpdated: new Date(),
    // Preserve existing auth fields
    supabaseUserId: existingLocal?.supabaseUserId,
    email: existingLocal?.email,
    authProvider: existingLocal?.authProvider,
    linkedAt: existingLocal?.linkedAt,
    // Preserve legacy fields
    source: existingLocal?.source,
    rawStats: existingLocal?.rawStats,
    analysis: existingLocal?.analysis,
    selfProfile: existingLocal?.selfProfile,
  };
}

/**
 * Fetches the user profile from the server
 */
export async function fetchUserProfile(userId: string): Promise<ServerUserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned - user profile doesn't exist yet
      return null;
    }
    throw new Error(`Failed to fetch user profile: ${error.message}`);
  }

  return data as ServerUserProfile;
}

/**
 * Creates a new user profile on the server
 */
export async function createUserProfileOnServer(
  identity: UserIdentity,
  userId: string
): Promise<string> {
  const serverData = localToServer(identity, userId);

  const { data, error } = await supabase
    .from('user_profiles')
    .insert(serverData)
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create user profile: ${error.message}`);
  }

  // Update local record with serverId
  await db.userIdentity.update(1, { serverId: data.id });

  return data.id;
}

/**
 * Updates the user profile on the server
 */
export async function updateUserProfileOnServer(
  identity: UserIdentity,
  userId: string
): Promise<void> {
  if (!identity.serverId) {
    throw new Error('Cannot update user profile without serverId');
  }

  const serverData = localToServer(identity, userId);

  const { error } = await supabase
    .from('user_profiles')
    .update(serverData)
    .eq('id', identity.serverId);

  if (error) {
    throw new Error(`Failed to update user profile: ${error.message}`);
  }
}

/**
 * Syncs user profile from server to local
 * Called on login to populate local cache
 */
export async function syncUserProfileFromServer(userId: string): Promise<void> {
  const serverProfile = await fetchUserProfile(userId);

  // Get or create local identity
  let localIdentity = await db.userIdentity.get(1);

  if (!localIdentity) {
    // Create empty local identity
    await db.userIdentity.add({
      id: 1,
      dataExports: [],
      textInputs: [],
      photos: [],
      manualEntry: {},
      lastUpdated: new Date(),
    });
    localIdentity = await db.userIdentity.get(1);
  }

  if (serverProfile) {
    // Update local with server data
    const localData = serverToLocal(serverProfile, localIdentity);
    await db.userIdentity.update(1, localData);
  } else if (localIdentity && hasUserData(localIdentity)) {
    // No server profile but local has data - push it
    await createUserProfileOnServer(localIdentity, userId);
  }
}

/**
 * Checks if local identity has meaningful data worth syncing
 */
function hasUserData(identity: UserIdentity): boolean {
  return !!(
    identity.datingGoals ||
    identity.synthesis ||
    (identity.dataExports && identity.dataExports.length > 0) ||
    (identity.textInputs && identity.textInputs.length > 0) ||
    (identity.photos && identity.photos.length > 0) ||
    (identity.manualEntry && Object.keys(identity.manualEntry).length > 0)
  );
}

/**
 * Saves user identity with sync to server
 * This is the main entry point for saving user profile data
 */
export async function saveUserIdentityWithSync(
  updates: Partial<UserIdentity>,
  userId: string
): Promise<void> {
  // Update local first
  await db.userIdentity.update(1, {
    ...updates,
    lastUpdated: new Date(),
  });

  // Get the full updated identity
  const identity = await db.userIdentity.get(1);
  if (!identity) {
    throw new Error('Failed to get identity after update');
  }

  // Sync to server
  if (identity.serverId) {
    await updateUserProfileOnServer(identity, userId);
  } else {
    await createUserProfileOnServer(identity, userId);
  }
}

/**
 * Pushes local user profile to server if it has data and isn't synced
 */
export async function pushUserProfileIfNeeded(userId: string): Promise<void> {
  const identity = await db.userIdentity.get(1);
  if (!identity) return;

  if (!identity.serverId && hasUserData(identity)) {
    await createUserProfileOnServer(identity, userId);
  }
}
