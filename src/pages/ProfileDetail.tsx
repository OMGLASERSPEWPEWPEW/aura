// src/pages/ProfileDetail.tsx
import { useParams, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { ArrowLeft, MapPin, Briefcase, GraduationCap, AlertTriangle, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export default function ProfileDetail() {
  const { id } = useParams();
  const profile = useLiveQuery(() => db.profiles.get(Number(id)), [id]);
  const [copied, setCopied] = useState(false);

  if (!profile) return <div className="p-8 text-center">Loading Profile...</div>;

  // Safe access with fallback for the "raw" error case
  const analysis = profile.analysis || {};
  
  // If we have the "raw" error, try to parse it manually here to show SOMETHING
  let displayData = analysis;
  if (analysis.raw && typeof analysis.raw === 'string') {
      try {
          // Try to clean and parse the raw string just for display
          const clean = analysis.raw.replace(/```json\n?|```/g, '').trim();
          displayData = JSON.parse(clean);
      } catch (e) {
          // If it still fails, just keep the raw
      }
  }

  const basics = displayData.basics || {};
  const photos = displayData.photos || [];
  const overall = displayData.overall_analysis || {};

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(profile, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="pb-24 bg-white min-h-screen">
      {/* Header Image */}
      <div className="relative h-64 bg-slate-900">
        {profile.thumbnail ? (
          <img src={profile.thumbnail} className="w-full h-full object-cover opacity-80" alt="Cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500">
             <div className="text-center">
               <AlertTriangle className="mx-auto mb-2" />
               <p>No Image Saved</p>
             </div>
          </div>
        )}
        
        <Link to="/" className="absolute top-6 left-6 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center text-slate-900 shadow-md z-10">
          <ArrowLeft size={20} />
        </Link>
        
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
          <h1 className="text-3xl font-bold">{basics.name || "Unknown Name"}</h1>
          <p className="opacity-90">
            {basics.age ? `${basics.age} • ` : ''} 
            {basics.location || "Location Unknown"}
          </p>
        </div>
      </div>

      <div className="p-6 max-w-lg mx-auto space-y-8">
        {/* Quick Stats */}
        <div className="flex flex-wrap gap-3 text-sm text-slate-600">
          {basics.job && <div className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full"><Briefcase size={14}/> {basics.job}</div>}
          {basics.school && <div className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full"><GraduationCap size={14}/> {basics.school}</div>}
          {basics.hometown && <div className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full"><MapPin size={14}/> {basics.hometown}</div>}
        </div>

        {/* Vibe Check */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-3">Vibe Check</h2>
          <div className="bg-blue-50 p-4 rounded-xl text-blue-900 border border-blue-100">
            {overall.summary || "No summary available."}
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-3 rounded-lg">
                <h4 className="font-bold text-green-800 text-sm mb-1">Green Flags</h4>
                <ul className="text-xs text-green-700 list-disc list-inside">
                    {overall.green_flags?.map((f:string, i:number) => <li key={i}>{f}</li>) || <li>None listed</li>}
                </ul>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
                <h4 className="font-bold text-red-800 text-sm mb-1">Red Flags</h4>
                <ul className="text-xs text-red-700 list-disc list-inside">
                    {overall.red_flags?.map((f:string, i:number) => <li key={i}>{f}</li>) || <li>None listed</li>}
                </ul>
            </div>
          </div>
        </section>

        {/* Subtext Analysis */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-3">Subtext Analysis</h2>
          <div className="space-y-4">
            {photos.length > 0 ? photos.map((photo: any, i: number) => (
              <div key={i} className="border-l-4 border-slate-200 pl-4 py-1">
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Photo {i+1}</p>
                <p className="text-slate-800 font-medium mb-1">"{photo.vibe}"</p>
                <p className="text-sm text-slate-600 italic">{photo.subtext}</p>
              </div>
            )) : <p className="text-slate-500 italic">No photo analysis found.</p>}
          </div>
        </section>

        {/* --- DEBUG SECTION --- */}
        <div className="mt-12 bg-slate-900 rounded-lg overflow-hidden">
            <div className="flex justify-between items-center p-3 border-b border-slate-800">
                <span className="text-slate-400 font-mono text-sm">🔧 Database Entry</span>
                <button 
                  onClick={handleCopy}
                  className="text-xs bg-slate-800 text-white px-3 py-1 rounded flex items-center hover:bg-slate-700"
                >
                  {copied ? <Check size={14} className="mr-1" /> : <Copy size={14} className="mr-1" />}
                  {copied ? "Copied!" : "Copy JSON"}
                </button>
            </div>
            <pre className="p-4 text-xs text-green-400 overflow-x-auto whitespace-pre-wrap font-mono h-48">
                {JSON.stringify(profile, null, 2)}
            </pre>
        </div>
      </div>
    </div>
  );
}
// File length: ~4800 chars