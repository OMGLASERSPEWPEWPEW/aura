// src/components/profileDetail/CompatibilityCard.tsx
import { Check, AlertCircle } from 'lucide-react';
import type { ProfileCompatibility } from '../../lib/db';
import { getResonanceDisplay } from '../../lib/virtues';

interface CompatibilityCardProps {
  compatibility: ProfileCompatibility;
}

/**
 * Displays compatibility using mystical resonance vocabulary.
 * Replaces numeric scores with psychologically-safe language.
 */
export function CompatibilityCard({ compatibility }: CompatibilityCardProps) {
  const { label, gradient, Icon, iconColors, description } = getResonanceDisplay(compatibility.score);

  return (
    <section className={`bg-gradient-to-br ${gradient} p-5 rounded-xl border`}>
      <div className="flex items-start justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
          <Icon size={18} className={iconColors} /> Resonance
        </h2>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-sm bg-white/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 border border-slate-200/50 dark:border-slate-600/50">
          <Icon size={14} className={iconColors} />
          {label}
        </div>
      </div>

      {/* Mystical description */}
      <p className="text-slate-700 dark:text-slate-200 font-medium mb-2 italic">{description}</p>

      {/* Original summary from analysis */}
      <p className="text-slate-600 dark:text-slate-300 mb-4">{compatibility.summary}</p>

      {compatibility.goal_alignment && (
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 italic">{compatibility.goal_alignment}</p>
      )}

      {compatibility.strengths && compatibility.strengths.length > 0 && (
        <div className="mb-3">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1">
            <Check size={14} className="text-violet-500 dark:text-violet-400" /> Points of connection:
          </h4>
          <ul className="space-y-1">
            {compatibility.strengths.map((s, i) => (
              <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                <span className="text-violet-400 dark:text-violet-500 mt-1">+</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {compatibility.concerns && compatibility.concerns.length > 0 && (
        <div className="bg-slate-100/50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-600">
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
            <AlertCircle size={14} className="text-amber-500 dark:text-amber-400" /> Navigate with awareness:
          </h4>
          <ul className="space-y-1">
            {compatibility.concerns.map((c, i) => (
              <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                <span className="text-amber-400 dark:text-amber-500 mt-1">~</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
