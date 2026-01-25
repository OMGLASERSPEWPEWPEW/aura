// src/pages/MyProfile.tsx
// Main page for user profile creation and analysis
// Redesigned 4-tab layout: Video | Text | Info | Insights
// Uses same streaming pattern as match Upload.tsx - auto-starts analysis on video upload
import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ArrowLeft,
  FileText,
  Video,
  User,
  Sparkles,
  Loader2,
} from 'lucide-react';

import { db, type UserIdentity, type DatingGoals, type TextInput, type VideoAnalysis, type PhotoEntry, type ManualEntry, type UserSynthesis } from '../lib/db';
import { analyzeUserSelf, extractPartnerVirtues, analyzeNeurodivergence, extractUserAspects } from '../lib/ai';
import { useUserStreamingAnalysis } from '../hooks/useUserStreamingAnalysis';
import { useAuth } from '../contexts/AuthContext';
import { saveUserIdentityWithSync } from '../lib/sync';

// Type for user self-analysis result
interface UserSelfAnalysisResult {
  basics?: {
    name?: string;
    age?: number;
    occupation?: string;
    location?: string;
  };
  photos?: Array<{
    description: string;
    vibe: string;
    subtext: string;
    attractiveness_notes?: string;
  }>;
  psychological_profile?: {
    agendas: Array<{
      type: string;
      evidence: string;
      priority: 'primary' | 'secondary';
    }>;
    presentation_tactics: string[];
    predicted_tactics: string[];
    subtext_analysis: {
      sexual_signaling: string;
      power_dynamics: string;
      vulnerability_indicators: string;
      disconnect: string;
    };
    archetype_summary: string;
  };
  dating_strategy?: {
    ideal_partner_profile: string;
    what_to_look_for: string[];
    what_to_avoid: string[];
    bio_suggestions: string[];
    opener_style_recommendations: string[];
  };
  behavioral_insights?: {
    communication_style: string;
    attachment_patterns: string;
    growth_areas: string[];
    strengths: string[];
  };
}

// Tab components
import TextInputTab from '../components/profile/TextInputTab';
import VideoTab from '../components/profile/VideoTab';
import InfoTab from '../components/profile/InfoTab';
import InsightsTab from '../components/profile/InsightsTab';

type TabType = 'video' | 'text' | 'info' | 'insights';

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ElementType;
  hasContent: (identity: UserIdentity | undefined) => boolean;
}

const TABS: TabConfig[] = [
  {
    id: 'video',
    label: 'Video',
    icon: Video,
    hasContent: (i) => (i?.videoAnalysis?.frames?.length ?? 0) > 0
  },
  {
    id: 'text',
    label: 'Text',
    icon: FileText,
    hasContent: (i) => (i?.textInputs?.length ?? 0) > 0
  },
  {
    id: 'info',
    label: 'Info',
    icon: User,
    hasContent: (i) => {
      const m = i?.manualEntry;
      const hasGoals = !!i?.datingGoals?.type;
      const hasInfo = !!(m?.name || m?.age || m?.occupation || m?.location);
      return hasGoals || hasInfo;
    }
  },
  {
    id: 'insights',
    label: 'Insights',
    icon: Sparkles,
    hasContent: (i) => !!i?.synthesis
  }
];

export default function MyProfile() {
  const [activeTab, setActiveTab] = useState<TabType>('video');
  const [isAnalyzingLegacy, setIsAnalyzingLegacy] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Get auth state for syncing
  const { user } = useAuth();

  // Live query for user identity
  const userIdentity = useLiveQuery(() => db.userIdentity.get(1));

  // Track if we've done the initial load from DB
  const isInitialized = useRef(false);

  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);

  // Store video file for streaming analysis
  const [videoFile, setVideoFile] = useState<File | null>(null);

  // Streaming analysis hook - lives at page level like Upload.tsx
  // Pass userId for server sync
  const {
    state: streamingState,
    startAnalysis,
    abort,
    reset: resetStreaming,
    isProcessing: isStreamingProcessing,
  } = useUserStreamingAnalysis({ userId: user?.id });

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Local state for unsaved changes (tracks current edits)
  const [localGoals, setLocalGoals] = useState<DatingGoals | undefined>();
  const [localTextInputs, setLocalTextInputs] = useState<TextInput[]>([]);
  const [localVideoAnalysis, setLocalVideoAnalysis] = useState<VideoAnalysis | undefined>();
  const [localPhotos, setLocalPhotos] = useState<PhotoEntry[]>([]);
  const [localManualEntry, setLocalManualEntry] = useState<ManualEntry>({});

  // Initialize local state from DB - only on first load
  useEffect(() => {
    if (userIdentity && !isInitialized.current) {
      console.log("MyProfile: Initializing from DB - videoFrames:", userIdentity.videoAnalysis?.frames?.length ?? 0);
      setLocalGoals(userIdentity.datingGoals);
      setLocalTextInputs(userIdentity.textInputs || []);
      setLocalVideoAnalysis(userIdentity.videoAnalysis);
      setLocalPhotos(userIdentity.photos || []);
      setLocalManualEntry(userIdentity.manualEntry || {});
      isInitialized.current = true;
    }
  }, [userIdentity]);

  // AUTO-START STREAMING ANALYSIS when video file is selected
  // This is the key change - matches the Upload.tsx pattern (lines 78-83)
  useEffect(() => {
    if (videoFile && streamingState.phase === 'idle') {
      console.log("MyProfile: Auto-starting streaming analysis...");
      setActiveTab('insights'); // Switch to insights tab to show progress
      startAnalysis(videoFile);
    }
  }, [videoFile, streamingState.phase, startAnalysis]);

  // Save to DB whenever local state changes (debounced effect)
  // Uses update() to only modify specified fields, preserving synthesis
  // Also syncs to server when user is logged in
  const saveToDb = useCallback(async () => {
    try {
      const fieldsToUpdate = {
        datingGoals: localGoals,
        textInputs: localTextInputs,
        videoAnalysis: localVideoAnalysis,
        photos: localPhotos,
        manualEntry: localManualEntry,
        lastUpdated: new Date()
      };

      console.log("MyProfile: Saving to DB - videoFrames:", localVideoAnalysis?.frames?.length ?? 0);

      // Use update() instead of put() to preserve synthesis and other fields
      const updated = await db.userIdentity.update(1, fieldsToUpdate);

      // If record doesn't exist yet (updated === 0), create it
      if (updated === 0) {
        await db.userIdentity.put({
          id: 1,
          ...fieldsToUpdate,
          dataExports: [],
          photos: localPhotos,
        });
      }

      console.log("MyProfile: Save successful");

      // Sync to server if user is logged in
      if (user?.id) {
        try {
          await saveUserIdentityWithSync(fieldsToUpdate, user.id);
          console.log("MyProfile: Synced to server");
        } catch (syncError) {
          console.error("MyProfile: Server sync failed:", syncError);
          // Don't throw - local save succeeded, sync can retry later
        }
      }
    } catch (error) {
      console.error("MyProfile: Failed to save to DB:", error);
    }
  }, [localGoals, localTextInputs, localVideoAnalysis, localPhotos, localManualEntry, user?.id]);

  // Auto-save on changes (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      saveToDb().catch(err => console.error("MyProfile: Auto-save error:", err));
    }, 500);
    return () => clearTimeout(timer);
  }, [saveToDb]);

  // Calculate which inputs have content
  const hasAnyInput = useCallback((): boolean => {
    return !!(
      localGoals?.type ||
      localTextInputs.length > 0 ||
      (localVideoAnalysis?.frames?.length ?? 0) > 0 ||
      localManualEntry.name ||
      localManualEntry.age
    );
  }, [localGoals, localTextInputs, localVideoAnalysis, localManualEntry]);

  // Run legacy synthesis (fallback when no video file)
  const runLegacySynthesis = async () => {
    if (!hasAnyInput()) {
      setAnalysisError("Please add some information first (video, text, or info)");
      return;
    }

    setIsAnalyzingLegacy(true);
    setAnalysisError(null);

    try {
      console.log("MyProfile: Starting legacy synthesis...");
      console.log("MyProfile: Input counts - frames:", localVideoAnalysis?.frames?.length ?? 0);

      // Prepare input for AI
      const textContent = localTextInputs.map(t => `[${t.label}]\n${t.content}`).join('\n\n');

      console.log("MyProfile: Sending frames to AI");

      const result = await analyzeUserSelf({
        frames: localVideoAnalysis?.frames,
        photos: [], // Photos tab removed - video only
        textContext: textContent || undefined,
        dataExports: undefined, // Data tab removed
        datingGoals: localGoals,
        manualInfo: Object.keys(localManualEntry).length > 0 ? localManualEntry : undefined
      }) as UserSelfAnalysisResult;

      if (!isMounted.current) return;
      console.log("MyProfile: Synthesis complete:", result);

      // Build synthesis object
      const inputsUsed: string[] = [];
      if (localGoals?.type) inputsUsed.push('goals');
      if (localTextInputs.length > 0) inputsUsed.push('text');
      if ((localVideoAnalysis?.frames?.length ?? 0) > 0) inputsUsed.push('video');
      if (localManualEntry.name || localManualEntry.age) inputsUsed.push('profile_info');

      // Extract partner virtues based on the psychological profile
      console.log("MyProfile: Extracting partner virtues...");
      let partnerVirtues = undefined;
      try {
        partnerVirtues = await extractPartnerVirtues({
          archetype_summary: result.psychological_profile?.archetype_summary,
          attachment_patterns: result.behavioral_insights?.attachment_patterns,
          communication_style: result.behavioral_insights?.communication_style,
          dating_goal: localGoals?.type,
          what_to_look_for: result.dating_strategy?.what_to_look_for,
          what_to_avoid: result.dating_strategy?.what_to_avoid,
          growth_areas: result.behavioral_insights?.growth_areas,
          strengths: result.behavioral_insights?.strengths
        });
        console.log("MyProfile: Extracted", partnerVirtues?.length || 0, "partner virtues");
      } catch (virtueError) {
        console.error("MyProfile: Failed to extract partner virtues:", virtueError);
      }

      if (!isMounted.current) return;

      // Analyze neurodivergence traits
      console.log("MyProfile: Analyzing neurodivergence traits...");
      let neurodivergence = undefined;
      const photoAnalysis = result.photos?.map((p, i) =>
        `Photo ${i + 1}: ${p.vibe} - ${p.subtext}`
      ).join('; ') || '';

      try {
        neurodivergence = await analyzeNeurodivergence({
          archetype_summary: result.psychological_profile?.archetype_summary,
          communication_style: result.behavioral_insights?.communication_style,
          attachment_patterns: result.behavioral_insights?.attachment_patterns,
          growth_areas: result.behavioral_insights?.growth_areas,
          strengths: result.behavioral_insights?.strengths,
          photo_analysis: photoAnalysis,
          dating_goal: localGoals?.type,
          behavioral_patterns: result.psychological_profile?.subtext_analysis?.disconnect
        });
        console.log("MyProfile: Neurodivergence analysis complete:", neurodivergence?.traits?.length || 0, "traits identified");
      } catch (ndError) {
        console.error("MyProfile: Failed to analyze neurodivergence:", ndError);
      }

      if (!isMounted.current) return;

      // Extract 23 Aspects profile
      console.log("MyProfile: Extracting 23 Aspects profile...");
      let aspectProfile = undefined;
      try {
        aspectProfile = await extractUserAspects({
          archetype_summary: result.psychological_profile?.archetype_summary,
          communication_style: result.behavioral_insights?.communication_style,
          attachment_patterns: result.behavioral_insights?.attachment_patterns,
          dating_goal: localGoals?.type,
          what_to_look_for: result.dating_strategy?.what_to_look_for,
          what_to_avoid: result.dating_strategy?.what_to_avoid,
          growth_areas: result.behavioral_insights?.growth_areas,
          strengths: result.behavioral_insights?.strengths,
          photo_analysis: photoAnalysis,
          behavioral_data: undefined
        });
        console.log("MyProfile: 23 Aspects profile extracted:", aspectProfile?.scores?.length || 0, "aspects scored");
      } catch (aspectError) {
        console.error("MyProfile: Failed to extract 23 Aspects profile:", aspectError);
      }

      if (!isMounted.current) return;

      const synthesis: UserSynthesis = {
        meta: {
          lastUpdated: new Date(),
          inputsUsed
        },
        basics: result.basics || {},
        photos: result.photos || [],
        psychological_profile: result.psychological_profile || {
          agendas: [],
          presentation_tactics: [],
          predicted_tactics: [],
          subtext_analysis: {
            sexual_signaling: '',
            power_dynamics: '',
            vulnerability_indicators: '',
            disconnect: '',
          },
          archetype_summary: ''
        },
        dating_strategy: result.dating_strategy || {
          ideal_partner_profile: '',
          what_to_look_for: [],
          what_to_avoid: [],
          bio_suggestions: [],
          opener_style_recommendations: []
        },
        behavioral_insights: result.behavioral_insights || {
          communication_style: '',
          attachment_patterns: '',
          growth_areas: [],
          strengths: []
        },
        partner_virtues: partnerVirtues,
        neurodivergence: neurodivergence,
        aspect_profile: aspectProfile
      };

      // Auto-populate manual entry from synthesis basics if fields are empty
      if (result.basics && isMounted.current) {
        const updatedManualEntry = { ...localManualEntry };
        let needsUpdate = false;

        if (!localManualEntry.name && result.basics.name) {
          updatedManualEntry.name = result.basics.name;
          needsUpdate = true;
        }
        if (!localManualEntry.age && result.basics.age) {
          updatedManualEntry.age = result.basics.age;
          needsUpdate = true;
        }
        if (!localManualEntry.occupation && result.basics.occupation) {
          updatedManualEntry.occupation = result.basics.occupation;
          needsUpdate = true;
        }
        if (!localManualEntry.location && result.basics.location) {
          updatedManualEntry.location = result.basics.location;
          needsUpdate = true;
        }

        if (needsUpdate) {
          setLocalManualEntry(updatedManualEntry);
        }
      }

      // Save synthesis to DB
      await db.userIdentity.update(1, { synthesis, lastUpdated: new Date() });

      // Sync to server if user is logged in
      if (user?.id) {
        try {
          await saveUserIdentityWithSync({ synthesis }, user.id);
          console.log("MyProfile: Synthesis synced to server");
        } catch (syncError) {
          console.error("MyProfile: Server sync failed:", syncError);
          // Don't throw - local save succeeded
        }
      }

      // Switch to Insights tab to show results
      if (isMounted.current) {
        setActiveTab('insights');
      }

    } catch (error) {
      console.error("MyProfile: Synthesis error:", error);
      if (isMounted.current) {
        setAnalysisError(error instanceof Error ? error.message : "Analysis failed. Please try again.");
      }
    } finally {
      if (isMounted.current) {
        setIsAnalyzingLegacy(false);
      }
    }
  };

  // Handle file selection from VideoTab
  const handleVideoFileSelect = (file: File | null) => {
    console.log("MyProfile: Video file selected:", file?.name);
    if (file) {
      resetStreaming(); // Reset streaming state before starting new analysis
    }
    setVideoFile(file);
  };

  // Determine if analysis is running (either streaming or legacy)
  const isAnalyzing = isStreamingProcessing || isAnalyzingLegacy;

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'video':
        return (
          <VideoTab
            videoAnalysis={localVideoAnalysis}
            onVideoAnalysisChange={setLocalVideoAnalysis}
            videoFile={videoFile}
            onVideoFileChange={handleVideoFileSelect}
            isAnalyzing={isAnalyzing}
          />
        );
      case 'text':
        return <TextInputTab textInputs={localTextInputs} onTextInputsChange={setLocalTextInputs} />;
      case 'info':
        return (
          <InfoTab
            manualEntry={localManualEntry}
            onManualEntryChange={setLocalManualEntry}
            goals={localGoals}
            onGoalsChange={setLocalGoals}
          />
        );
      case 'insights':
        return (
          <InsightsTab
            synthesis={userIdentity?.synthesis}
            streamingState={streamingState}
            isAnalyzingLegacy={isAnalyzingLegacy}
            analysisError={analysisError}
            hasAnyInput={hasAnyInput()}
            videoAnalysis={userIdentity?.videoAnalysis}
            onRunAnalysisLegacy={runLegacySynthesis}
            onClearError={() => setAnalysisError(null)}
            onAbort={abort}
            onReset={resetStreaming}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 sticky top-0 z-20">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft size={20} className="text-slate-600" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900">My Profile</h1>
              <p className="text-xs text-slate-500">Build your dating intelligence</p>
            </div>
          </div>

          {/* Quick analyze button in header - only show for legacy (non-video) analysis */}
          {activeTab !== 'insights' && hasAnyInput() && !videoFile && (
            <button
              onClick={runLegacySynthesis}
              disabled={isAnalyzing}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Analyze
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation - 4 tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-[72px] z-10">
        <div className="flex max-w-2xl mx-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const hasContent = tab.hasContent(userIdentity);
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 px-3 flex flex-col items-center gap-1 border-b-2 transition-all ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <div className="relative">
                  <Icon size={20} />
                  {hasContent && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Tab Content */}
        <div className="animate-in fade-in duration-200">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
