// src/hooks/index.ts
// Re-export all custom hooks

export { useCopyToClipboard } from './useCopyToClipboard';
export { useZodiacCompatibility } from './useZodiacCompatibility';
export { useDateIdeas } from './useDateIdeas';
export { useOpenerRefresh } from './useOpenerRefresh';
export { useConversationCoach } from './useConversationCoach';
export { useCompatibilityScores } from './useCompatibilityScores';
export { useAskAboutMatch } from './useAskAboutMatch';
export { useStreamingAnalysisCore } from './useStreamingAnalysisCore';
export type {
  StreamingAnalysisStateBase,
  StreamingAnalysisReturnBase,
  StreamingAnalysisCallbacks,
  ChunkAnalysisOptions,
} from './useStreamingAnalysisCore';
export { useStreamingAnalysis } from './useStreamingAnalysis';
export { useUserStreamingAnalysis } from './useUserStreamingAnalysis';
export { useRequireAuth } from './useRequireAuth';
export { useSyncStatus } from './useSyncStatus';
