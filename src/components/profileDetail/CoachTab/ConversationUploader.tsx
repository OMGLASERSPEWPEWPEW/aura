// src/components/profileDetail/CoachTab/ConversationUploader.tsx
import { useCallback, useRef } from 'react';
import { Upload, Image, X, Loader2 } from 'lucide-react';

interface ConversationUploaderProps {
  images: string[];
  isAnalyzing: boolean;
  onAddImages: (images: string[]) => void;
  onRemoveImage: (index: number) => void;
  onAnalyze: () => void;
}

/**
 * Component for uploading conversation screenshots
 */
export function ConversationUploader({
  images,
  isAnalyzing,
  onAddImages,
  onRemoveImage,
  onAnalyze,
}: ConversationUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const newImages: string[] = [];

      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;

        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = () => {
            const result = reader.result as string;
            // Extract base64 data without the data URL prefix
            const base64Data = result.split(',')[1];
            resolve(base64Data);
          };
          reader.readAsDataURL(file);
        });
        newImages.push(base64);
      }

      if (newImages.length > 0) {
        onAddImages(newImages);
      }

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [onAddImages]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (!files || files.length === 0) return;

      const newImages: string[] = [];

      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;

        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = () => {
            const result = reader.result as string;
            const base64Data = result.split(',')[1];
            resolve(base64Data);
          };
          reader.readAsDataURL(file);
        });
        newImages.push(base64);
      }

      if (newImages.length > 0) {
        onAddImages(newImages);
      }
    },
    [onAddImages]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-pink-400 hover:bg-pink-50/50 transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <Upload className="mx-auto h-10 w-10 text-slate-400 mb-3" />
        <p className="text-sm font-medium text-slate-700">
          Drop conversation screenshots here
        </p>
        <p className="text-xs text-slate-500 mt-1">
          or tap to select from your photos
        </p>
      </div>

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">
              {images.length} screenshot{images.length !== 1 ? 's' : ''} added
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {images.map((img, index) => (
              <div
                key={index}
                className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200"
              >
                <img
                  src={`data:image/jpeg;base64,${img}`}
                  alt={`Screenshot ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveImage(index);
                  }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analyze Button */}
      {images.length > 0 && (
        <button
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium rounded-xl hover:from-pink-600 hover:to-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Analyzing conversation...
            </>
          ) : (
            <>
              <Image size={18} />
              Get coaching
            </>
          )}
        </button>
      )}
    </div>
  );
}
