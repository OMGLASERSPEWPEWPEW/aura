// src/pages/MyProfile.tsx
// Main page for user profile creation and analysis
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ArrowLeft,
  Target,
  FileJson,
  FileText,
  Video,
  Camera,
  User,
  Sparkles,
  Loader2,
  AlertCircle,
  Check
} from 'lucide-react';

import { db, type UserIdentity, type DatingGoals, type DataExport, type TextInput, type VideoAnalysis, type PhotoEntry, type ManualEntry, type UserSynthesis } from '../lib/db';
import { analyzeUserSelf } from '../lib/ai';

// Tab components
import GoalsTab from '../components/profile/GoalsTab';
import DataExportTab from '../components/profile/DataExportTab';
import TextInputTab from '../components/profile/TextInputTab';
import VideoTab from '../components/profile/VideoTab';
import PhotosTab from '../components/profile/PhotosTab';
import ManualEntryTab from '../components/profile/ManualEntryTab';
import UserProfileDisplay from '../components/UserProfileDisplay';

type TabType = 'goals' | 'data' | 'text' | 'video' | 'photos' | 'manual';

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ElementType;
  hasContent: (identity: UserIdentity | undefined) => boolean;
}

const TABS: TabConfig[] = [
  {
    id: 'goals',
    label: 'Goals',
    icon: Target,
    hasContent: (i) => !!i?.datingGoals?.type
  },
  {
    id: 'data',
    label: 'Data',
    icon: FileJson,
    hasContent: (i) => (i?.dataExports?.length ?? 0) > 0
  },
  {
    id: 'text',
    label: 'Text',
    icon: FileText,
    hasContent: (i) => (i?.textInputs?.length ?? 0) > 0
  },
  {
    id: 'video',
    label: 'Video',
    icon: Video,
    hasContent: (i) => (i?.videoAnalysis?.frames?.length ?? 0) > 0
  },
  {
    id: 'photos',
    label: 'Photos',
    icon: Camera,
    hasContent: (i) => (i?.photos?.length ?? 0) > 0
  },
  {
    id: 'manual',
    label: 'Info',
    icon: User,
    hasContent: (i) => {
      const m = i?.manualEntry;
      return !!(m?.name || m?.age || m?.occupation || m?.location || m?.attachmentStyle);
    }
  }
];

export default function MyProfile() {
  const [activeTab, setActiveTab] = useState<TabType>('goals');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Live query for user identity
  const userIdentity = useLiveQuery(() => db.userIdentity.get(1));

  // Local state for unsaved changes (tracks current edits)
  const [localGoals, setLocalGoals] = useState<DatingGoals | undefined>();
  const [localExports, setLocalExports] = useState<DataExport[]>([]);
  const [localTextInputs, setLocalTextInputs] = useState<TextInput[]>([]);
  const [localVideoAnalysis, setLocalVideoAnalysis] = useState<VideoAnalysis | undefined>();
  const [localPhotos, setLocalPhotos] = useState<PhotoEntry[]>([]);
  const [localManualEntry, setLocalManualEntry] = useState<ManualEntry>({});

  // Initialize local state from DB
  useEffect(() => {
    if (userIdentity) {
      setLocalGoals(userIdentity.datingGoals);
      setLocalExports(userIdentity.dataExports || []);
      setLocalTextInputs(userIdentity.textInputs || []);
      setLocalVideoAnalysis(userIdentity.videoAnalysis);
      setLocalPhotos(userIdentity.photos || []);
      setLocalManualEntry(userIdentity.manualEntry || {});
    }
  }, [userIdentity]);

  // Save to DB whenever local state changes (debounced effect)
  const saveToDb = useCallback(async () => {
    const identity: UserIdentity = {
      id: 1,
      datingGoals: localGoals,
      dataExports: localExports,
      textInputs: localTextInputs,
      videoAnalysis: localVideoAnalysis,
      photos: localPhotos,
      manualEntry: localManualEntry,
      synthesis: userIdentity?.synthesis,
      // Preserve legacy fields
      source: userIdentity?.source,
      rawStats: userIdentity?.rawStats,
      analysis: userIdentity?.analysis,
      selfProfile: userIdentity?.selfProfile,
      lastUpdated: new Date()
    };

    await db.userIdentity.put(identity);
  }, [localGoals, localExports, localTextInputs, localVideoAnalysis, localPhotos, localManualEntry, userIdentity]);

  // Auto-save on changes (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      saveToDb();
    }, 500);
    return () => clearTimeout(timer);
  }, [saveToDb]);

  // Calculate which inputs have content
  const hasAnyInput = () => {
    return (
      localGoals?.type ||
      localExports.length > 0 ||
      localTextInputs.length > 0 ||
      (localVideoAnalysis?.frames?.length ?? 0) > 0 ||
      localPhotos.length > 0 ||
      localManualEntry.name ||
      localManualEntry.age
    );
  };

  // Run synthesis
  const runSynthesis = async () => {
    if (!hasAnyInput()) {
      setAnalysisError("Please add some information first (photos, text, goals, etc.)");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      console.log("MyProfile: Starting synthesis...");

      // Prepare input for AI
      const textContent = localTextInputs.map(t => `[${t.label}]\n${t.content}`).join('\n\n');

      const result = await analyzeUserSelf({
        frames: localVideoAnalysis?.frames,
        photos: localPhotos.map(p => p.base64),
        textContext: textContent || undefined,
        dataExports: localExports.length > 0 ? localExports : undefined,
        datingGoals: localGoals,
        manualInfo: Object.keys(localManualEntry).length > 0 ? localManualEntry : undefined
      });

      console.log("MyProfile: Synthesis complete:", result);

      // Build synthesis object
      const inputsUsed: string[] = [];
      if (localGoals?.type) inputsUsed.push('goals');
      if (localExports.length > 0) inputsUsed.push('behavior_data');
      if (localTextInputs.length > 0) inputsUsed.push('text');
      if ((localVideoAnalysis?.frames?.length ?? 0) > 0) inputsUsed.push('video');
      if (localPhotos.length > 0) inputsUsed.push('photos');
      if (localManualEntry.name || localManualEntry.age) inputsUsed.push('profile_info');

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
          subtext_analysis: {},
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
        }
      };

      // Auto-populate manual entry from synthesis basics if fields are empty
      if (result.basics) {
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

    } catch (error) {
      console.error("MyProfile: Synthesis error:", error);
      setAnalysisError(error instanceof Error ? error.message : "Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'goals':
        return <GoalsTab goals={localGoals} onGoalsChange={setLocalGoals} />;
      case 'data':
        return <DataExportTab exports={localExports} onExportsChange={setLocalExports} />;
      case 'text':
        return <TextInputTab textInputs={localTextInputs} onTextInputsChange={setLocalTextInputs} />;
      case 'video':
        return <VideoTab videoAnalysis={localVideoAnalysis} onVideoAnalysisChange={setLocalVideoAnalysis} />;
      case 'photos':
        return <PhotosTab photos={localPhotos} onPhotosChange={setLocalPhotos} />;
      case 'manual':
        return <ManualEntryTab manualEntry={localManualEntry} onManualEntryChange={setLocalManualEntry} />;
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
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-[72px] z-10 overflow-x-auto">
        <div className="flex max-w-2xl mx-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const hasContent = tab.hasContent(userIdentity);
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[60px] py-3 px-2 flex flex-col items-center gap-1 border-b-2 transition-all ${
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

        {/* Synthesis Section */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="text-indigo-600" size={20} />
              <h3 className="font-semibold text-slate-800">AI Synthesis</h3>
            </div>
            {userIdentity?.synthesis && (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <Check size={14} /> Analysis available
              </span>
            )}
          </div>

          <p className="text-sm text-slate-600 mb-4">
            {hasAnyInput()
              ? "Ready to synthesize your profile. The AI will analyze all your inputs to create a comprehensive psychological profile and dating strategy."
              : "Add some information in the tabs above, then run synthesis to get your personalized analysis."}
          </p>

          {analysisError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-start text-sm">
              <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              {analysisError}
            </div>
          )}

          <button
            onClick={runSynthesis}
            disabled={isAnalyzing || !hasAnyInput()}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="animate-spin mr-2" size={20} />
                Synthesizing Profile...
              </>
            ) : userIdentity?.synthesis ? (
              "Re-run Synthesis"
            ) : (
              "Run Synthesis"
            )}
          </button>
        </div>

        {/* Synthesis Results */}
        {userIdentity?.synthesis && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <UserProfileDisplay
              synthesis={userIdentity.synthesis}
              onRerunSynthesis={runSynthesis}
            />
          </div>
        )}
      </div>
    </div>
  );
}
