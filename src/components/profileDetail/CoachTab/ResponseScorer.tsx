// src/components/profileDetail/CoachTab/ResponseScorer.tsx
import { useState } from 'react';
import { Trophy, Send, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import type { ResponseScoreResult } from '../../../lib/ai';

interface ResponseScorerProps {
  hasAnalysis: boolean;
  existingScore?: number;
  existingExplanation?: string;
  existingResponse?: string;
  isScoring: boolean;
  onScore: (response: string) => Promise<ResponseScoreResult | null>;
}

/**
 * Component for scoring user's actual response
 */
export function ResponseScorer({
  hasAnalysis,
  existingScore,
  existingExplanation,
  existingResponse,
  isScoring,
  onScore,
}: ResponseScorerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [userResponse, setUserResponse] = useState(existingResponse || '');
  const [scoreResult, setScoreResult] = useState<ResponseScoreResult | null>(
    existingScore !== undefined && existingExplanation
      ? { score: existingScore, explanation: existingExplanation, growth_note: '' }
      : null
  );

  const handleSubmit = async () => {
    if (!userResponse.trim()) return;
    const result = await onScore(userResponse);
    if (result) {
      setScoreResult(result);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-100';
    if (score >= 6) return 'text-amber-600 bg-amber-100';
    return 'text-red-600 bg-red-100';
  };

  if (!hasAnalysis) return null;

  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4"
      >
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-amber-500" />
          <span className="text-sm font-medium text-slate-700">
            Score Your Response
          </span>
          {scoreResult && (
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded ${getScoreColor(
                scoreResult.score
              )}`}
            >
              {scoreResult.score}/10
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp size={16} className="text-slate-400" />
        ) : (
          <ChevronDown size={16} className="text-slate-400" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-slate-200 p-4 space-y-4">
          <p className="text-xs text-slate-500">
            Share what you actually sent to get a score and feedback on your response.
          </p>

          {/* Input */}
          <div className="space-y-2">
            <textarea
              value={userResponse}
              onChange={(e) => setUserResponse(e.target.value)}
              placeholder="Paste or type what you sent..."
              className="w-full p-3 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              rows={3}
            />
            <button
              onClick={handleSubmit}
              disabled={isScoring || !userResponse.trim()}
              className="w-full py-2 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-lg hover:from-amber-600 hover:to-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isScoring ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Scoring...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Get Score
                </>
              )}
            </button>
          </div>

          {/* Score Result */}
          {scoreResult && (
            <div className="bg-white rounded-lg p-4 border border-slate-200 space-y-3">
              {/* Score Display */}
              <div className="flex items-center justify-center">
                <div
                  className={`text-3xl font-bold px-4 py-2 rounded-xl ${getScoreColor(
                    scoreResult.score
                  )}`}
                >
                  {scoreResult.score}/10
                </div>
              </div>

              {/* Explanation */}
              <p className="text-sm text-slate-700">{scoreResult.explanation}</p>

              {/* Growth Note */}
              {scoreResult.growth_note && (
                <p className="text-xs text-green-600 bg-green-50 p-2 rounded-lg">
                  {scoreResult.growth_note}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
