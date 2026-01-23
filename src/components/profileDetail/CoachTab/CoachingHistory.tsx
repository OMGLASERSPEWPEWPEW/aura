// src/components/profileDetail/CoachTab/CoachingHistory.tsx
import { useState } from 'react';
import { History, ChevronDown, ChevronUp, Star, MessageSquare } from 'lucide-react';
import type { CoachingSession } from '../../../lib/db';

interface CoachingHistoryProps {
  sessions: CoachingSession[];
  currentSessionId?: number;
  onLoadSession: (session: CoachingSession) => void;
}

/**
 * Display past coaching sessions for this match
 */
export function CoachingHistory({
  sessions,
  currentSessionId,
  onLoadSession,
}: CoachingHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter out current session from history
  const historySessions = sessions.filter(s => s.id !== currentSessionId);

  if (historySessions.length === 0) return null;

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4"
      >
        <div className="flex items-center gap-2">
          <History size={16} className="text-slate-500" />
          <span className="text-sm font-medium text-slate-700">
            Past Sessions ({historySessions.length})
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp size={16} className="text-slate-400" />
        ) : (
          <ChevronDown size={16} className="text-slate-400" />
        )}
      </button>

      {/* Session List */}
      {isExpanded && (
        <div className="border-t border-slate-200 divide-y divide-slate-200">
          {historySessions.slice(0, 5).map((session) => (
            <button
              key={session.id}
              onClick={() => onLoadSession(session)}
              className="w-full p-3 text-left hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500">
                  {formatDate(session.timestamp)}
                </span>
                {session.responseScore && (
                  <div className="flex items-center gap-1">
                    <Star size={12} className="text-amber-500" />
                    <span className="text-xs font-medium text-amber-600">
                      {session.responseScore}/10
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare size={12} className="text-slate-400" />
                <p className="text-sm text-slate-600 truncate">
                  {session.matchAnalysis.detected_agenda}
                </p>
              </div>
              {session.userActualResponse && (
                <p className="text-xs text-slate-500 mt-1 truncate">
                  You sent: "{session.userActualResponse}"
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
