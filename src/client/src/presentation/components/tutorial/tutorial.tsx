import { type FC, useCallback, useEffect, useState } from 'react';

import { TutorialBackdrop } from './tutorialBackdrop';
import { TutorialFallback } from './tutorialFallback';
import { TutorialHighlight } from './tutorialHighlight';
import { TutorialTooltip } from './tutorialTooltip';

export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  targetSelector: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
  action?: 'highlight' | 'demo';
  optional?: boolean;
}

export interface TutorialLabels {
  title: string;
  skip: string;
  previous: string;
  next: string;
  finish: string;
  step: string;
  of: string;
}

interface TutorialProps {
  isOpen: boolean;
  steps: TutorialStep[];
  labels: TutorialLabels;
  onClose: () => void;
  onComplete: () => void;
}

export const Tutorial: FC<TutorialProps> = ({
  isOpen,
  steps,
  labels,
  onClose,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const currentTutorialStep = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  // Update target element and positioning
  const updateTarget = useCallback(() => {
    if (!currentTutorialStep?.targetSelector) {
      setAnchorEl(null);
      return;
    }

    const targetElement = document.querySelector(
      currentTutorialStep.targetSelector
    ) as HTMLElement;

    if (targetElement) {
      setAnchorEl(targetElement);
    } else {
      console.warn(
        `Tutorial target not found: ${currentTutorialStep.targetSelector}`
      );
      setAnchorEl(null);
    }
  }, [currentTutorialStep]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: we want to trigger the useEffect when the step changes
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(updateTarget, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentStep, updateTarget]);

  // Handle navigation
  const handleNext = useCallback(() => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  }, [isLastStep, onComplete, steps.length]);

  const handlePrevious = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  const handleSkip = useCallback(() => {
    onClose();
  }, [onClose]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          handleSkip();
          break;
        case 'ArrowRight':
        case 'Enter':
        case ' ':
          event.preventDefault();
          handleNext();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          handlePrevious();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrevious, handleSkip]);

  if (!isOpen || !currentTutorialStep) {
    return null;
  }

  return (
    <>
      <TutorialBackdrop hasTarget={Boolean(anchorEl)} onSkip={handleSkip} />
      <TutorialHighlight targetElement={anchorEl} />

      {anchorEl ? (
        <TutorialTooltip
          anchorEl={anchorEl}
          title={currentTutorialStep.title}
          content={currentTutorialStep.content}
          placement={currentTutorialStep.placement}
          currentStep={currentStep}
          totalSteps={steps.length}
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
          labels={{
            step: labels.step,
            of: labels.of,
            previous: labels.previous,
            next: labels.next,
            finish: labels.finish,
          }}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onClose={handleSkip}
        />
      ) : (
        <TutorialFallback
          title={currentTutorialStep.title}
          content={currentTutorialStep.content}
          tutorialTitle={labels.title}
          currentStep={currentStep}
          totalSteps={steps.length}
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
          labels={{
            step: labels.step,
            of: labels.of,
            previous: labels.previous,
            next: labels.next,
            finish: labels.finish,
            skip: labels.skip,
          }}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onClose={handleSkip}
        />
      )}
    </>
  );
};
