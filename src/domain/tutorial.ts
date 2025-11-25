/**
 * Tutorial Domain Logic
 * Handles tutorial flow and state transitions
 */

export type TutorialStep =
  | 'not_started' // Not started
  | 'welcome' // Welcome page
  | 'start_using' // Start using
  | 'completed'; // Completed

/**
 * Get next tutorial step
 */
export function getNextTutorialStep(currentStep: TutorialStep): TutorialStep | null {
  const transitions: Record<TutorialStep, TutorialStep | null> = {
    not_started: 'welcome',
    welcome: 'start_using',
    start_using: 'completed',
    completed: null,
  };

  return transitions[currentStep];
}

/**
 * Check if tutorial is completed
 */
export function isTutorialCompleted(step: TutorialStep): boolean {
  return step === 'completed';
}

/**
 * Check if tutorial should auto-trigger
 */
export function shouldAutoTriggerTutorial(
  onboardingCompleted: boolean,
  tutorialCompleted: boolean
): boolean {
  return onboardingCompleted && !tutorialCompleted;
}
