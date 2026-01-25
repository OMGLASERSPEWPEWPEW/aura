// src/components/profile/VideoTab.tsx
// Simplified video upload - matches match flow (Upload.tsx)
// Just shows the uploader - analysis auto-starts when file is selected
import { Video, Loader2, CheckCircle } from 'lucide-react';
import VideoUploader from '../VideoUploader';
import type { VideoAnalysis } from '../../lib/db';

interface VideoTabProps {
  videoAnalysis: VideoAnalysis | undefined;
  onVideoAnalysisChange: (analysis: VideoAnalysis | undefined) => void;
  videoFile: File | null;
  onVideoFileChange: (file: File | null) => void;
  isAnalyzing: boolean;
}

export default function VideoTab({
  videoAnalysis,
  onVideoAnalysisChange,
  videoFile,
  onVideoFileChange,
  isAnalyzing,
}: VideoTabProps) {
  const hasFrames = (videoAnalysis?.frames?.length ?? 0) > 0;

  const handleVideoFileSelect = (file: File) => {
    console.log("VideoTab: File selected:", file.name);
    onVideoFileChange(file);
  };

  const handleClear = () => {
    onVideoFileChange(null);
    onVideoAnalysisChange(undefined);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Video className="text-purple-600" size={20} />
          <h2 className="font-semibold text-gray-800">Profile Video</h2>
        </div>

        <p className="text-sm text-slate-500 mb-4">
          Upload a screen recording of your dating profile. Analysis starts automatically.
        </p>

        {/* Show uploader if not analyzing and no video selected */}
        {!isAnalyzing && !videoFile && !hasFrames && (
          <VideoUploader onFileSelect={handleVideoFileSelect} />
        )}

        {/* Show analyzing state */}
        {isAnalyzing && (
          <div className="bg-indigo-50 p-6 rounded-xl text-center">
            <Loader2 className="animate-spin mx-auto mb-3 text-indigo-600" size={32} />
            <h3 className="font-semibold text-indigo-800 mb-1">Analyzing Your Profile...</h3>
            <p className="text-sm text-indigo-600">
              Switch to the Insights tab to see your results as they appear
            </p>
          </div>
        )}

        {/* Show success state if we have frames and not currently analyzing */}
        {hasFrames && !isAnalyzing && (
          <div className="bg-green-50 p-6 rounded-xl text-center">
            <CheckCircle className="mx-auto mb-3 text-green-600" size={32} />
            <h3 className="font-semibold text-green-800 mb-1">Video Processed</h3>
            <p className="text-sm text-green-600 mb-4">
              {videoAnalysis?.frames?.length} frames extracted and analyzed
            </p>
            <button
              onClick={handleClear}
              className="text-sm text-slate-500 hover:text-slate-700 underline"
            >
              Upload a different video
            </button>
          </div>
        )}

        {/* Show file selected but not yet processed state */}
        {videoFile && !isAnalyzing && !hasFrames && (
          <div className="bg-purple-50 p-6 rounded-xl text-center">
            <Video className="mx-auto mb-3 text-purple-600" size={32} />
            <h3 className="font-semibold text-purple-800 mb-1">Video Ready</h3>
            <p className="text-sm text-purple-600 mb-2">{videoFile.name}</p>
            <p className="text-xs text-purple-500">
              Analysis will start automatically...
            </p>
          </div>
        )}
      </div>

      {/* Instructions - only show when no video */}
      {!videoFile && !hasFrames && !isAnalyzing && (
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
