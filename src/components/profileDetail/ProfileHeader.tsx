// src/components/profileDetail/ProfileHeader.tsx
import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, MapPin, Briefcase, GraduationCap, Sparkles } from 'lucide-react';
import type { Profile, ProfileBasics } from '../../lib/db';
import { useThumbnailUrl, type ThumbnailValue } from '../../lib/utils/thumbnailUtils';
import { ImageCarousel, type CarouselImage } from './ImageCarousel';

interface ProfileHeaderProps {
  profile: Profile;
  basics: ProfileBasics;
}

/**
 * Header section with profile image carousel, basic info, and virtue sentence.
 */
export function ProfileHeader({ profile, basics }: ProfileHeaderProps) {
  const thumbnailUrl = useThumbnailUrl(profile.thumbnail as ThumbnailValue);
  const [essenceUrl, setEssenceUrl] = useState<string | null>(null);
  const [currentImageType, setCurrentImageType] = useState<'thumbnail' | 'essence'>('thumbnail');

  // Create object URL for essence image blob
  useEffect(() => {
    if (profile.essenceImage instanceof Blob) {
      const url = URL.createObjectURL(profile.essenceImage);
      setEssenceUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setEssenceUrl(null);
  }, [profile.essenceImage]);

  // Build carousel images array
  const carouselImages = useMemo<CarouselImage[]>(() => {
    const images: CarouselImage[] = [];

    if (thumbnailUrl) {
      images.push({
        type: 'thumbnail',
        url: thumbnailUrl,
        label: 'Photo',
      });
    }

    if (essenceUrl) {
      images.push({
        type: 'essence',
        url: essenceUrl,
        label: 'Essence',
      });
    }

    return images;
  }, [thumbnailUrl, essenceUrl]);

  const hasEssence = !!essenceUrl;

  return (
    <>
      {/* Header Image */}
      <div className="relative h-64 bg-slate-900">
        {carouselImages.length > 0 ? (
          <div className="w-full h-full opacity-80">
            <ImageCarousel
              images={carouselImages}
              onImageChange={setCurrentImageType}
            />
          </div>
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

        {/* Essence Badge (shows when essence available and currently viewing thumbnail) */}
        {hasEssence && currentImageType === 'thumbnail' && (
          <div className="absolute top-6 right-6 bg-violet-500/90 text-white px-3 py-1 rounded-full text-xs flex items-center gap-1 z-10">
            <Sparkles size={12} />
            Essence Available
          </div>
        )}

        {/* Name + Virtue Sentence Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
          <h1 className="text-3xl font-bold">{basics.name || 'Unknown Name'}</h1>

          {/* Virtue Sentence (if available) */}
          {profile.virtueSentence ? (
            <p className="text-white/90 italic text-sm mt-1">{profile.virtueSentence}</p>
          ) : (
            <p className="opacity-90">
              {basics.age ? `${basics.age} • ` : ''}
              {basics.location || 'Location Unknown'}
            </p>
          )}

          {/* Age/Location on separate line if we have virtue sentence */}
          {profile.virtueSentence && (basics.age || basics.location) && (
            <p className="opacity-70 text-sm mt-1">
              {basics.age ? `${basics.age}` : ''}
              {basics.age && basics.location ? ' • ' : ''}
              {basics.location || ''}
            </p>
          )}
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
