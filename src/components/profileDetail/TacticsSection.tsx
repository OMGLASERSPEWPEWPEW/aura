// src/components/profileDetail/TacticsSection.tsx
import { Zap } from 'lucide-react';
import { SectionHeader } from '../ui/SectionCard';

interface TacticsSectionProps {
  presentationTactics?: string[];
  predictedTactics?: string[];
}

/**
 * Tactics (how they operate) section.
 */
export function TacticsSection({ presentationTactics, predictedTactics }: TacticsSectionProps) {
  if (!presentationTactics && !predictedTactics) return null;

  return (
    <section>
      <SectionHeader icon={Zap} title="How They Operate (Tactics)" iconColor="text-amber-600" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {presentationTactics && (
          <div className="bg-amber-50 p-3 rounded-lg">
            <h4 className="font-bold text-amber-800 text-sm mb-2">In Their Profile</h4>
            <div className="flex flex-wrap gap-1">
              {presentationTactics.map((t, i) => (
                <span key={i} className="bg-amber-200 text-amber-900 text-xs font-medium px-2 py-1 rounded">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
        {predictedTactics && (
          <div className="bg-orange-50 p-3 rounded-lg">
            <h4 className="font-bold text-orange-800 text-sm mb-2">On Dates (Predicted)</h4>
            <div className="flex flex-wrap gap-1">
              {predictedTactics.map((t, i) => (
                <span key={i} className="bg-orange-200 text-orange-900 text-xs font-medium px-2 py-1 rounded">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
