// src/lib/sync/userProfileSync.ts
// Handles sync for user_profiles (local userIdentity table)

import { supabase } from '../supabase';
import { db, type UserIdentity } from '../db';
import type { ServerUserProfile } from './types';
import { uploadImage, downloadImage, isStoragePath } from './imageSync';
import { ImageSyncError } from '../errors';

/**
 * Converts a local UserIdentity to server format
 * Note: Frames are NOT included in video_analysis - they're handled separately via Storage
 */
function localToServer(
  identity: UserIdentity,
  userId: string,
  videoFramePaths?: string[]
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
    // Store only metadata - frames go to Storage via video_frame_paths
    video_analysis: identity.videoAnalysis ? {
      thumbnailIndex: identity.videoAnalysis.thumbnailIndex,
      extractedAt: identity.videoAnalysis.extractedAt?.toISOString(),
      analyzedAt: identity.videoAnalysis.analyzedAt?.toISOString(),
    } : null,
    video_frame_paths: videoFramePaths ?? null,
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
 * Note: Frames are NOT populated here - they're downloaded separately via downloadUserFrames()
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
    // Metadata only - frames will be populated via downloadUserFrames()
    videoAnalysis: server.video_analysis ? {
      frames: existingLocal?.videoAnalysis?.frames || [], // Preserve existing or empty until download
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
 * Uploads user video frames to Storage
 * @returns Array of storage paths
 */
async function uploadUserFrames(
  userId: string,
  frames: string[]
): Promise<string[]> {
  const paths: string[] = [];

  // Upload frames in parallel for better performance
  const uploadPromises = frames.map(async (frame, index) => {
    // Skip if already a storage path (already uploaded)
    if (isStoragePath(frame)) {
      return { index, path: frame };
    }

    try {
      const result = await uploadImage(
        userId,
        frame,
        `user-frames/frame-${index}.jpg`
      );
      return { index, path: result.path };
    } catch (error) {
      // Non-critical: log typed error but continue with other frames
      const imageError = new ImageSyncError('upload', {
        imagePath: `user-frames/frame-${index}.jpg`,
        context: { frameIndex: index },
        cause: error instanceof Error ? error : undefined,
      });
      console.log('userProfileSync:', imageError.code, imageError.message);
      return { index, path: null };
    }
  });

  const results = await Promise.all(uploadPromises);

  // Build paths array in order, filtering out failed uploads
  for (const result of results.sort((a, b) => a.index - b.index)) {
    if (result.path) {
      paths.push(result.path);
    }
  }

  return paths;
}

/**
 * Downloads user video frames from Storage
 * @returns Array of base64 strings
 */
async function downloadUserFrames(paths: string[]): Promise<string[]> {
  const frames: string[] = [];

  // Download frames in parallel for better performance
  const downloadPromises = paths.map(async (path, index) => {
    try {
      const base64 = await downloadImage(path);
      return { index, base64 };
    } catch (error) {
      // Non-critical: log typed error but continue with other frames
      const imageError = new ImageSyncError('download', {
        imagePath: path,
        context: { frameIndex: index },
        cause: error instanceof Error ? error : undefined,
      });
      console.log('userProfileSync:', imageError.code, imageError.message);
      return { index, base64: null };
    }
  });

  const results = await Promise.all(downloadPromises);

  // Build frames array in order, filtering out failed downloads
  for (const result of results.sort((a, b) => a.index - b.index)) {
    if (result.base64) {
      frames.push(result.base64);
    }
  }

  return frames;
}

/**
 * Creates a new user profile on the server
 */
export async function createUserProfileOnServer(
  identity: UserIdentity,
  userId: string
): Promise<string> {
  // Upload frames to Storage if they exist
  let videoFramePaths: string[] | undefined;
  if (identity.videoAnalysis?.frames && identity.videoAnalysis.frames.length > 0) {
    videoFramePaths = await uploadUserFrames(userId, identity.videoAnalysis.frames);
  }

  const serverData = localToServer(identity, userId, videoFramePaths);

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

  // Upload frames to Storage if they exist and are base64 (not already uploaded)
  let videoFramePaths: string[] | undefined;
  if (identity.videoAnalysis?.frames && identity.videoAnalysis.frames.length > 0) {
    // Check if any frames need uploading (are base64, not storage paths)
    const hasBase64Frames = identity.videoAnalysis.frames.some(f => !isStoragePath(f));
    if (hasBase64Frames) {
      videoFramePaths = await uploadUserFrames(userId, identity.videoAnalysis.frames);
    }
  }

  const serverData = localToServer(identity, userId, videoFramePaths);

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
    // Update local with server data (metadata only, frames downloaded separately)
    const localData = serverToLocal(serverProfile, localIdentity);
    await db.userIdentity.update(1, localData);

    // Download frames from Storage if paths exist
    if (serverProfile.video_frame_paths && serverProfile.video_frame_paths.length > 0) {
      try {
        const frames = await downloadUserFrames(serverProfile.video_frame_paths);
        if (frames.length > 0) {
          // Update videoAnalysis with downloaded frames
          const currentIdentity = await db.userIdentity.get(1);
          if (currentIdentity?.videoAnalysis) {
            await db.userIdentity.update(1, {
              videoAnalysis: {
                ...currentIdentity.videoAnalysis,
                frames,
              },
            });
          }
        }
      } catch (error) {
        // Non-critical: log typed error but continue with sync
        const imageError = new ImageSyncError('download', {
          context: { frameCount: serverProfile.video_frame_paths?.length },
          cause: error instanceof Error ? error : undefined,
        });
        console.log('userProfileSync:', imageError.code, imageError.message);
      }
    }
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
