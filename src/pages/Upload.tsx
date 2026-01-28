// src/pages/Upload.tsx
// Streaming profile analysis with unfurling insight cards

import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import VideoUploader from '../components/VideoUploader';
import {
  InsightCard,
  FlagCard,
  VibesCard,
  ArchetypeCard,
  DeepAnalysisPendingCard,
} from '../components/upload/InsightCard';
import {
  ProgressiveHeader,
  FloatingProgress,
  AbortButton,
} from '../components/upload/ProgressiveHeader';
import { useStreamingAnalysis } from '../hooks/useStreamingAnalysis';
import { db } from '../lib/db';
import type { UserIdentity } from '../lib/db';
import { hasUserProfile as checkHasUserProfile } from '../lib/utils';
import { downloadConsoleLogs } from '../lib/utils/errorExport';
import {
  User,
  Download,
} from 'lucide-react';

export default function Upload() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [userIdentity, setUserIdentity] = useState<UserIdentity | undefined>(undefined);
  const [userContextLoaded, setUserContextLoaded] = useState(false);
  const [showAbortModal, setShowAbortModal] = useState(false);

  // Streaming analysis hook
  const {
    state,
    startAnalysis,
    abort,
    reset,
    canAbort,
    hasMinimumViableProfile,
    isProcessing,
  } = useStreamingAnalysis();

  // Track if component is mounted
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Fetch user identity on mount
  useEffect(() => {
    const loadUserIdentity = async () => {
      const identity = await db.userIdentity.get(1);
      if (isMounted.current) {
        setUserIdentity(identity);
        setUserContextLoaded(true);
      }
    };
    loadUserIdentity();
  }, []);

  const hasUserProfile = checkHasUserProfile(userIdentity);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    reset(); // Reset streaming state
  };

  // Auto-start analysis when file is selected
  useEffect(() => {
    if (file && state.phase === 'idle') {
      startAnalysis(file);
    }
  }, [file, state.phase, startAnalysis]);

  // Handle abort button click
  const handleAbortClick = () => {
    if (hasMinimumViableProfile) {
      setShowAbortModal(true);
    } else {
      abort(false);
      reset();
      setFile(null);
    }
  };

  // Handle abort modal choices
  const handleAbortConfirm = async (saveProgress: boolean) => {
    setShowAbortModal(false);
    await abort(saveProgress);
    if (!saveProgress) {
      reset();
      setFile(null);
    }
  };

  // Auto-navigate to profile when analysis completes
  useEffect(() => {
    if (state.phase === 'complete' && state.savedProfileId) {
      navigate(`/profile/${state.savedProfileId}`);
    }
  }, [state.phase, state.savedProfileId, navigate]);

  // Calculate insights count for display
  const insightsCount =
    state.profile.photos.vibesSummary.length +
    state.profile.psychological.signals.length +
    state.profile.earlyWarnings.redFlags.length +
    state.profile.earlyWarnings.greenFlags.length;

  // Determine card states based on current chunk
  const getCardState = (minChunk: number) => {
    if (state.phase === 'error') return 'error';
    if (state.currentChunk >= minChunk) return 'complete';
    if (state.currentChunk === minChunk - 1) return 'loading';
    return 'pending';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      {/* Header */}
      <div className="p-4 max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <Link to="/" className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400">
            ← Back
          </Link>
          <button
            onClick={() => downloadConsoleLogs()}
            className="text-xs bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 px-3 py-1 rounded flex items-center gap-1"
          >
            <Download size={12} /> Debug
          </button>
        </div>

        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-50 mb-4">Match Explore</h1>

        {/* Warning if no user profile */}
        {userContextLoaded && !hasUserProfile && state.phase === 'idle' && (
          <div className="mb-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200 p-3 rounded-lg flex items-start text-sm">
            <User className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <Link to="/my-profile" className="font-bold underline hover:text-amber-900 dark:hover:text-amber-100">
                Create your profile
              </Link>
              {' '}for personalized compatibility insights.
            </div>
          </div>
        )}
      </div>

      {/* Video uploader (only show when idle) */}
      {state.phase === 'idle' && (
        <div className="px-4 max-w-2xl mx-auto">
          <VideoUploader onFileSelect={handleFileSelect} />

          {/* Recording Guide */}
          <div className="mt-4 bg-slate-50 dark:bg-slate-700 p-4 rounded-xl text-sm text-slate-600 dark:text-slate-300">
            <h4 className="font-semibold text-slate-900 dark:text-slate-50 mb-2">
              How to record a match:
            </h4>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Open your dating app and find their profile</li>
              <li>Start a screen recording on your phone</li>
              <li>Slowly scroll through their entire profile</li>
              <li>Pause briefly on each photo (2-3 seconds)</li>
              <li>Make sure to capture any prompts or bio text</li>
              <li>Stop recording and upload here</li>
            </ol>
          </div>
        </div>
      )}

      {/* Streaming Analysis View */}
      {state.phase !== 'idle' && (
        <>
          {/* Progressive Header */}
          <ProgressiveHeader
            profile={state.profile}
            thumbnailFrame={state.thumbnailFrame}
            isLoading={isProcessing}
          />

          {/* Abort Button */}
          {canAbort && (
            <div className="sticky top-[88px] z-10 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-b border-slate-100 dark:border-slate-700 px-4 py-2">
              <div className="max-w-2xl mx-auto flex justify-between items-center">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {state.phase === 'extracting' && 'Extracting frames...'}
                  {state.phase.startsWith('chunk-') && `Exploring (chunk ${state.currentChunk + 1}/4)...`}
                  {state.phase === 'consolidating' && 'Finishing up...'}
                </span>
                <AbortButton
                  onClick={handleAbortClick}
                  hasProgress={hasMinimumViableProfile}
                />
              </div>
            </div>
          )}

          {/* Insight Cards */}
          <div className="px-4 max-w-2xl mx-auto mt-4 space-y-3">
            <AnimatePresence>
              {/* Identity Info Card - appears after chunk 1 */}
              {state.currentChunk >= 1 && (
                <InsightCard
                  title="Basic Info"
                  state={getCardState(1)}
                  index={0}
                >
                  <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                    {state.profile.identity.name && (
                      <p><span className="font-medium">Name:</span> {state.profile.identity.name}</p>
                    )}
                    {state.profile.identity.age && (
                      <p><span className="font-medium">Age:</span> {state.profile.identity.age}</p>
                    )}
                    {state.profile.identity.location && (
                      <p><span className="font-medium">Location:</span> {state.profile.identity.location}</p>
                    )}
                    {state.profile.identity.job && (
                      <p><span className="font-medium">Work:</span> {state.profile.identity.job}</p>
                    )}
                  </div>
                </InsightCard>
              )}

              {/* Vibes Card - appears after chunk 2 */}
              {(state.currentChunk >= 2 || state.phase.startsWith('chunk-2')) && (
                <VibesCard
                  vibes={state.profile.photos.vibesSummary}
                  state={getCardState(2)}
                  index={1}
                />
              )}

              {/* Archetype Card - appears after chunk 2 */}
              {(state.currentChunk >= 2 || state.phase.startsWith('chunk-2')) && (
                <ArchetypeCard
                  archetype={state.profile.psychological.emergingArchetype}
                  confidence={state.profile.psychological.confidenceLevel}
                  state={getCardState(2)}
                  index={2}
                />
              )}

              {/* Prompts Card - appears after chunk 3 */}
              {(state.currentChunk >= 3 || state.phase.startsWith('chunk-3')) && (
                <InsightCard
                  title="Prompts Found"
                  state={getCardState(3)}
                  index={3}
                >
                  {state.profile.prompts.found.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400 italic">No prompts detected</p>
                  ) : (
                    <div className="space-y-3">
                      {state.profile.prompts.found.slice(0, 3).map((prompt, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="bg-slate-50 dark:bg-slate-700 rounded-lg p-2"
                        >
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{prompt.question}</p>
                          <p className="text-sm text-slate-700 dark:text-slate-200 mt-1">"{prompt.answer}"</p>
                        </motion.div>
                      ))}
                      {state.profile.prompts.found.length > 3 && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          +{state.profile.prompts.found.length - 3} more prompts
                        </p>
                      )}
                    </div>
                  )}
                </InsightCard>
              )}

              {/* Green Flags Card - appears after chunk 4 */}
              {(state.currentChunk >= 4 || state.phase === 'consolidating' || state.phase === 'complete') && (
                <FlagCard
                  title="Green Flags"
                  flags={state.profile.earlyWarnings.greenFlags}
                  type="green"
                  state={getCardState(4)}
                  index={4}
                />
              )}

              {/* Red Flags Card - appears after chunk 4 */}
              {(state.currentChunk >= 4 || state.phase === 'consolidating' || state.phase === 'complete') && (
                <FlagCard
                  title="Red Flags"
                  flags={state.profile.earlyWarnings.redFlags}
                  type="red"
                  state={getCardState(4)}
                  index={5}
                />
              )}

              {/* Deep Analysis Pending Card */}
              {state.phase !== 'complete' && state.phase !== 'error' && (
                <DeepAnalysisPendingCard isVisible={state.currentChunk >= 2} />
              )}
            </AnimatePresence>

            {/* Error Display */}
            {state.phase === 'error' && state.error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl p-4"
              >
                <h3 className="font-medium text-red-800 dark:text-red-200">Analysis Error</h3>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1">{state.error}</p>
                <button
                  onClick={() => {
                    reset();
                    setFile(null);
                  }}
                  className="mt-3 text-sm text-red-700 dark:text-red-300 font-medium hover:underline"
                >
                  Try Again
                </button>
              </motion.div>
            )}

            {/* Complete State - auto-navigates to profile page via useEffect */}
          </div>

          {/* Floating Progress Indicator */}
          <AnimatePresence>
            {isProcessing && (
              <FloatingProgress
                currentChunk={state.currentChunk}
                totalChunks={state.totalChunks}
                insightsCount={insightsCount}
                isComplete={state.phase === 'complete'}
              />
            )}
          </AnimatePresence>
        </>
      )}

      {/* Abort Confirmation Modal */}
      <AnimatePresence>
        {showAbortModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAbortModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-xl"
            >
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-50 mb-2">Stop Analysis?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                You've already discovered some insights about this profile.
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => handleAbortConfirm(true)}
                  className="w-full py-3 bg-amber-500 dark:bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-600 dark:hover:bg-amber-500 transition-colors"
                >
                  Save Progress & View
                </button>
                <button
                  onClick={() => handleAbortConfirm(false)}
                  className="w-full py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Discard & Start Over
                </button>
                <button
                  onClick={() => setShowAbortModal(false)}
                  className="w-full py-2 text-slate-500 dark:text-slate-400 text-sm hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Continue Analysis
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
