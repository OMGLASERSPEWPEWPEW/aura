// src/components/profile/AspectConstellationCard.tsx
// Displays user's 23 Aspects profile with visual bars by realm
// NOTE: This is the legacy 23 Aspects system. New code should use VirtueMixingBoard for 11 Virtues.

import { useState } from 'react';
import { Sparkles, HelpCircle, X, ChevronDown, ChevronUp } from 'lucide-react';
import type { UserAspectProfile } from '../../lib/db';
import { LEGACY_REALMS, getAspectsByRealm } from '../../lib/virtues';

interface AspectConstellationCardProps {
  aspectProfile: UserAspectProfile;
}

export default function AspectConstellationCard({ aspectProfile }: AspectConstellationCardProps) {
  const [showHelp, setShowHelp] = useState(false);
  const [expandedRealm, setExpandedRealm] = useState<string | null>('vitality');

  // Get score for an aspect
  const getScore = (aspectId: string): number => {
    const found = aspectProfile.scores.find(s => s.aspect_id === aspectId);
    return found?.score ?? 50;
  };

  // Get evidence for an aspect
  const getEvidence = (aspectId: string): string | undefined => {
    const found = aspectProfile.scores.find(s => s.aspect_id === aspectId);
    return found?.evidence;
  };

  // Check if aspect is dominant
  const isDominant = (aspectId: string): boolean => {
    return aspectProfile.dominant_aspects?.includes(aspectId) ?? false;
  };

  // Check if aspect is shadow
  const isShadow = (aspectId: string): boolean => {
    return aspectProfile.shadow_aspects?.includes(aspectId) ?? false;
  };

  // Get bar color based on score and status
  const getBarColor = (aspectId: string, score: number): string => {
    if (isDominant(aspectId)) return 'bg-emerald-500';
    if (isShadow(aspectId)) return 'bg-amber-400';
    if (score >= 70) return 'bg-blue-500';
    if (score >= 40) return 'bg-slate-400';
    return 'bg-slate-300';
  };

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Sparkles size={18} className="text-violet-600" /> Your 23 Aspects
        </h3>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="p-1.5 rounded-full hover:bg-violet-100 transition-colors"
          aria-label="What are the 23 Aspects?"
        >
          <HelpCircle size={18} className="text-violet-600" />
        </button>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="mb-4 bg-violet-50 p-4 rounded-lg border border-violet-300 relative">
          <button
            onClick={() => setShowHelp(false)}
            className="absolute top-2 right-2 p-1 hover:bg-violet-200 rounded-full"
          >
            <X size={14} className="text-violet-600" />
          </button>
          <h4 className="font-bold text-violet-900 text-sm mb-2">What are the 23 Aspects?</h4>
          <p className="text-sm text-violet-800 mb-2">
            The 23 Aspects system is a comprehensive framework for understanding romantic compatibility.
            Each aspect represents a core virtue or value dimension.
          </p>
          <p className="text-sm text-violet-800 mb-2">
            <strong>3 Realms:</strong>
          </p>
          <ul className="text-sm text-violet-800 mb-2 ml-4 list-disc">
            <li><strong>Vitality</strong> - How you move through the world (body & action)</li>
            <li><strong>Connection</strong> - How you bond with others (heart & spirit)</li>
            <li><strong>Structure</strong> - How you organize reality (mind & environment)</li>
          </ul>
          <p className="text-xs text-violet-600 italic">
            Your <span className="text-emerald-600 font-bold">dominant aspects</span> are your strengths.
            Your <span className="text-amber-600 font-bold">shadow aspects</span> are growth areas.
          </p>
        </div>
      )}

      {/* Realm Summary */}
      {aspectProfile.realm_summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {LEGACY_REALMS.map(realm => (
            <div
              key={realm.id}
              className={`${realm.bgClass} p-3 rounded-lg ${realm.borderClass} border`}
            >
              <h4 className={`font-bold text-xs uppercase ${realm.colorClass}`}>
                {realm.id === 'vitality' ? 'Vitality' : realm.id === 'connection' ? 'Connection' : 'Structure'}
              </h4>
              <p className="text-xs text-slate-700 mt-1">
                {aspectProfile.realm_summary[realm.id as keyof typeof aspectProfile.realm_summary]}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Aspect Bars by Realm */}
      <div className="space-y-4">
        {LEGACY_REALMS.map(realm => {
          const realmAspects = getAspectsByRealm(realm.id);
          const isExpanded = expandedRealm === realm.id;

          return (
            <div
              key={realm.id}
              className={`${realm.bgClass} rounded-xl border ${realm.borderClass} overflow-hidden`}
            >
              <button
                onClick={() => setExpandedRealm(isExpanded ? null : realm.id)}
                className="w-full p-3 flex items-center justify-between hover:bg-white/30 transition-colors"
              >
                <div>
                  <h4 className={`font-bold text-sm ${realm.colorClass}`}>{realm.name}</h4>
                  <p className="text-xs text-slate-600">{realm.subtitle}</p>
                </div>
                {isExpanded ? (
                  <ChevronUp size={18} className={realm.colorClass} />
                ) : (
                  <ChevronDown size={18} className={realm.colorClass} />
                )}
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 space-y-2">
                  {realmAspects.map(aspect => {
                    const score = getScore(aspect.id);
                    const evidence = getEvidence(aspect.id);
                    const dominant = isDominant(aspect.id);
                    const shadow = isShadow(aspect.id);

                    return (
                      <div key={aspect.id} className="bg-white/60 rounded-lg p-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-slate-800 flex items-center gap-1">
                            {aspect.name}
                            {dominant && (
                              <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">
                                Dominant
                              </span>
                            )}
                            {shadow && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">
                                Growth
                              </span>
                            )}
                          </span>
                          <span className="text-xs font-bold text-slate-600">{score}</span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getBarColor(aspect.id, score)} rounded-full transition-all duration-300`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                        {evidence && (
                          <p className="text-xs text-slate-500 mt-1 italic">{evidence}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-emerald-500 rounded-full" />
          Dominant
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-amber-400 rounded-full" />
          Growth Area
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-blue-500 rounded-full" />
          High (70+)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-slate-400 rounded-full" />
          Average
        </span>
      </div>
    </section>
  );
}
