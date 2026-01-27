// src/components/profileDetail/ProfileHeader.tsx
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, MapPin, Briefcase, GraduationCap } from 'lucide-react';
import type { Profile, ProfileBasics } from '../../lib/db';

interface ProfileHeaderProps {
  profile: Profile;
  basics: ProfileBasics;
}

/**
 * Header section with profile image and basic info.
 */
export function ProfileHeader({ profile, basics }: ProfileHeaderProps) {
  return (
    <>
      {/* Header Image */}
      <div className="relative h-64 bg-slate-900">
        {profile.thumbnail ? (
          <img src={profile.thumbnail as string} className="w-full h-full object-cover opacity-80" alt="Cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500">
            <div className="text-center">
              <AlertTriangle className="mx-auto mb-2" />
              <p>No Image Saved</p>
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
