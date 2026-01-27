// src/components/profileDetail/ImageCarousel.tsx
import { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface CarouselImage {
  type: 'thumbnail' | 'essence';
  url: string;
  label: string;
}

interface ImageCarouselProps {
  images: CarouselImage[];
  onImageChange?: (type: 'thumbnail' | 'essence') => void;
}

/**
 * Image carousel for switching between thumbnail and essence image.
 * Supports swipe gestures on mobile and click navigation on desktop.
 */
export function ImageCarousel({ images, onImageChange }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance to trigger navigation
  const minSwipeDistance = 50;

  const goTo = useCallback((index: number) => {
    const newIndex = Math.max(0, Math.min(index, images.length - 1));
    setCurrentIndex(newIndex);
    onImageChange?.(images[newIndex]?.type || 'thumbnail');
  }, [images, onImageChange]);

  const goNext = useCallback(() => {
    if (currentIndex < images.length - 1) {
      goTo(currentIndex + 1);
    }
  }, [currentIndex, images.length, goTo]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      goTo(currentIndex - 1);
    }
  }, [currentIndex, goTo]);

  // Touch handlers for swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goNext();
    } else if (isRightSwipe) {
      goPrev();
    }
  };

  // Reset to first image if images change
  useEffect(() => {
    setCurrentIndex(0);
  }, [images.length]);

  if (images.length === 0) {
    return null;
  }

  const currentImage = images[currentIndex];
  const showNavigation = images.length > 1;

  return (
    <div
      className="relative w-full h-full"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Current Image */}
      <img
        src={currentImage.url}
        alt={currentImage.label}
        className="w-full h-full object-cover"
      />

      {/* Navigation Arrows (desktop) */}
      {showNavigation && (
        <>
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 disabled:opacity-30 disabled:cursor-not-allowed rounded-full flex items-center justify-center text-white transition-colors hidden sm:flex"
            aria-label="Previous image"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={goNext}
            disabled={currentIndex === images.length - 1}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 disabled:opacity-30 disabled:cursor-not-allowed rounded-full flex items-center justify-center text-white transition-colors hidden sm:flex"
            aria-label="Next image"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Dot Navigation */}
      {showNavigation && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((image, index) => (
            <button
              key={image.type}
              onClick={() => goTo(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-white w-6'
                  : 'bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`View ${image.label}`}
            />
          ))}
        </div>
      )}

      {/* Image Type Label */}
      {showNavigation && (
        <div className="absolute top-4 right-4 bg-black/40 text-white text-xs px-2 py-1 rounded-full">
          {currentImage.label}
        </div>
      )}
    </div>
  );
}
