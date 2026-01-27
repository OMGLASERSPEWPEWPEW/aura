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
      <SectionHeader icon={Eye} title="Psychological Read" iconColor="text-purple-600 dark:text-purple-400" />
      <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-xl text-purple-900 dark:text-purple-100 border border-purple-100 dark:border-purple-700 text-sm leading-relaxed">
        {archetypeSummary}
      </div>
    </section>
  );
}
