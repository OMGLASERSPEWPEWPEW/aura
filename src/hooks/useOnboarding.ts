// src/hooks/useOnboarding.ts
// Hook for managing onboarding state and tutorial flow

import { useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';

export type OnboardingStep = 'welcome' | 'gallery' | 'analyze' | 'insights' | 'complete';

interface UseOnboardingResult {
  // State
  showOnboarding: boolean;
  currentStep: OnboardingStep;
  isLoading: boolean;

  // Actions
  startOnboarding: () => void;
  nextStep: () => void;
  skipOnboarding: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

const STEP_ORDER: OnboardingStep[] = ['welcome', 'gallery', 'analyze', 'insights', 'complete'];

export function useOnboarding(): UseOnboardingResult {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Load user settings to check if onboarding has been seen
  const userIdentity = useLiveQuery(() => db.userIdentity.get(1));
  const isLoading = userIdentity === undefined;

  // Determine if we should show onboarding (only if not seen before)
  const hasSeenOnboarding = userIdentity?.settings?.hasSeenOnboarding ?? false;

  // Auto-show onboarding for new users (when no profiles exist and hasn't seen it)
  const profiles = useLiveQuery(() => db.profiles.count());
  const shouldAutoShow = !isLoading && !hasSeenOnboarding && profiles === 0;

  // Start onboarding manually (e.g., from "Show tutorial again" button)
  const startOnboarding = useCallback(() => {
    setCurrentStep('welcome');
    setShowOnboarding(true);
  }, []);

  // Move to next step
  const nextStep = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex < STEP_ORDER.length - 1) {
      setCurrentStep(STEP_ORDER[currentIndex + 1]);
    } else {
      // Reached the end
      setShowOnboarding(false);
    }
  }, [currentStep]);

  // Skip onboarding and mark as seen
  const skipOnboarding = useCallback(async () => {
    setShowOnboarding(false);

    // Mark as seen in database
    if (userIdentity) {
      await db.userIdentity.update(1, {
        settings: {
          autoCompatibility: userIdentity.settings?.autoCompatibility ?? false,
          theme: userIdentity.settings?.theme ?? 'system',
          hasSeenOnboarding: true,
        },
        lastUpdated: new Date(),
      });
    } else {
      // Create new user identity if it doesn't exist
      await db.userIdentity.add({
        id: 1,
        dataExports: [],
        textInputs: [],
        photos: [],
        manualEntry: {},
        settings: {
          autoCompatibility: false,
          theme: 'system',
          hasSeenOnboarding: true,
        },
        lastUpdated: new Date(),
      });
    }
  }, [userIdentity]);

  // Complete onboarding (same as skip, but called at the end)
  const completeOnboarding = useCallback(async () => {
    await skipOnboarding();
  }, [skipOnboarding]);

  // Reset onboarding (for "Show tutorial again" feature)
  const resetOnboarding = useCallback(async () => {
    if (userIdentity) {
      await db.userIdentity.update(1, {
        settings: {
          autoCompatibility: userIdentity.settings?.autoCompatibility ?? false,
          theme: userIdentity.settings?.theme ?? 'system',
          hasSeenOnboarding: false,
        },
        lastUpdated: new Date(),
      });
    }
    startOnboarding();
  }, [userIdentity, startOnboarding]);

  return {
    showOnboarding: showOnboarding || shouldAutoShow,
    currentStep,
    isLoading,
    startOnboarding,
    nextStep,
    skipOnboarding,
    completeOnboarding,
    resetOnboarding,
  };
}
