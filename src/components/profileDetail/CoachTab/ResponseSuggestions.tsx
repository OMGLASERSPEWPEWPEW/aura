// src/components/profileDetail/CoachTab/ResponseSuggestions.tsx
import { Copy, Check, Sparkles, Lightbulb, RefreshCw, Loader2 } from 'lucide-react';
import type { CoachingResponse } from '../../../lib/db';

interface ResponseSuggestionsProps {
  responses: CoachingResponse[];
  copiedIndex: number | null;
  isRefreshing: boolean;
  onCopy: (text: string, index: number) => void;
  onRefresh: () => void;
}

/**
 * Display suggested responses with copy functionality
 */
export function ResponseSuggestions({
  responses,
  copiedIndex,
  isRefreshing,
  onCopy,
  onRefresh,
}: ResponseSuggestionsProps) {
  if (responses.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Sparkles size={16} className="text-pink-500" />
          Suggested Responses
        </h3>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-pink-600 hover:text-pink-800 hover:bg-pink-100 rounded-lg transition-colors disabled:opacity-50"
        >
          {isRefreshing ? (
            <Loader2 className="animate-spin" size={12} />
          ) : (
            <RefreshCw size={12} />
          )}
          Try different
        </button>
      </div>

      <div className="space-y-3">
        {responses.map((response, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm"
          >
            {/* Tactic Badge */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold bg-gradient-to-r from-pink-500 to-purple-500 text-white px-2 py-0.5 rounded">
                {response.tactic}
              </span>
            </div>

            {/* Message */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <p className="text-sm text-slate-800 font-medium flex-1">
                "{response.message}"
              </p>
              <button
                onClick={() => onCopy(response.message, index)}
                className="flex-shrink-0 p-2 hover:bg-pink-100 rounded-lg transition-colors"
                title="Copy to clipboard"
              >
                {copiedIndex === index ? (
                  <Check size={16} className="text-green-600" />
                ) : (
                  <Copy size={16} className="text-slate-400" />
                )}
              </button>
            </div>

            {/* Why it works */}
            <div className="text-xs text-slate-600 mb-2">
              <span className="font-semibold text-slate-700">Why it works: </span>
              {response.why_it_works}
            </div>

            {/* Growth insight */}
            <div className="flex items-start gap-2 bg-green-50 p-2 rounded-lg">
              <Lightbulb size={14} className="text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-green-700">
                <span className="font-semibold">Growth: </span>
                {response.growth_insight}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
