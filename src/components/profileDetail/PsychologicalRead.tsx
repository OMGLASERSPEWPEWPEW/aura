// src/components/profileDetail/PsychologicalRead.tsx
import { Eye } from 'lucide-react';
import { SectionHeader } from '../ui/SectionCard';

interface PsychologicalReadProps {
  archetypeSummary: string;
}

/**
 * Psychological archetype summary section.
 */
export function PsychologicalRead({ archetypeSummary }: PsychologicalReadProps) {
  if (!archetypeSummary) return null;

  return (
    <section>
      <SectionHeader icon={Eye} title="Psychological Read" iconColor="text-purple-600" />
      <div className="bg-purple-50 p-4 rounded-xl text-purple-900 border border-purple-100 text-sm leading-relaxed">
        {archetypeSummary}
      </div>
    </section>
  );
}
