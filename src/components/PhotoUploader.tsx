// src/components/PhotoUploader.tsx
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useCallback, useState } from 'react';
import { clsx } from 'clsx';

interface PhotoUploaderProps {
  photos: string[];                    // Array of base64 images
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
}

// Compress image to target width and quality
async function compressImage(file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Scale down if larger than maxWidth
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const base64 = canvas.toDataURL('image/jpeg', quality);
        resolve(base64);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export default function PhotoUploader({ photos, onPhotosChange, maxPhotos = 6 }: PhotoUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter(f => f.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      alert("Please upload image files (JPG, PNG, etc.)");
      return;
    }

    // Check max limit
    const remainingSlots = maxPhotos - photos.length;
    if (remainingSlots <= 0) {
      alert(`Maximum ${maxPhotos} photos allowed. Remove some to add more.`);
      return;
    }

    const filesToProcess = imageFiles.slice(0, remainingSlots);
    setIsProcessing(true);

    try {
      const compressedImages = await Promise.all(
        filesToProcess.map(file => compressImage(file))
      );
      onPhotosChange([...photos, ...compressedImages]);
    } catch (error) {
      // User gets feedback via alert, just log for debugging
      console.log("PhotoUploader: Image processing failed:", error instanceof Error ? error.message : String(error));
      alert("Failed to process some images. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [photos, maxPhotos, onPhotosChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  const canAddMore = photos.length < maxPhotos;

  return (
    <div className="w-full space-y-4">
      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100">
              <img
                src={photo}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => removePhoto(index)}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
              >
                <X size={14} />
              </button>
              <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {canAddMore && (
        <div
          className={clsx(
            "relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 ease-in-out text-center",
            dragActive ? "border-blue-500 bg-blue-50 scale-[1.02]" : "border-slate-300 hover:border-blue-400 hover:bg-slate-50",
            isProcessing && "opacity-50 pointer-events-none"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            accept="image/jpeg,image/png,image/webp,image/*"
            multiple
            onChange={handleChange}
            disabled={isProcessing}
          />

          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              {isProcessing ? (
                <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full" />
              ) : photos.length > 0 ? (
                <ImageIcon size={24} />
              ) : (
                <Upload size={24} />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800">
                {isProcessing ? 'Processing...' : photos.length > 0 ? 'Add more photos' : 'Upload photos'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {photos.length}/{maxPhotos} photos • Drag & drop or tap
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Max reached message */}
      {!canAddMore && (
        <p className="text-xs text-center text-slate-500">
          Maximum {maxPhotos} photos reached. Remove some to add more.
        </p>
      )}
    </div>
  );
}
