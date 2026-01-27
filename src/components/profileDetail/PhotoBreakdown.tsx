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
            <div key={i} className="flex items-start gap-3 bg-slate-50 dark:bg-slate-700 p-3 rounded-lg">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-0.5">{i + 1}</span>
              <div className="flex-1">
                <span className="inline-block bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200 text-xs font-bold px-2 py-0.5 rounded mr-2">
                  {photo.vibe}
                </span>
                <span className="text-sm text-slate-600 dark:text-slate-300">{photo.subtext}</span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-slate-500 dark:text-slate-400 italic">No photo analysis found.</p>
        )}
      </div>
    </section>
  );
}
