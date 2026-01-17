// src/components/VideoUploader.tsx
import { Upload, FileVideo, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { clsx } from 'clsx';

interface VideoUploaderProps {
  onFileSelect?: (file: File) => void;
  onAnalysisComplete?: (frames: string[]) => void;
}

export default function VideoUploader({ onFileSelect, onAnalysisComplete }: VideoUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    if (file && file.type.startsWith('video/')) {
      setSelectedFileName(file.name);
      
      // ONLY call this if it exists
      if (onFileSelect) {
        onFileSelect(file);
      }
      
    } else {
      alert("Please upload a video file");
    }
  }, [onFileSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
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

  // Reset selection
  const clearSelection = () => {
    setSelectedFileName(null);
    // You might want to notify parent to clear file here too
  };

  return (
    <div className="w-full">
      <div 
        className={clsx(
          "relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 ease-in-out text-center",
          dragActive ? "border-blue-500 bg-blue-50 scale-[1.02]" : "border-slate-300 hover:border-blue-400 hover:bg-slate-50",
          selectedFileName ? "bg-green-50 border-green-500 border-solid" : ""
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          accept="video/mp4,video/quicktime,video/x-m4v,video/*"
          onChange={handleChange}
          disabled={!!selectedFileName} // Disable input if file selected (use clear button to reset)
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          {selectedFileName ? (
            <>
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
                <FileVideo size={32} />
              </div>
              <div className="z-20">
                <p className="text-lg font-medium text-slate-800 break-all">{selectedFileName}</p>
                <p className="text-sm text-slate-500 mt-1">Ready to analyze</p>
                <button 
                  onClick={(e) => {
                    e.preventDefault(); // Prevent input click bubbling
                    clearSelection();
                  }}
                  className="mt-4 inline-flex items-center text-sm text-red-600 hover:text-red-700 font-medium px-3 py-1 rounded-md hover:bg-red-50 transition-colors z-20 relative pointer-events-auto"
                >
                  <X size={16} className="mr-1" /> Remove Video
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-2">
                <Upload size={32} />
              </div>
              <div>
                <p className="text-lg font-medium text-slate-800">
                  Tap to upload screen recording
                </p>
                <p className="text-sm text-slate-500 mt-2">
                  Supports iPhone Recordings (.MOV, .MP4)
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
// File length: 2840 chars