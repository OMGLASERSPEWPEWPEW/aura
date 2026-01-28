// src/pages/Home.tsx
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { extractAnalysisFields } from '../lib/utils/profileHelpers';
import { User, Trash2, Zap, Star, PlusCircle } from 'lucide-react';
import Logo from '../components/ui/Logo';
import type { PartnerVirtueScore } from '../lib/db';
import UserMenu from '../components/auth/UserMenu';
import { SyncIndicator } from '../components/SyncIndicator';
import { deleteProfileFromServer } from '../lib/sync';
import { SyncError } from '../lib/errors';
import { useOnboarding } from '../hooks/useOnboarding';
import { TutorialOverlay } from '../components/onboarding';

export default function Home() {
  const profiles = useLiveQuery(() => db.profiles.orderBy('timestamp').reverse().toArray());

  // Treat undefined as empty array during initial IndexedDB load
  // This prevents blank page while query executes
  const profileList = profiles ?? [];

  // Onboarding state
  const {
    showOnboarding,
    currentStep,
    nextStep,
    skipOnboarding,
    completeOnboarding,
  } = useOnboarding();

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.preventDefault(); // Stop the link from opening
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this profile?")) {
      // Get the profile to check for serverId and thumbnailPath
      const profile = await db.profiles.get(id);

      // Delete from server first (if synced)
      if (profile?.serverId) {
        try {
          await deleteProfileFromServer(profile.serverId, profile.thumbnailPath);
        } catch (error) {
          // Non-critical: continue with local delete even if server fails
          const syncError = new SyncError(
            `Server delete failed: ${error instanceof Error ? error.message : String(error)}`,
            { operation: 'delete', cause: error instanceof Error ? error : undefined }
          );
          console.log('Home:', syncError.code, syncError.message);
        }
      }

      // Delete locally
      await db.profiles.delete(id);
    }
  };

  // Helper to get color based on app name
  const getAppBadge = (appName?: string) => {
    const app = (appName || "").toLowerCase();
    if (app.includes('tinder')) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-800">Tinder</span>;
    if (app.includes('bumble')) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800">Bumble</span>;
    if (app.includes('hinge')) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800">Hinge</span>;
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">Profile</span>;
  };

  // Helper to get analysis phase badge
  const getAnalysisPhaseBadge = (analysisPhase?: string) => {
    if (analysisPhase === 'quick') {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
          <Zap size={10} /> Quick
        </span>
      );
    }
    return null;
  };

  // Helper to get virtue score badge
  const getVirtueScoreBadge = (virtueScores?: PartnerVirtueScore[]) => {
    if (!virtueScores || virtueScores.length === 0) return null;
    const avg = Math.round(virtueScores.reduce((sum, v) => sum + v.score, 0) / virtueScores.length);
    const colorClass = avg >= 7
      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
      : avg >= 5
        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600';
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${colorClass}`}>
        <Star size={10} /> {avg}/10
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 pb-20">
      {/* Header */}
      <div className="max-w-md mx-auto mb-8">
        {/* Top row: Logo and user menu */}
        <div className="flex justify-between items-center">
          <Logo size="xl" showText={false} />
          {/* User Menu */}
          <UserMenu />
        </div>

        {/* Taglines - moved down with more spacing */}
        <div className="flex flex-col mt-4">
          <p className="text-slate-500 dark:text-slate-400 text-sm">Decode Emotions. Navigate Life.</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm">They made love a game. Let's even the odds.</p>
        </div>

        {/* Sync Status - below account button area */}
        <div className="mt-3">
          <SyncIndicator variant="badge" />
        </div>
      </div>

      <div className="max-w-md mx-auto">
        {/* Empty State */}
        {profileList.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-white dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100 dark:border-slate-700">
                <PlusCircle className="text-slate-400" size={32} />
            </div>
            <h3 className="text-slate-900 dark:text-slate-50 font-medium mb-2">No matches yet</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Upload your first screen recording to start.</p>
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-colors"
            >
              <PlusCircle size={20} />
              Analyze a Profile
            </Link>
          </div>
        )}

        {/* Grid of Profiles */}
        <div className="grid grid-cols-1 gap-4" data-tutorial="match-gallery">
          {profileList.map((profile) => (
            <Link
              key={profile.id}
              to={`/profile/${profile.id}`}
              className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-start space-x-4 hover:shadow-md transition-all active:scale-[0.98]"
            >
              {/* Thumbnail */}
              <div className="w-20 h-24 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden flex-shrink-0 relative">
                {profile.thumbnail ? (
                  <img src={profile.thumbnail as string} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-500">
                    <User />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                        <div className="flex items-center space-x-2 mb-1 flex-wrap gap-1">
                             <h3 className="font-bold text-slate-900 dark:text-slate-50 truncate text-lg leading-tight">{profile.name}</h3>
                             {getAppBadge(profile.appName)}
                             {getAnalysisPhaseBadge(profile.analysisPhase)}
                             {getVirtueScoreBadge(profile.virtue_scores)}
                        </div>
                        <span className="text-xs text-slate-400">{new Date(profile.timestamp).toLocaleDateString()}</span>
                    </div>

                    {/* Delete Button */}
                    <button
                        onClick={(e) => handleDelete(e, profile.id)}
                        className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors -mt-2 -mr-2"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>

                {(() => {
                  const { basics, overall } = extractAnalysisFields(profile.analysis);
                  return (
                    <>
                      {/* Virtue Sentence (if available) */}
                      {profile.virtueSentence && (
                        <p className="text-sm text-slate-600 dark:text-slate-300 italic mb-1 line-clamp-1">
                          {profile.virtueSentence}
                        </p>
                      )}
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 truncate">
                        {profile.age ? `${profile.age} • ` : ''}
                        {basics.location || 'Unknown Location'}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 bg-slate-50 dark:bg-slate-700 p-2 rounded border border-slate-100 dark:border-slate-600">
                        "{overall.summary}"
                      </p>
                    </>
                  );
                })()}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Onboarding Tutorial */}
      {showOnboarding && (
        <TutorialOverlay
          currentStep={currentStep}
          onNext={nextStep}
          onSkip={skipOnboarding}
          onComplete={completeOnboarding}
        />
      )}
    </div>
  );
}
