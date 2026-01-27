// src/components/profileDetail/AskAboutMatch.tsx
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Loader2, X, Sparkles, Trash2 } from 'lucide-react';
import { useAskAboutMatch } from '../../hooks';
import type { ProfileAnalysis, ProfileCompatibility } from '../../lib/db';

interface AskAboutMatchProps {
  profileId: number;
  matchName: string;
  matchAnalysis: ProfileAnalysis;
  compatibility?: ProfileCompatibility;
}

const EXAMPLE_QUESTIONS = [
  "What are some red flags I should watch for?",
  "What's the best way to approach them?",
  "Are they looking for something serious?",
  "What topics should I avoid?",
  "What do their photos say about them?",
];

/**
 * Chat interface to ask AI questions about a match profile.
 * Messages persist in IndexedDB across sessions.
 */
export function AskAboutMatch({ profileId, matchName, matchAnalysis, compatibility }: AskAboutMatchProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use hook for persisted chat history
  const { messages, isLoading, sendMessage, clearHistory } = useAskAboutMatch(
    profileId,
    matchAnalysis,
    compatibility
  );

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleSubmit = async (question: string) => {
    if (!question.trim() || isLoading) return;
    setInputValue('');
    await sendMessage(question);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(inputValue);
  };

  const handleExampleClick = (question: string) => {
    handleSubmit(question);
  };

  const handleClearHistory = async () => {
    if (confirm('Clear all chat history for this match?')) {
      await clearHistory();
    }
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full bg-gradient-to-r from-violet-500 to-purple-600 dark:from-violet-600 dark:to-purple-700 text-white p-4 rounded-xl font-medium hover:from-violet-600 hover:to-purple-700 dark:hover:from-violet-700 dark:hover:to-purple-800 transition-all shadow-md flex items-center justify-center gap-2"
      >
        <MessageCircle size={20} />
        Ask about {matchName}
      </button>
    );
  }

  return (
    <section className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/30 dark:to-purple-900/30 rounded-xl border border-violet-200 dark:border-violet-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-600 dark:from-violet-600 dark:to-purple-700 p-4 flex items-center justify-between">
        <h3 className="text-white font-bold flex items-center gap-2">
          <Sparkles size={18} />
          Ask about {matchName}
        </h3>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors"
              title="Clear history"
            >
              <Trash2 size={16} />
            </button>
          )}
          <button
            onClick={() => setIsExpanded(false)}
            className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="h-64 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-violet-600 dark:text-violet-400 mb-4">
              Ask anything about {matchName}'s profile, psychology, or how to approach them.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {EXAMPLE_QUESTIONS.slice(0, 3).map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleExampleClick(q)}
                  className="text-xs bg-white dark:bg-slate-800 text-violet-700 dark:text-violet-300 px-3 py-1.5 rounded-full border border-violet-200 dark:border-violet-600 hover:bg-violet-100 dark:hover:bg-slate-700 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-xl text-sm ${
                  msg.role === 'user'
                    ? 'bg-violet-600 dark:bg-violet-700 text-white rounded-br-none'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-violet-100 dark:border-violet-700 rounded-bl-none shadow-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 p-3 rounded-xl rounded-bl-none border border-violet-100 dark:border-violet-700 shadow-sm">
              <Loader2 className="animate-spin" size={18} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleFormSubmit} className="p-3 border-t border-violet-200 dark:border-violet-700 bg-white/50 dark:bg-slate-800/50">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Ask about ${matchName}...`}
            className="flex-1 px-4 py-2 rounded-full border border-violet-200 dark:border-violet-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-400 dark:focus:ring-violet-500 focus:border-transparent text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="bg-violet-600 dark:bg-violet-700 text-white p-2 rounded-full hover:bg-violet-700 dark:hover:bg-violet-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </section>
  );
}
