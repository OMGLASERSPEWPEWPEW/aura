// src/components/profile/PhotosTab.tsx
import { Camera } from 'lucide-react';
import PhotoUploader from '../PhotoUploader';
import type { PhotoEntry } from '../../lib/db';

interface PhotosTabProps {
  photos: PhotoEntry[];
  onPhotosChange: (photos: PhotoEntry[]) => void;
}

export default function PhotosTab({ photos, onPhotosChange }: PhotosTabProps) {
  const handlePhotosChange = (base64Photos: string[]) => {
    // Convert base64 strings to PhotoEntry objects
    const photoEntries: PhotoEntry[] = base64Photos.map((base64, index) => {
      // Check if this photo already exists (preserve existing metadata)
      const existing = photos.find(p => p.base64 === base64);
      if (existing) return existing;

      // New photo
      return {
        base64,
        label: `Photo ${index + 1}`,
        addedAt: new Date()
      };
    });

    onPhotosChange(photoEntries);
  };

  // Extract base64 strings for the PhotoUploader
  const base64Photos = photos.map(p => p.base64);

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Camera className="text-pink-600" size={20} />
          <h2 className="font-semibold text-gray-800">Your Photos</h2>
        </div>

        <p className="text-sm text-slate-500 mb-4">
          Upload photos of yourself that you use (or might use) on dating apps.
          We'll analyze what they communicate to potential matches.
        </p>

        <PhotoUploader
          photos={base64Photos}
          onPhotosChange={handlePhotosChange}
          maxPhotos={6}
        />
      </div>

      {/* Tips */}
      {photos.length === 0 && (
        <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-600">
          <h4 className="font-semibold text-slate-800 mb-2">Photo tips:</h4>
          <ul className="list-disc pl-4 space-y-1">
            <li>Include your main dating app photos</li>
            <li>Add a clear headshot</li>
            <li>Include full-body shots if used in your profile</li>
            <li>Photos will be analyzed for vibe, subtext, and attractiveness signals</li>
          </ul>
        </div>
      )}

      {/* Photo analysis preview */}
      {photos.length > 0 && (
        <div className="bg-pink-50 p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-pink-400"></span>
            <span className="text-xs font-bold tracking-wider text-pink-600 uppercase">Ready for Analysis</span>
          </div>
          <p className="text-sm text-pink-900">
            {photos.length} photo{photos.length !== 1 ? 's' : ''} uploaded.
            These will be analyzed for:
          </p>
          <ul className="text-xs text-pink-700 mt-2 space-y-1">
            <li>• What vibe each photo projects</li>
            <li>• Hidden subtext and signals</li>
            <li>• Attractiveness notes and improvement suggestions</li>
          </ul>
        </div>
      )}
    </div>
  );
}
