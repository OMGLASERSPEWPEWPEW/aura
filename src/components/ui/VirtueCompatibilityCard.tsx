// src/components/ui/VirtueCompatibilityCard.tsx
// Card component for displaying 11 Virtues compatibility on match profiles
// Wraps VirtueMixingBoard with summary header and critical issues

import { useState } from 'react';
import { Sparkles, AlertTriangle, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { VirtueMixingBoard } from './VirtueMixingBoard';
import {
  getOverallVerdictSummary,
  type MatchVirtueCompatibility,
  type VirtueScore,
} from '../../lib/virtues';

interface VirtueCompatibilityCardProps {
  // User's virtue scores
  userScores: VirtueScore[];

  // Match's compatibility analysis
  matchCompatibility: MatchVirtueCompatibility;

  // Match's name for display
  matchName?: string;

  // Display options
  defaultExpanded?: boolean;
}

/**
 * Compatibility card for match profiles showing 11 Virtues analysis.
 *
 * Displays:
 * - Overall compatibility score and verdict summary
 * - Realm-level scores (Biological, Emotional, Cerebral)
 * - Critical issues callout (if any danger verdicts)
 * - Full mixing board with all 11 virtues
 */
export function VirtueCompatibilityCard({
  userScores,
  matchCompatibility,
  matchName = 'Match',
  defaultExpanded = true,
}: VirtueCompatibilityCardProps) {
  const [showFullBoard, setShowFullBoard] = useState(defaultExpanded);

  const {
    compatibility,
    realm_scores,
    overall_score,
    danger_count,
    friction_count,
    sympatico_count,
    critical_issues,
  } = matchCompatibility;

  // Get overall score color
  const getOverallColor = (): string => {
    if (overall_score >= 75) return 'text-emerald-600';
    if (overall_score >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  // Get overall score background
  const getOverallBg = (): string => {
    if (overall_score >= 75) return 'bg-emerald-50 border-emerald-200';
    if (overall_score >= 50) return 'bg-amber-50 border-amber-200';
    return 'bg-red-50 border-red-200';
  };

  const verdictSummary = getOverallVerdictSummary(matchCompatibility);

  return (
    <section className="bg-white rounded-xl border border-indigo-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 border-b border-indigo-100">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-indigo-600" />
          <h3 className="font-bold text-slate-900">11 Virtues Compatibility</h3>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Overall Score Card */}
        <div className={`p-4 rounded-lg border ${getOverallBg()}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">
              Overall Compatibility with {matchName}
            </span>
            <span className={`text-3xl font-bold ${getOverallColor()}`}>
              {overall_score}%
            </span>
          </div>
          <p className="text-sm text-slate-600">{verdictSummary}</p>
        </div>

        {/* Verdict Summary Badges */}
        <div className="flex items-center justify-center gap-4 py-2">
          <div className="flex items-center gap-1.5 text-sm">
            <CheckCircle size={16} className="text-emerald-500" />
            <span className="font-medium text-emerald-700">{sympatico_count}</span>
            <span className="text-slate-500">Sympatico</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <AlertCircle size={16} className="text-amber-500" />
            <span className="font-medium text-amber-700">{friction_count}</span>
            <span className="text-slate-500">Friction</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <AlertTriangle size={16} className="text-red-500" />
            <span className="font-medium text-red-700">{danger_count}</span>
            <span className="text-slate-500">Danger</span>
          </div>
        </div>

        {/* Critical Issues Callout */}
        {critical_issues.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <h4 className="font-bold text-red-800 text-sm mb-2 flex items-center gap-1.5">
              <AlertTriangle size={14} />
              Critical Issues to Discuss
            </h4>
            <ul className="space-y-1">
              {critical_issues.map((issue, idx) => (
                <li key={idx} className="text-sm text-red-700">
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Expand/Collapse Toggle */}
        <button
          onClick={() => setShowFullBoard(!showFullBoard)}
          className="w-full flex items-center justify-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 py-2 border-t border-slate-100"
        >
          {showFullBoard ? (
            <>
              <ChevronUp size={16} /> Hide Detailed Breakdown
            </>
          ) : (
            <>
              <ChevronDown size={16} /> Show All 11 Virtues
            </>
          )}
        </button>

        {/* Full Mixing Board */}
        {showFullBoard && (
          <VirtueMixingBoard
            userScores={userScores}
            matchCompatibility={compatibility}
            realmScores={realm_scores}
            showMatch={true}
            compact={false}
            defaultExpandedRealm="biological"
          />
        )}
      </div>
    </section>
  );
}

export default VirtueCompatibilityCard;
