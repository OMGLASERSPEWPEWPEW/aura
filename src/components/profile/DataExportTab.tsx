// src/components/profile/DataExportTab.tsx
// Port from Mirror.tsx - handles Tinder JSON parsing
import { useState } from 'react';
import { FileJson, Upload, Trash2 } from 'lucide-react';
import { parseTinderData } from '../../lib/dataParsing';
import type { DataExport } from '../../lib/db';

interface DataExportTabProps {
  exports: DataExport[];
  onExportsChange: (exports: DataExport[]) => void;
}

export default function DataExportTab({ exports, onExportsChange }: DataExportTabProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

        console.log("DataExportTab: Parsing JSON...");
        const stats = parseTinderData(json);

        const newExport: DataExport = {
          source: 'tinder',
          rawStats: stats,
          uploadedAt: new Date()
        };

        // Add to exports (allow multiple sources in the future)
        const existingTinderIndex = exports.findIndex(exp => exp.source === 'tinder');
        if (existingTinderIndex >= 0) {
          // Replace existing Tinder export
          const updated = [...exports];
          updated[existingTinderIndex] = newExport;
          onExportsChange(updated);
        } else {
          onExportsChange([...exports, newExport]);
        }

      } catch (err) {
        console.error("DataExportTab: Error", err);
        setError("Could not parse file. Make sure it's a valid Tinder data.json.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);

    // Reset the input
    event.target.value = '';
  };

  const removeExport = (index: number) => {
    onExportsChange(exports.filter((_, i) => i !== index));
  };

  const tinderExport = exports.find(e => e.source === 'tinder');

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <FileJson className="text-indigo-600" size={20} />
          <h2 className="font-semibold text-gray-800">Dating App Data</h2>
        </div>

        <p className="text-sm text-slate-500 mb-4">
          Upload your <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">data.json</code> file
          from Tinder to analyze your messaging patterns and behavior.
        </p>

        <label className="block w-full cursor-pointer">
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-indigo-400 hover:bg-slate-50 transition-all">
            <Upload className="mx-auto text-slate-400 mb-2" size={24} />
            <span className="text-sm font-medium text-slate-600">
              {tinderExport ? 'Upload new data.json' : 'Upload data.json'}
            </span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
              disabled={loading}
            />
          </div>
        </label>

        {loading && (
          <p className="text-sm text-indigo-600 mt-4 animate-pulse text-center">
            Analyzing patterns...
          </p>
        )}
        {error && (
          <p className="text-sm text-red-500 mt-4 text-center">{error}</p>
        )}
      </div>

      {/* Stats Display */}
      {tinderExport && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Your Tinder Stats</h3>
            <button
              onClick={() => removeExport(exports.indexOf(tinderExport))}
              className="text-slate-400 hover:text-red-500 transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>

          {/* Conversion Rate Card */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">Conversion Rate</span>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-3xl font-bold text-slate-900">
                {tinderExport.rawStats.conversations > 0
                  ? Math.round((tinderExport.rawStats.conversations / tinderExport.rawStats.matches) * 100)
                  : 0}%
              </span>
              <span className="text-sm text-slate-500 mb-1">
                spoke out of {tinderExport.rawStats.matches} matches
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Initiator Card */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">Initiator</span>
              <div className="mt-2">
                <span className="text-2xl font-bold text-slate-900">
                  {Math.round(tinderExport.rawStats.initiatorRatio * 100)}%
                </span>
                <p className="text-xs text-slate-500 mt-1">First messages sent</p>
              </div>
            </div>

            {/* Eagerness Card */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">Eagerness</span>
              <div className="mt-2">
                <span className="text-2xl font-bold text-slate-900">
                  {Math.round(tinderExport.rawStats.doubleTextRatio * 100)}%
                </span>
                <p className="text-xs text-slate-500 mt-1">Double text rate</p>
              </div>
            </div>
          </div>

          {/* Quick Assessment */}
          <div className="bg-indigo-900 p-4 rounded-xl text-white">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              <span className="text-xs font-bold tracking-wider uppercase opacity-70">Quick Assessment</span>
            </div>
            <p className="text-indigo-100 text-sm italic leading-relaxed">
              {tinderExport.rawStats.initiatorRatio > 0.7
                ? `You initiate ${Math.round(tinderExport.rawStats.initiatorRatio * 100)}% of conversations - very proactive! ${tinderExport.rawStats.doubleTextRatio > 0.3 ? 'Your double-text rate suggests you might be over-functioning early on.' : ''}`
                : tinderExport.rawStats.initiatorRatio < 0.3
                  ? `You rarely initiate (${Math.round(tinderExport.rawStats.initiatorRatio * 100)}%) - you prefer to be pursued. This works if you're getting matches, but limits options.`
                  : `Balanced initiator ratio (${Math.round(tinderExport.rawStats.initiatorRatio * 100)}%) - you're selective about who you message first.`
              }
            </p>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!tinderExport && (
        <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-600">
          <h4 className="font-semibold text-slate-800 mb-2">How to get your data:</h4>
          <ol className="list-decimal pl-4 space-y-1">
            <li>Open Tinder settings</li>
            <li>Go to "Download My Data"</li>
            <li>Request and download your data</li>
            <li>Find the <code className="bg-slate-200 px-1 rounded">data.json</code> file</li>
            <li>Upload it here</li>
          </ol>
        </div>
      )}
    </div>
  );
}
