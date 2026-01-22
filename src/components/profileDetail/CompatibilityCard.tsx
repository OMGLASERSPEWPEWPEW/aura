// src/components/profileDetail/CompatibilityCard.tsx
import { Star, Check, AlertCircle } from 'lucide-react';
import type { ProfileCompatibility } from '../../lib/db';

interface CompatibilityCardProps {
  compatibility: ProfileCompatibility;
}

/**
 * Displays compatibility score and breakdown.
 */
export function CompatibilityCard({ compatibility }: CompatibilityCardProps) {
  return (
    <section className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-xl border border-emerald-200">
      <div className="flex items-start justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Star size={18} className="text-emerald-600" /> Compatibility
        </h2>
        <div
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-bold text-lg ${
            compatibility.score >= 7
              ? 'bg-emerald-200 text-emerald-800'
              : compatibility.score >= 4
              ? 'bg-amber-200 text-amber-800'
              : 'bg-red-200 text-red-800'
          }`}
        >
          {compatibility.score}/10
        </div>
      </div>

      <p className="text-emerald-900 font-medium mb-4">{compatibility.summary}</p>

      {compatibility.goal_alignment && (
        <p className="text-sm text-emerald-700 mb-4 italic">{compatibility.goal_alignment}</p>
      )}

      {compatibility.strengths && compatibility.strengths.length > 0 && (
        <div className="mb-3">
          <h4 className="text-sm font-bold text-emerald-800 mb-2 flex items-center gap-1">
            <Check size={14} /> Why this works for you:
          </h4>
          <ul className="space-y-1">
            {compatibility.strengths.map((s, i) => (
              <li key={i} className="text-sm text-emerald-700 flex items-start gap-2">
                <span className="text-emerald-500 mt-1">•</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {compatibility.concerns && compatibility.concerns.length > 0 && (
        <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
          <h4 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-1">
            <AlertCircle size={14} /> Watch out for:
          </h4>
          <ul className="space-y-1">
            {compatibility.concerns.map((c, i) => (
              <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                <span className="text-amber-500 mt-1">•</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
