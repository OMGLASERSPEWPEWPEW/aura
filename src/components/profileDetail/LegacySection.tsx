// src/components/profileDetail/LegacySection.tsx
import { SectionHeader } from '../ui/SectionCard';

interface LegacyOverallAnalysis {
  summary?: string;
  green_flags?: string[];
  red_flags?: string[];
}

interface LegacySectionProps {
  overall: LegacyOverallAnalysis;
  hasArchetype: boolean;
}

/**
 * Legacy fallback section for old data format.
 */
export function LegacySection({ overall, hasArchetype }: LegacySectionProps) {
  // Don't show if we have the new archetype format or no legacy data
  if (hasArchetype || !overall.summary) return null;

  return (
    <section>
      <SectionHeader title="Vibe Check (Legacy)" />
      <div className="bg-blue-50 p-4 rounded-xl text-blue-900 border border-blue-100">{overall.summary}</div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-green-50 p-3 rounded-lg">
          <h4 className="font-bold text-green-800 text-sm mb-1">Green Flags</h4>
          <ul className="text-xs text-green-700 list-disc list-inside">
            {overall.green_flags?.map((f, i) => <li key={i}>{f}</li>) || <li>None listed</li>}
          </ul>
        </div>
        <div className="bg-red-50 p-3 rounded-lg">
          <h4 className="font-bold text-red-800 text-sm mb-1">Red Flags</h4>
          <ul className="text-xs text-red-700 list-disc list-inside">
            {overall.red_flags?.map((f, i) => <li key={i}>{f}</li>) || <li>None listed</li>}
          </ul>
        </div>
      </div>
    </section>
  );
}
