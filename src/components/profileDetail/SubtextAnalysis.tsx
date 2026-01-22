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
      <SectionHeader icon={MessageCircle} title="Deep Subtext" iconColor="text-rose-600" />
      <div className="space-y-3">
        {subtext.sexual_signaling && (
          <div className="bg-rose-50 p-3 rounded-lg border-l-4 border-rose-400">
            <h4 className="font-bold text-rose-800 text-xs uppercase mb-1 flex items-center gap-1">
              <Heart size={12} /> Sexual Signaling
            </h4>
            <p className="text-sm text-rose-900">{subtext.sexual_signaling}</p>
          </div>
        )}
        {subtext.power_dynamics && (
          <div className="bg-indigo-50 p-3 rounded-lg border-l-4 border-indigo-400">
            <h4 className="font-bold text-indigo-800 text-xs uppercase mb-1 flex items-center gap-1">
              <Zap size={12} /> Power Dynamics
            </h4>
            <p className="text-sm text-indigo-900">{subtext.power_dynamics}</p>
          </div>
        )}
        {subtext.vulnerability_indicators && (
          <div className="bg-teal-50 p-3 rounded-lg border-l-4 border-teal-400">
            <h4 className="font-bold text-teal-800 text-xs uppercase mb-1 flex items-center gap-1">
              <Shield size={12} /> Vulnerability & Wounds
            </h4>
            <p className="text-sm text-teal-900">{subtext.vulnerability_indicators}</p>
          </div>
        )}
        {subtext.disconnect && (
          <div className="bg-slate-100 p-3 rounded-lg border-l-4 border-slate-400">
            <h4 className="font-bold text-slate-700 text-xs uppercase mb-1">Text vs. Subtext</h4>
            <p className="text-sm text-slate-700">{subtext.disconnect}</p>
          </div>
        )}
      </div>
    </section>
  );
}
