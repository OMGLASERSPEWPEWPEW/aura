// src/components/profileDetail/SubtextAnalysis.tsx
import { MessageCircle, Heart, Zap, Shield } from 'lucide-react';
import { SectionHeader } from '../ui/SectionCard';
import type { SubtextAnalysis as SubtextType } from '../../lib/db';

interface SubtextAnalysisProps {
  subtext: SubtextType;
}

/**
 * Deep subtext analysis section.
 */
export function SubtextAnalysis({ subtext }: SubtextAnalysisProps) {
  const hasContent =
    subtext.sexual_signaling || subtext.power_dynamics || subtext.vulnerability_indicators || subtext.disconnect;

  if (!hasContent) return null;

  return (
    <section>
      <SectionHeader icon={MessageCircle} title="Deep Subtext" iconColor="text-rose-600 dark:text-rose-400" />
      <div className="space-y-3">
        {subtext.sexual_signaling && (
          <div className="bg-rose-50 dark:bg-rose-900/30 p-3 rounded-lg border-l-4 border-rose-400 dark:border-rose-500">
            <h4 className="font-bold text-rose-800 dark:text-rose-200 text-xs uppercase mb-1 flex items-center gap-1">
              <Heart size={12} /> Sexual Signaling
            </h4>
            <p className="text-sm text-rose-900 dark:text-rose-100">{subtext.sexual_signaling}</p>
          </div>
        )}
        {subtext.power_dynamics && (
          <div className="bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-lg border-l-4 border-indigo-400 dark:border-indigo-500">
            <h4 className="font-bold text-indigo-800 dark:text-indigo-200 text-xs uppercase mb-1 flex items-center gap-1">
              <Zap size={12} /> Power Dynamics
            </h4>
            <p className="text-sm text-indigo-900 dark:text-indigo-100">{subtext.power_dynamics}</p>
          </div>
        )}
        {subtext.vulnerability_indicators && (
          <div className="bg-teal-50 dark:bg-teal-900/30 p-3 rounded-lg border-l-4 border-teal-400 dark:border-teal-500">
            <h4 className="font-bold text-teal-800 dark:text-teal-200 text-xs uppercase mb-1 flex items-center gap-1">
              <Shield size={12} /> Vulnerability & Wounds
            </h4>
            <p className="text-sm text-teal-900 dark:text-teal-100">{subtext.vulnerability_indicators}</p>
          </div>
        )}
        {subtext.disconnect && (
          <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-lg border-l-4 border-slate-400 dark:border-slate-500">
            <h4 className="font-bold text-slate-700 dark:text-slate-200 text-xs uppercase mb-1">Text vs. Subtext</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300">{subtext.disconnect}</p>
          </div>
        )}
      </div>
    </section>
  );
}
