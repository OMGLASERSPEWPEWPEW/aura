// src/components/profileDetail/OverviewTab.tsx
import { Link } from 'react-router-dom';
import { User } from 'lucide-react';

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

      {/* Feedback when user has profile but scores are missing */}
      {hasUserProfile && !virtueScores?.length && !aspectScores?.scores?.length && (
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

      {/* Virtue Scores Card */}
      {virtueScores && virtueScores.length > 0 && <VirtueScoresCard virtueScores={virtueScores} />}

      {/* 23 Aspects Compatibility Card */}
      {aspectScores && aspectScores.scores && aspectScores.scores.length > 0 && (
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
