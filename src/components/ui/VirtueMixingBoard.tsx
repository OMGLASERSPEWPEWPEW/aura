// src/components/ui/VirtueMixingBoard.tsx
// "Mixing Board" UI displaying all 11 Virtues grouped by realm
// Shows user scores only (MyProfile) or user+match comparison (ProfileDetail)

import { useState } from 'react';
import { ChevronDown, ChevronUp, Heart, Users, Brain, HelpCircle, X } from 'lucide-react';
import { VirtueFader } from './VirtueFader';
import {
  REALMS,
  getVirtuesByRealm,
  type RealmType,
  type VirtueScore,
  type VirtueCompatibility,
} from '../../lib/virtues';

interface VirtueMixingBoardProps {
  // User's scores (always required)
  userScores: VirtueScore[];

  // Match comparison data (optional - omit for MyProfile view)
  matchCompatibility?: VirtueCompatibility[];
  realmScores?: {
    biological: number;
    emotional: number;
    cerebral: number;
  };

  // Display options
  showMatch?: boolean;
  compact?: boolean;
  defaultExpandedRealm?: RealmType | null;
}

// Map realm IDs to Lucide icons
const REALM_ICONS: Record<RealmType, React.ComponentType<{ size?: number; className?: string }>> = {
  biological: Heart,
  emotional: Users,
  cerebral: Brain,
};

/**
 * The "Mixing Board" - displays all 11 virtue faders organized by realm.
 *
 * In MyProfile mode (showMatch=false):
 *   - Shows only user's scores
 *   - No verdict indicators
 *
 * In Match mode (showMatch=true):
 *   - Shows both user and match scores
 *   - Displays compatibility verdicts
 *   - Shows realm-level compatibility scores
 */
export function VirtueMixingBoard({
  userScores,
  matchCompatibility,
  realmScores,
  showMatch = false,
  compact = false,
  defaultExpandedRealm = 'biological',
}: VirtueMixingBoardProps) {
  const [expandedRealm, setExpandedRealm] = useState<RealmType | null>(defaultExpandedRealm);
  const [showHelp, setShowHelp] = useState(false);

  // Get user score for a virtue
  const getUserScore = (virtueId: string): number => {
    const found = userScores.find(s => s.virtue_id === virtueId);
    return found?.score ?? 50;
  };

  // Get compatibility data for a virtue (when showing match)
  const getCompatibility = (virtueId: string): VirtueCompatibility | undefined => {
    return matchCompatibility?.find(c => c.virtue_id === virtueId);
  };

  // Get realm score color
  const getRealmScoreColor = (score: number): string => {
    if (score >= 75) return 'text-emerald-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-3">
      {/* Help button and modal */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="p-1.5 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="What are the 11 Virtues?"
        >
          <HelpCircle size={18} className="text-slate-500" />
        </button>
      </div>

      {showHelp && (
        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 relative mb-4">
          <button
            onClick={() => setShowHelp(false)}
            className="absolute top-2 right-2 p-1 hover:bg-indigo-100 rounded-full"
          >
            <X size={14} className="text-indigo-600" />
          </button>
          <h4 className="font-bold text-indigo-900 text-sm mb-2">The 11 Virtues of Love</h4>
          <p className="text-sm text-indigo-800 mb-2">
            A framework for understanding romantic compatibility across three realms:
          </p>
          <ul className="text-sm text-indigo-800 space-y-1 ml-4 list-disc mb-3">
            <li><strong className="text-rose-600">Biological</strong> - Chemistry and physical compatibility</li>
            <li><strong className="text-amber-600">Emotional</strong> - How you connect and handle conflict</li>
            <li><strong className="text-indigo-600">Cerebral</strong> - Long-term intellectual compatibility</li>
          </ul>
          {showMatch && (
            <>
              <p className="text-sm text-indigo-800 mb-2">Compatibility verdicts:</p>
              <ul className="text-sm text-indigo-800 space-y-1 ml-4 list-disc">
                <li><span className="text-emerald-600 font-bold">Sympatico</span> - Well aligned</li>
                <li><span className="text-amber-600 font-bold">Friction</span> - Some tension, needs discussion</li>
                <li><span className="text-red-600 font-bold">Danger Zone</span> - Significant mismatch</li>
              </ul>
            </>
          )}
        </div>
      )}

      {/* Realm sections */}
      {REALMS.map((realm) => {
        const RealmIcon = REALM_ICONS[realm.id];
        const realmVirtues = getVirtuesByRealm(realm.id);
        const isExpanded = expandedRealm === realm.id;
        const realmScore = realmScores?.[realm.id];

        return (
          <div
            key={realm.id}
            className={`${realm.bgClass} rounded-xl border ${realm.borderClass} overflow-hidden`}
          >
            {/* Realm header */}
            <button
              onClick={() => setExpandedRealm(isExpanded ? null : realm.id)}
              className="w-full p-3 flex items-center justify-between hover:bg-white/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <RealmIcon size={18} className={realm.colorClass} />
                <div className="text-left">
                  <h4 className={`font-bold text-sm ${realm.colorClass}`}>{realm.name}</h4>
                  <p className="text-xs text-slate-600">{realm.subtitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Realm compatibility score (only in match mode) */}
                {showMatch && realmScore !== undefined && (
                  <span className={`text-lg font-bold ${getRealmScoreColor(realmScore)}`}>
                    {realmScore}%
                  </span>
                )}
                {isExpanded ? (
                  <ChevronUp size={18} className={realm.colorClass} />
                ) : (
                  <ChevronDown size={18} className={realm.colorClass} />
                )}
              </div>
            </button>

            {/* Virtue faders */}
            {isExpanded && (
              <div className="px-4 pb-4 space-y-1 border-t border-white/50">
                {realmVirtues.map((virtue) => {
                  const userScore = getUserScore(virtue.id);
                  const compat = getCompatibility(virtue.id);

                  return (
                    <VirtueFader
                      key={virtue.id}
                      virtueId={virtue.id}
                      userScore={userScore}
                      matchScore={compat?.match_score}
                      verdict={compat?.verdict}
                      note={compat?.note}
                      showMatch={showMatch}
                      compact={compact}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default VirtueMixingBoard;
