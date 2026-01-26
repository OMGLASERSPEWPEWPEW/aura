// src/hooks/useAskAboutMatch.ts
import { useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type ProfileAnalysis, type ProfileCompatibility } from '../lib/db';
import { askAboutMatch } from '../lib/ai';
import { ApiError, StorageError, AuraError } from '../lib/errors';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface UseAskAboutMatchReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (question: string) => Promise<void>;
  clearHistory: () => Promise<void>;
}

/**
 * Hook for managing Ask About Match chat with persistence.
 * Messages are stored in IndexedDB and persist across sessions.
 */
export function useAskAboutMatch(
  profileId: number,
  matchAnalysis: ProfileAnalysis,
  compatibility?: ProfileCompatibility
): UseAskAboutMatchReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load chat history from IndexedDB using useLiveQuery for real-time updates
  const chatMessages = useLiveQuery(
    () => db.matchChats
      .where('profileId')
      .equals(profileId)
      .sortBy('timestamp'),
    [profileId]
  );

  // Convert DB messages to Message format
  const messages: Message[] = (chatMessages || []).map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  const sendMessage = useCallback(async (question: string) => {
    if (!question.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      // Add user message to DB first
      await db.matchChats.add({
        profileId,
        timestamp: new Date(),
        role: 'user',
        content: question.trim(),
      });

      // Call AI for response
      const response = await askAboutMatch({
        question: question.trim(),
        matchAnalysis,
        compatibility,
      });

      // Add assistant response to DB
      await db.matchChats.add({
        profileId,
        timestamp: new Date(),
        role: 'assistant',
        content: response,
      });
    } catch (err) {
      const auraError = err instanceof AuraError
        ? err
        : new ApiError(err instanceof Error ? err.message : 'Failed to process question', { cause: err instanceof Error ? err : undefined });
      console.log('useAskAboutMatch:', auraError.code, auraError.message);

      const errorMessage = auraError.getUserMessage();
      setError(errorMessage);

      // Still add error response to DB for consistency
      await db.matchChats.add({
        profileId,
        timestamp: new Date(),
        role: 'assistant',
        content: "Sorry, I couldn't process that question. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [profileId, matchAnalysis, compatibility, isLoading]);

  const clearHistory = useCallback(async () => {
    try {
      // Delete all messages for this profile
      await db.matchChats.where('profileId').equals(profileId).delete();
    } catch (err) {
      const storageError = new StorageError(
        `Failed to clear chat history: ${err instanceof Error ? err.message : String(err)}`,
        'local',
        { cause: err instanceof Error ? err : undefined }
      );
      console.log('useAskAboutMatch:', storageError.code, storageError.message);
      setError(storageError.getUserMessage());
    }
  }, [profileId]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearHistory,
  };
}
