// src/pages/ProfileDetail.tsx
import { useParams, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useState, useEffect } from 'react';
import { User } from 'lucide-react';

import { db } from '../lib/db';
import type { UserIdentity } from '../lib/db';
import { extractAnalysisFields } from '../lib/utils/profileHelpers';
import { hasUserProfile as checkHasUserProfile } from '../lib/utils/userContext';

import { useCopyToClipboard, useZodiacCompatibility, useDateIdeas, useOpenerRefresh } from '../hooks';

import {
  ProfileHeader,
  CompatibilityCard,
  ZodiacSection,
  DateIdeasSection,
  OpenersSection,
  PhotoBreakdown,
  PsychologicalRead,
  AgendasSection,
  TacticsSection,
  SubtextAnalysis,
  PromptsSection,
  DebugSection,
  LegacySection,
} from '../components/profileDetail';

export default function ProfileDetail() {
  const { id } = useParams();
  const profile = useLiveQuery(() => db.profiles.get(Number(id)), [id]);

  // User identity state
  const [userIdentity, setUserIdentity] = useState<UserIdentity | undefined>(undefined);

  // Custom hooks
  const { copiedIndex, handleCopy } = useCopyToClipboard();
  const zodiac = useZodiacCompatibility(profile, userIdentity);
  const dateIdeas = useDateIdeas(profile, userIdentity);
  const openers = useOpenerRefresh(profile, userIdentity);

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

  const hasUserProfileFlag = checkHasUserProfile(userIdentity);

  return (
    <div className="pb-24 bg-white min-h-screen">
      <ProfileHeader profile={profile} basics={basics} />

      <div className="p-6 max-w-lg mx-auto space-y-8">
        {/* Warning if no user profile */}
        {!hasUserProfileFlag && !profile.compatibility && (
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

        {/* Compatibility Card */}
        {profile.compatibility && <CompatibilityCard compatibility={profile.compatibility} />}

        {/* Zodiac Compatibility */}
        <ZodiacSection
          compatibility={zodiac.compatibility}
          isLoading={zodiac.isLoading}
          error={zodiac.error}
          userZodiac={zodiac.userZodiac}
          matchZodiac={zodiac.matchZodiac}
          canGenerate={zodiac.canGenerate}
          onGenerate={zodiac.generate}
        />

        {/* Date Ideas */}
        <DateIdeasSection
          suggestions={dateIdeas.suggestions}
          targetDate={dateIdeas.targetDate}
          weatherForecast={dateIdeas.weatherForecast}
          localEvents={dateIdeas.localEvents}
          isLoadingWeather={dateIdeas.isLoadingWeather}
          isLoadingDates={dateIdeas.isLoadingDates}
          error={dateIdeas.error}
          onDateSelect={dateIdeas.handleDateSelect}
          onGenerate={dateIdeas.generate}
        />

        {/* Recommended Openers */}
        <OpenersSection
          openers={openersList}
          copiedIndex={copiedIndex}
          isRefreshing={openers.isRefreshingOpeners}
          onCopy={handleCopy}
          onRefresh={openers.refreshAll}
        />

        {/* Photo Breakdown */}
        <PhotoBreakdown photos={photos} />

        {/* Psychological Read */}
        <PsychologicalRead archetypeSummary={psych.archetype_summary || ''} />

        {/* Agendas */}
        <AgendasSection agendas={psych.agendas || []} />

        {/* Tactics */}
        <TacticsSection
          presentationTactics={psych.presentation_tactics}
          predictedTactics={psych.predicted_tactics}
        />

        {/* Deep Subtext */}
        <SubtextAnalysis subtext={subtext} />

        {/* Prompts */}
        <PromptsSection
          prompts={prompts}
          copiedIndex={copiedIndex}
          refreshingPromptIndex={openers.refreshingPromptIndex}
          onCopy={handleCopy}
          onRefreshPrompt={openers.refreshPrompt}
        />

        {/* Legacy Fallback */}
        <LegacySection overall={overall} hasArchetype={!!psych.archetype_summary} />

        {/* Debug Section */}
        <DebugSection profile={profile} basics={basics} />
      </div>
    </div>
  );
}
