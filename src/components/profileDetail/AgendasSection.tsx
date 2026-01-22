// src/components/profileDetail/AgendasSection.tsx
import { Target } from 'lucide-react';
import { SectionHeader } from '../ui/SectionCard';
import type { Agenda } from '../../lib/db';

interface AgendasSectionProps {
  agendas: Agenda[];
}

/**
 * Agendas (what they want) section.
 */
export function AgendasSection({ agendas }: AgendasSectionProps) {
  if (!agendas || agendas.length === 0) return null;

  return (
    <section>
      <SectionHeader icon={Target} title="What They Want (Agendas)" iconColor="text-blue-600" />
      <div className="space-y-3">
        {agendas.map((agenda, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg border-l-4 ${
              agenda.priority === 'primary' ? 'bg-blue-50 border-blue-500' : 'bg-slate-50 border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-xs font-bold uppercase ${
                  agenda.priority === 'primary' ? 'text-blue-600' : 'text-slate-500'
                }`}
              >
                {agenda.priority}
              </span>
              <span className="text-sm font-medium text-slate-800">{agenda.type}</span>
            </div>
            <p className="text-sm text-slate-600">{agenda.evidence}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
