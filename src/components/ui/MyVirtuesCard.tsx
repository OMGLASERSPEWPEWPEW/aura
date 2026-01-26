// src/components/ui/MyVirtuesCard.tsx
// Card component for displaying user's own 11 Virtues profile
// Shows on MyProfile page in the Insights tab

import { Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { VirtueMixingBoard } from './VirtueMixingBoard';
import type { UserVirtueProfile, RealmType } from '../../lib/virtues';

interface MyVirtuesCardProps {
  // User's virtue profile
  virtueProfile: UserVirtueProfile;

  // Callback to regenerate virtue profile
  onRegenerate?: () => void;

  // Loading state during regeneration
  isRegenerating?: boolean;

  // Error state
  error?: string | null;
}

/**
 * Card for displaying user's own virtue profile on MyProfile page.
 *
 * Shows:
 * - Realm summaries (how AI characterized each realm)
 * - Full mixing board with all 11 virtue scores
 * - Regenerate button to re-analyze from backstory
 */
export function MyVirtuesCard({
  virtueProfile,
  onRegenerate,
  isRegenerating = false,
  error = null,
}: MyVirtuesCardProps) {
  const { scores, realm_summary, lastUpdated } = virtueProfile;

  // Format last updated date
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get realm summary text
  const getRealmSummary = (realm: RealmType): string => {
    return realm_summary[realm] || 'No summary available';
  };

  return (
    <section className="bg-white rounded-xl border border-indigo-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 border-b border-indigo-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-indigo-600" />
            <h3 className="font-bold text-slate-900">Your 11 Virtues Profile</h3>
          </div>

          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={14} className={isRegenerating ? 'animate-spin' : ''} />
              {isRegenerating ? 'Regenerating...' : 'Regenerate'}
            </button>
          )}
        </div>

        <p className="text-xs text-slate-500 mt-1">
          Last updated: {formatDate(lastUpdated)}
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Realm Summaries */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
            <h4 className="font-bold text-xs uppercase text-rose-600 mb-1">
              Biological
            </h4>
            <p className="text-xs text-slate-700">{getRealmSummary('biological')}</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <h4 className="font-bold text-xs uppercase text-amber-600 mb-1">
              Emotional
            </h4>
            <p className="text-xs text-slate-700">{getRealmSummary('emotional')}</p>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
            <h4 className="font-bold text-xs uppercase text-indigo-600 mb-1">
              Cerebral
            </h4>
            <p className="text-xs text-slate-700">{getRealmSummary('cerebral')}</p>
          </div>
        </div>

        {/* Mixing Board (user scores only) */}
        <VirtueMixingBoard
          userScores={scores}
          showMatch={false}
          compact={false}
          defaultExpandedRealm="biological"
        />

        {/* Info Footer */}
        <p className="text-xs text-slate-500 text-center pt-2 border-t border-slate-100">
          Your virtue scores are extracted from your backstory and self-analysis.
          Update those to refine your profile.
        </p>
      </div>
    </section>
  );
}

export default MyVirtuesCard;
