// src/components/profileDetail/OpenersSection.tsx
import { Send, Copy, Check, Loader2, RefreshCw } from 'lucide-react';
import type { RecommendedOpener } from '../../lib/db';

interface OpenersSectionProps {
  openers: RecommendedOpener[];
  copiedIndex: number | null;
  isRefreshing: boolean;
  onCopy: (text: string, index: number) => void;
  onRefresh: () => void;
}

/**
 * Recommended openers section with copy functionality.
 */
export function OpenersSection({ openers, copiedIndex, isRefreshing, onCopy, onRefresh }: OpenersSectionProps) {
  if (openers.length === 0) return null;

  return (
    <section className="bg-gradient-to-br from-pink-50 to-purple-50 p-4 rounded-xl border border-pink-200">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Send size={18} className="text-pink-600" /> Recommended Openers
        </h2>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-pink-600 hover:text-pink-800 hover:bg-pink-100 rounded-lg transition-colors disabled:opacity-50"
        >
          {isRefreshing ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
          Refresh
        </button>
      </div>
      <div className="space-y-3">
        {openers.map((opener, i) => (
          <div key={i} className="bg-white p-3 rounded-lg shadow-sm border border-pink-100">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      opener.type === 'like_comment' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {opener.type === 'like_comment' ? 'Like Comment' : 'Match Opener'}
                  </span>
                  <span className="text-xs text-purple-600 font-medium">{opener.tactic}</span>
                </div>
                <p className="text-sm text-slate-800 font-medium mb-1">"{opener.message}"</p>
                <p className="text-xs text-slate-500 italic">{opener.why_it_works}</p>
              </div>
              <button
                onClick={() => onCopy(opener.message, i)}
                className="flex-shrink-0 p-2 hover:bg-pink-100 rounded-lg transition-colors"
                title="Copy to clipboard"
              >
                {copiedIndex === i ? (
                  <Check size={16} className="text-green-600" />
                ) : (
                  <Copy size={16} className="text-slate-400" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
