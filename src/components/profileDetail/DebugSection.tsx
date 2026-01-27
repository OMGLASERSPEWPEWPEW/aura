// src/components/profileDetail/DebugSection.tsx
import { Download } from 'lucide-react';
import type { Profile, ProfileBasics } from '../../lib/db';

interface DebugSectionProps {
  profile: Profile;
  basics: ProfileBasics;
}

/**
 * Debug section with raw JSON data and download.
 */
export function DebugSection({ profile, basics }: DebugSectionProps) {
  const handleDownload = () => {
    const jsonString = JSON.stringify(profile, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${basics.name || 'profile'}_aura_data.json`;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-12 bg-slate-900 dark:bg-slate-950 rounded-lg overflow-hidden">
      <div className="flex justify-between items-center p-3 border-b border-slate-800 dark:border-slate-700">
        <span className="text-slate-400 dark:text-slate-500 font-mono text-sm">Database Entry</span>
        <button
          onClick={handleDownload}
          className="text-xs bg-blue-600 dark:bg-blue-700 text-white px-3 py-1 rounded flex items-center hover:bg-blue-500 dark:hover:bg-blue-600 font-bold"
        >
          <Download size={14} className="mr-1" />
          Download JSON
        </button>
      </div>
      <pre className="p-4 text-xs text-green-400 dark:text-green-300 overflow-x-auto whitespace-pre-wrap font-mono h-48">
        {JSON.stringify(profile, null, 2)}
      </pre>
    </div>
  );
}
