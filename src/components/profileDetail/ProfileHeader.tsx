// src/components/profileDetail/ProfileHeader.tsx
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, MapPin, Briefcase, GraduationCap, Sparkles } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { Profile, ProfileBasics } from '../../lib/db';

interface ProfileHeaderProps {
  profile: Profile;
  basics: ProfileBasics;
  isGeneratingEssence?: boolean;
}

/**
 * Header section with swipeable image carousel and basic info.
 * Shows essence image (AI-generated) and thumbnail photo.
 */
export function ProfileHeader({ profile, basics, isGeneratingEssence = false }: ProfileHeaderProps) {
  // Convert essenceImage Blob to Object URL for display
  const [essenceImageUrl, setEssenceImageUrl] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Touch handling for swipe
  const touchStartX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profile.essenceImage instanceof Blob) {
      const url = URL.createObjectURL(profile.essenceImage);
      setEssenceImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setEssenceImageUrl(null);
    }
  }, [profile.essenceImage]);

  // Build images array: [essence (if available), thumbnail]
  const images: { src: string; label: string; isEssence: boolean }[] = [];

  if (essenceImageUrl) {
    images.push({ src: essenceImageUrl, label: 'Essence', isEssence: true });
  }

  if (profile.thumbnail) {
    images.push({ src: profile.thumbnail as string, label: 'Photo', isEssence: false });
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
        {currentImage ? (
          <img
            src={currentImage.src}
            className={`w-full h-full object-cover ${!currentImage.isEssence ? 'opacity-80' : ''}`}
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

        {/* Image type indicator */}
        {currentImage?.isEssence && (
          <div className="absolute top-6 right-6 px-3 py-1.5 bg-purple-500/90 rounded-full flex items-center gap-1.5 text-sm font-medium text-white shadow-md z-10">
            <Sparkles size={14} />
            Essence
          </div>
        )}

        {/* Loading indicator when generating essence */}
        {isGeneratingEssence && !essenceImageUrl && (
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
