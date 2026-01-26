// src/components/profileDetail/OverviewTab.tsx
import { Link } from 'react-router-dom';
import { User, Loader2, Sparkles, FileText } from 'lucide-react';

import type {
  ProfileCompatibility,
  ZodiacCompatibility,
  RecommendedOpener,
  ProfileAnalysis,
  TransactionalIndicators,
  MatchVirtueCompatibility,
  UserVirtueProfile,
} from '../../lib/db';
import { CompatibilityCard } from './CompatibilityCard';
import { TransactionalIndicatorsCard } from './TransactionalIndicatorsCard';
import { AskAboutMatch } from './AskAboutMatch';
import { ZodiacSection } from './ZodiacSection';
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

  // Match summary (brief read on the match)
  overallSummary?: string;

  // Compatibility
  compatibility?: ProfileCompatibility;

  // 11 Virtues system
  virtues11?: MatchVirtueCompatibility;
  userVirtueProfile?: UserVirtueProfile;
  isLoadingVirtues11: boolean;
  virtues11Error: string | null;
  onGenerateVirtues11: () => void;

  transactionalIndicators?: TransactionalIndicators;

  // Zodiac
  zodiacCompatibility: ZodiacCompatibility | null;
  zodiacIsLoading: boolean;
  zodiacError: string | null;
  userZodiac: string | undefined;
  matchZodiac: string | undefined;
  canGenerateZodiac: boolean;
  onGenerateZodiac: () => void;

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
  overallSummary,
  compatibility,
  // 11 Virtues system
  virtues11,
  userVirtueProfile,
  isLoadingVirtues11,
  virtues11Error,
  onGenerateVirtues11,
  transactionalIndicators,
  zodiacCompatibility,
  zodiacIsLoading,
  zodiacError,
  userZodiac,
  matchZodiac,
  canGenerateZodiac,
  onGenerateZodiac,
  openers,
  copiedIndex,
  isRefreshingOpeners,
  onCopy,
  onRefreshOpeners,
}: OverviewTabProps) {
  // Check if user profile has been updated since virtues were generated
  const userProfileUpdatedAt = userVirtueProfile?.lastUpdated;
  const canRerun = userProfileUpdatedAt && virtues11 && !isLoadingVirtues11;

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

      {/* Feedback when user needs to run synthesis */}
      {hasUserProfile && !virtues11 && !isLoadingVirtues11 && !userVirtueProfile && (
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

      {/* Match Summary - brief read on the match */}
      {overallSummary && (
        <section className="bg-slate-50 p-5 rounded-xl border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
            <FileText size={18} className="text-slate-600" />
            The Read on {matchName}
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            {overallSummary}
          </p>
        </section>
      )}

      {/* 11 Virtues Compatibility Card - show loading or results */}
      {isLoadingVirtues11 && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-200">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-indigo-600 animate-pulse" />
              </div>
              <div className="absolute -bottom-1 -right-1">
                <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
              </div>
            </div>
            <h3 className="font-bold text-indigo-900 text-lg mb-1">Diving into Virtues...</h3>
            <p className="text-sm text-indigo-600 text-center max-w-xs">
              Analyzing compatibility across all 11 virtues
            </p>
          </div>
          <div className="space-y-3 mt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
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
          onRerun={canRerun ? onGenerateVirtues11 : undefined}
          error={virtues11Error}
        />
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
