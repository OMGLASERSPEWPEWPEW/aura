// src/components/ui/ExpandableInsight.tsx
// Expandable insight card with help icons, deep details, and feedback buttons

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, Check, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import type { InsightFeedback } from '../../lib/db';

export type FeedbackRating = 'spot_on' | 'mostly' | 'off';

interface ExpandableInsightProps {
  /** Unique key for this insight (e.g., "attachment_patterns", "strengths[0]") */
  insightKey: string;
  /** Icon component to show in header */
  icon?: React.ReactNode;
  /** Title shown in collapsed state */
  title: React.ReactNode;
  /** Summary text (1-2 lines, always visible) */
  summary: string;
  /** Detailed content shown when expanded */
  detail?: React.ReactNode;
  /** Help text shown when "?" is tapped */
  helpText?: string;
  /** Current feedback if any */
  currentFeedback?: FeedbackRating;
  /** Callback when feedback is submitted */
  onFeedback?: (insightKey: string, rating: FeedbackRating) => void;
  /** Whether to show feedback buttons */
  showFeedback?: boolean;
  /** Additional className */
  className?: string;
  /** Children to render in expanded section */
  children?: React.ReactNode;
}

// Animation variants for expand/collapse
const contentVariants = {
  hidden: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: 0.25, ease: 'easeInOut' as const },
      opacity: { duration: 0.15 },
    },
  },
  visible: {
    height: 'auto' as const,
    opacity: 1,
    transition: {
      height: { type: 'spring' as const, stiffness: 500, damping: 30 },
      opacity: { duration: 0.2, delay: 0.1 },
    },
  },
};

// Tooltip component for help text
function HelpTooltip({
  text,
  isVisible,
  onClose,
}: {
  text: string;
  isVisible: boolean;
  onClose: () => void;
}) {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="absolute right-0 top-full mt-2 z-10 w-64 p-3 bg-slate-800 dark:bg-slate-900 text-white text-xs rounded-lg shadow-lg"
      onClick={(e) => e.stopPropagation()}
    >
      <p>{text}</p>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="mt-2 text-slate-400 hover:text-white text-xs underline"
      >
        Got it
      </button>
      {/* Arrow pointing up */}
      <div className="absolute -top-1.5 right-4 w-3 h-3 bg-slate-800 dark:bg-slate-900 rotate-45" />
    </motion.div>
  );
}

// Feedback button component
function FeedbackButton({
  label,
  icon,
  isSelected,
  onClick,
  colorClass,
}: {
  label: string;
  icon: React.ReactNode;
  isSelected: boolean;
  onClick: () => void;
  colorClass: string;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(10);
        }
        onClick();
      }}
      className={`
        flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
        transition-all duration-200 min-w-[88px] min-h-[44px]
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-800
        ${isSelected
          ? `${colorClass} text-white shadow-sm`
          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
        }
      `}
    >
      {isSelected ? <Check size={14} /> : icon}
      <span>{label}</span>
    </button>
  );
}

export default function ExpandableInsight({
  insightKey,
  icon,
  title,
  summary,
  detail,
  helpText,
  currentFeedback,
  onFeedback,
  showFeedback = true,
  className = '',
  children,
}: ExpandableInsightProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [localFeedback, setLocalFeedback] = useState<FeedbackRating | undefined>(currentFeedback);

  // Handle feedback selection with debounce
  const handleFeedback = (rating: FeedbackRating) => {
    setLocalFeedback(rating);
    // Debounce the callback
    setTimeout(() => {
      onFeedback?.(insightKey, rating);
    }, 500);
  };

  const hasExpandableContent = !!(detail || children || (showFeedback && onFeedback));

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden ${className}`}
    >
      {/* Header - always visible */}
      <button
        onClick={() => hasExpandableContent && setIsExpanded(!isExpanded)}
        className={`w-full p-4 text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 ${hasExpandableContent ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          {icon && (
            <div className="flex-shrink-0 mt-0.5">
              {icon}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title row with help and expand icons */}
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                {title}
              </h3>

              <div className="flex items-center gap-1">
                {/* Help icon */}
                {helpText && (
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowHelp(!showHelp);
                      }}
                      className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      aria-label="Help"
                    >
                      <HelpCircle size={16} />
                    </button>
                    <AnimatePresence>
                      {showHelp && (
                        <HelpTooltip
                          text={helpText}
                          isVisible={showHelp}
                          onClose={() => setShowHelp(false)}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Expand icon */}
                {hasExpandableContent && (
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-slate-400 dark:text-slate-500"
                  >
                    <ChevronDown size={18} />
                  </motion.div>
                )}
              </div>
            </div>

            {/* Summary - always visible */}
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
              {summary}
            </p>
          </div>
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && hasExpandableContent && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={contentVariants}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              {/* Divider */}
              <div className="border-t border-dashed border-slate-200 dark:border-slate-700 mb-4" />

              {/* Detail content */}
              {detail && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                    Why This Matters
                  </h4>
                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    {detail}
                  </div>
                </div>
              )}

              {/* Children */}
              {children && (
                <div className="mb-4">
                  {children}
                </div>
              )}

              {/* Feedback buttons */}
              {showFeedback && onFeedback && (
                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                    Does this resonate?
                  </h4>
                  <div className="flex gap-2">
                    <FeedbackButton
                      label="Spot on"
                      icon={<ThumbsUp size={14} />}
                      isSelected={localFeedback === 'spot_on'}
                      onClick={() => handleFeedback('spot_on')}
                      colorClass="bg-green-600"
                    />
                    <FeedbackButton
                      label="Mostly"
                      icon={<Minus size={14} />}
                      isSelected={localFeedback === 'mostly'}
                      onClick={() => handleFeedback('mostly')}
                      colorClass="bg-amber-500"
                    />
                    <FeedbackButton
                      label="Off base"
                      icon={<ThumbsDown size={14} />}
                      isSelected={localFeedback === 'off'}
                      onClick={() => handleFeedback('off')}
                      colorClass="bg-red-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper function to create feedback from ExpandableInsight callbacks
export function createInsightFeedback(
  insightKey: string,
  rating: FeedbackRating
): InsightFeedback {
  return {
    insightKey,
    rating,
    timestamp: new Date(),
  };
}
