// src/components/profileDetail/PhotoBreakdown.tsx
import { SectionHeader } from '../ui/SectionCard';
import type { PhotoAnalysis } from '../../lib/db';

interface PhotoBreakdownProps {
  photos: PhotoAnalysis[];
}

/**
 * Photo analysis breakdown section.
 */
export function PhotoBreakdown({ photos }: PhotoBreakdownProps) {
  return (
    <section>
      <SectionHeader title="Photo Breakdown" />
      <div className="space-y-2">
        {photos.length > 0 ? (
          photos.map((photo, i) => (
            <div key={i} className="flex items-start gap-3 bg-slate-50 p-3 rounded-lg">
              <span className="text-xs font-bold text-slate-400 mt-0.5">{i + 1}</span>
              <div className="flex-1">
                <span className="inline-block bg-purple-100 text-purple-800 text-xs font-bold px-2 py-0.5 rounded mr-2">
                  {photo.vibe}
                </span>
                <span className="text-sm text-slate-600">{photo.subtext}</span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-slate-500 italic">No photo analysis found.</p>
        )}
      </div>
    </section>
  );
}
