// src/components/upload/InsightCard.tsx
// Reusable card component for streaming insights with unfurl animation

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Loader2, AlertCircle, Clock } from 'lucide-react';

export type InsightCardState = 'pending' | 'loading' | 'complete' | 'error';

interface InsightCardProps {
  title: string;
  state: InsightCardState;
  children?: React.ReactNode;
  errorMessage?: string;
  index?: number; // For stagger animation delay
}

// Animation variants for unfurl effect
const cardVariants = {
  hidden: {
    opacity: 0,
    height: 0,
    y: -10,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    height: 'auto',
    y: 0,
    scale: 1,
    transition: {
      height: { type: 'spring' as const, stiffness: 500, damping: 30 },
      opacity: { duration: 0.2 },
      scale: { duration: 0.2 },
    },
  },
  exit: {
    opacity: 0,
    height: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

const contentVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { delay: 0.1, duration: 0.3 },
  },
};

export function InsightCard({
  title,
  state,
  children,
  errorMessage,
  index = 0,
}: InsightCardProps) {
  // State-based styling
  const getStateStyles = () => {
    switch (state) {
      case 'pending':
        return {
          border: 'border-dashed border-slate-300 dark:border-slate-600',
          bg: 'bg-slate-50 dark:bg-slate-800/50',
          opacity: 'opacity-60',
          icon: <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500" />,
        };
      case 'loading':
        return {
          border: 'border-solid border-blue-400 dark:border-blue-500',
          bg: 'bg-blue-50 dark:bg-blue-900/30',
          opacity: 'opacity-100',
          icon: <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />,
        };
      case 'complete':
        return {
          border: 'border-solid border-slate-200 dark:border-slate-700',
          bg: 'bg-white dark:bg-slate-800',
          opacity: 'opacity-100',
          icon: <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-500" />,
        };
      case 'error':
        return {
          border: 'border-solid border-red-300 dark:border-red-700',
          bg: 'bg-red-50 dark:bg-red-900/30',
          opacity: 'opacity-100',
          icon: <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />,
        };
    }
  };

  const styles = getStateStyles();

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={cardVariants}
      style={{ originY: 0 }}
      transition={{ delay: index * 0.15 }} // Stagger delay
      className={`
        rounded-xl border p-4 overflow-hidden
        ${styles.border} ${styles.bg} ${styles.opacity}
        transition-colors duration-300
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{title}</h3>
        {styles.icon}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {state === 'pending' && (
          <motion.div
            key="pending"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="text-sm text-slate-400 dark:text-slate-500 italic"
          >
            Waiting...
          </motion.div>
        )}

        {state === 'loading' && (
          <motion.div
            key="loading"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-2"
          >
            {/* Shimmer effect */}
            <div className="animate-pulse space-y-2">
              <div className="h-3 bg-blue-200 dark:bg-blue-700/50 rounded w-3/4" />
              <div className="h-3 bg-blue-200 dark:bg-blue-700/50 rounded w-1/2" />
            </div>
          </motion.div>
        )}

        {state === 'complete' && children && (
          <motion.div
            key="complete"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {children}
          </motion.div>
        )}

        {state === 'error' && (
          <motion.div
            key="error"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="text-sm text-red-600 dark:text-red-400"
          >
            {errorMessage || 'An error occurred'}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Compact version for flag lists
interface FlagListProps {
  title: string;
  flags: string[];
  type: 'red' | 'green';
  state: InsightCardState;
  index?: number;
}

export function FlagCard({ title, flags, type, state, index = 0 }: FlagListProps) {
  const colors = type === 'red'
    ? {
        bg: 'bg-red-50 dark:bg-red-900/30',
        border: 'border-red-200 dark:border-red-700',
        text: 'text-red-800 dark:text-red-300',
        dot: 'bg-red-500 dark:bg-red-400'
      }
    : {
        bg: 'bg-green-50 dark:bg-emerald-900/30',
        border: 'border-green-200 dark:border-emerald-700',
        text: 'text-green-800 dark:text-emerald-300',
        dot: 'bg-green-500 dark:bg-emerald-400'
      };

  return (
    <InsightCard title={title} state={state} index={index}>
      {flags.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 italic">None detected</p>
      ) : (
        <ul className={`space-y-1 ${colors.text}`}>
          {flags.map((flag, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="text-sm flex items-start"
            >
              <span className={`w-1.5 h-1.5 ${colors.dot} rounded-full mt-1.5 mr-2 flex-shrink-0`} />
              {flag}
            </motion.li>
          ))}
        </ul>
      )}
    </InsightCard>
  );
}

// Photo vibes card
interface VibesCardProps {
  vibes: string[];
  state: InsightCardState;
  index?: number;
}

export function VibesCard({ vibes, state, index = 0 }: VibesCardProps) {
  return (
    <InsightCard title="Photo Vibes" state={state} index={index}>
      {vibes.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 italic">Analyzing...</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {vibes.map((vibe, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="px-2 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full"
            >
              {vibe}
            </motion.span>
          ))}
        </div>
      )}
    </InsightCard>
  );
}

// Archetype card
interface ArchetypeCardProps {
  archetype: string | null;
  confidence: number;
  state: InsightCardState;
  index?: number;
}

export function ArchetypeCard({ archetype, confidence, state, index = 0 }: ArchetypeCardProps) {
  return (
    <InsightCard title="Emerging Archetype" state={state} index={index}>
      {archetype ? (
        <div>
          <p className="text-sm text-slate-700 dark:text-slate-300">{archetype}</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${confidence}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full"
              />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">{confidence}% confidence</span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400 italic">Building profile...</p>
      )}
    </InsightCard>
  );
}

// Deep analysis pending card
interface DeepAnalysisPendingCardProps {
  isVisible: boolean;
}

export function DeepAnalysisPendingCard({ isVisible }: DeepAnalysisPendingCardProps) {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 p-4 bg-slate-50 dark:bg-slate-800/50"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
          <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        </div>
        <div>
          <h3 className="font-medium text-slate-700 dark:text-slate-200 text-sm">Deep Analysis</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Detailed psychological profile will run after quick analysis
          </p>
        </div>
      </div>
    </motion.div>
  );
}
