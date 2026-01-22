// src/pages/Upload.tsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import VideoUploader from '../components/VideoUploader';
import { extractFramesFromVideo } from '../lib/frameExtraction';
import { analyzeProfile } from '../lib/ai';
import { db } from '../lib/db';
import type { UserIdentity, ProfileAnalysis } from '../lib/db';
import { buildUserContextForMatch, hasUserProfile as checkHasUserProfile } from '../lib/utils';
import { Loader2, AlertCircle, Save, CheckCircle, User } from 'lucide-react';

export default function Upload() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [frames, setFrames] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<ProfileAnalysis | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [userIdentity, setUserIdentity] = useState<UserIdentity | undefined>(undefined);
  const [userContextLoaded, setUserContextLoaded] = useState(false);

  // Fetch user identity on mount
  useEffect(() => {
    const loadUserIdentity = async () => {
      const identity = await db.userIdentity.get(1);
      setUserIdentity(identity);
      setUserContextLoaded(true);
    };
    loadUserIdentity();
  }, []);

  const hasUserProfile = checkHasUserProfile(userIdentity);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setFrames([]);
    setAnalysis(null);
    setErrorMessage(null);
  };

  const startAnalysis = async () => {
    if (!file) return;

    setIsProcessing(true);
    setAnalysis(null);
    setErrorMessage(null);

    try {
      console.log("Starting extraction...");
      const extractedImages = await extractFramesFromVideo(file, 2);
      setFrames(extractedImages);

      console.log("Sending to AI...");
      if (extractedImages.length === 0) throw new Error("No frames extracted.");

      // Pass user context for personalized analysis
      const userContext = buildUserContextForMatch(userIdentity);
      const result = await analyzeProfile(extractedImages, userContext) as ProfileAnalysis;
      setAnalysis(result);

    } catch (error) {
      console.error("Process failed:", error);
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsProcessing(false);
    }
  };



  const saveProfile = async () => {
    if (!analysis || frames.length === 0) return;

    setIsSaving(true);
    try {
      // 1. Determine the best thumbnail
      const bestIndex = analysis.meta?.best_photo_index ?? 1;
      const safeIndex = (bestIndex >= 0 && bestIndex < frames.length) ? bestIndex : 0;
      const thumbnailImage = frames[safeIndex];

      // 2. Add to database with compatibility data if available
      await db.profiles.add({
        name: analysis.basics?.name || "Unknown Match",
        age: analysis.basics?.age || undefined,
        appName: analysis.meta?.app_name || "Unknown App",
        timestamp: new Date(),
        analysis: analysis,
        thumbnail: thumbnailImage,
        // Include compatibility if user context was used
        compatibility: analysis.compatibility || undefined
      });

      navigate('/');
    } catch (error) {
      alert("Failed to save profile: " + error);
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto pb-24">
      <Link to="/" className="text-sm text-slate-500 hover:text-blue-600 mb-6 inline-block">
        ← Back to Home
      </Link>
      
      <h1 className="text-3xl font-bold mb-6 text-slate-800">Upload Recording</h1>

      {/* Warning if no user profile for personalized analysis */}
      {userContextLoaded && !hasUserProfile && !analysis && (
        <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg flex items-start">
          <User className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-amber-600" />
          <div>
            <p className="text-sm">
              For personalized compatibility insights,{' '}
              <Link to="/my-profile" className="font-bold underline hover:text-amber-900">
                create your profile first
              </Link>
              . You can still analyze matches without it.
            </p>
          </div>
        </div>
      )}

      {!analysis && (
        <div className="mb-8">
          <VideoUploader onFileSelect={handleFileSelect} />
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-bold">Analysis Failed</h3>
            <p className="text-sm mt-1">{errorMessage}</p>
          </div>
        </div>
      )}

      {file && !analysis && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <button 
            className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center justify-center disabled:opacity-50"
            onClick={startAnalysis}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="animate-spin mr-2" /> Processing Video...
              </>
            ) : (
              "Extract Frames & Analyze"
            )}
          </button>
        </div>
      )}

      {/* Analysis Results Display */}
      {analysis && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6 animate-fade-in">
          <div className="flex justify-between items-start mb-4">
             <h3 className="text-2xl font-bold text-blue-900">
              {analysis.basics?.name || "Unknown Profile"} 
              {analysis.basics?.age && `, ${analysis.basics.age}`}
            </h3>
            <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center">
                <CheckCircle size={14} className="mr-1"/> Complete
            </div>
          </div>
          
          <p className="text-slate-700 mb-6">{analysis.overall_analysis?.summary}</p>

          <button 
            onClick={saveProfile}
            disabled={isSaving}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center"
          >
            {isSaving ? <Loader2 className="animate-spin" /> : <><Save className="mr-2" /> Save to Gallery</>}
          </button>
        </div>
      )}
    </div>
  );
}
// File length: ~3500 chars