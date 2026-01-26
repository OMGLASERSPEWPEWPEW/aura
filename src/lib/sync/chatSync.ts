// src/lib/sync/chatSync.ts
// Handles sync for match_chats table (Ask About Match feature)

import { supabase } from '../supabase';
import { db, type MatchChatMessage } from '../db';
import type { ServerMatchChat } from './types';
import { SyncError } from '../errors';

/**
 * Converts a local MatchChatMessage to server format
 */
function localToServer(
  chat: MatchChatMessage,
  userId: string,
  serverProfileId: string
): Omit<ServerMatchChat, 'id' | 'created_at'> {
  return {
    user_id: userId,
    match_profile_id: serverProfileId,
    role: chat.role,
    content: chat.content,
  };
}

/**
 * Converts server data to local MatchChatMessage format
 */
function serverToLocal(
  server: ServerMatchChat,
  localProfileId: number,
  existingLocalId?: number
): Omit<MatchChatMessage, 'id'> & { id?: number; serverId: string; serverProfileId: string } {
  return {
    id: existingLocalId,
    serverId: server.id,
    serverProfileId: server.match_profile_id,
    profileId: localProfileId,
    timestamp: new Date(server.created_at),
    role: server.role,
    content: server.content,
  };
}

/**
 * Pushes a chat message to the server
 */
export async function pushChatMessage(
  chat: MatchChatMessage,
  userId: string
): Promise<string> {
  // Get the server profile ID
  const profile = await db.profiles.get(chat.profileId);
  const serverProfileId = profile?.serverId;
  if (!serverProfileId) {
    throw new Error('Cannot sync chat message: match profile not synced');
  }

  const serverData = localToServer(chat, userId, serverProfileId);

  const { data, error } = await supabase
    .from('match_chats')
    .insert(serverData)
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to push chat message: ${error.message}`);
  }

  // Update local record with serverId
  await db.matchChats.update(chat.id!, {
    serverId: data.id,
    serverProfileId,
  });

  return data.id;
}

/**
 * Deletes chat messages for a profile from the server
 */
export async function deleteChatMessagesFromServer(serverProfileId: string): Promise<void> {
  const { error } = await supabase
    .from('match_chats')
    .delete()
    .eq('match_profile_id', serverProfileId);

  if (error) {
    throw new Error(`Failed to delete chat messages: ${error.message}`);
  }
}

/**
 * Pulls all chat messages from the server
 */
export async function pullChatMessages(userId: string): Promise<Map<string, ServerMatchChat>> {
  const { data, error } = await supabase
    .from('match_chats')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to pull chat messages: ${error.message}`);
  }

  const map = new Map<string, ServerMatchChat>();
  for (const chat of data || []) {
    map.set(chat.id, chat as ServerMatchChat);
  }
  return map;
}

/**
 * Syncs chat messages from server to local
 */
export async function syncChatMessagesFromServer(userId: string): Promise<void> {
  const serverChats = await pullChatMessages(userId);

  // Build map of serverProfileId -> localProfileId
  const profiles = await db.profiles.toArray();
  const profileIdMap = new Map<string, number>();
  for (const p of profiles) {
    if (p.serverId) {
      profileIdMap.set(p.serverId, p.id!);
    }
  }

  // Get existing local chats
  const localChats = await db.matchChats.toArray();
  const localByServerId = new Map<string, MatchChatMessage>();
  for (const c of localChats) {
    if (c.serverId) {
      localByServerId.set(c.serverId, c);
    }
  }

  // Process each server chat
  for (const [serverId, serverChat] of serverChats) {
    const localProfileId = profileIdMap.get(serverChat.match_profile_id);
    if (!localProfileId) {
      // Skip chats for profiles we don't have locally
      continue;
    }

    const existingLocal = localByServerId.get(serverId);

    if (!existingLocal) {
      // Insert new (chats are immutable, so no updates needed)
      const localData = serverToLocal(serverChat, localProfileId);
      await db.matchChats.add(localData as MatchChatMessage);
    }
  }

  // Delete local chats not on server
  for (const local of localChats) {
    if (local.serverId && !serverChats.has(local.serverId)) {
      await db.matchChats.delete(local.id!);
    }
  }
}

/**
 * Pushes all unsynced chat messages
 */
export async function pushUnsyncedChatMessages(userId: string): Promise<void> {
  const unsyncedChats = await db.matchChats
    .filter(c => !c.serverId)
    .toArray();

  // Sort by timestamp to maintain order
  unsyncedChats.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  for (const chat of unsyncedChats) {
    try {
      await pushChatMessage(chat, userId);
    } catch (error) {
      // Non-critical: log typed error but continue with other messages
      const syncError = new SyncError(
        `Failed to push chat message ${chat.id}: ${error instanceof Error ? error.message : String(error)}`,
        {
          operation: 'push',
          context: { chatId: chat.id },
          cause: error instanceof Error ? error : undefined,
        }
      );
      console.log('chatSync:', syncError.code, syncError.message);
    }
  }
}

/**
 * Saves a chat message with sync
 */
export async function saveChatMessageWithSync(
  chat: Omit<MatchChatMessage, 'id'>,
  userId: string
): Promise<{ localId: number; serverId: string }> {
  // Save locally first
  const localId = await db.matchChats.add(chat as MatchChatMessage) as number;

  const fullChat = await db.matchChats.get(localId);
  if (!fullChat) {
    throw new Error('Failed to get chat message after save');
  }

  // Push to server
  const serverId = await pushChatMessage(fullChat, userId);

  return { localId, serverId };
}

/**
 * Bulk push chat messages for a profile
 */
export async function pushChatMessagesForProfile(
  profileId: number,
  userId: string
): Promise<void> {
  const chats = await db.matchChats
    .where('profileId')
    .equals(profileId)
    .filter(c => !c.serverId)
    .toArray();

  for (const chat of chats) {
    await pushChatMessage(chat, userId);
  }
}
