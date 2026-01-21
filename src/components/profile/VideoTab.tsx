// src/components/profile/VideoTab.tsx
// Port from UserBackstory.tsx - handles video upload and frame extraction
import { useState } from 'react';
import { Video, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import VideoUploader from '../VideoUploader';
import { extractFramesFromVideo } from '../../lib/frameExtraction';
import type { VideoAnalysis } from '../../lib/db';

interface VideoTabProps {
  videoAnalysis: VideoAnalysis | undefined;
  onVideoAnalysisChange: (analysis: VideoAnalysis | undefined) => void;
}

export default function VideoTab({ videoAnalysis, onVideoAnalysisChange }: VideoTabProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewFrames, setPreviewFrames] = useState<string[]>([]);

  const handleVideoFileSelect = (file: File) => {
    console.log("VideoTab: File selected:", file.name);
    setVideoFile(file);
    setError(null);
    setPreviewFrames([]);
  };

  const processVideo = async () => {
    if (!videoFile) return;

    setIsProcessing(true);
    setError(null);

    try {
      console.log("VideoTab: Extracting frames...");
      const extractedFrames = await extractFramesFromVideo(videoFile, 2);

      if (extractedFrames.length === 0) {
        throw new Error("No frames could be extracted from the video.");
      }

      console.log(`VideoTab: Extracted ${extractedFrames.length} frames`);
      setPreviewFrames(extractedFrames);

      // Save to parent state
      onVideoAnalysisChange({
        frames: extractedFrames,
        analyzedAt: new Date()
      });

      // Clear the file after successful extraction
      setVideoFile(null);

    } catch (err) {
      console.error("VideoTab: Error:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsProcessing(false);
    }
  };

  const clearVideo = () => {
    setVideoFile(null);
    setPreviewFrames([]);
    setError(null);
    onVideoAnalysisChange(undefined);
  };

  const hasFrames = (videoAnalysis?.frames?.length ?? 0) > 0;
  const displayFrames = hasFrames ? videoAnalysis!.frames : previewFrames;

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Video className="text-purple-600" size={20} />
          <h2 className="font-semibold text-gray-800">Profile Video</h2>
        </div>

        <p className="text-sm text-slate-500 mb-4">
          Upload a screen recording of your dating profile (preview mode).
          We'll extract frames to analyze your photos and prompts.
        </p>

        {/* Video Uploader - Only show if no frames extracted */}
        {!hasFrames && (
          <VideoUploader onFileSelect={handleVideoFileSelect} />
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-bold">Processing Failed</h3>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Process Button */}
        {videoFile && !hasFrames && (
          <button
            onClick={processVideo}
            disabled={isProcessing}
            className="mt-4 w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isProcessing ? (
              <>
                <Loader2 className="animate-spin mr-2" size={20} />
                Extracting Frames...
              </>
            ) : (
              "Extract Frames"
            )}
          </button>
        )}
      </div>

      {/* Frame Preview */}
      {displayFrames.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">
              Extracted Frames ({displayFrames.length})
            </h3>
            <button
              onClick={clearVideo}
              className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
            >
              <Trash2 size={16} />
              Clear
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {displayFrames.slice(0, 9).map((frame, index) => (
              <div
                key={index}
                className="aspect-[9/16] rounded-lg overflow-hidden bg-slate-100"
              >
                <img
                  src={frame}
                  alt={`Frame ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>

          {displayFrames.length > 9 && (
            <p className="text-xs text-center text-slate-500">
              +{displayFrames.length - 9} more frames (showing first 9)
            </p>
          )}

          {hasFrames && (
            <div className="bg-green-50 p-3 rounded-lg text-sm text-green-700 text-center">
              Video frames saved and ready for synthesis
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      {!hasFrames && !videoFile && displayFrames.length === 0 && (
        <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-600">
          <h4 className="font-semibold text-slate-800 mb-2">How to record your profile:</h4>
          <ol className="list-decimal pl-4 space-y-1">
            <li>Open your dating app</li>
            <li>Go to your profile preview</li>
            <li>Start a screen recording</li>
            <li>Slowly scroll through your entire profile</li>
            <li>Stop recording and upload here</li>
          </ol>
        </div>
      )}
    </div>
  );
}
