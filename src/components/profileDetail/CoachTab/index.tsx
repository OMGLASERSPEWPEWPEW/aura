// src/components/profileDetail/CoachTab/index.tsx
import { MessageCircle, AlertCircle, X } from 'lucide-react';
import type { UseConversationCoachReturn } from '../../../hooks/useConversationCoach';
import type { DateSuggestion } from '../../../lib/db';
import type { WeatherForecast } from '../../../lib/weather';
import { ConversationUploader } from './ConversationUploader';
import { MatchTacticsCard } from './MatchTacticsCard';
import { ResponseSuggestions } from './ResponseSuggestions';
import { CoachingHistory } from './CoachingHistory';
import { DateAskGenerator } from './DateAskGenerator';
import { ResponseScorer } from './ResponseScorer';
import { DateIdeasSection } from '../DateIdeasSection';

interface CoachTabProps {
  coach: UseConversationCoachReturn;
  matchName?: string;
  copiedIndex: number | null;
  onCopy: (text: string, index: number) => void;
  // Date Ideas props
  dateSuggestions: DateSuggestion[] | null;
  dateTarget: string;
  weatherForecast: WeatherForecast | null;
  localEvents: string[];
  isLoadingWeather: boolean;
  isLoadingDates: boolean;
  dateError: string | null;
  onDateSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGenerateDates: () => void;
}

/**
 * Main Coach tab container component
 */
export function CoachTab({
  coach,
  matchName,
  copiedIndex,
  onCopy,
  dateSuggestions,
  dateTarget,
  weatherForecast,
  localEvents,
  isLoadingWeather,
  isLoadingDates,
  dateError,
  onDateSelect,
  onGenerateDates,
}: CoachTabProps) {
  const {
    conversationImages,
    isAnalyzing,
    isScoring,
    isGeneratingDateAsk,
    error,
    currentSession,
    matchAnalysis,
    suggestedResponses,
    dateAskSuggestions,
    coachingHistory,
    addImages,
    clearImages,
    analyzeConversation,
    refreshResponses,
    scoreResponse,
    generateDateAskSuggestions,
    loadSession,
    clearSession,
  } = coach;

  const handleRemoveImage = (index: number) => {
    const newImages = [...conversationImages];
    newImages.splice(index, 1);
    clearImages();
    if (newImages.length > 0) {
      addImages(newImages);
    }
  };

  return (
    <div className="space-y-6">
      {/* Date Ideas Section */}
      <DateIdeasSection
        suggestions={dateSuggestions}
        targetDate={dateTarget}
        weatherForecast={weatherForecast}
        localEvents={localEvents}
        isLoadingWeather={isLoadingWeather}
        isLoadingDates={isLoadingDates}
        error={dateError}
        onDateSelect={onDateSelect}
        onGenerate={onGenerateDates}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <MessageCircle size={20} className="text-pink-600" />
          Conversation Coach
        </h2>
        {(matchAnalysis || conversationImages.length > 0) && (
          <button
            onClick={clearSession}
            className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
          >
            <X size={14} />
            Clear
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <p className="text-sm">{error.getUserMessage()}</p>
        </div>
      )}

      {/* Upload or Results */}
      {!matchAnalysis ? (
        <>
          {/* Conversation Uploader */}
          <ConversationUploader
            images={conversationImages}
            isAnalyzing={isAnalyzing}
            onAddImages={addImages}
            onRemoveImage={handleRemoveImage}
            onAnalyze={analyzeConversation}
          />

          {/* Coaching History */}
          <CoachingHistory
            sessions={coachingHistory}
            currentSessionId={currentSession?.id}
            onLoadSession={loadSession}
          />
        </>
      ) : (
        <>
          {/* Match Tactics Card */}
          <MatchTacticsCard analysis={matchAnalysis} matchName={matchName} />

          {/* Response Suggestions */}
          <ResponseSuggestions
            responses={suggestedResponses}
            copiedIndex={copiedIndex}
            isRefreshing={isAnalyzing}
            onCopy={onCopy}
            onRefresh={refreshResponses}
          />

          {/* Response Scorer */}
          <ResponseScorer
            hasAnalysis={!!matchAnalysis}
            existingScore={currentSession?.responseScore}
            existingExplanation={currentSession?.scoreExplanation}
            existingResponse={currentSession?.userActualResponse}
            isScoring={isScoring}
            onScore={scoreResponse}
          />

          {/* Date Ask Generator */}
          <DateAskGenerator
            suggestions={dateAskSuggestions}
            isGenerating={isGeneratingDateAsk}
            hasConversation={conversationImages.length > 0}
            copiedIndex={copiedIndex}
            onGenerate={generateDateAskSuggestions}
            onCopy={onCopy}
          />

          {/* Coaching History */}
          <CoachingHistory
            sessions={coachingHistory}
            currentSessionId={currentSession?.id}
            onLoadSession={loadSession}
          />
        </>
      )}

      {/* Help Text */}
      {!matchAnalysis && conversationImages.length === 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-slate-500">
            Upload screenshots of your conversation to get AI-powered coaching.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            We'll analyze their messages and suggest the best responses.
          </p>
        </div>
      )}
    </div>
  );
}

// Re-export sub-components for flexibility
export { ConversationUploader } from './ConversationUploader';
export { MatchTacticsCard } from './MatchTacticsCard';
export { ResponseSuggestions } from './ResponseSuggestions';
export { CoachingHistory } from './CoachingHistory';
export { DateAskGenerator } from './DateAskGenerator';
export { ResponseScorer } from './ResponseScorer';
