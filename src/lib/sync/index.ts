// src/lib/sync/index.ts
// Main export file for sync module

// Types
export type {
  SyncStatus,
  SyncState,
  SyncResult,
  ServerUserProfile,
  ServerMatchProfile,
  ServerCoachingSession,
  ServerMatchChat,
  ImageUploadResult,
  ImageSyncOptions,
} from './types';

// Main sync service
export {
  getSyncState,
  subscribeSyncState,
  performFullSync,
  pullAllFromServer,
  pushAllToServer,
  clearAllLocalData,
  countUnsyncedRecords,
  refreshPendingCount,
  hasUnsyncedData,
  // Re-exported save functions
  saveProfileWithSync,
  deleteProfileFromServer,
  saveUserIdentityWithSync,
  saveCoachingSessionWithSync,
  deleteCoachingSessionFromServer,
  saveChatMessageWithSync,
  deleteChatMessagesFromServer,
} from './syncService';

// Image sync utilities
export {
  uploadImage,
  downloadImage,
  getSignedUrl,
  deleteImage,
  uploadImages,
  isStoragePath,
  getImageAsBase64,
} from './imageSync';

// Profile sync (for direct access if needed)
export {
  pushProfile,
  updateProfileOnServer,
  pullProfiles,
  syncProfilesFromServer,
  pushUnsyncedProfiles,
} from './profileSync';

// User profile sync
export {
  fetchUserProfile,
  createUserProfileOnServer,
  updateUserProfileOnServer,
  syncUserProfileFromServer,
  pushUserProfileIfNeeded,
} from './userProfileSync';

// Coaching sync
export {
  pushCoachingSession,
  updateCoachingSessionOnServer,
  pullCoachingSessions,
  syncCoachingSessionsFromServer,
  pushUnsyncedCoachingSessions,
} from './coachingSync';

// Chat sync
export {
  pushChatMessage,
  pullChatMessages,
  syncChatMessagesFromServer,
  pushUnsyncedChatMessages,
  pushChatMessagesForProfile,
} from './chatSync';
