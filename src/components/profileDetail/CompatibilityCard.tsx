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
    <section className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 p-5 rounded-xl border border-emerald-200 dark:border-emerald-700">
      <div className="flex items-start justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
          <Star size={18} className="text-emerald-600 dark:text-emerald-400" /> Compatibility
        </h2>
        <div
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-bold text-lg ${
            compatibility.score >= 7
              ? 'bg-emerald-200 dark:bg-emerald-700 text-emerald-800 dark:text-emerald-100'
              : compatibility.score >= 4
              ? 'bg-amber-200 dark:bg-amber-700 text-amber-800 dark:text-amber-100'
              : 'bg-red-200 dark:bg-red-700 text-red-800 dark:text-red-100'
          }`}
        >
          {compatibility.score}/10
        </div>
      </div>

      <p className="text-emerald-900 dark:text-emerald-100 font-medium mb-4">{compatibility.summary}</p>

      {compatibility.goal_alignment && (
        <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-4 italic">{compatibility.goal_alignment}</p>
      )}

      {compatibility.strengths && compatibility.strengths.length > 0 && (
        <div className="mb-3">
          <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-200 mb-2 flex items-center gap-1">
            <Check size={14} /> Why this works for you:
          </h4>
          <ul className="space-y-1">
            {compatibility.strengths.map((s, i) => (
              <li key={i} className="text-sm text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
                <span className="text-emerald-500 dark:text-emerald-400 mt-1">*</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {compatibility.concerns && compatibility.concerns.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/30 p-3 rounded-lg border border-amber-200 dark:border-amber-700">
          <h4 className="text-sm font-bold text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-1">
            <AlertCircle size={14} /> Watch out for:
          </h4>
          <ul className="space-y-1">
            {compatibility.concerns.map((c, i) => (
              <li key={i} className="text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2">
                <span className="text-amber-500 dark:text-amber-400 mt-1">*</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
