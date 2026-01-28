// src/pages/ProfileDetail.tsx
import { useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useState, useEffect, useCallback } from 'react';

import { db } from '../lib/db';
import type { UserIdentity, ProfileAnalysis } from '../lib/db';
import { extractAnalysisFields } from '../lib/utils/profileHelpers';
import { hasUserProfile as checkHasUserProfile } from '../lib/utils/userContext';
import { generateAndSaveEssenceImage } from '../lib/essence';
import { generateAndSaveSoraVideo } from '../lib/sora';

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
import { ContextualGenerateButton, type CarouselPosition } from '../components/profileDetail/ContextualGenerateButton';
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

  // Carousel position tracking for contextual button
  const [carouselPosition, setCarouselPosition] = useState<CarouselPosition>('moodboard');

  // Manual essence image generation (user-triggered for cost control ~$0.04)
  // Virtue sentence is generated automatically (free), but DALL-E image requires user action
  const [isGeneratingEssence, setIsGeneratingEssence] = useState(false);

  const handleGenerateEssence = useCallback(async () => {
    if (!profile?.id) return;

    setIsGeneratingEssence(true);
    try {
      // Ensure virtues_11 is saved to profile first (needed for image generation)
      if (compatibilityScores.virtues11) {
        await db.profiles.update(profile.id, {
          virtues_11: compatibilityScores.virtues11,
        });
      }

      const result = await generateAndSaveEssenceImage(profile.id);
      if (result.success) {
        console.log('[ProfileDetail] Essence image generated successfully');
      } else {
        console.error('[ProfileDetail] Essence generation failed:', result.error);
        alert(`Failed to generate essence: ${result.error}`);
      }
    } catch (err) {
      console.error('[ProfileDetail] Essence generation error:', err);
      alert('Failed to generate essence image. Please try again.');
    } finally {
      setIsGeneratingEssence(false);
    }
  }, [profile?.id, compatibilityScores.virtues11]);

  // Manual Sora video generation (user-triggered for cost control ~$0.30)
  const [isGeneratingSora, setIsGeneratingSora] = useState(false);

  const handleGenerateSora = useCallback(async () => {
    if (!profile?.id) return;

    setIsGeneratingSora(true);
    try {
      // Ensure virtues_11 is saved to profile first (needed for video generation)
      if (compatibilityScores.virtues11) {
        await db.profiles.update(profile.id, {
          virtues_11: compatibilityScores.virtues11,
        });
      }

      const result = await generateAndSaveSoraVideo(profile.id);
      if (result.success) {
        console.log('[ProfileDetail] Sora video generated successfully');
      } else {
        console.error('[ProfileDetail] Sora generation failed:', result.error);
        alert(`Failed to generate motion: ${result.error}`);
      }
    } catch (err) {
      console.error('[ProfileDetail] Sora generation error:', err);
      alert('Failed to generate motion video. Please try again.');
    } finally {
      setIsGeneratingSora(false);
    }
  }, [profile?.id, compatibilityScores.virtues11]);

  // Loading state
  if (!profile) {
    return (
      <div className="p-8 text-center text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 min-h-screen">
        Loading Profile...
      </div>
    );
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
  const hasVirtues = !!(profile.virtues_11?.scores && profile.virtues_11.scores.length > 0);

  return (
    <div className="pb-20 bg-white dark:bg-slate-900 min-h-screen">
      <ProfileHeader
        profile={profile}
        basics={basics}
        isGeneratingEssence={isGeneratingEssence}
        isGeneratingSora={isGeneratingSora}
        onCarouselPositionChange={setCarouselPosition}
      />

      {/* Contextual Generate Button - appears below carousel based on position */}
      <ContextualGenerateButton
        carouselPosition={carouselPosition}
        hasVirtues={hasVirtues}
        isGeneratingEssence={isGeneratingEssence}
        isGeneratingSora={isGeneratingSora}
        onGenerateEssence={handleGenerateEssence}
        onGenerateSora={handleGenerateSora}
      />

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
            overallSummary={overall.summary}
            compatibility={profile.compatibility}
            // 11 Virtues system
            virtues11={compatibilityScores.virtues11}
            userVirtueProfile={compatibilityScores.userVirtueProfile}
            isLoadingVirtues11={compatibilityScores.isLoadingVirtues11}
            virtues11Error={compatibilityScores.virtues11Error}
            onGenerateVirtues11={compatibilityScores.generateVirtues11}
            transactionalIndicators={transactionalIndicators}
            zodiacCompatibility={zodiac.compatibility}
            zodiacIsLoading={zodiac.isLoading}
            zodiacError={zodiac.error?.message ?? null}
            userZodiac={zodiac.userZodiac}
            matchZodiac={zodiac.matchZodiac}
            canGenerateZodiac={zodiac.canGenerate}
            onGenerateZodiac={zodiac.generate}
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
            dateSuggestions={dateIdeas.suggestions}
            dateTarget={dateIdeas.targetDate}
            weatherForecast={dateIdeas.weatherForecast}
            localEvents={dateIdeas.localEvents}
            isLoadingWeather={dateIdeas.isLoadingWeather}
            isLoadingDates={dateIdeas.isLoadingDates}
            dateError={dateIdeas.error?.message ?? null}
            onDateSelect={dateIdeas.handleDateSelect}
            onGenerateDates={dateIdeas.generate}
          />
        )}
      </div>
    </div>
  );
}
