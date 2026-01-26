// src/components/profile/InsightsTab.tsx
// Tab for displaying progressive streaming analysis results
// Uses the SAME UI components as Upload.tsx (match analysis)

import { Sparkles, Loader2, RefreshCw, CheckCircle, XCircle, User, MapPin, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UserSynthesis, VideoAnalysis } from '../../lib/db';
import type { UserStreamingAnalysisState } from '../../hooks/useUserStreamingAnalysis';
import UserProfileDisplay from '../UserProfileDisplay';
import { MyVirtuesCard } from '../ui/MyVirtuesCard';
import {
  InsightCard,
  FlagCard,
  VibesCard,
  ArchetypeCard,
  DeepAnalysisPendingCard,
} from '../upload/InsightCard';
import {
  FloatingProgress,
  AbortButton,
} from '../upload/ProgressiveHeader';

type LivingSituation = 'solo' | 'roommates' | 'caregiving';

interface InsightsTabProps {
  synthesis: UserSynthesis | undefined;
  streamingState: UserStreamingAnalysisState;
  isAnalyzingLegacy: boolean;
  analysisError: string | null;
  hasAnyInput: boolean;
  videoAnalysis?: VideoAnalysis;
  livingSituation?: LivingSituation;
  onLivingSituationChange?: (value: LivingSituation) => void;
  onRunAnalysisLegacy: () => void;
  onClearError: () => void;
  onAbort: () => void;
  onReset: () => void;
}

// Determine card state based on current chunk (same logic as Upload.tsx)
function getCardState(currentChunk: number, minChunk: number, phase: string) {
  if (phase === 'error') return 'error' as const;
  if (currentChunk >= minChunk) return 'complete' as const;
  if (currentChunk === minChunk - 1) return 'loading' as const;
  return 'pending' as const;
}

export default function InsightsTab({
  synthesis,
  streamingState,
  isAnalyzingLegacy,
  analysisError,
  hasAnyInput,
  videoAnalysis,
  livingSituation,
  onLivingSituationChange,
  onRunAnalysisLegacy,
  onClearError,
  onAbort,
  onReset,
}: InsightsTabProps) {
  const { phase, currentChunk, totalChunks, error: streamingError, thumbnailFrame, profile } = streamingState;

  // Check if streaming analysis is in progress
  const isStreamingActive = phase !== 'idle' && phase !== 'complete' && phase !== 'error' && phase !== 'aborted';
  const canAbort = ['extracting', 'chunk-1', 'chunk-2', 'chunk-3', 'chunk-4'].includes(phase);
  const isProcessing = canAbort || phase === 'consolidating';
  const hasMinimumViableProfile = profile.identity.name !== null || profile.identity.age !== null;
  const isError = phase === 'error' || !!analysisError;
  const errorMessage = streamingError || analysisError;

  // Calculate insights count (mirrors Upload.tsx)
  const insightsCount =
    profile.photos.vibesSummary.length +
    profile.behavioral.strengths.length +
    profile.behavioral.growthAreas.length;

  // Determine what to show
  // Hide streaming cards when complete AND synthesis exists (full profile will show instead)
  const showStreaming = phase !== 'idle' && !(phase === 'complete' && synthesis);
  const showLegacyLoading = isAnalyzingLegacy && !isStreamingActive;
  const showResults = synthesis && !isStreamingActive && !isAnalyzingLegacy && phase !== 'error';
  const showEmptyState = !synthesis && !isStreamingActive && !isAnalyzingLegacy && !isError && phase === 'idle';

  // Check if user has 11 Virtues profile
  const hasVirtueProfile = !!(synthesis?.virtue_profile?.scores?.length);

  return (
    <div className="space-y-3">
      {/* Error state */}
      {isError && !isStreamingActive && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <XCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="font-medium text-red-800">Analysis Error</h3>
              <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
              <button
                onClick={() => {
                  onClearError();
                  onReset();
                }}
                className="mt-3 text-sm text-red-700 font-medium hover:underline"
              >
                Try Again
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ===== STREAMING ANALYSIS VIEW (mirrors Upload.tsx) ===== */}
      {showStreaming && phase !== 'error' && (
        <>
          {/* Progressive Header - same as Upload.tsx but adapted for user profile */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/95 backdrop-blur-sm border border-slate-100 shadow-sm rounded-xl overflow-hidden"
          >
            <div className="p-4 flex items-start gap-4">
              {/* Thumbnail */}
              <div className="w-16 h-20 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                <AnimatePresence mode="wait">
                  {thumbnailFrame ? (
                    <motion.img
                      key="thumbnail"
                      src={thumbnailFrame}
                      alt={profile.identity.name || 'Your profile'}
                      initial={{ opacity: 0, scale: 1.1 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <motion.div
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full h-full flex items-center justify-center"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
                      ) : (
                        <User className="w-6 h-6 text-slate-300" />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Loading overlay */}
                {isProcessing && thumbnailFrame && (
                  <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <AnimatePresence mode="wait">
                    {profile.identity.name ? (
                      <motion.h2
                        key="name"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-xl font-bold text-slate-900 truncate"
                      >
                        {profile.identity.name}
                        {profile.identity.age && (
                          <span className="font-normal text-slate-600">, {profile.identity.age}</span>
                        )}
                      </motion.h2>
                    ) : (
                      <motion.div
                        key="name-loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-6 w-32 bg-slate-200 rounded animate-pulse"
                      />
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <AnimatePresence>
                    {profile.identity.location && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-1"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[150px]">{profile.identity.location}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <AnimatePresence>
                    {profile.identity.occupation && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex items-center gap-1"
                      >
                        <Briefcase className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[150px]">{profile.identity.occupation}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!profile.identity.location && !profile.identity.occupation && (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
                      <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Abort bar - same as Upload.tsx */}
          {canAbort && (
            <div className="bg-white/95 backdrop-blur-sm border border-slate-100 rounded-xl px-4 py-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">
                  {phase === 'extracting' && 'Extracting frames...'}
                  {phase.startsWith('chunk-') && `Analyzing (chunk ${currentChunk + 1}/4)...`}
                  {phase === 'consolidating' && 'Finishing up...'}
                </span>
                <AbortButton
                  onClick={() => { onAbort(); onReset(); }}
                  hasProgress={hasMinimumViableProfile}
                />
              </div>
            </div>
          )}

          {/* Unfurling Insight Cards - same components as Upload.tsx */}
          <AnimatePresence>
            {/* Identity Info Card - appears after chunk 1 */}
            {currentChunk >= 1 && (
              <InsightCard
                title="Basic Info"
                state={getCardState(currentChunk, 1, phase)}
                index={0}
              >
                <div className="text-sm text-slate-600 space-y-1">
                  {profile.identity.name && (
                    <p><span className="font-medium">Name:</span> {profile.identity.name}</p>
                  )}
                  {profile.identity.age && (
                    <p><span className="font-medium">Age:</span> {profile.identity.age}</p>
                  )}
                  {profile.identity.location && (
                    <p><span className="font-medium">Location:</span> {profile.identity.location}</p>
                  )}
                  {profile.identity.occupation && (
                    <p><span className="font-medium">Work:</span> {profile.identity.occupation}</p>
                  )}
                </div>
              </InsightCard>
            )}

            {/* Vibes Card - appears after chunk 2 */}
            {(currentChunk >= 2 || phase.startsWith('chunk-2')) && (
              <VibesCard
                vibes={profile.photos.vibesSummary}
                state={getCardState(currentChunk, 2, phase)}
                index={1}
              />
            )}

            {/* Archetype Card - appears after chunk 2 */}
            {(currentChunk >= 2 || phase.startsWith('chunk-2')) && (
              <ArchetypeCard
                archetype={profile.psychological.archetype}
                confidence={profile.psychological.confidenceLevel}
                state={getCardState(currentChunk, 2, phase)}
                index={2}
              />
            )}

            {/* Strengths Card - appears after chunk 3 (user-specific) */}
            {(currentChunk >= 3 || phase.startsWith('chunk-3')) && (
              <FlagCard
                title="Your Strengths"
                flags={profile.behavioral.strengths}
                type="green"
                state={getCardState(currentChunk, 3, phase)}
                index={3}
              />
            )}

            {/* Growth Areas Card - appears after chunk 4 (user-specific, positive framing) */}
            {(currentChunk >= 4 || phase === 'consolidating' || phase === 'complete') && (
              <FlagCard
                title="Your Next Level"
                flags={profile.behavioral.growthAreas}
                type="red"
                state={getCardState(currentChunk, 4, phase)}
                index={4}
              />
            )}

            {/* Deep Analysis Pending Card */}
            {phase !== 'complete' && phase !== 'aborted' && (
              <DeepAnalysisPendingCard isVisible={currentChunk >= 2} />
            )}
          </AnimatePresence>

          {/* Complete State */}
          {phase === 'complete' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 border border-green-200 rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-medium text-green-800">Analysis Complete</h3>
              </div>
              <p className="text-sm text-green-700 mb-4">
                Your profile has been analyzed. View full results below.
              </p>
            </motion.div>
          )}

          {/* Floating Progress Indicator - the black pill at bottom */}
          <AnimatePresence>
            {isProcessing && (
              <FloatingProgress
                currentChunk={currentChunk}
                totalChunks={totalChunks}
                insightsCount={insightsCount}
                isComplete={phase === 'complete'}
              />
            )}
          </AnimatePresence>
        </>
      )}

      {/* Legacy loading state */}
      {showLegacyLoading && (
        <div className="bg-white p-8 rounded-xl shadow-sm text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-indigo-600" size={40} />
          <h3 className="font-semibold text-slate-800 mb-2">Analyzing Your Profile...</h3>
          <p className="text-sm text-slate-500">This typically takes 30-60 seconds.</p>
        </div>
      )}

      {/* Empty state - no analysis yet */}
      {showEmptyState && (
        <div className="bg-white p-8 rounded-xl shadow-sm text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Sparkles className="text-indigo-600" size={28} />
          </div>
          <h3 className="font-semibold text-slate-800 mb-2">No Analysis Yet</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
            {hasAnyInput
              ? "You have some profile data. Upload a video to get your full analysis, or run a text-based analysis."
              : "Upload a video recording of your dating profile to get started."
            }
          </p>

          {hasAnyInput && (
            <button
              onClick={onRunAnalysisLegacy}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              <Sparkles size={18} />
              Analyze Without Video
            </button>
          )}
        </div>
      )}

      {/* Results display */}
      {showResults && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Success header */}
          <div className="bg-green-50 p-4 rounded-xl flex items-center gap-3">
            <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-semibold text-green-800">Analysis Complete</h3>
              <p className="text-sm text-green-600">
                Last updated: {synthesis.meta.lastUpdated.toLocaleString()}
              </p>
            </div>
            <button
              onClick={onRunAnalysisLegacy}
              className="ml-auto p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
              title="Re-run analysis"
            >
              <RefreshCw size={18} />
            </button>
          </div>

          {/* 11 Virtues Profile Card - show if available */}
          {hasVirtueProfile && synthesis.virtue_profile && (
            <MyVirtuesCard
              virtueProfile={synthesis.virtue_profile}
              onRegenerate={onRunAnalysisLegacy}
              isRegenerating={isAnalyzingLegacy}
            />
          )}

          {/* Full profile display */}
          <UserProfileDisplay
            synthesis={synthesis}
            videoFrames={videoAnalysis?.frames}
            livingSituation={livingSituation}
            onLivingSituationChange={onLivingSituationChange}
          />
        </motion.div>
      )}
    </div>
  );
}
