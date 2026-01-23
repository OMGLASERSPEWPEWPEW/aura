// src/components/profileDetail/AnalysisTab.tsx
import type { Profile, PhotoAnalysis, PromptAnalysis, PsychologicalProfile, SubtextAnalysis, ProfileBasics } from '../../lib/db';
import { PhotoBreakdown } from './PhotoBreakdown';
import { PsychologicalRead } from './PsychologicalRead';
import { AgendasSection } from './AgendasSection';
import { TacticsSection } from './TacticsSection';
import { SubtextAnalysis as SubtextSection } from './SubtextAnalysis';
import { PromptsSection } from './PromptsSection';
import { LegacySection } from './LegacySection';
import { DebugSection } from './DebugSection';

interface AnalysisTabProps {
  profile: Profile;
  basics: ProfileBasics;
  photos: PhotoAnalysis[];
  prompts: PromptAnalysis[];
  psych: PsychologicalProfile;
  subtext: SubtextAnalysis;
  overall: {
    summary?: string;
    green_flags?: string[];
    red_flags?: string[];
  };
  copiedIndex: number | null;
  refreshingPromptIndex: number | null;
  onCopy: (text: string, index: number) => void;
  onRefreshPrompt: (index: number) => void;
}

/**
 * Analysis tab content - detailed psychological analysis and profile breakdown
 */
export function AnalysisTab({
  profile,
  basics,
  photos,
  prompts,
  psych,
  subtext,
  overall,
  copiedIndex,
  refreshingPromptIndex,
  onCopy,
  onRefreshPrompt,
}: AnalysisTabProps) {
  return (
    <div className="space-y-8">
      {/* Photo Breakdown */}
      <PhotoBreakdown photos={photos} />

      {/* Psychological Read */}
      <PsychologicalRead archetypeSummary={psych.archetype_summary || ''} />

      {/* Agendas */}
      <AgendasSection agendas={psych.agendas || []} />

      {/* Tactics */}
      <TacticsSection
        presentationTactics={psych.presentation_tactics}
        predictedTactics={psych.predicted_tactics}
      />

      {/* Deep Subtext */}
      <SubtextSection subtext={subtext} />

      {/* Prompts */}
      <PromptsSection
        prompts={prompts}
        copiedIndex={copiedIndex}
        refreshingPromptIndex={refreshingPromptIndex}
        onCopy={onCopy}
        onRefreshPrompt={onRefreshPrompt}
      />

      {/* Legacy Fallback */}
      <LegacySection overall={overall} hasArchetype={!!psych.archetype_summary} />

      {/* Debug Section */}
      <DebugSection profile={profile} basics={basics} />
    </div>
  );
}
