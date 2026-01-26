// src/components/profileDetail/OverviewTab.tsx
import { Link } from 'react-router-dom';
import { User, Loader2, Sparkles, AlertCircle } from 'lucide-react';

import type {
  ProfileCompatibility,
  ZodiacCompatibility,
  RecommendedOpener,
  DateSuggestion,
  VirtueScore,
  ProfileAnalysis,
  TransactionalIndicators,
  MatchAspectScores,
  MatchVirtueCompatibility,
  UserVirtueProfile,
} from '../../lib/db';
import type { WeatherForecast } from '../../lib/weather';
import { CompatibilityCard } from './CompatibilityCard';
import { VirtueScoresCard } from './VirtueScoresCard';
import { AspectMatchCard } from './AspectMatchCard';
import { TransactionalIndicatorsCard } from './TransactionalIndicatorsCard';
import { AskAboutMatch } from './AskAboutMatch';
import { ZodiacSection } from './ZodiacSection';
import { DateIdeasSection } from './DateIdeasSection';
import { OpenersSection } from './OpenersSection';
import { VirtueCompatibilityCard } from '../ui/VirtueCompatibilityCard';

interface OverviewTabProps {
  // User profile check
  hasUserProfile: boolean;
  hasCompatibility: boolean;

  // Match info for Ask feature
  profileId: number;
  matchName: string;
  matchAnalysis: ProfileAnalysis;

  // Compatibility
  compatibility?: ProfileCompatibility;

  // Legacy systems (deprecated)
  virtueScores?: VirtueScore[];
  aspectScores?: MatchAspectScores;
  isLoadingVirtues: boolean;
  isLoadingAspects: boolean;
  virtueError: string | null;
  aspectError: string | null;
  canGenerateVirtues: boolean;
  canGenerateAspects: boolean;
  onGenerateVirtues: () => void;
  onGenerateAspects: () => void;

  // 11 Virtues system (primary)
  virtues11?: MatchVirtueCompatibility;
  userVirtueProfile?: UserVirtueProfile;
  isLoadingVirtues11: boolean;
  virtues11Error: string | null;
  canGenerateVirtues11: boolean;
  onGenerateVirtues11: () => void;

  // Combined
  onGenerateAllScores: () => void;
  transactionalIndicators?: TransactionalIndicators;

  // Zodiac
  zodiacCompatibility: ZodiacCompatibility | null;
  zodiacIsLoading: boolean;
  zodiacError: string | null;
  userZodiac: string | undefined;
  matchZodiac: string | undefined;
  canGenerateZodiac: boolean;
  onGenerateZodiac: () => void;

  // Date Ideas
  dateSuggestions: DateSuggestion[] | null;
  dateTarget: string;
  weatherForecast: WeatherForecast | null;
  localEvents: string[];
  isLoadingWeather: boolean;
  isLoadingDates: boolean;
  dateError: string | null;
  onDateSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGenerateDates: () => void;

  // Openers
  openers: RecommendedOpener[];
  copiedIndex: number | null;
  isRefreshingOpeners: boolean;
  onCopy: (text: string, index: number) => void;
  onRefreshOpeners: () => void;
}

/**
 * Overview tab content - quick glance at compatibility, zodiac, and openers
 */
export function OverviewTab({
  hasUserProfile,
  hasCompatibility,
  profileId,
  matchName,
  matchAnalysis,
  compatibility,
  // Legacy systems (kept for interface compatibility, used via onGenerateAllScores)
  virtueScores,
  aspectScores,
  isLoadingVirtues,
  isLoadingAspects,
  virtueError,
  aspectError,
  canGenerateVirtues,
  canGenerateAspects,
  onGenerateVirtues: _onGenerateVirtues,
  onGenerateAspects: _onGenerateAspects,
  // 11 Virtues system
  virtues11,
  userVirtueProfile,
  isLoadingVirtues11,
  virtues11Error,
  canGenerateVirtues11,
  onGenerateVirtues11,
  // Combined
  onGenerateAllScores,
  transactionalIndicators,
  zodiacCompatibility,
  zodiacIsLoading,
  zodiacError,
  userZodiac,
  matchZodiac,
  canGenerateZodiac,
  onGenerateZodiac,
  dateSuggestions,
  dateTarget,
  weatherForecast,
  localEvents,
  isLoadingWeather,
  isLoadingDates,
  dateError,
  onDateSelect,
  onGenerateDates,
  openers,
  copiedIndex,
  isRefreshingOpeners,
  onCopy,
  onRefreshOpeners,
}: OverviewTabProps) {
  // Suppress unused variable warnings for legacy handlers (called via onGenerateAllScores)
  void _onGenerateVirtues;
  void _onGenerateAspects;

  // Determine if any compatibility system can be generated
  const canGenerateAny = canGenerateVirtues11 || canGenerateVirtues || canGenerateAspects;
  const isLoadingAny = isLoadingVirtues11 || isLoadingVirtues || isLoadingAspects;

  return (
    <div className="space-y-8">
      {/* Warning if no user profile */}
      {!hasUserProfile && !hasCompatibility && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg flex items-start">
          <User className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-amber-600" />
          <div>
            <p className="text-sm">
              <Link to="/my-profile" className="font-bold underline hover:text-amber-900">
                Create your profile
              </Link>{' '}
              for personalized compatibility insights.
            </p>
          </div>
        </div>
      )}

      {/* Generate Compatibility Scores - when user has synthesis but profile doesn't have scores */}
      {hasUserProfile && canGenerateAny && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 p-5 rounded-xl">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-indigo-900">Generate Compatibility Scores</h3>
            </div>
          </div>
          <p className="text-sm text-indigo-700 mb-4">
            Analyze how {matchName} matches your 11 Virtues profile for deep compatibility insights.
          </p>

          {/* Error messages */}
          {virtues11Error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-700">{virtues11Error}</p>
            </div>
          )}
          {virtueError && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-700">{virtueError}</p>
            </div>
          )}
          {aspectError && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-700">{aspectError}</p>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            {/* Primary: Generate 11 Virtues */}
            {canGenerateVirtues11 && (
              <button
                onClick={onGenerateVirtues11}
                disabled={isLoadingVirtues11}
                className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoadingVirtues11 ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing 11 Virtues...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate 11 Virtues Compatibility
                  </>
                )}
              </button>
            )}

            {/* Legacy: Generate All (if multiple systems available) */}
            {!canGenerateVirtues11 && (canGenerateVirtues || canGenerateAspects) && (
              <button
                onClick={onGenerateAllScores}
                disabled={isLoadingAny}
                className="flex-1 bg-violet-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoadingAny ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Compatibility Scores
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Feedback when user needs to create profile or run synthesis */}
      {hasUserProfile && !canGenerateAny && !virtues11 && !virtueScores?.length && !aspectScores?.scores?.length && (
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 p-4 rounded-lg flex items-start">
          <User className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-indigo-600" />
          <div>
            <p className="text-sm font-medium mb-1">Compatibility scores not available</p>
            <p className="text-xs text-indigo-600">
              Run synthesis on your profile to enable 11 Virtues matching.{' '}
              <Link to="/my-profile" className="font-bold underline hover:text-indigo-900">
                Set up now
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Compatibility Card */}
      {compatibility && <CompatibilityCard compatibility={compatibility} />}

      {/* 11 Virtues Compatibility Card (PRIMARY) - show loading or results */}
      {isLoadingVirtues11 && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-5 rounded-xl border border-indigo-200 animate-pulse">
          <div className="flex items-center gap-2 mb-4">
            <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
            <span className="font-medium text-indigo-800">Analyzing 11 Virtues compatibility...</span>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="h-4 bg-indigo-200/50 rounded w-1/3 mb-2" />
                <div className="h-2.5 bg-indigo-200/50 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      )}
      {!isLoadingVirtues11 && virtues11 && userVirtueProfile && (
        <VirtueCompatibilityCard
          userScores={userVirtueProfile.scores}
          matchCompatibility={virtues11}
          matchName={matchName}
          defaultExpanded={true}
        />
      )}

      {/* Legacy Virtue Scores Card - show loading or results */}
      {isLoadingVirtues && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-xl border border-amber-200 animate-pulse">
          <div className="flex items-center gap-2 mb-4">
            <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
            <span className="font-medium text-amber-800">Scoring partner virtues...</span>
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i}>
                <div className="h-4 bg-amber-200/50 rounded w-1/3 mb-2" />
                <div className="h-2.5 bg-amber-200/50 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      )}
      {!isLoadingVirtues && virtueScores && virtueScores.length > 0 && !virtues11 && (
        <VirtueScoresCard virtueScores={virtueScores} />
      )}

      {/* Legacy 23 Aspects Compatibility Card - show loading or results */}
      {isLoadingAspects && (
        <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-5 rounded-xl border border-purple-200 animate-pulse">
          <div className="flex items-center gap-2 mb-4">
            <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
            <span className="font-medium text-purple-800">Analyzing 23 Aspects compatibility...</span>
          </div>
          <div className="space-y-3">
            <div className="h-20 bg-purple-200/50 rounded-lg" />
            <div className="h-16 bg-purple-200/50 rounded-lg" />
          </div>
        </div>
      )}
      {!isLoadingAspects && aspectScores && aspectScores.scores && aspectScores.scores.length > 0 && !virtues11 && (
        <AspectMatchCard aspectScores={aspectScores} matchName={matchName} />
      )}

      {/* Transactional Indicators (only shows for moderate/high) */}
      {transactionalIndicators && <TransactionalIndicatorsCard indicators={transactionalIndicators} />}

      {/* Zodiac Compatibility */}
      <ZodiacSection
        compatibility={zodiacCompatibility}
        isLoading={zodiacIsLoading}
        error={zodiacError}
        userZodiac={userZodiac}
        matchZodiac={matchZodiac}
        canGenerate={canGenerateZodiac}
        onGenerate={onGenerateZodiac}
      />

      {/* Date Ideas */}
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

      {/* Recommended Openers */}
      <OpenersSection
        openers={openers}
        copiedIndex={copiedIndex}
        isRefreshing={isRefreshingOpeners}
        onCopy={onCopy}
        onRefresh={onRefreshOpeners}
      />

      {/* Ask About Match */}
      <AskAboutMatch
        profileId={profileId}
        matchName={matchName}
        matchAnalysis={matchAnalysis}
        compatibility={compatibility}
      />
    </div>
  );
}
