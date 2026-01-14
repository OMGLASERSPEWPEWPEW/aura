// src/pages/Mirror.tsx
import { useState, useEffect } from 'react';
import { db, type UserIdentity } from '../lib/db';
import { parseTinderData } from '../lib/dataParsing';
import { Link } from 'react-router-dom';

export default function Mirror() {
  const [identity, setIdentity] = useState<UserIdentity | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing data on mount
  useEffect(() => {
    const loadIdentity = async () => {
      try {
        const existing = await db.userIdentity.toArray();
        if (existing.length > 0) {
          console.log("src/pages/Mirror.tsx: loadIdentity: Found existing identity", existing[0]);
          setIdentity(existing[0]);
        }
      } catch (e) {
        console.error("src/pages/Mirror.tsx: loadIdentity: DB Error", e);
      }
    };
    loadIdentity();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const json = JSON.parse(text);

        // 1. Parse the data locally
        console.log("src/pages/Mirror.tsx: handleFileUpload: Parsing JSON...");
        const stats = parseTinderData(json);
        
        // 2. Save to DB
        const newIdentity: UserIdentity = {
          id: 1, // Singleton for now
          source: 'tinder',
          rawStats: stats,
          lastUpdated: new Date()
        };

        await db.userIdentity.put(newIdentity);
        setIdentity(newIdentity);
        
      } catch (err) {
        console.error("src/pages/Mirror.tsx: handleFileUpload: Error", err);
        setError("Could not parse file. Make sure it's a valid Tinder data.json.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">The Mirror</h1>
        <Link to="/" className="text-sm font-medium text-slate-500 hover:text-indigo-600">
          ← Back
        </Link>
      </div>

      <div className="max-w-xl mx-auto space-y-8">
        
        {/* State 1: Upload (Visible if no data or re-uploading) */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-900">{identity ? 'Update Data' : 'Upload Data'}</h2>
          <p className="text-slate-500 text-sm mt-1 mb-6">
            Upload your <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">data.json</code> file from Tinder to establish your baseline.
          </p>
          
          <label className="block w-full cursor-pointer relative group">
            <span className="sr-only">Choose file</span>
            <div className="absolute inset-0 bg-indigo-600 rounded-lg opacity-0 group-hover:opacity-5 transition-opacity"></div>
            <input 
              type="file" 
              accept=".json"
              onChange={handleFileUpload}
              className="block w-full text-sm text-slate-500
                file:mr-4 file:py-2.5 file:px-6
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-600 file:text-white
                hover:file:bg-indigo-700
                cursor-pointer
              "
            />
          </label>
          
          {loading && <p className="text-sm text-indigo-600 mt-4 animate-pulse">Analyzing patterns...</p>}
          {error && <p className="text-sm text-red-500 mt-4">{error}</p>}
        </div>

        {/* State 2: Dashboard (Visible if identity exists) */}
        {identity && (
          <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Stat Card: Matches */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 col-span-2">
              <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">Conversion Rate</span>
              <div className="flex items-end gap-2 mt-1">
                <span className="text-3xl font-bold text-slate-900">
                  {Math.round((identity.rawStats.conversations / identity.rawStats.matches) * 100)}%
                </span>
                <span className="text-sm text-slate-500 mb-1">spoke out of {identity.rawStats.matches} matches</span>
              </div>
            </div>

            {/* Stat Card: Initiator */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">Initiator</span>
              <div className="mt-2">
                <span className="text-2xl font-bold text-slate-900">
                   {Math.round(identity.rawStats.initiatorRatio * 100)}%
                </span>
                <p className="text-xs text-slate-500 mt-1">First messages sent</p>
              </div>
            </div>

             {/* Stat Card: Double Text */}
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">Eagerness</span>
              <div className="mt-2">
                <span className="text-2xl font-bold text-slate-900">
                   {Math.round(identity.rawStats.doubleTextRatio * 100)}%
                </span>
                <p className="text-xs text-slate-500 mt-1">Double text rate</p>
              </div>
            </div>
            
             {/* Clinical Note Placeholder */}
             <div className="bg-indigo-900 p-6 rounded-2xl shadow-sm border border-indigo-800 col-span-2 text-white">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                <span className="text-xs font-bold tracking-wider uppercase opacity-70">Aura Assessment</span>
              </div>
              <p className="text-indigo-100 text-sm italic leading-relaxed">
                "We haven't run the full AI analysis yet, but your raw data suggests an 'Anxious-Proactive' style. You initiate frequently ({Math.round(identity.rawStats.initiatorRatio * 100)}%), which is brave, but your double-text rate indicates you might be over-functioning in early connections."
              </p>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

// File Length: 4520 characters