// src/components/profileDetail/AspectMatchCard.tsx
// Displays match's 23 Aspects comparison with user
// NOTE: This is the legacy 23 Aspects system. New code should use VirtueCompatibilityCard for 11 Virtues.

import { useState } from 'react';
import { Sparkles, HelpCircle, X, ChevronDown, ChevronUp, Heart, Zap, AlertTriangle } from 'lucide-react';
import type { MatchAspectScores } from '../../lib/db';
import { LEGACY_REALMS, getAspectsByRealm } from '../../lib/virtues';

interface AspectMatchCardProps {
  aspectScores: MatchAspectScores;
  matchName?: string;
}

export function AspectMatchCard({ aspectScores, matchName = 'Match' }: AspectMatchCardProps) {
  const [showHelp, setShowHelp] = useState(false);
  const [showFullComparison, setShowFullComparison] = useState(false);

  const { scores, compatibility_insights, overall_realm_compatibility } = aspectScores;

  // Get score for an aspect
  const getScore = (aspectId: string): number => {
    const found = scores.find(s => s.aspect_id === aspectId);
    return found?.score ?? 50;
  };

  // Get evidence for an aspect
  const getEvidence = (aspectId: string): string | undefined => {
    const found = scores.find(s => s.aspect_id === aspectId);
    return found?.evidence;
  };

  // Get bar color based on score
  const getBarColor = (score: number): string => {
    if (score >= 80) return 'bg-emerald-500 dark:bg-emerald-400';
    if (score >= 60) return 'bg-blue-500 dark:bg-blue-400';
    if (score >= 40) return 'bg-slate-400 dark:bg-slate-500';
    return 'bg-slate-300 dark:bg-slate-600';
  };

  // Get realm compatibility color
  const getRealmColor = (score: number): string => {
    if (score >= 75) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 50) return 'text-blue-600 dark:text-blue-400';
    if (score >= 35) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <section className="bg-white dark:bg-slate-800 rounded-xl border border-violet-200 dark:border-violet-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/30 dark:to-purple-900/30 p-4 border-b border-violet-100 dark:border-violet-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-violet-600 dark:text-violet-400" />
            <h3 className="font-bold text-slate-900 dark:text-slate-50">23 Aspects Compatibility</h3>
          </div>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="p-1.5 rounded-full hover:bg-violet-100 dark:hover:bg-violet-800/50 transition-colors"
            aria-label="What are the 23 Aspects?"
          >
            <HelpCircle size={18} className="text-violet-600 dark:text-violet-400" />
          </button>
        </div>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="m-4 bg-violet-50 dark:bg-violet-900/30 p-4 rounded-lg border border-violet-300 dark:border-violet-600 relative">
          <button
            onClick={() => setShowHelp(false)}
            className="absolute top-2 right-2 p-1 hover:bg-violet-200 dark:hover:bg-violet-800/50 rounded-full"
          >
            <X size={14} className="text-violet-600 dark:text-violet-400" />
          </button>
          <h4 className="font-bold text-violet-900 dark:text-violet-100 text-sm mb-2">23 Aspects Compatibility</h4>
          <p className="text-sm text-violet-800 dark:text-violet-200 mb-2">
            This compares {matchName}'s aspect scores with yours to identify compatibility patterns.
          </p>
          <ul className="text-sm text-violet-800 dark:text-violet-200 ml-4 list-disc">
            <li><strong className="text-emerald-600 dark:text-emerald-400">Strong Matches</strong> - Both score high (bonding potential)</li>
            <li><strong className="text-blue-600 dark:text-blue-400">Complementary</strong> - One fills the other's gap (growth)</li>
            <li><strong className="text-amber-600 dark:text-amber-400">Friction Points</strong> - Opposing values (needs attention)</li>
          </ul>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Realm Compatibility Overview */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
            <p className="text-xs text-orange-600 dark:text-orange-400 font-medium uppercase">Vitality</p>
            <p className={`text-2xl font-bold ${getRealmColor(overall_realm_compatibility.vitality)}`}>
              {overall_realm_compatibility.vitality}%
            </p>
          </div>
          <div className="text-center p-3 bg-rose-50 dark:bg-rose-900/30 rounded-lg">
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium uppercase">Connection</p>
            <p className={`text-2xl font-bold ${getRealmColor(overall_realm_compatibility.connection)}`}>
              {overall_realm_compatibility.connection}%
            </p>
          </div>
          <div className="text-center p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium uppercase">Structure</p>
            <p className={`text-2xl font-bold ${getRealmColor(overall_realm_compatibility.structure)}`}>
              {overall_realm_compatibility.structure}%
            </p>
          </div>
        </div>

        {/* Strong Matches */}
        {compatibility_insights.strong_matches && compatibility_insights.strong_matches.length > 0 && (
          <div className="bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-lg border border-emerald-100 dark:border-emerald-700">
            <h4 className="font-bold text-emerald-800 dark:text-emerald-200 text-sm mb-2 flex items-center gap-1">
              <Heart size={14} /> Strong Matches
            </h4>
            <div className="space-y-2">
              {compatibility_insights.strong_matches.map((match, i) => (
                <div key={i} className="text-sm">
                  <span className="font-medium text-emerald-700 dark:text-emerald-300">{match.aspect}</span>
                  <p className="text-emerald-600 dark:text-emerald-400 text-xs mt-0.5">{match.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Complementary Aspects */}
        {compatibility_insights.complementary && compatibility_insights.complementary.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg border border-blue-100 dark:border-blue-700">
            <h4 className="font-bold text-blue-800 dark:text-blue-200 text-sm mb-2 flex items-center gap-1">
              <Zap size={14} /> Complementary
            </h4>
            <div className="space-y-2">
              {compatibility_insights.complementary.map((comp, i) => (
                <div key={i} className="text-sm">
                  <span className="font-medium text-blue-700 dark:text-blue-300">{comp.aspect}</span>
                  <p className="text-blue-600 dark:text-blue-400 text-xs mt-0.5">{comp.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Potential Friction */}
        {compatibility_insights.potential_friction && compatibility_insights.potential_friction.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/30 p-3 rounded-lg border border-amber-100 dark:border-amber-700">
            <h4 className="font-bold text-amber-800 dark:text-amber-200 text-sm mb-2 flex items-center gap-1">
              <AlertTriangle size={14} /> Potential Friction
            </h4>
            <div className="space-y-2">
              {compatibility_insights.potential_friction.map((friction, i) => (
                <div key={i} className="text-sm">
                  <span className="font-medium text-amber-700 dark:text-amber-300">{friction.aspect}</span>
                  <p className="text-amber-600 dark:text-amber-400 text-xs mt-0.5">{friction.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expand/Collapse Full Comparison */}
        <button
          onClick={() => setShowFullComparison(!showFullComparison)}
          className="w-full flex items-center justify-center gap-2 text-sm text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300 py-2"
        >
          {showFullComparison ? (
            <>
              <ChevronUp size={16} /> Hide Full 23 Aspects
            </>
          ) : (
            <>
              <ChevronDown size={16} /> Show Full 23 Aspects
            </>
          )}
        </button>

        {/* Full Aspect Comparison */}
        {showFullComparison && (
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-700">
            {LEGACY_REALMS.map(realm => {
              const realmAspects = getAspectsByRealm(realm.id);

              return (
                <div key={realm.id}>
                  <h5 className={`font-bold text-xs uppercase ${realm.colorClass} mb-2`}>
                    {realm.name}
                  </h5>
                  <div className="space-y-2">
                    {realmAspects.map(aspect => {
                      const score = getScore(aspect.id);
                      const evidence = getEvidence(aspect.id);

                      return (
                        <div key={aspect.id} className="bg-slate-50 dark:bg-slate-700 rounded-lg p-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{aspect.name}</span>
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{score}</span>
                          </div>
                          <div className="h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${getBarColor(score)} rounded-full transition-all duration-300`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                          {evidence && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">{evidence}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
