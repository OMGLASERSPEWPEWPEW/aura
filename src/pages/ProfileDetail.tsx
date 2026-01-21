// src/pages/ProfileDetail.tsx
import { useParams, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { ArrowLeft, MapPin, Briefcase, GraduationCap, AlertTriangle, Target, Zap, Eye, Heart, Shield, MessageCircle, Send, Copy, Check } from 'lucide-react';
import { Download } from 'lucide-react';
import { useState } from 'react';

export default function ProfileDetail() {
  const { id } = useParams();
  const profile = useLiveQuery(() => db.profiles.get(Number(id)), [id]);

  // State for copy feedback - must be before any conditional returns (React hooks rule)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

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
  const prompts = displayData.prompts || [];
  const psych = displayData.psychological_profile || {};
  const subtext = psych.subtext_analysis || {};
  const openers = displayData.recommended_openers || [];
  // Fallback for old data format
  const overall = displayData.overall_analysis || {};

  const handleCopyOpener = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDownload = () => {
      // Create a blob from the JSON data
      const jsonString = JSON.stringify(profile, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link and click it
      const link = document.createElement('a');
      link.href = url;
      link.download = `${basics.name || "profile"}_aura_data.json`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
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

        {/* Recommended Openers */}
        {openers.length > 0 && (
          <section className="bg-gradient-to-br from-pink-50 to-purple-50 p-4 rounded-xl border border-pink-200">
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Send size={18} className="text-pink-600" /> Recommended Openers
            </h2>
            <div className="space-y-3">
              {openers.map((opener: any, i: number) => (
                <div key={i} className="bg-white p-3 rounded-lg shadow-sm border border-pink-100">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${opener.type === 'like_comment' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                          {opener.type === 'like_comment' ? 'Like Comment' : 'Match Opener'}
                        </span>
                        <span className="text-xs text-purple-600 font-medium">{opener.tactic}</span>
                      </div>
                      <p className="text-sm text-slate-800 font-medium mb-1">"{opener.message}"</p>
                      <p className="text-xs text-slate-500 italic">{opener.why_it_works}</p>
                    </div>
                    <button
                      onClick={() => handleCopyOpener(opener.message, i)}
                      className="flex-shrink-0 p-2 hover:bg-pink-100 rounded-lg transition-colors"
                      title="Copy to clipboard"
                    >
                      {copiedIndex === i ? (
                        <Check size={16} className="text-green-600" />
                      ) : (
                        <Copy size={16} className="text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Photo Analysis (Compact) */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-3">Photo Breakdown</h2>
          <div className="space-y-2">
            {photos.length > 0 ? photos.map((photo: any, i: number) => (
              <div key={i} className="flex items-start gap-3 bg-slate-50 p-3 rounded-lg">
                <span className="text-xs font-bold text-slate-400 mt-0.5">{i+1}</span>
                <div className="flex-1">
                  <span className="inline-block bg-purple-100 text-purple-800 text-xs font-bold px-2 py-0.5 rounded mr-2">{photo.vibe}</span>
                  <span className="text-sm text-slate-600">{photo.subtext}</span>
                </div>
              </div>
            )) : <p className="text-slate-500 italic">No photo analysis found.</p>}
          </div>
        </section>

        {/* Archetype Summary */}
        {psych.archetype_summary && (
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Eye size={18} className="text-purple-600" /> Psychological Read
            </h2>
            <div className="bg-purple-50 p-4 rounded-xl text-purple-900 border border-purple-100 text-sm leading-relaxed">
              {psych.archetype_summary}
            </div>
          </section>
        )}

        {/* Agendas */}
        {psych.agendas && psych.agendas.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Target size={18} className="text-blue-600" /> What They Want (Agendas)
            </h2>
            <div className="space-y-3">
              {psych.agendas.map((agenda: any, i: number) => (
                <div key={i} className={`p-3 rounded-lg border-l-4 ${agenda.priority === 'primary' ? 'bg-blue-50 border-blue-500' : 'bg-slate-50 border-slate-300'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold uppercase ${agenda.priority === 'primary' ? 'text-blue-600' : 'text-slate-500'}`}>
                      {agenda.priority}
                    </span>
                    <span className="text-sm font-medium text-slate-800">{agenda.type}</span>
                  </div>
                  <p className="text-sm text-slate-600">{agenda.evidence}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tactics */}
        {(psych.presentation_tactics || psych.predicted_tactics) && (
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Zap size={18} className="text-amber-600" /> How They Operate (Tactics)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {psych.presentation_tactics && (
                <div className="bg-amber-50 p-3 rounded-lg">
                  <h4 className="font-bold text-amber-800 text-sm mb-2">In Their Profile</h4>
                  <div className="flex flex-wrap gap-1">
                    {psych.presentation_tactics.map((t: string, i: number) => (
                      <span key={i} className="bg-amber-200 text-amber-900 text-xs font-medium px-2 py-1 rounded">{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {psych.predicted_tactics && (
                <div className="bg-orange-50 p-3 rounded-lg">
                  <h4 className="font-bold text-orange-800 text-sm mb-2">On Dates (Predicted)</h4>
                  <div className="flex flex-wrap gap-1">
                    {psych.predicted_tactics.map((t: string, i: number) => (
                      <span key={i} className="bg-orange-200 text-orange-900 text-xs font-medium px-2 py-1 rounded">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Deep Subtext Analysis */}
        {(subtext.sexual_signaling || subtext.power_dynamics || subtext.vulnerability_indicators || subtext.disconnect) && (
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <MessageCircle size={18} className="text-rose-600" /> Deep Subtext
            </h2>
            <div className="space-y-3">
              {subtext.sexual_signaling && (
                <div className="bg-rose-50 p-3 rounded-lg border-l-4 border-rose-400">
                  <h4 className="font-bold text-rose-800 text-xs uppercase mb-1 flex items-center gap-1">
                    <Heart size={12} /> Sexual Signaling
                  </h4>
                  <p className="text-sm text-rose-900">{subtext.sexual_signaling}</p>
                </div>
              )}
              {subtext.power_dynamics && (
                <div className="bg-indigo-50 p-3 rounded-lg border-l-4 border-indigo-400">
                  <h4 className="font-bold text-indigo-800 text-xs uppercase mb-1 flex items-center gap-1">
                    <Zap size={12} /> Power Dynamics
                  </h4>
                  <p className="text-sm text-indigo-900">{subtext.power_dynamics}</p>
                </div>
              )}
              {subtext.vulnerability_indicators && (
                <div className="bg-teal-50 p-3 rounded-lg border-l-4 border-teal-400">
                  <h4 className="font-bold text-teal-800 text-xs uppercase mb-1 flex items-center gap-1">
                    <Shield size={12} /> Vulnerability & Wounds
                  </h4>
                  <p className="text-sm text-teal-900">{subtext.vulnerability_indicators}</p>
                </div>
              )}
              {subtext.disconnect && (
                <div className="bg-slate-100 p-3 rounded-lg border-l-4 border-slate-400">
                  <h4 className="font-bold text-slate-700 text-xs uppercase mb-1">Text vs. Subtext</h4>
                  <p className="text-sm text-slate-700">{subtext.disconnect}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Prompts Analysis */}
        {prompts.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">Prompt Reveals</h2>
            <div className="space-y-3">
              {prompts.map((prompt: any, i: number) => (
                <div key={i} className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-500 font-medium mb-1">{prompt.question}</p>
                  <p className="text-sm text-slate-800 font-medium mb-2">"{prompt.answer}"</p>
                  <p className="text-xs text-slate-600 italic border-t border-slate-200 pt-2">{prompt.analysis}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Legacy Fallback for old data */}
        {!psych.archetype_summary && overall.summary && (
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">Vibe Check (Legacy)</h2>
            <div className="bg-blue-50 p-4 rounded-xl text-blue-900 border border-blue-100">
              {overall.summary}
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
        )}

        {/* --- DEBUG SECTION --- */}
        <div className="mt-12 bg-slate-900 rounded-lg overflow-hidden">
            <div className="flex justify-between items-center p-3 border-b border-slate-800">
                <span className="text-slate-400 font-mono text-sm">🔧 Database Entry</span>
                <button 
                  onClick={handleDownload}
                  className="text-xs bg-blue-600 text-white px-3 py-1 rounded flex items-center hover:bg-blue-500 font-bold"
                >
                  <Download size={14} className="mr-1" />
                  Download JSON
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