// src/pages/UserBackstory.tsx
// Path: src/pages/UserBackstory.tsx

import React, { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { analyzeUserBackstory, analyzeProfile } from '../lib/ai';
import { extractFramesFromVideo } from '../lib/frameExtraction';
import { useLiveQuery } from 'dexie-react-hooks';
import VideoUploader from '../components/VideoUploader';
import { Loader2, AlertCircle } from 'lucide-react';

export default function UserBackstory() {
  // === TEXT TAB STATE ===
  const [bioText, setBioText] = useState('');
  const [isAnalyzingText, setIsAnalyzingText] = useState(false);

  // === VIDEO TAB STATE (NEW - mirrors Upload.tsx pattern) ===
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [videoFrames, setVideoFrames] = useState<string[]>([]);
  const [videoError, setVideoError] = useState<string | null>(null);

  // === SHARED STATE ===
  const [activeTab, setActiveTab] = useState<'text' | 'video'>('text');

  // Load existing data from DB
  const userIdentity = useLiveQuery(() => db.userIdentity.get(1));

  // Initialize text if it exists
  useEffect(() => {
    if (userIdentity?.analysis && !bioText) {
      // Optional: You could pre-fill the text box if we stored the raw text,
      // but for now we just show the results.
    }
  }, [userIdentity]);

  // =====================
  // TEXT TAB HANDLERS
  // =====================

  // Handle File Uploads (Text/MD files)
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    let combinedText = bioText; // Start with current text

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const text = await file.text();
      combinedText += `\n\n--- FILE: ${file.name} ---\n${text}`;
    }

    setBioText(combinedText);
  };

  // 🧠 The Brain: Analyze Text
  const runPsychoanalysis = async () => {
    if (!bioText) return alert("Please enter some text or upload files first.");

    setIsAnalyzingText(true);
    try {
      console.log("UserBackstory.tsx | runPsychoanalysis | Starting text analysis...");
      const result = await analyzeUserBackstory(bioText);

      // Update DB
      await db.userIdentity.put({
        id: 1, // Always ID 1 for the user
        source: 'hinge', // Default, can be changed later
        rawStats: userIdentity?.rawStats || { matches: 0, conversations: 0, initiatorRatio: 0, doubleTextRatio: 0, avgMessageLength: 0 },
        lastUpdated: new Date(),
        analysis: result, // Save the psychoanalysis
        selfProfile: userIdentity?.selfProfile // Keep existing video analysis if any
      });

      console.log("UserBackstory.tsx | runPsychoanalysis | Analysis saved to DB");
    } catch (error) {
      console.error("UserBackstory.tsx | runPsychoanalysis | Error:", error);
      alert("Analysis failed. Check console.");
    } finally {
      setIsAnalyzingText(false);
    }
  };

  // =====================
  // VIDEO TAB HANDLERS (NEW - Fixed flow)
  // =====================

  // Step 1: Handle file selection from VideoUploader
  const handleVideoFileSelect = (file: File) => {
    console.log("UserBackstory.tsx | handleVideoFileSelect | File selected:", file.name);
    setVideoFile(file);
    setVideoFrames([]);
    setVideoError(null);
  };

  // Step 2: Process video - extract frames and send to AI
  const startVideoAnalysis = async () => {
    if (!videoFile) return;

    setIsProcessingVideo(true);
    setVideoError(null);

    try {
      // Step 2a: Extract frames from video
      console.log("UserBackstory.tsx | startVideoAnalysis | Extracting frames...");
      const extractedFrames = await extractFramesFromVideo(videoFile, 2);
      setVideoFrames(extractedFrames);

      if (extractedFrames.length === 0) {
        throw new Error("No frames could be extracted from the video.");
      }

      console.log("UserBackstory.tsx | startVideoAnalysis | Extracted " + extractedFrames.length + " frames. Sending to AI...");

      // Step 2b: Send frames to AI for analysis
      const result = await analyzeProfile(extractedFrames);

      console.log("UserBackstory.tsx | startVideoAnalysis | AI analysis complete. Saving to DB...");

      // Step 2c: Save to DB under selfProfile
      // First ensure userIdentity exists
      const existingIdentity = await db.userIdentity.get(1);

      if (existingIdentity) {
        await db.userIdentity.update(1, {
          selfProfile: result,
          lastUpdated: new Date()
        });
      } else {
        // Create new identity record if none exists
        await db.userIdentity.put({
          id: 1,
          source: 'hinge',
          rawStats: { matches: 0, conversations: 0, initiatorRatio: 0, doubleTextRatio: 0, avgMessageLength: 0 },
          lastUpdated: new Date(),
          selfProfile: result
        });
      }

      console.log("UserBackstory.tsx | startVideoAnalysis | Saved to DB successfully");

      // Clear the file after successful analysis
      setVideoFile(null);

    } catch (error: any) {
      console.error("UserBackstory.tsx | startVideoAnalysis | Error:", error);
      setVideoError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsProcessingVideo(false);
    }
  };

  // =====================
  // RENDER
  // =====================

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-900">Nosce Te Ipsum</h1>
        <p className="text-xs text-gray-500">Know Thyself. Build your dating profile so the AI knows who it's advising.</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-gray-200 bg-white">
        <button
          onClick={() => setActiveTab('text')}
          className={`flex-1 py-3 text-sm font-medium ${activeTab === 'text' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
        >
          📝 Text / Journal
        </button>
        <button
          onClick={() => setActiveTab('video')}
          className={`flex-1 py-3 text-sm font-medium ${activeTab === 'video' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
        >
          📸 Self-Audit (Video)
        </button>
      </div>

      <div className="p-4 space-y-6">

        {/* === TEXT TAB === */}
        {activeTab === 'text' && (
          <>
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <h2 className="font-semibold text-gray-800 mb-2">Your Story</h2>
              <p className="text-sm text-gray-600 mb-4">
                Paste your journal entries, dating app bio, therapy notes, or any text that describes who you are.
              </p>

              <textarea
                value={bioText}
                onChange={(e) => setBioText(e.target.value)}
                placeholder="I'm looking for someone who... My ideal weekend is... I value..."
                className="w-full h-48 p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />

              <div className="mt-4 flex items-center gap-3">
                <label className="text-sm text-indigo-600 font-medium cursor-pointer hover:underline">
                  📎 Upload .txt or .md files
                  <input
                    type="file"
                    accept=".txt,.md,.markdown"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>

              <button
                onClick={runPsychoanalysis}
                disabled={isAnalyzingText || !bioText}
                className="mt-6 w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isAnalyzingText ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} />
                    Analyzing Brain...
                  </>
                ) : (
                  "🧠 Run Psychoanalysis"
                )}
              </button>
            </div>

            {/* The Mirror (Text Analysis Results) */}
            {userIdentity?.analysis && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
                  <h3 className="text-indigo-900 font-bold text-lg mb-1">Your Archetype</h3>
                  <div className="text-3xl font-serif text-indigo-700">
                    {userIdentity.analysis.psychoanalysis.archetype}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-2">Core Values</h3>
                  <div className="flex flex-wrap gap-2">
                    {userIdentity.analysis.psychoanalysis.core_values.map((val: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        {val}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-2">Dating Strategy</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs font-bold text-gray-400 uppercase">Target Audience</span>
                      <p className="text-sm text-gray-700 mt-1">{userIdentity.analysis.dating_strategy.target_audience}</p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-gray-400 uppercase">Green Flags to Seek</span>
                      <ul className="list-disc pl-4 text-sm text-gray-700 mt-1">
                        {userIdentity.analysis.dating_strategy.what_to_look_for.map((item: string, i: number) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* === VIDEO TAB === */}
        {activeTab === 'video' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <h2 className="font-semibold text-gray-800 mb-2">Self-Audit</h2>
              <p className="text-sm text-gray-600 mb-4">
                Upload a screen recording of your OWN profile (preview mode).
                The AI will analyze it as if it were a potential match to give you an objective "Vibe Check."
              </p>

              {/* Video Uploader - Now using onFileSelect like Upload.tsx */}
              <VideoUploader onFileSelect={handleVideoFileSelect} />

              {/* Error Display */}
              {videoError && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start">
                  <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold">Analysis Failed</h3>
                    <p className="text-sm mt-1">{videoError}</p>
                  </div>
                </div>
              )}

              {/* Process Button - Only shows when file is selected */}
              {videoFile && !userIdentity?.selfProfile && (
                <button
                  onClick={startVideoAnalysis}
                  disabled={isProcessingVideo}
                  className="mt-4 w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isProcessingVideo ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={20} />
                      Extracting & Analyzing...
                    </>
                  ) : (
                    "📸 Analyze My Profile"
                  )}
                </button>
              )}
            </div>

            {/* Self-Audit Results */}
            {userIdentity?.selfProfile && (
              <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-purple-500">
                <h3 className="font-bold text-gray-900">AI Verdict on YOU</h3>
                <div className="mt-3 space-y-2">
                  <p className="text-sm italic text-gray-600">"{userIdentity.selfProfile.overall_analysis?.summary}"</p>

                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <div className="p-3 bg-red-50 rounded-lg">
                      <span className="text-xs font-bold text-red-500">RED FLAGS (FIX THESE)</span>
                      <ul className="text-xs text-gray-700 mt-1 list-disc pl-3">
                        {userIdentity.selfProfile.overall_analysis?.red_flags?.map((flag: string, i: number) => (
                          <li key={i}>{flag}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <span className="text-xs font-bold text-green-600">YOUR STRENGTHS</span>
                      <ul className="text-xs text-gray-700 mt-1 list-disc pl-3">
                        {userIdentity.selfProfile.overall_analysis?.green_flags?.map((flag: string, i: number) => (
                          <li key={i}>{flag}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Re-analyze button */}
                  <button
                    onClick={() => {
                      // Clear selfProfile to allow re-upload
                      db.userIdentity.update(1, { selfProfile: undefined });
                    }}
                    className="mt-4 w-full text-sm text-purple-600 hover:text-purple-800 font-medium"
                  >
                    🔄 Run New Self-Audit
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

// File: src/pages/UserBackstory.tsx
// Total characters: ~9850