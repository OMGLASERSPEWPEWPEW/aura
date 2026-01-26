// src/hooks/useConversationCoach.ts
import { useState, useCallback, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import type { Profile, UserIdentity, CoachingSession, CoachingResponse, MatchCoachingAnalysis } from '../lib/db';
import { analyzeConversation, scoreUserResponse, generateDateAsk } from '../lib/ai';
import type { CoachingAnalysisResult, DateAskSuggestion, ResponseScoreResult } from '../lib/ai';
import { extractAnalysisFields } from '../lib/utils/profileHelpers';
import { AuraError, ApiError, ValidationError } from '../lib/errors';
import { useErrorToast } from '../contexts/ToastContext';

export interface UseConversationCoachReturn {
  // State
  conversationImages: string[];
  isAnalyzing: boolean;
  isScoring: boolean;
  isGeneratingDateAsk: boolean;
  error: AuraError | null;

  // Current session data
  currentSession: CoachingSession | null;
  matchAnalysis: MatchCoachingAnalysis | null;
  suggestedResponses: CoachingResponse[];

  // Date ask suggestions
  dateAskSuggestions: DateAskSuggestion[];

  // History
  coachingHistory: CoachingSession[];

  // Actions
  addImages: (images: string[]) => void;
  clearImages: () => void;
  analyzeConversation: () => Promise<void>;
  refreshResponses: () => Promise<void>;
  scoreResponse: (userResponse: string) => Promise<ResponseScoreResult | null>;
  generateDateAskSuggestions: () => Promise<void>;
  loadSession: (session: CoachingSession) => void;
  clearSession: () => void;
}

/**
 * Hook for managing conversation coaching state and AI interactions.
 */
export function useConversationCoach(
  profile: Profile | undefined,
  userIdentity: UserIdentity | undefined
): UseConversationCoachReturn {
  // Image state
  const [conversationImages, setConversationImages] = useState<string[]>([]);

  // Loading states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [isGeneratingDateAsk, setIsGeneratingDateAsk] = useState(false);

  // Error state
  const [error, setError] = useState<AuraError | null>(null);
  const showError = useErrorToast();

  // Current session state
  const [currentSession, setCurrentSession] = useState<CoachingSession | null>(null);
  const [matchAnalysis, setMatchAnalysis] = useState<MatchCoachingAnalysis | null>(null);
  const [suggestedResponses, setSuggestedResponses] = useState<CoachingResponse[]>([]);

  // Date ask suggestions
  const [dateAskSuggestions, setDateAskSuggestions] = useState<DateAskSuggestion[]>([]);

  // Fetch coaching history for this profile
  const coachingHistory = useLiveQuery(
    async () => {
      if (!profile?.id) return [];
      return db.coachingSessions
        .where('profileId')
        .equals(profile.id)
        .reverse()
        .sortBy('timestamp');
    },
    [profile?.id],
    []
  );

  // Build context objects from profile and user data
  const buildUserContext = useCallback(() => {
    if (!userIdentity?.synthesis) {
      return {
        archetype: undefined,
        attachmentPatterns: undefined,
        communicationStyle: undefined,
        growthAreas: undefined,
        goal: userIdentity?.datingGoals?.type,
      };
    }

    const synthesis = userIdentity.synthesis;
    return {
      archetype: synthesis.psychological_profile?.archetype_summary,
      attachmentPatterns: synthesis.behavioral_insights?.attachment_patterns,
      communicationStyle: synthesis.behavioral_insights?.communication_style,
      growthAreas: synthesis.behavioral_insights?.growth_areas,
      goal: userIdentity.datingGoals?.type,
    };
  }, [userIdentity]);

  const buildMatchContext = useCallback(() => {
    if (!profile) {
      return {
        name: undefined,
        archetype: undefined,
        agendas: undefined,
        tactics: undefined,
        vulnerabilities: undefined,
        powerDynamics: undefined,
      };
    }

    const { basics, psych } = extractAnalysisFields(profile.analysis);
    return {
      name: basics.name || profile.name,
      archetype: psych.archetype_summary,
      agendas: psych.agendas?.map(a => a.type),
      tactics: psych.predicted_tactics,
      vulnerabilities: psych.subtext_analysis?.vulnerability_indicators,
      powerDynamics: psych.subtext_analysis?.power_dynamics,
    };
  }, [profile]);

  // Add images to conversation
  const addImages = useCallback((images: string[]) => {
    setConversationImages(prev => [...prev, ...images]);
    setError(null);
  }, []);

  // Clear images
  const clearImages = useCallback(() => {
    setConversationImages([]);
  }, []);

  // Clear current session
  const clearSession = useCallback(() => {
    setCurrentSession(null);
    setMatchAnalysis(null);
    setSuggestedResponses([]);
    setDateAskSuggestions([]);
    setConversationImages([]);
    setError(null);
  }, []);

  // Load a previous session
  const loadSession = useCallback((session: CoachingSession) => {
    setCurrentSession(session);
    setMatchAnalysis(session.matchAnalysis);
    setSuggestedResponses(session.suggestedResponses);
    setConversationImages(session.conversationImages);
    setDateAskSuggestions([]);
    setError(null);
  }, []);

  // Analyze conversation
  const doAnalyzeConversation = useCallback(async () => {
    if (!profile?.id || conversationImages.length === 0) {
      const validationError = new ValidationError('Please add conversation screenshots first.');
      setError(validationError);
      showError(validationError);
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const result: CoachingAnalysisResult = await analyzeConversation({
        conversationImages,
        userContext: buildUserContext(),
        matchContext: buildMatchContext(),
      });

      // Update state
      setMatchAnalysis(result.match_analysis);
      setSuggestedResponses(result.suggested_responses);

      // Save to database
      const newSession: CoachingSession = {
        profileId: profile.id,
        timestamp: new Date(),
        conversationImages,
        matchAnalysis: result.match_analysis,
        suggestedResponses: result.suggested_responses,
      };

      const sessionId = await db.coachingSessions.add(newSession);
      setCurrentSession({ ...newSession, id: sessionId });
    } catch (err) {
      const auraError = err instanceof AuraError
        ? err
        : new ApiError(err instanceof Error ? err.message : 'Failed to analyze conversation', { cause: err instanceof Error ? err : undefined });
      console.log('useConversationCoach:', auraError.code, auraError.message);
      setError(auraError);
      showError(auraError);
    } finally {
      setIsAnalyzing(false);
    }
  }, [profile?.id, conversationImages, buildUserContext, buildMatchContext, showError]);

  // Refresh responses (re-analyze with same images)
  const refreshResponses = useCallback(async () => {
    if (!profile?.id || conversationImages.length === 0) {
      const validationError = new ValidationError('No conversation to refresh.');
      setError(validationError);
      showError(validationError);
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const result: CoachingAnalysisResult = await analyzeConversation({
        conversationImages,
        userContext: buildUserContext(),
        matchContext: buildMatchContext(),
      });

      // Update state with new responses
      setMatchAnalysis(result.match_analysis);
      setSuggestedResponses(result.suggested_responses);

      // Update the current session in database if exists
      if (currentSession?.id) {
        await db.coachingSessions.update(currentSession.id, {
          matchAnalysis: result.match_analysis,
          suggestedResponses: result.suggested_responses,
        });
        setCurrentSession(prev => prev ? {
          ...prev,
          matchAnalysis: result.match_analysis,
          suggestedResponses: result.suggested_responses,
        } : null);
      }
    } catch (err) {
      const auraError = err instanceof AuraError
        ? err
        : new ApiError(err instanceof Error ? err.message : 'Failed to refresh responses', { cause: err instanceof Error ? err : undefined });
      console.log('useConversationCoach:', auraError.code, auraError.message);
      setError(auraError);
      showError(auraError);
    } finally {
      setIsAnalyzing(false);
    }
  }, [profile?.id, conversationImages, currentSession?.id, buildUserContext, buildMatchContext, showError]);

  // Score user's actual response
  const doScoreResponse = useCallback(async (userResponse: string): Promise<ResponseScoreResult | null> => {
    if (!matchAnalysis || suggestedResponses.length === 0) {
      const validationError = new ValidationError('No analysis to score against.');
      setError(validationError);
      showError(validationError);
      return null;
    }

    setIsScoring(true);
    setError(null);

    try {
      const matchContext = buildMatchContext();
      const userContext = buildUserContext();

      const result = await scoreUserResponse(
        userResponse,
        {
          archetype: matchContext.archetype,
          detectedAgenda: matchAnalysis.detected_agenda,
          detectedTactics: matchAnalysis.detected_tactics,
          subtext: matchAnalysis.subtext,
        },
        {
          archetype: userContext.archetype,
          growthAreas: userContext.growthAreas,
          communicationStyle: userContext.communicationStyle,
        },
        suggestedResponses
      );

      // Update session in database with score
      if (currentSession?.id) {
        await db.coachingSessions.update(currentSession.id, {
          userActualResponse: userResponse,
          responseScore: result.score,
          scoreExplanation: result.explanation,
        });
        setCurrentSession(prev => prev ? {
          ...prev,
          userActualResponse: userResponse,
          responseScore: result.score,
          scoreExplanation: result.explanation,
        } : null);
      }

      return result;
    } catch (err) {
      const auraError = err instanceof AuraError
        ? err
        : new ApiError(err instanceof Error ? err.message : 'Failed to score response', { cause: err instanceof Error ? err : undefined });
      console.log('useConversationCoach:', auraError.code, auraError.message);
      setError(auraError);
      showError(auraError);
      return null;
    } finally {
      setIsScoring(false);
    }
  }, [matchAnalysis, suggestedResponses, currentSession?.id, buildMatchContext, buildUserContext, showError]);

  // Generate date ask suggestions
  const doGenerateDateAsk = useCallback(async () => {
    if (conversationImages.length === 0) {
      const validationError = new ValidationError('Please add conversation screenshots first.');
      setError(validationError);
      showError(validationError);
      return;
    }

    setIsGeneratingDateAsk(true);
    setError(null);

    try {
      const matchContext = buildMatchContext();
      const userContext = buildUserContext();

      const suggestions = await generateDateAsk(
        conversationImages,
        {
          name: matchContext.name,
          archetype: matchContext.archetype,
          powerDynamics: matchContext.powerDynamics,
          vulnerabilities: matchContext.vulnerabilities,
        },
        {
          goal: userContext.goal,
          communicationStyle: userContext.communicationStyle,
        }
      );

      setDateAskSuggestions(suggestions);
    } catch (err) {
      const auraError = err instanceof AuraError
        ? err
        : new ApiError(err instanceof Error ? err.message : 'Failed to generate date suggestions', { cause: err instanceof Error ? err : undefined });
      console.log('useConversationCoach:', auraError.code, auraError.message);
      setError(auraError);
      showError(auraError);
    } finally {
      setIsGeneratingDateAsk(false);
    }
  }, [conversationImages, buildMatchContext, buildUserContext, showError]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return {
    // State
    conversationImages,
    isAnalyzing,
    isScoring,
    isGeneratingDateAsk,
    error,

    // Current session data
    currentSession,
    matchAnalysis,
    suggestedResponses,

    // Date ask
    dateAskSuggestions,

    // History
    coachingHistory,

    // Actions
    addImages,
    clearImages,
    analyzeConversation: doAnalyzeConversation,
    refreshResponses,
    scoreResponse: doScoreResponse,
    generateDateAskSuggestions: doGenerateDateAsk,
    loadSession,
    clearSession,
  };
}
