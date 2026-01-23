// src/components/profileDetail/CoachTab/MatchTacticsCard.tsx
import { Target, Zap, Eye } from 'lucide-react';
import type { MatchCoachingAnalysis } from '../../../lib/db';

interface MatchTacticsCardProps {
  analysis: MatchCoachingAnalysis;
  matchName?: string;
}

/**
 * Card showing the match's detected agenda and tactics
 */
export function MatchTacticsCard({ analysis, matchName }: MatchTacticsCardProps) {
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
        <Target size={16} className="text-indigo-600" />
        {matchName ? `${matchName}'s Play` : "Match's Play"}
      </h3>

      <div className="space-y-3">
        {/* Detected Agenda */}
        <div className="flex items-start gap-2">
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded whitespace-nowrap">
            Agenda
          </span>
          <p className="text-sm text-slate-700">{analysis.detected_agenda}</p>
        </div>

        {/* Detected Tactics */}
        <div className="flex items-start gap-2">
          <Zap size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">Tactics</span>
            <div className="flex flex-wrap gap-1">
              {analysis.detected_tactics.map((tactic, i) => (
                <span
                  key={i}
                  className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded"
                >
                  {tactic}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Subtext */}
        <div className="flex items-start gap-2">
          <Eye size={14} className="text-purple-500 mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">Subtext</span>
            <p className="text-sm text-slate-600 italic">{analysis.subtext}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
