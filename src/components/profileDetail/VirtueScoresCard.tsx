// src/components/profileDetail/VirtueScoresCard.tsx
import { useState } from 'react';
import { Landmark, HelpCircle, X } from 'lucide-react';
import type { VirtueScore } from '../../lib/db';

interface VirtueScoresCardProps {
  virtueScores: VirtueScore[];
}

/**
 * Displays virtue scores for a match - shows how they embody the user's desired virtues.
 */
export function VirtueScoresCard({ virtueScores }: VirtueScoresCardProps) {
  const [showHelp, setShowHelp] = useState(false);

  // Get score color for virtue bars
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-emerald-500';
    if (score >= 6) return 'bg-teal-400';
    if (score >= 4) return 'bg-amber-400';
    return 'bg-red-400';
  };

  // Calculate average virtue score
  const avgScore = virtueScores.length > 0
    ? Math.round(virtueScores.reduce((sum, v) => sum + v.score, 0) / virtueScores.length * 10) / 10
    : 0;

  return (
    <section className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-xl border border-amber-200">
      <div className="flex items-start justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Landmark size={18} className="text-amber-600" /> Virtue Match
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="p-1.5 rounded-full hover:bg-amber-100 transition-colors"
            aria-label="What are virtues?"
          >
            <HelpCircle size={16} className="text-amber-600" />
          </button>
          <div
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-bold text-lg ${
              avgScore >= 7
                ? 'bg-emerald-200 text-emerald-800'
                : avgScore >= 4
                ? 'bg-amber-200 text-amber-800'
                : 'bg-red-200 text-red-800'
            }`}
          >
            {avgScore}/10
          </div>
        </div>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="mb-4 bg-white p-4 rounded-lg border border-amber-300 relative">
          <button
            onClick={() => setShowHelp(false)}
            className="absolute top-2 right-2 p-1 hover:bg-amber-100 rounded-full"
          >
            <X size={14} className="text-amber-600" />
          </button>
          <h4 className="font-bold text-amber-900 text-sm mb-2">What are Partner Virtues?</h4>
          <p className="text-sm text-amber-800 mb-2">
            Based on Greek philosophy and the concept of <strong>eudaimonia</strong> (human flourishing),
            these are the 5 core character virtues that would lead to genuine happiness in a relationship for you.
          </p>
          <p className="text-sm text-amber-800 mb-2">
            These virtues are personalized based on your psychological profile, attachment patterns,
            and what you actually need in a partner (not just what you think you want).
          </p>
          <p className="text-xs text-amber-600 italic">
            Tip: To update your virtues, re-run synthesis in My Profile.
          </p>
        </div>
      )}

      <p className="text-sm text-amber-800 mb-4">
        How well this person embodies the character virtues you're seeking:
      </p>

      <div className="space-y-3">
        {virtueScores.map((vs, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-slate-700">{vs.virtue}</span>
              <span className="text-sm font-bold text-slate-800">{vs.score}/10</span>
            </div>
            <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden mb-1">
              <div
                className={`h-full ${getScoreColor(vs.score)} transition-all duration-500`}
                style={{ width: `${vs.score * 10}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 italic">{vs.evidence}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
