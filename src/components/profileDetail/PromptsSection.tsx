// src/components/profileDetail/PromptsSection.tsx
import { Copy, Check, Loader2, RefreshCw } from 'lucide-react';
import { SectionHeader } from '../ui/SectionCard';
import type { PromptAnalysis } from '../../lib/db';

interface PromptsSectionProps {
  prompts: PromptAnalysis[];
  copiedIndex: number | null;
  refreshingPromptIndex: number | null;
  onCopy: (text: string, index: number) => void;
  onRefreshPrompt: (index: number) => void;
}

/**
 * Prompts analysis section with per-prompt openers.
 */
export function PromptsSection({
  prompts,
  copiedIndex,
  refreshingPromptIndex,
  onCopy,
  onRefreshPrompt,
}: PromptsSectionProps) {
  if (prompts.length === 0) return null;

  return (
    <section>
      <SectionHeader title="Prompt Reveals" />
      <div className="space-y-3">
        {prompts.map((prompt, i) => (
          <div key={i} className="bg-slate-50 p-3 rounded-lg">
            <p className="text-xs text-slate-500 font-medium mb-1">{prompt.question}</p>
            <p className="text-sm text-slate-800 font-medium mb-2">"{prompt.answer}"</p>
            <p className="text-xs text-slate-600 italic border-t border-slate-200 pt-2">{prompt.analysis}</p>

            {/* Per-Prompt Opener */}
            {prompt.suggested_opener && (
              <div className="mt-3 bg-gradient-to-r from-pink-50 to-purple-50 p-3 rounded-lg border border-pink-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-purple-600">{prompt.suggested_opener.tactic}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onCopy(prompt.suggested_opener!.message, 100 + i)}
                      className="p-1 hover:bg-pink-100 rounded transition-colors"
                      title="Copy to clipboard"
                    >
                      {copiedIndex === 100 + i ? (
                        <Check size={14} className="text-green-600" />
                      ) : (
                        <Copy size={14} className="text-slate-400" />
                      )}
                    </button>
                    <button
                      onClick={() => onRefreshPrompt(i)}
                      disabled={refreshingPromptIndex === i}
                      className="p-1 hover:bg-pink-100 rounded transition-colors disabled:opacity-50"
                      title="Refresh opener"
                    >
                      {refreshingPromptIndex === i ? (
                        <Loader2 size={14} className="animate-spin text-pink-600" />
                      ) : (
                        <RefreshCw size={14} className="text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-800 font-medium mb-1">"{prompt.suggested_opener.message}"</p>
                <p className="text-xs text-slate-500 italic">{prompt.suggested_opener.why_it_works}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
