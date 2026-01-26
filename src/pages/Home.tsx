// src/pages/Home.tsx
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { extractAnalysisFields } from '../lib/utils/profileHelpers';
import { Plus, User, Trash2, Brain, Zap, Star } from 'lucide-react';
import Logo from '../components/ui/Logo';
import type { VirtueScore } from '../lib/db';
import UserMenu from '../components/auth/UserMenu';
import { SyncIndicator } from '../components/SyncIndicator';
import { deleteProfileFromServer } from '../lib/sync';

export default function Home() {
  const profiles = useLiveQuery(() => db.profiles.orderBy('timestamp').reverse().toArray());

  // Treat undefined as empty array during initial IndexedDB load
  // This prevents blank page while query executes
  const profileList = profiles ?? [];

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
          console.error('Failed to delete from server:', error);
          // Continue with local delete even if server fails
        }
      }

      // Delete locally
      await db.profiles.delete(id);
    }
  };

  // Helper to get color based on app name
  const getAppBadge = (appName?: string) => {
    const app = (appName || "").toLowerCase();
    if (app.includes('tinder')) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-600 border border-pink-200">Tinder</span>;
    if (app.includes('bumble')) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">Bumble</span>;
    if (app.includes('hinge')) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">Hinge</span>;
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">Profile</span>;
  };

  // Helper to get analysis phase badge
  const getAnalysisPhaseBadge = (analysisPhase?: string) => {
    if (analysisPhase === 'quick') {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1">
          <Zap size={10} /> Quick
        </span>
      );
    }
    return null;
  };

  // Helper to get virtue score badge
  const getVirtueScoreBadge = (virtueScores?: VirtueScore[]) => {
    if (!virtueScores || virtueScores.length === 0) return null;
    const avg = Math.round(virtueScores.reduce((sum, v) => sum + v.score, 0) / virtueScores.length);
    const colorClass = avg >= 7
      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
      : avg >= 5
        ? 'bg-amber-100 text-amber-700 border-amber-200'
        : 'bg-slate-100 text-slate-600 border-slate-200';
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${colorClass}`}>
        <Star size={10} /> {avg}/10
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-24">
      {/* Header */}
      <div className="max-w-md mx-auto mb-8">
        {/* Top row: Logo and buttons */}
        <div className="flex justify-between items-center">
          <Logo size="xl" showText={false} />
          <div className="flex items-center gap-3">
            {/* My Profile Button */}
            <Link
              to="/my-profile"
              className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors"
            >
              <Brain size={20} />
              <span className="text-sm font-medium hidden sm:inline">My Profile</span>
            </Link>
            {/* User Menu */}
            <UserMenu />
          </div>
        </div>

        {/* Tagline - moved down with more spacing */}
        <p className="text-slate-500 text-sm mt-4">Decode Emotions. Navigate Life.</p>

        {/* Sync Status - below account button area */}
        <div className="mt-3">
          <SyncIndicator variant="badge" />
        </div>
      </div>

      <div className="max-w-md mx-auto">
        {/* Empty State */}
        {profileList.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                <Plus className="text-slate-400" size={32} />
            </div>
            <h3 className="text-slate-900 font-medium mb-2">No matches yet</h3>
            <p className="text-slate-500 text-sm mb-6">Upload your first screen recording to start.</p>
          </div>
        )}

        {/* Grid of Profiles */}
        <div className="grid grid-cols-1 gap-4">
          {profileList.map((profile) => (
            <Link
              key={profile.id}
              to={`/profile/${profile.id}`}
              className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-start space-x-4 hover:shadow-md transition-all active:scale-[0.98]"
            >
              {/* Thumbnail */}
              <div className="w-20 h-24 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                {profile.thumbnail ? (
                  <img src={profile.thumbnail} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <User />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                        <div className="flex items-center space-x-2 mb-1 flex-wrap gap-1">
                             <h3 className="font-bold text-slate-900 truncate text-lg leading-tight">{profile.name}</h3>
                             {getAppBadge(profile.appName)}
                             {getAnalysisPhaseBadge(profile.analysisPhase)}
                             {getVirtueScoreBadge(profile.virtue_scores)}
                        </div>
                        <span className="text-xs text-slate-400">{new Date(profile.timestamp).toLocaleDateString()}</span>
                    </div>

                    {/* Delete Button */}
                    <button
                        onClick={(e) => handleDelete(e, profile.id)}
                        className="p-2 text-slate-300 hover:text-red-500 transition-colors -mt-2 -mr-2"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>

                {(() => {
                  const { basics, overall } = extractAnalysisFields(profile.analysis);
                  return (
                    <>
                      <p className="text-sm text-slate-500 mb-2 truncate">
                        {profile.age ? `${profile.age} • ` : ''}
                        {basics.location || 'Unknown Location'}
                      </p>
                      <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded border border-slate-100">
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

      {/* FAB */}
      <Link
        to="/upload"
        className="fixed bottom-8 right-8 w-14 h-14 bg-slate-900 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-slate-800 transition-colors z-50"
      >
        <Plus size={28} />
      </Link>
    </div>
  );
}
