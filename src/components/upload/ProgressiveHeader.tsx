// src/components/upload/ProgressiveHeader.tsx
// Sticky header that shows profile info as it becomes available

import { motion, AnimatePresence } from 'framer-motion';
import { User, MapPin, Briefcase, Loader2 } from 'lucide-react';
import type { AccumulatedProfile } from '../../lib/streaming/types';

interface ProgressiveHeaderProps {
  profile: AccumulatedProfile;
  thumbnailFrame: string | null;
  isLoading?: boolean;
}

export function ProgressiveHeader({
  profile,
  thumbnailFrame,
  isLoading = false,
}: ProgressiveHeaderProps) {
  const { name, age, location, job, app } = profile.identity;

  // App badge colors
  const getAppBadgeStyle = (appName: string | null) => {
    const app = (appName || '').toLowerCase();
    if (app.includes('tinder'))
      return 'bg-pink-100 text-pink-600 border-pink-200';
    if (app.includes('bumble'))
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (app.includes('hinge'))
      return 'bg-purple-100 text-purple-700 border-purple-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm"
    >
      <div className="p-4 flex items-start gap-4">
        {/* Thumbnail */}
        <div className="w-16 h-20 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 relative">
          <AnimatePresence mode="wait">
            {thumbnailFrame ? (
              <motion.img
                key="thumbnail"
                src={thumbnailFrame}
                alt={name || 'Profile'}
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
                {isLoading ? (
                  <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
                ) : (
                  <User className="w-6 h-6 text-slate-300" />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading overlay */}
          {isLoading && thumbnailFrame && (
            <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Name and Age */}
          <div className="flex items-center gap-2 mb-1">
            <AnimatePresence mode="wait">
              {name ? (
                <motion.h2
                  key="name"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xl font-bold text-slate-900 truncate"
                >
                  {name}
                  {age && <span className="font-normal text-slate-600">, {age}</span>}
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

            {/* App Badge */}
            <AnimatePresence>
              {app && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getAppBadgeStyle(app)}`}
                >
                  {app}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Location and Job */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <AnimatePresence>
              {location && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-1"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[150px]">{location}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {job && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-1"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[150px]">{job}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading placeholder if no info yet */}
            {!location && !job && (
              <div className="flex items-center gap-2">
                <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
                <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Floating progress indicator for bottom of screen
interface FloatingProgressProps {
  currentChunk: number;
  totalChunks: number;
  insightsCount: number;
  isComplete: boolean;
}

export function FloatingProgress({
  currentChunk,
  totalChunks,
  insightsCount,
  isComplete,
}: FloatingProgressProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20"
    >
      <div className="bg-slate-900 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-3">
        {!isComplete ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">
              Exploring ({currentChunk}/{totalChunks})
            </span>
            <div className="w-px h-4 bg-slate-700" />
            <span className="text-sm text-slate-300">
              {insightsCount} insights found
            </span>
          </>
        ) : (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center"
            >
              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
            <span className="text-sm font-medium">Explore Complete</span>
            <div className="w-px h-4 bg-slate-700" />
            <span className="text-sm text-slate-300">
              {insightsCount} insights
            </span>
          </>
        )}
      </div>
    </motion.div>
  );
}

// Abort button component
interface AbortButtonProps {
  onClick: () => void;
  hasProgress: boolean;
  disabled?: boolean;
}

export function AbortButton({ onClick, hasProgress, disabled }: AbortButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
        ${hasProgress
          ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {hasProgress ? 'Save & Stop' : 'Cancel'}
    </button>
  );
}
