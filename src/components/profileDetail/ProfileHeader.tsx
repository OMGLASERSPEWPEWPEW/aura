// src/components/profileDetail/ProfileHeader.tsx
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, MapPin, Briefcase, GraduationCap, Sparkles, Palette, Lock } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { Profile, ProfileBasics } from '../../lib/db';
import { useThumbnailUrl } from '../../lib/utils/thumbnailUtils';

interface ProfileHeaderProps {
  profile: Profile;
  basics: ProfileBasics;
  isGeneratingEssence?: boolean;
  isGeneratingMoodboard?: boolean;
  onGenerateEssence?: () => void;
}

/**
 * Header section with swipeable image carousel and basic info.
 * Shows mood board, essence image (or locked placeholder), and thumbnail photo.
 * Order: Mood Board (lifestyle) → Essence (abstract) → Photo (original)
 */
export function ProfileHeader({ profile, basics, isGeneratingEssence = false, isGeneratingMoodboard = false, onGenerateEssence }: ProfileHeaderProps) {
  // Convert Blob images to Object URLs for display
  const [essenceImageUrl, setEssenceImageUrl] = useState<string | null>(null);
  const [moodboardImageUrl, setMoodboardImageUrl] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Touch handling for swipe
  const touchStartX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cache URLs in refs to prevent loss on re-render
  const essenceUrlRef = useRef<string | null>(null);
  const moodboardUrlRef = useRef<string | null>(null);

  // Handle essence image URL with defensive caching
  useEffect(() => {
    // Only create new URL if we have a valid Blob
    if (profile.essenceImage && profile.essenceImage instanceof Blob) {
      // Revoke old URL if exists
      if (essenceUrlRef.current) {
        URL.revokeObjectURL(essenceUrlRef.current);
      }
      const url = URL.createObjectURL(profile.essenceImage);
      essenceUrlRef.current = url;
      setEssenceImageUrl(url);
    }
    // Note: We intentionally do NOT clear the URL if blob is missing
    // This prevents flicker when profile object reference changes
  }, [profile.essenceImage]);

  // Handle moodboard image URL with defensive caching
  useEffect(() => {
    // Only create new URL if we have a valid Blob
    if (profile.moodboardImage && profile.moodboardImage instanceof Blob) {
      // Revoke old URL if exists
      if (moodboardUrlRef.current) {
        URL.revokeObjectURL(moodboardUrlRef.current);
      }
      const url = URL.createObjectURL(profile.moodboardImage);
      moodboardUrlRef.current = url;
      setMoodboardImageUrl(url);
    }
    // Note: We intentionally do NOT clear the URL if blob is missing
    // This prevents flicker when profile object reference changes
  }, [profile.moodboardImage]);

  // Cleanup URLs on unmount only (not on re-render)
  useEffect(() => {
    return () => {
      if (essenceUrlRef.current) {
        URL.revokeObjectURL(essenceUrlRef.current);
      }
      if (moodboardUrlRef.current) {
        URL.revokeObjectURL(moodboardUrlRef.current);
      }
    };
  }, []);

  // Handle thumbnail (can be string or Blob)
  const thumbnailUrl = useThumbnailUrl(profile.thumbnail);

  // Build images array: [moodboard (if available), essence or locked placeholder, thumbnail]
  // Order: Mood Board → Essence → Photo (concrete first)
  type CarouselImage = {
    src?: string;
    label: string;
    type: 'moodboard' | 'essence' | 'essence-locked' | 'photo';
    virtueSentence?: string;
  };
  const images: CarouselImage[] = [];

  if (moodboardImageUrl) {
    images.push({ src: moodboardImageUrl, label: 'Lifestyle', type: 'moodboard' });
  }

  if (essenceImageUrl) {
    images.push({ src: essenceImageUrl, label: 'Essence', type: 'essence' });
  } else if (profile.virtueSentence) {
    // Show locked placeholder when virtue sentence exists but image doesn't
    images.push({
      label: 'Essence',
      type: 'essence-locked',
      virtueSentence: profile.virtueSentence,
    });
  }

  if (thumbnailUrl) {
    images.push({ src: thumbnailUrl, label: 'Photo', type: 'photo' });
  }

  const hasMultipleImages = images.length > 1;

  // Navigate carousel
  const goToIndex = useCallback((index: number) => {
    if (index >= 0 && index < images.length) {
      setCurrentIndex(index);
    }
  }, [images.length]);

  const goNext = useCallback(() => {
    goToIndex((currentIndex + 1) % images.length);
  }, [currentIndex, images.length, goToIndex]);

  const goPrev = useCallback(() => {
    goToIndex((currentIndex - 1 + images.length) % images.length);
  }, [currentIndex, images.length, goToIndex]);

  // Touch handlers for swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || !hasMultipleImages) return;

    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    const threshold = 50; // Minimum swipe distance

    if (diff > threshold) {
      goNext();
    } else if (diff < -threshold) {
      goPrev();
    }

    touchStartX.current = null;
  }, [hasMultipleImages, goNext, goPrev]);

  // Current image to display
  const currentImage = images[currentIndex];

  return (
    <>
      {/* Header Image Carousel */}
      <div
        ref={containerRef}
        className="relative h-64 bg-slate-900 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {currentImage?.type === 'essence-locked' ? (
          // Locked essence placeholder - shows virtue sentence teaser with generate button
          <div className="w-full h-full bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 flex flex-col items-center justify-center p-6 text-white">
            <Lock size={40} className="mb-3 opacity-80" />
            <p className="text-lg font-medium text-center mb-2 px-4 leading-relaxed">
              &ldquo;{currentImage.virtueSentence}&rdquo;
            </p>
            <p className="text-sm opacity-70 mb-5">Generate to reveal abstract essence</p>
            <button
              onClick={onGenerateEssence}
              disabled={isGeneratingEssence || !onGenerateEssence}
              className="px-5 py-2.5 bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:cursor-not-allowed rounded-full font-medium text-sm transition-colors backdrop-blur-sm border border-white/30"
            >
              {isGeneratingEssence ? (
                <span className="flex items-center gap-2">
                  <Sparkles size={16} className="animate-pulse" />
                  Generating...
                </span>
              ) : (
                'Generate Essence (~$0.04)'
              )}
            </button>
          </div>
        ) : currentImage?.src ? (
          <img
            src={currentImage.src}
            className={`w-full h-full object-cover ${currentImage.type === 'photo' ? 'opacity-80' : ''}`}
            alt={currentImage.label}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
            <div className="text-center">
              <AlertTriangle className="mx-auto mb-2" />
              <p>No Image Saved</p>
            </div>
          </div>
        )}

        {/* Dot indicators */}
        {hasMultipleImages && (
          <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-2 z-10">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => goToIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentIndex
                    ? 'bg-white w-4'
                    : 'bg-white/50'
                }`}
                aria-label={`Go to ${img.label}`}
              />
            ))}
          </div>
        )}

        {/* Image type indicator - Moodboard (Lifestyle) */}
        {currentImage?.type === 'moodboard' && (
          <div className="absolute top-6 right-6 px-3 py-1.5 bg-amber-500/90 rounded-full flex items-center gap-1.5 text-sm font-medium text-white shadow-md z-10">
            <Palette size={14} />
            Lifestyle
          </div>
        )}

        {/* Image type indicator - Essence */}
        {currentImage?.type === 'essence' && (
          <div className="absolute top-6 right-6 px-3 py-1.5 bg-purple-500/90 rounded-full flex items-center gap-1.5 text-sm font-medium text-white shadow-md z-10">
            <Sparkles size={14} />
            Essence
          </div>
        )}

        {/* Image type indicator - Essence Locked */}
        {currentImage?.type === 'essence-locked' && (
          <div className="absolute top-6 right-6 px-3 py-1.5 bg-purple-500/60 rounded-full flex items-center gap-1.5 text-sm font-medium text-white shadow-md z-10">
            <Lock size={14} />
            Essence
          </div>
        )}

        {/* Loading indicator when generating moodboard */}
        {isGeneratingMoodboard && !moodboardImageUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 z-10">
            <div className="text-center text-white">
              <Palette className="mx-auto mb-2 animate-pulse" size={32} />
              <p className="text-sm font-medium">Creating Lifestyle...</p>
            </div>
          </div>
        )}

        {/* Loading indicator when generating essence (only when NOT on locked view, which has its own button state) */}
        {isGeneratingEssence && !essenceImageUrl && !isGeneratingMoodboard && currentImage?.type !== 'essence-locked' && (
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
          className="absolute top-6 left-6 w-10 h-10 bg-white/90 dark:bg-slate-800/90 rounded-full flex items-center justify-center text-slate-900 dark:text-slate-50 shadow-md z-10"
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
      <div className="flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-300 px-4 py-3">
        {basics.job && (
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
            <Briefcase size={14} /> {basics.job}
          </div>
        )}
        {basics.school && (
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
            <GraduationCap size={14} /> {basics.school}
          </div>
        )}
        {basics.hometown && (
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
            <MapPin size={14} /> {basics.hometown}
          </div>
        )}
      </div>
    </>
  );
}
