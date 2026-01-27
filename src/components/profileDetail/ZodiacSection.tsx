// src/components/profileDetail/ZodiacSection.tsx
import { Link } from 'react-router-dom';
import { Sparkles, Loader2, Check, AlertCircle, RefreshCw } from 'lucide-react';
import type { ZodiacCompatibility } from '../../lib/db';

interface ZodiacSectionProps {
  compatibility: ZodiacCompatibility | null;
  isLoading: boolean;
  error: string | null;
  userZodiac: string | undefined;
  matchZodiac: string | undefined;
  canGenerate: boolean;
  onGenerate: () => void;
}

/**
 * Zodiac compatibility section with generation and display.
 */
export function ZodiacSection({
  compatibility,
  isLoading,
  error,
  userZodiac,
  matchZodiac,
  canGenerate,
  onGenerate,
}: ZodiacSectionProps) {
  // Show hint if only one sign is available
  if (!canGenerate && (userZodiac || matchZodiac)) {
    return (
      <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 text-indigo-800 dark:text-indigo-200 p-4 rounded-lg flex items-start">
        <Sparkles className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-indigo-600 dark:text-indigo-400" />
        <div className="text-sm">
          {!userZodiac ? (
            <p>
              <Link to="/my-profile" className="font-bold underline hover:text-indigo-900 dark:hover:text-indigo-100">
                Add your zodiac sign
              </Link>{' '}
              to see cosmic compatibility with{' '}
              {matchZodiac ? matchZodiac.charAt(0).toUpperCase() + matchZodiac.slice(1) : 'this match'}.
            </p>
          ) : (
            <p>This match's zodiac sign wasn't detected from their profile.</p>
          )}
        </div>
      </div>
    );
  }

  // Don't render if no zodiac info at all
  if (!canGenerate) return null;

  const formatSign = (sign: string) => sign.charAt(0).toUpperCase() + sign.slice(1);

  return (
    <section className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 p-5 rounded-xl border border-indigo-200 dark:border-indigo-700">
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-3 flex items-center gap-2">
        <Sparkles size={18} className="text-indigo-600 dark:text-indigo-400" /> Zodiac Compatibility
      </h2>

      <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-4">
        {formatSign(userZodiac!)} + {formatSign(matchZodiac!)}
      </p>

      {!compatibility && !isLoading && (
        <button
          onClick={onGenerate}
          className="w-full bg-indigo-600 dark:bg-indigo-700 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors flex items-center justify-center"
        >
          <Sparkles className="mr-2" size={18} />
          Generate Compatibility
        </button>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-6 text-indigo-600 dark:text-indigo-400">
          <Loader2 className="animate-spin mr-2" />
          <span>Reading the stars...</span>
        </div>
      )}

      {error && <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 p-3 rounded-lg text-sm">{error}</div>}

      {compatibility && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-indigo-800 dark:text-indigo-200">Cosmic Score</span>
            <div
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-bold text-lg ${
                compatibility.overall_score >= 7
                  ? 'bg-indigo-200 dark:bg-indigo-700 text-indigo-800 dark:text-indigo-100'
                  : compatibility.overall_score >= 4
                  ? 'bg-amber-200 dark:bg-amber-700 text-amber-800 dark:text-amber-100'
                  : 'bg-red-200 dark:bg-red-700 text-red-800 dark:text-red-100'
              }`}
            >
              {compatibility.overall_score}/10
            </div>
          </div>

          <p className="text-indigo-900 dark:text-indigo-100">{compatibility.summary}</p>

          {compatibility.strengths && compatibility.strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-indigo-800 dark:text-indigo-200 mb-2 flex items-center gap-1">
                <Check size={14} /> Cosmic Strengths
              </h4>
              <ul className="space-y-1">
                {compatibility.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-indigo-700 dark:text-indigo-300 flex items-start gap-2">
                    <span className="text-indigo-400 dark:text-indigo-500 mt-1">*</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {compatibility.challenges && compatibility.challenges.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/30 p-3 rounded-lg border border-amber-200 dark:border-amber-700">
              <h4 className="text-sm font-bold text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-1">
                <AlertCircle size={14} /> Potential Challenges
              </h4>
              <ul className="space-y-1">
                {compatibility.challenges.map((c, i) => (
                  <li key={i} className="text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2">
                    <span className="text-amber-400 dark:text-amber-500 mt-1">*</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {compatibility.advice && (
            <div className="bg-indigo-100 dark:bg-indigo-800/50 p-3 rounded-lg">
              <p className="text-sm text-indigo-800 dark:text-indigo-200 italic">
                <strong>Advice:</strong> {compatibility.advice}
              </p>
            </div>
          )}

          <button
            onClick={onGenerate}
            disabled={isLoading}
            className="w-full text-indigo-600 dark:text-indigo-400 py-2 text-sm font-medium hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors flex items-center justify-center gap-1"
          >
            <RefreshCw size={14} />
            Regenerate
          </button>
        </div>
      )}
    </section>
  );
}
