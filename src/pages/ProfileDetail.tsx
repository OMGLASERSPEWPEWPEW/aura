// src/pages/ProfileDetail.tsx
import { useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useState, useEffect } from 'react';

import { db } from '../lib/db';
import type { UserIdentity, ProfileAnalysis } from '../lib/db';
import { extractAnalysisFields } from '../lib/utils/profileHelpers';
import { hasUserProfile as checkHasUserProfile } from '../lib/utils/userContext';

import {
  useCopyToClipboard,
  useZodiacCompatibility,
  useDateIdeas,
  useOpenerRefresh,
  useConversationCoach,
  useCompatibilityScores,
} from '../hooks';

import {
  ProfileHeader,
  TabNavigation,
  OverviewTab,
  AnalysisTab,
  CoachTab,
} from '../components/profileDetail';
import type { ProfileTab } from '../components/profileDetail';

export default function ProfileDetail() {
  const { id } = useParams();
  const profile = useLiveQuery(() => db.profiles.get(Number(id)), [id]);

  // Tab state
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');

  // User identity state
  const [userIdentity, setUserIdentity] = useState<UserIdentity | undefined>(undefined);

  // Custom hooks
  const { copiedIndex, handleCopy } = useCopyToClipboard();
  const zodiac = useZodiacCompatibility(profile, userIdentity);
  const dateIdeas = useDateIdeas(profile, userIdentity);
  const openers = useOpenerRefresh(profile, userIdentity);
  const coach = useConversationCoach(profile, userIdentity);
  const compatibilityScores = useCompatibilityScores(profile, userIdentity);

  // Fetch user identity on mount
  useEffect(() => {
    const loadUserIdentity = async () => {
      const identity = await db.userIdentity.get(1);
      setUserIdentity(identity);
    };
    loadUserIdentity();
  }, []);

  // Loading state
  if (!profile) {
    return <div className="p-8 text-center">Loading Profile...</div>;
  }

  // Extract analysis fields with safe fallbacks
  const { basics, photos, prompts, psych, subtext, openers: openersList, overall } = extractAnalysisFields(
    profile.analysis
  );

  // Extract transactional indicators if present
  const transactionalIndicators = 'transactional_indicators' in profile.analysis
    ? (profile.analysis as ProfileAnalysis).transactional_indicators
    : undefined;

  const hasUserProfileFlag = checkHasUserProfile(userIdentity);

  return (
    <div className="pb-24 bg-white min-h-screen">
      <ProfileHeader profile={profile} basics={basics} />

      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="p-6 max-w-lg mx-auto">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <OverviewTab
            hasUserProfile={hasUserProfileFlag}
            hasCompatibility={!!profile.compatibility}
            profileId={profile.id}
            matchName={basics.name || profile.name}
            matchAnalysis={profile.analysis as import('../lib/db').ProfileAnalysis}
            compatibility={profile.compatibility}
            // Legacy systems
            virtueScores={compatibilityScores.virtueScores}
            aspectScores={compatibilityScores.aspectScores}
            isLoadingVirtues={compatibilityScores.isLoadingVirtues}
            isLoadingAspects={compatibilityScores.isLoadingAspects}
            virtueError={compatibilityScores.virtueError}
            aspectError={compatibilityScores.aspectError}
            canGenerateVirtues={compatibilityScores.canGenerateVirtues}
            canGenerateAspects={compatibilityScores.canGenerateAspects}
            onGenerateVirtues={compatibilityScores.generateVirtues}
            onGenerateAspects={compatibilityScores.generateAspects}
            // 11 Virtues system (primary)
            virtues11={compatibilityScores.virtues11}
            userVirtueProfile={compatibilityScores.userVirtueProfile}
            isLoadingVirtues11={compatibilityScores.isLoadingVirtues11}
            virtues11Error={compatibilityScores.virtues11Error}
            canGenerateVirtues11={compatibilityScores.canGenerateVirtues11}
            onGenerateVirtues11={compatibilityScores.generateVirtues11}
            // Combined
            onGenerateAllScores={compatibilityScores.generateAll}
            transactionalIndicators={transactionalIndicators}
            zodiacCompatibility={zodiac.compatibility}
            zodiacIsLoading={zodiac.isLoading}
            zodiacError={zodiac.error?.message ?? null}
            userZodiac={zodiac.userZodiac}
            matchZodiac={zodiac.matchZodiac}
            canGenerateZodiac={zodiac.canGenerate}
            onGenerateZodiac={zodiac.generate}
            dateSuggestions={dateIdeas.suggestions}
            dateTarget={dateIdeas.targetDate}
            weatherForecast={dateIdeas.weatherForecast}
            localEvents={dateIdeas.localEvents}
            isLoadingWeather={dateIdeas.isLoadingWeather}
            isLoadingDates={dateIdeas.isLoadingDates}
            dateError={dateIdeas.error?.message ?? null}
            onDateSelect={dateIdeas.handleDateSelect}
            onGenerateDates={dateIdeas.generate}
            openers={openersList}
            copiedIndex={copiedIndex}
            isRefreshingOpeners={openers.isRefreshingOpeners}
            onCopy={handleCopy}
            onRefreshOpeners={openers.refreshAll}
          />
        )}

        {/* Analysis Tab */}
        {activeTab === 'analysis' && (
          <AnalysisTab
            profile={profile}
            basics={basics}
            photos={photos}
            prompts={prompts}
            psych={psych}
            subtext={subtext}
            overall={overall}
            copiedIndex={copiedIndex}
            refreshingPromptIndex={openers.refreshingPromptIndex}
            onCopy={handleCopy}
            onRefreshPrompt={openers.refreshPrompt}
          />
        )}

        {/* Coach Tab */}
        {activeTab === 'coach' && (
          <CoachTab
            coach={coach}
            matchName={basics.name || profile.name}
            copiedIndex={copiedIndex}
            onCopy={handleCopy}
          />
        )}
      </div>
    </div>
  );
}
