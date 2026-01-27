// src/components/profileDetail/ProfileHeader.tsx
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, MapPin, Briefcase, GraduationCap, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Profile, ProfileBasics } from '../../lib/db';

interface ProfileHeaderProps {
  profile: Profile;
  basics: ProfileBasics;
  isGeneratingEssence?: boolean;
}

/**
 * Header section with profile image and basic info.
 * Shows essence image (AI-generated) when available, with thumbnail fallback.
 */
export function ProfileHeader({ profile, basics, isGeneratingEssence = false }: ProfileHeaderProps) {
  // Convert essenceImage Blob to Object URL for display
  const [essenceImageUrl, setEssenceImageUrl] = useState<string | null>(null);
  const [showEssence, setShowEssence] = useState(true);

  useEffect(() => {
    if (profile.essenceImage instanceof Blob) {
      const url = URL.createObjectURL(profile.essenceImage);
      setEssenceImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setEssenceImageUrl(null);
    }
  }, [profile.essenceImage]);

  // Determine which image to show
  const hasEssence = !!essenceImageUrl;
  const hasThumbnail = !!profile.thumbnail;
  const displayEssence = showEssence && hasEssence;

  return (
    <>
      {/* Header Image */}
      <div className="relative h-64 bg-slate-900">
        {displayEssence ? (
          <img src={essenceImageUrl} className="w-full h-full object-cover" alt="Essence" />
        ) : hasThumbnail ? (
          <img src={profile.thumbnail as string} className="w-full h-full object-cover opacity-80" alt="Cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500">
            <div className="text-center">
              <AlertTriangle className="mx-auto mb-2" />
              <p>No Image Saved</p>
            </div>
          </div>
        )}

        {/* Toggle between essence and thumbnail if both exist */}
        {hasEssence && hasThumbnail && (
          <button
            onClick={() => setShowEssence(!showEssence)}
            className="absolute top-6 right-6 px-3 py-1.5 bg-white/90 rounded-full flex items-center gap-1.5 text-sm font-medium text-slate-700 shadow-md z-10"
          >
            <Sparkles size={14} className={showEssence ? 'text-purple-500' : 'text-slate-400'} />
            {showEssence ? 'Essence' : 'Photo'}
          </button>
        )}

        {/* Loading indicator when generating essence */}
        {isGeneratingEssence && !hasEssence && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 z-10">
            <div className="text-center text-white">
              <Sparkles className="mx-auto mb-2 animate-pulse" size={32} />
              <p className="text-sm font-medium">Generating Essence...</p>
            </div>
          </div>
        )}

        {/* Back Button */}
        <Link
          to="/"
          className="absolute top-6 left-6 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center text-slate-900 shadow-md z-10"
        >
          <ArrowLeft size={20} />
        </Link>

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
          <h1 className="text-3xl font-bold">{basics.name || 'Unknown Name'}</h1>
          <p className="opacity-90">
            {basics.age ? `${basics.age} • ` : ''}
            {basics.location || 'Location Unknown'}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="flex flex-wrap gap-3 text-sm text-slate-600">
        {basics.job && (
          <div className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full">
            <Briefcase size={14} /> {basics.job}
          </div>
        )}
        {basics.school && (
          <div className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full">
            <GraduationCap size={14} /> {basics.school}
          </div>
        )}
        {basics.hometown && (
          <div className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full">
            <MapPin size={14} /> {basics.hometown}
          </div>
        )}
      </div>
    </>
  );
}
