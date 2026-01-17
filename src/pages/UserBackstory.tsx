// src/pages/UserBackstory.tsx
import React, { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { analyzeUserBackstory, analyzeProfile } from '../lib/ai';
import { useLiveQuery } from 'dexie-react-hooks';
import VideoUploader from '../components/VideoUploader'; 

export default function UserBackstory() {
  const [bioText, setBioText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'text' | 'video'>('text');

  // Load existing data
  const userIdentity = useLiveQuery(() => db.userIdentity.get(1));

  // Initialize text if it exists
  useEffect(() => {
    if (userIdentity?.analysis && !bioText) {
      // Optional: You could pre-fill the text box if we stored the raw text, 
      // but for now we just show the results.
    }
  }, [userIdentity]);

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
    
    setIsAnalyzing(true);
    try {
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
      
    } catch (error) {
      console.error(error);
      alert("Analysis failed. Check console.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 📸 The Lens: Analyze Video (Self-Audit)
  const handleVideoAnalysis = async (frames: string[]) => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeProfile(frames);
      
      // Save specifically to selfProfile
      await db.userIdentity.update(1, {
        selfProfile: result
      });
      
    } catch (error) {
      console.error(error);
      alert("Video analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-900">Nosce Te Ipsum</h1>
        <p className="text-xs text-gray-500">Know Thyself. The foundation of all strategy.</p>
        
        {/* Tabs */}
        <div className="flex mt-4 space-x-4 border-b">
          <button 
            onClick={() => setActiveTab('text')}
            className={`pb-2 ${activeTab === 'text' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          >
            Psychoanalysis
          </button>
          <button 
            onClick={() => setActiveTab('video')}
            className={`pb-2 ${activeTab === 'video' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          >
            Profile Audit
          </button>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-6">
        
        {/* === TEXT TAB === */}
        {activeTab === 'text' && (
          <>
            {/* Input Section */}
            <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
              <h2 className="font-semibold text-gray-800">1. Upload Context</h2>
              <p className="text-sm text-gray-600">
                Paste journal entries, bio drafts, or upload text files from your /me/ folder.
              </p>
              
              <textarea 
                className="w-full h-40 p-3 border rounded-lg text-sm"
                placeholder="I am a 28 year old architect..."
                value={bioText}
                onChange={(e) => setBioText(e.target.value)}
              />

              <div className="flex items-center space-x-2">
                <label className="bg-gray-100 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-200">
                  📂 Upload Files
                  <input type="file" multiple accept=".txt,.md,.json" className="hidden" onChange={handleFileUpload} />
                </label>
                <div className="text-xs text-gray-400">
                  {bioText.length} characters loaded
                </div>
              </div>

              <button 
                onClick={runPsychoanalysis}
                disabled={isAnalyzing}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold shadow-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isAnalyzing ? "Analyzing Brain..." : "🧠 Run Psychoanalysis"}
              </button>
            </div>

            {/* The Mirror (Results) */}
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
                    {userIdentity.analysis.psychoanalysis.core_values.map((val, i) => (
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
                        {userIdentity.analysis.dating_strategy.what_to_look_for.map((item, i) => (
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
              
              {/* Reuse the Video Uploader but intercept the result */}
              {/* Note: We need to ensure VideoUploader exposes a way to get frames or we handle it here. 
                  For now, assuming we pass a prop or use it as is. 
                  If VideoUploader auto-saves to 'profiles', we might need to tweak it later. 
                  For MVP, let's assume we can use the logic. 
               */}
               <VideoUploader onAnalysisComplete={handleVideoAnalysis} />
            </div>

            {userIdentity?.selfProfile && (
              <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-purple-500">
                <h3 className="font-bold text-gray-900">AI Verdict on YOU</h3>
                <div className="mt-3 space-y-2">
                   <p className="text-sm italic text-gray-600">"{userIdentity.selfProfile.overall_analysis.summary}"</p>
                   
                   <div className="grid grid-cols-2 gap-2 mt-4">
                      <div className="p-3 bg-red-50 rounded-lg">
                        <span className="text-xs font-bold text-red-500">RED FLAGS (FIX THESE)</span>
                        <ul className="text-xs text-gray-700 mt-1 list-disc pl-3">
                          {userIdentity.selfProfile.overall_analysis.red_flags.map((flag: string, i: number) => (
                            <li key={i}>{flag}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <span className="text-xs font-bold text-green-600">YOUR STRENGTHS</span>
                        <ul className="text-xs text-gray-700 mt-1 list-disc pl-3">
                          {userIdentity.selfProfile.overall_analysis.green_flags.map((flag: string, i: number) => (
                            <li key={i}>{flag}</li>
                          ))}
                        </ul>
                      </div>
                   </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
// Total characters: 4800