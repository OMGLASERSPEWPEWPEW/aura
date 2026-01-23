// src/components/profileDetail/OverviewTab.tsx
import { Link } from 'react-router-dom';
import { User, Loader2, Sparkles, AlertCircle } from 'lucide-react';

import type { ProfileCompatibility, ZodiacCompatibility, RecommendedOpener, DateSuggestion, VirtueScore, ProfileAnalysis, TransactionalIndicators, MatchAspectScores } from '../../lib/db';
import type { WeatherForecast } from '../../lib/weather';
import { CompatibilityCard } from './CompatibilityCard';
import { VirtueScoresCard } from './VirtueScoresCard';
import { AspectMatchCard } from './AspectMatchCard';
import { TransactionalIndicatorsCard } from './TransactionalIndicatorsCard';
import { AskAboutMatch } from './AskAboutMatch';
import { ZodiacSection } from './ZodiacSection';
import { DateIdeasSection } from './DateIdeasSection';
import { OpenersSection } from './OpenersSection';

interface OverviewTabProps {
  // User profile check
  hasUserProfile: boolean;
  hasCompatibility: boolean;

  // Match info for Ask feature
  matchName: string;
  matchAnalysis: ProfileAnalysis;

  // Compatibility
  compatibility?: ProfileCompatibility;
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
  matchName,
  matchAnalysis,
  compatibility,
  virtueScores,
  aspectScores,
  isLoadingVirtues,
  isLoadingAspects,
  virtueError,
  aspectError,
  canGenerateVirtues,
  canGenerateAspects,
  onGenerateVirtues,
  onGenerateAspects,
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
      {hasUserProfile && (canGenerateVirtues || canGenerateAspects) && (
        <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 p-5 rounded-xl">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-600" />
              <h3 className="font-bold text-violet-900">Generate Compatibility Scores</h3>
            </div>
          </div>
          <p className="text-sm text-violet-700 mb-4">
            Analyze how {matchName} matches your ideal partner virtues and 23 Aspects profile.
          </p>

          {/* Error messages */}
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
            {canGenerateVirtues && canGenerateAspects && (
              <button
                onClick={onGenerateAllScores}
                disabled={isLoadingVirtues || isLoadingAspects}
                className="flex-1 bg-violet-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {(isLoadingVirtues || isLoadingAspects) ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate All Scores
                  </>
                )}
              </button>
            )}
            {canGenerateVirtues && !canGenerateAspects && (
              <button
                onClick={onGenerateVirtues}
                disabled={isLoadingVirtues}
                className="flex-1 bg-amber-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoadingVirtues ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Scoring virtues...
                  </>
                ) : (
                  'Generate Virtue Scores'
                )}
              </button>
            )}
            {canGenerateAspects && !canGenerateVirtues && (
              <button
                onClick={onGenerateAspects}
                disabled={isLoadingAspects}
                className="flex-1 bg-purple-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoadingAspects ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Scoring aspects...
                  </>
                ) : (
                  'Generate 23 Aspects Scores'
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Feedback when user needs to create profile or run synthesis */}
      {hasUserProfile && !canGenerateVirtues && !canGenerateAspects && !virtueScores?.length && !aspectScores?.scores?.length && (
        <div className="bg-violet-50 border border-violet-200 text-violet-800 p-4 rounded-lg flex items-start">
          <User className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-violet-600" />
          <div>
            <p className="text-sm font-medium mb-1">Virtue & Aspect scores not available</p>
            <p className="text-xs text-violet-600">
              Run synthesis on your profile to enable virtue and 23 Aspects matching.{' '}
              <Link to="/my-profile" className="font-bold underline hover:text-violet-900">
                Set up now
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Compatibility Card */}
      {compatibility && <CompatibilityCard compatibility={compatibility} />}

      {/* Virtue Scores Card - show loading or results */}
      {isLoadingVirtues && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-xl border border-amber-200 animate-pulse">
          <div className="flex items-center gap-2 mb-4">
            <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
            <span className="font-medium text-amber-800">Scoring virtues...</span>
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
      {!isLoadingVirtues && virtueScores && virtueScores.length > 0 && (
        <VirtueScoresCard virtueScores={virtueScores} />
      )}

      {/* 23 Aspects Compatibility Card - show loading or results */}
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
      {!isLoadingAspects && aspectScores && aspectScores.scores && aspectScores.scores.length > 0 && (
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
        matchName={matchName}
        matchAnalysis={matchAnalysis}
        compatibility={compatibility}
      />
    </div>
  );
}
