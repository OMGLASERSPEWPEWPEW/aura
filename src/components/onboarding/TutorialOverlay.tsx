// src/components/onboarding/TutorialOverlay.tsx
// Orchestrates the step-by-step tutorial flow

import { AnimatePresence } from 'framer-motion';
import { Home, PlusCircle, Sparkles } from 'lucide-react';
import type { OnboardingStep } from '../../hooks/useOnboarding';
import WelcomeModal from './WelcomeModal';
import TutorialStep from './TutorialStep';

interface TutorialOverlayProps {
  currentStep: OnboardingStep;
  onNext: () => void;
  onSkip: () => void;
  onComplete: () => void;
}

const TUTORIAL_STEPS = {
  gallery: {
    title: 'Your Match Gallery',
    description: 'This is where all your analyzed profiles live. Tap any card to see detailed insights, flags, and compatibility scores.',
    icon: Home,
    position: 'top' as const,
  },
  analyze: {
    title: 'Analyze a Profile',
    description: 'Tap "Analyze" to upload a screen recording of a dating profile. The AI will extract insights in seconds.',
    icon: PlusCircle,
    position: 'bottom' as const,
  },
  insights: {
    title: 'See the Full Picture',
    description: 'Each profile shows psychological patterns, red/green flags, and how compatible they are with your relationship goals.',
    icon: Sparkles,
    position: 'center' as const,
  },
};

export default function TutorialOverlay({
  currentStep,
  onNext,
  onSkip,
  onComplete,
}: TutorialOverlayProps) {
  // Get step config
  const stepConfig = TUTORIAL_STEPS[currentStep as keyof typeof TUTORIAL_STEPS];

  // Calculate step number (1-indexed, excluding welcome)
  const stepKeys = Object.keys(TUTORIAL_STEPS);
  const stepNumber = stepKeys.indexOf(currentStep) + 1;
  const totalSteps = stepKeys.length;

  return (
    <AnimatePresence mode="wait">
      {currentStep === 'welcome' && (
        <WelcomeModal
          key="welcome"
          onGetStarted={onNext}
          onSkip={onSkip}
        />
      )}

      {stepConfig && (
        <TutorialStep
          key={currentStep}
          title={stepConfig.title}
          description={stepConfig.description}
          icon={stepConfig.icon}
          stepNumber={stepNumber}
          totalSteps={totalSteps}
          position={stepConfig.position}
          onNext={stepNumber === totalSteps ? onComplete : onNext}
          onSkip={onSkip}
        />
      )}
    </AnimatePresence>
  );
}
