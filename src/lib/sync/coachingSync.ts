// src/lib/sync/coachingSync.ts
// Handles sync for coaching_sessions table

import { supabase } from '../supabase';
import { db, type CoachingSession } from '../db';
import { uploadImages, deleteImage, isStoragePath } from './imageSync';
import type { ServerCoachingSession } from './types';
import { ImageSyncError, SyncError } from '../errors';

/**
 * Converts a local CoachingSession to server format
 */
function localToServer(
  session: CoachingSession,
  userId: string,
  serverProfileId: string,
  imagePaths?: string[]
): Omit<ServerCoachingSession, 'id' | 'created_at' | 'updated_at'> {
  return {
    user_id: userId,
    match_profile_id: serverProfileId,
    conversation_image_paths: imagePaths || session.conversationImagePaths || [],
    match_analysis: session.matchAnalysis,
    suggested_responses: session.suggestedResponses,
    user_actual_response: session.userActualResponse ?? null,
    response_score: session.responseScore ?? null,
    score_explanation: session.scoreExplanation ?? null,
  };
}

/**
 * Converts server data to local CoachingSession format
 */
function serverToLocal(
  server: ServerCoachingSession,
  localProfileId: number,
  existingLocalId?: number
): Omit<CoachingSession, 'id'> & { id?: number; serverId: string; serverProfileId: string } {
  return {
    id: existingLocalId,
    serverId: server.id,
    serverProfileId: server.match_profile_id,
    profileId: localProfileId,
    timestamp: new Date(server.created_at),
    conversationImages: [], // Will be downloaded if needed
    conversationImagePaths: server.conversation_image_paths,
    matchAnalysis: server.match_analysis,
    suggestedResponses: server.suggested_responses,
    userActualResponse: server.user_actual_response ?? undefined,
    responseScore: server.response_score ?? undefined,
    scoreExplanation: server.score_explanation ?? undefined,
  };
}

/**
 * Gets the serverProfileId for a local profile
 */
async function getServerProfileId(localProfileId: number): Promise<string | null> {
  const profile = await db.profiles.get(localProfileId);
  return profile?.serverId ?? null;
}

/**
 * Pushes a coaching session to the server
 */
export async function pushCoachingSession(
  session: CoachingSession,
  userId: string
): Promise<string> {
  // Get the server profile ID
  const serverProfileId = await getServerProfileId(session.profileId);
  if (!serverProfileId) {
    throw new Error('Cannot sync coaching session: match profile not synced');
  }

  // Upload images if they're base64
  let imagePaths: string[] = session.conversationImagePaths || [];

  if (session.conversationImages && session.conversationImages.length > 0) {
    const base64Images = session.conversationImages.filter(img => !isStoragePath(img));
    if (base64Images.length > 0) {
      const sessionId = crypto.randomUUID();
      const uploads = base64Images.map((img, idx) => ({
        base64: img,
        path: `coaching/${sessionId}/${idx}.jpg`,
      }));
      const results = await uploadImages(userId, uploads);
      imagePaths = results.map(r => r.path);
    }
  }

  const serverData = localToServer(session, userId, serverProfileId, imagePaths);

  const { data, error } = await supabase
    .from('coaching_sessions')
    .insert(serverData)
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to push coaching session: ${error.message}`);
  }

  // Update local record with serverId and image paths
  await db.coachingSessions.update(session.id!, {
    serverId: data.id,
    serverProfileId,
    conversationImagePaths: imagePaths,
  });

  return data.id;
}

/**
 * Updates a coaching session on the server
 */
export async function updateCoachingSessionOnServer(
  session: CoachingSession,
  userId: string
): Promise<void> {
  if (!session.serverId || !session.serverProfileId) {
    throw new Error('Cannot update coaching session without server IDs');
  }

  const serverData = localToServer(
    session,
    userId,
    session.serverProfileId,
    session.conversationImagePaths
  );

  const { error } = await supabase
    .from('coaching_sessions')
    .update(serverData)
    .eq('id', session.serverId);

  if (error) {
    throw new Error(`Failed to update coaching session: ${error.message}`);
  }
}

/**
 * Deletes a coaching session from the server
 */
export async function deleteCoachingSessionFromServer(
  serverId: string,
  imagePaths?: string[]
): Promise<void> {
  // Delete images from storage
  if (imagePaths && imagePaths.length > 0) {
    for (const path of imagePaths) {
      try {
        await deleteImage(path);
      } catch (e) {
        // Non-critical: log typed error but continue with session deletion
        const imageError = new ImageSyncError('delete', {
          imagePath: path,
          cause: e instanceof Error ? e : undefined,
        });
        console.log('coachingSync:', imageError.code, imageError.message);
      }
    }
  }

  const { error } = await supabase
    .from('coaching_sessions')
    .delete()
    .eq('id', serverId);

  if (error) {
    throw new Error(`Failed to delete coaching session: ${error.message}`);
  }
}

/**
 * Pulls all coaching sessions from the server
 */
export async function pullCoachingSessions(
  userId: string
): Promise<Map<string, ServerCoachingSession>> {
  const { data, error } = await supabase
    .from('coaching_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to pull coaching sessions: ${error.message}`);
  }

  const map = new Map<string, ServerCoachingSession>();
  for (const session of data || []) {
    map.set(session.id, session as ServerCoachingSession);
  }
  return map;
}

/**
 * Syncs coaching sessions from server to local
 */
export async function syncCoachingSessionsFromServer(userId: string): Promise<void> {
  const serverSessions = await pullCoachingSessions(userId);

  // Build map of serverProfileId -> localProfileId
  const profiles = await db.profiles.toArray();
  const profileIdMap = new Map<string, number>();
  for (const p of profiles) {
    if (p.serverId) {
      profileIdMap.set(p.serverId, p.id!);
    }
  }

  // Get existing local sessions
  const localSessions = await db.coachingSessions.toArray();
  const localByServerId = new Map<string, CoachingSession>();
  for (const s of localSessions) {
    if (s.serverId) {
      localByServerId.set(s.serverId, s);
    }
  }

  // Process each server session
  for (const [serverId, serverSession] of serverSessions) {
    const localProfileId = profileIdMap.get(serverSession.match_profile_id);
    if (!localProfileId) {
      // Skip sessions for profiles we don't have locally - informational log
      console.log(`coachingSync: Skipping session - profile ${serverSession.match_profile_id} not found locally`);
      continue;
    }

    const existingLocal = localByServerId.get(serverId);

    if (existingLocal) {
      // Update existing
      const localData = serverToLocal(serverSession, localProfileId, existingLocal.id);
      // Keep local images if we have them
      if (existingLocal.conversationImages.length > 0) {
        localData.conversationImages = existingLocal.conversationImages;
      }
      await db.coachingSessions.update(existingLocal.id!, localData);
    } else {
      // Insert new
      const localData = serverToLocal(serverSession, localProfileId);
      await db.coachingSessions.add(localData as CoachingSession);
    }
  }

  // Delete local sessions not on server
  for (const local of localSessions) {
    if (local.serverId && !serverSessions.has(local.serverId)) {
      await db.coachingSessions.delete(local.id!);
    }
  }
}

/**
 * Pushes all unsynced coaching sessions
 */
export async function pushUnsyncedCoachingSessions(userId: string): Promise<void> {
  const unsyncedSessions = await db.coachingSessions
    .filter(s => !s.serverId)
    .toArray();

  for (const session of unsyncedSessions) {
    try {
      await pushCoachingSession(session, userId);
    } catch (error) {
      // Non-critical: log typed error but continue with other sessions
      const syncError = new SyncError(
        `Failed to push coaching session ${session.id}: ${error instanceof Error ? error.message : String(error)}`,
        {
          operation: 'push',
          context: { sessionId: session.id },
          cause: error instanceof Error ? error : undefined,
        }
      );
      console.log('coachingSync:', syncError.code, syncError.message);
    }
  }
}

/**
 * Saves a coaching session with sync
 */
export async function saveCoachingSessionWithSync(
  session: Omit<CoachingSession, 'id'> & { id?: number },
  userId: string
): Promise<{ localId: number; serverId: string }> {
  // Save locally first
  let localId: number;
  if (session.id) {
    await db.coachingSessions.update(session.id, session);
    localId = session.id;
  } else {
    localId = await db.coachingSessions.add(session as CoachingSession) as number;
  }

  const fullSession = await db.coachingSessions.get(localId);
  if (!fullSession) {
    throw new Error('Failed to get coaching session after save');
  }

  // Push to server
  let serverId: string;
  if (fullSession.serverId) {
    await updateCoachingSessionOnServer(fullSession, userId);
    serverId = fullSession.serverId;
  } else {
    serverId = await pushCoachingSession(fullSession, userId);
  }

  return { localId, serverId };
}
