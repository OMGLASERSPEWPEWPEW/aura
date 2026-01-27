// src/components/ui/VirtueFader.tsx
// Single fader component showing both user and match scores for a virtue
// Part of the "Mixing Board" UI for 11 Virtues compatibility

import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import type { CompatibilityVerdict } from '../../lib/virtues/types';
import { getVirtueById, getVerdictColors, getVerdictLabel } from '../../lib/virtues';

interface VirtueFaderProps {
  virtueId: string;
  userScore: number;
  matchScore?: number;
  verdict?: CompatibilityVerdict;
  note?: string;
  showMatch?: boolean;  // If false, only show user score (for MyProfile)
  compact?: boolean;    // Smaller version for dense layouts
}

/**
 * A single "fader" showing a virtue spectrum with score indicators.
 * When showMatch is true, displays both user (left dot) and match (right dot) scores
 * with a connection line and verdict indicator.
 */
export function VirtueFader({
  virtueId,
  userScore,
  matchScore,
  verdict,
  note,
  showMatch = false,
  compact = false,
}: VirtueFaderProps) {
  const virtue = getVirtueById(virtueId);
  if (!virtue) return null;

  const delta = matchScore !== undefined ? Math.abs(userScore - matchScore) : 0;
  const verdictColors = verdict ? getVerdictColors(verdict) : null;

  // Get verdict icon
  const VerdictIcon = verdict === 'sympatico'
    ? CheckCircle
    : verdict === 'friction'
    ? AlertCircle
    : verdict === 'danger'
    ? AlertTriangle
    : null;

  return (
    <div className={`${compact ? 'py-1.5' : 'py-2'}`}>
      {/* Header row: virtue name + verdict */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className={`font-medium ${compact ? 'text-xs' : 'text-sm'} text-slate-800 dark:text-slate-100`}>
            {virtue.name}
          </span>
          {virtue.critical && (
            <span className="text-[10px] bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-1 py-0.5 rounded font-bold uppercase">
              Critical
            </span>
          )}
        </div>
        {showMatch && verdict && VerdictIcon && (
          <div className={`flex items-center gap-1 ${verdictColors?.text}`}>
            <VerdictIcon size={compact ? 12 : 14} />
            <span className={`${compact ? 'text-[10px]' : 'text-xs'} font-medium`}>
              {getVerdictLabel(verdict)}
            </span>
          </div>
        )}
      </div>

      {/* The fader track */}
      <div className="relative">
        {/* Background track */}
        <div className={`w-full ${compact ? 'h-2' : 'h-3'} bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-600 dark:via-slate-700 dark:to-slate-600 rounded-full relative`}>
          {/* Connection line between scores (only when showing match) */}
          {showMatch && matchScore !== undefined && (
            <div
              className={`absolute top-1/2 -translate-y-1/2 ${compact ? 'h-0.5' : 'h-1'} rounded-full ${
                verdict === 'sympatico'
                  ? 'bg-emerald-400'
                  : verdict === 'friction'
                  ? 'bg-amber-400'
                  : verdict === 'danger'
                  ? 'bg-red-400'
                  : 'bg-slate-300 dark:bg-slate-500'
              }`}
              style={{
                left: `${Math.min(userScore, matchScore)}%`,
                width: `${delta}%`,
              }}
            />
          )}

          {/* User score indicator */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 ${compact ? 'w-3 h-3' : 'w-4 h-4'} rounded-full bg-indigo-600 border-2 border-white dark:border-slate-800 shadow-sm z-10`}
            style={{ left: `${userScore}%` }}
            title={`You: ${userScore}`}
          />

          {/* Match score indicator (only when showing match) */}
          {showMatch && matchScore !== undefined && (
            <div
              className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 ${compact ? 'w-3 h-3' : 'w-4 h-4'} rounded-full ${
                verdict === 'sympatico'
                  ? 'bg-emerald-500'
                  : verdict === 'friction'
                  ? 'bg-amber-500'
                  : verdict === 'danger'
                  ? 'bg-red-500'
                  : 'bg-slate-500'
              } border-2 border-white dark:border-slate-800 shadow-sm z-10`}
              style={{ left: `${matchScore}%` }}
              title={`Match: ${matchScore}`}
            />
          )}
        </div>

        {/* Spectrum labels */}
        <div className={`flex justify-between ${compact ? 'mt-0.5' : 'mt-1'}`}>
          <span className={`${compact ? 'text-[9px]' : 'text-[10px]'} text-slate-500 dark:text-slate-400`}>
            {virtue.lowLabel}
          </span>
          <span className={`${compact ? 'text-[9px]' : 'text-[10px]'} text-slate-500 dark:text-slate-400`}>
            {virtue.highLabel}
          </span>
        </div>
      </div>

      {/* Score values and note */}
      {showMatch && matchScore !== undefined && (
        <div className={`flex items-center justify-between ${compact ? 'mt-1' : 'mt-1.5'}`}>
          <div className={`flex items-center gap-2 ${compact ? 'text-[10px]' : 'text-xs'}`}>
            <span className="text-indigo-600 dark:text-indigo-400 font-medium">You: {userScore}</span>
            <span className="text-slate-400 dark:text-slate-500">|</span>
            <span className={`font-medium ${verdictColors?.text || 'text-slate-600 dark:text-slate-300'}`}>
              Match: {matchScore}
            </span>
            <span className="text-slate-400 dark:text-slate-500">|</span>
            <span className="text-slate-500 dark:text-slate-400">Gap: {delta}</span>
          </div>
        </div>
      )}

      {/* Just user score when not showing match */}
      {!showMatch && (
        <div className={`${compact ? 'mt-1' : 'mt-1.5'} ${compact ? 'text-[10px]' : 'text-xs'} text-indigo-600 dark:text-indigo-400 font-medium`}>
          Score: {userScore}
        </div>
      )}

      {/* Compatibility note (only for match view) */}
      {showMatch && note && (
        <p className={`${compact ? 'text-[10px]' : 'text-xs'} text-slate-500 dark:text-slate-400 ${compact ? 'mt-0.5' : 'mt-1'} italic`}>
          {note}
        </p>
      )}
    </div>
  );
}

/**
 * A compact version of VirtueFader for list views
 */
export function VirtueFaderCompact(props: Omit<VirtueFaderProps, 'compact'>) {
  return <VirtueFader {...props} compact />;
}

export default VirtueFader;
