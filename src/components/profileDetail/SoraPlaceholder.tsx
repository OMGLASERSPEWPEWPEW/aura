// src/components/profileDetail/SoraPlaceholder.tsx
// Locked placeholder for Sora motion portrait before generation

import { Film, Lock } from 'lucide-react';

interface SoraPlaceholderProps {
  hasVirtues: boolean;
}

/**
 * Placeholder shown in carousel when Sora video hasn't been generated yet.
 * Displays teal gradient with film icon and teaser text.
 *
 * States:
 * - hasVirtues=false: "Complete analysis to unlock"
 * - hasVirtues=true: "Motion portrait" + "Dynamic personality visualization"
 */
export function SoraPlaceholder({ hasVirtues }: SoraPlaceholderProps) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-teal-600 via-cyan-700 to-cyan-900 flex flex-col items-center justify-center p-6 text-white">
      {hasVirtues ? (
        <>
          <Film size={40} className="mb-3 opacity-80" />
          <p className="text-lg font-medium text-center mb-2">Motion portrait</p>
          <p className="text-sm opacity-70">Dynamic personality visualization</p>
        </>
      ) : (
        <>
          <Lock size={40} className="mb-3 opacity-80" />
          <p className="text-lg font-medium text-center mb-2">Motion portrait</p>
          <p className="text-sm opacity-70">Complete analysis to unlock</p>
        </>
      )}
    </div>
  );
}
