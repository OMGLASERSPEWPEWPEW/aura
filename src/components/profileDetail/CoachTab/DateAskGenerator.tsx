// src/components/profileDetail/CoachTab/DateAskGenerator.tsx
import { Calendar, Copy, Check, Loader2 } from 'lucide-react';
import type { DateAskSuggestion } from '../../../lib/ai';

interface DateAskGeneratorProps {
  suggestions: DateAskSuggestion[];
  isGenerating: boolean;
  hasConversation: boolean;
  copiedIndex: number | null;
  onGenerate: () => void;
  onCopy: (text: string, index: number) => void;
}

const approachColors: Record<string, string> = {
  Direct: 'bg-blue-100 text-blue-700',
  Playful: 'bg-pink-100 text-pink-700',
  'Low-pressure': 'bg-green-100 text-green-700',
};

/**
 * Generate and display date ask suggestions
 */
export function DateAskGenerator({
  suggestions,
  isGenerating,
  hasConversation,
  copiedIndex,
  onGenerate,
  onCopy,
}: DateAskGeneratorProps) {
  return (
    <div className="bg-gradient-to-br from-rose-50 to-orange-50 rounded-xl p-4 border border-rose-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Calendar size={16} className="text-rose-500" />
          Ask Them Out
        </h3>
        {suggestions.length === 0 && (
          <button
            onClick={onGenerate}
            disabled={isGenerating || !hasConversation}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin" size={12} />
                Generating...
              </>
            ) : (
              'Generate date asks'
            )}
          </button>
        )}
      </div>

      {!hasConversation && suggestions.length === 0 && (
        <p className="text-xs text-slate-500">
          Upload a conversation first to get contextual date ask suggestions.
        </p>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="bg-white rounded-lg p-3 border border-rose-100"
            >
              {/* Approach and Tactic */}
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    approachColors[suggestion.approach] || 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {suggestion.approach}
                </span>
                <span className="text-xs text-purple-600 font-medium">
                  {suggestion.tactic}
                </span>
              </div>

              {/* Message */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm text-slate-800 font-medium flex-1">
                  "{suggestion.message}"
                </p>
                <button
                  onClick={() => onCopy(suggestion.message, 100 + index)}
                  className="flex-shrink-0 p-2 hover:bg-rose-100 rounded-lg transition-colors"
                  title="Copy to clipboard"
                >
                  {copiedIndex === 100 + index ? (
                    <Check size={16} className="text-green-600" />
                  ) : (
                    <Copy size={16} className="text-slate-400" />
                  )}
                </button>
              </div>

              {/* Why it works */}
              <p className="text-xs text-slate-500 italic">
                {suggestion.why_it_works}
              </p>
            </div>
          ))}

          {/* Refresh button when suggestions exist */}
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="w-full py-2 text-xs font-medium text-rose-600 hover:text-rose-800 hover:bg-rose-100 rounded-lg transition-colors disabled:opacity-50"
          >
            {isGenerating ? 'Generating...' : 'Try different asks'}
          </button>
        </div>
      )}
    </div>
  );
}
