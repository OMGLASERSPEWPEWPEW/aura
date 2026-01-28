// src/components/onboarding/TutorialStep.tsx
// Individual tutorial step with spotlight effect and tooltip

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import SpotlightOverlay from './SpotlightOverlay';

interface TutorialStepProps {
  title: string;
  description: string;
  icon: LucideIcon;
  stepNumber: number;
  totalSteps: number;
  position: 'top' | 'bottom' | 'center';
  highlightSelector?: string | null;
  onNext: () => void;
  onSkip: () => void;
}

export default function TutorialStep({
  title,
  description,
  icon: Icon,
  stepNumber,
  totalSteps,
  position,
  highlightSelector,
  onNext,
  onSkip,
}: TutorialStepProps) {
  const positionClasses = {
    top: 'top-24',
    bottom: 'bottom-24',
    center: 'top-1/2 -translate-y-1/2',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50"
    >
      {/* Spotlight Overlay with cutout for highlighted element */}
      <SpotlightOverlay highlightSelector={highlightSelector} onClick={onSkip} />

      {/* Tooltip Card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={`absolute left-4 right-4 ${positionClasses[position]} max-w-sm mx-auto`}
      >
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Step indicator */}
          <div className="bg-violet-50 dark:bg-violet-900/30 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center">
                <Icon size={16} className="text-white" />
              </div>
              <span className="text-xs font-medium text-violet-600 dark:text-violet-400">
                Step {stepNumber} of {totalSteps}
              </span>
            </div>
            {/* Progress dots */}
            <div className="flex gap-1">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i < stepNumber
                      ? 'bg-violet-600'
                      : 'bg-slate-200 dark:bg-slate-600'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-50 mb-2">
              {title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {description}
            </p>
          </div>

          {/* Actions */}
          <div className="px-5 pb-5 flex gap-3">
            <button
              onClick={onSkip}
              className="flex-1 py-2.5 text-slate-500 dark:text-slate-400 text-sm font-medium hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              Skip
            </button>
            <button
              onClick={onNext}
              className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-semibold transition-colors"
            >
              {stepNumber === totalSteps ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
