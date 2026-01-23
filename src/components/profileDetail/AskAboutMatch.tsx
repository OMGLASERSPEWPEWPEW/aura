// src/components/profileDetail/AskAboutMatch.tsx
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Loader2, X, Sparkles } from 'lucide-react';
import { askAboutMatch } from '../../lib/ai';
import type { ProfileAnalysis, ProfileCompatibility } from '../../lib/db';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AskAboutMatchProps {
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
 */
export function AskAboutMatch({ matchName, matchAnalysis, compatibility }: AskAboutMatchProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

    const userMessage: Message = { role: 'user', content: question.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await askAboutMatch({
        question: question.trim(),
        matchAnalysis,
        compatibility,
      });

      const assistantMessage: Message = { role: 'assistant', content: response };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to ask about match:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: "Sorry, I couldn't process that question. Please try again.",
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(inputValue);
  };

  const handleExampleClick = (question: string) => {
    handleSubmit(question);
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white p-4 rounded-xl font-medium hover:from-violet-600 hover:to-purple-700 transition-all shadow-md flex items-center justify-center gap-2"
      >
        <MessageCircle size={20} />
        Ask about {matchName}
      </button>
    );
  }

  return (
    <section className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-4 flex items-center justify-between">
        <h3 className="text-white font-bold flex items-center gap-2">
          <Sparkles size={18} />
          Ask about {matchName}
        </h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="h-64 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-violet-600 mb-4">
              Ask anything about {matchName}'s profile, psychology, or how to approach them.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {EXAMPLE_QUESTIONS.slice(0, 3).map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleExampleClick(q)}
                  className="text-xs bg-white text-violet-700 px-3 py-1.5 rounded-full border border-violet-200 hover:bg-violet-100 transition-colors"
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
                    ? 'bg-violet-600 text-white rounded-br-none'
                    : 'bg-white text-slate-700 border border-violet-100 rounded-bl-none shadow-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-violet-600 p-3 rounded-xl rounded-bl-none border border-violet-100 shadow-sm">
              <Loader2 className="animate-spin" size={18} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleFormSubmit} className="p-3 border-t border-violet-200 bg-white/50">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Ask about ${matchName}...`}
            className="flex-1 px-4 py-2 rounded-full border border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="bg-violet-600 text-white p-2 rounded-full hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </section>
  );
}
