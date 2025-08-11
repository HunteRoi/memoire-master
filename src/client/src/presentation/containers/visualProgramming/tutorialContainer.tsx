import { type ReactNode, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Tutorial } from '../../components/tutorial/tutorial';
import { useTutorial } from '../../contexts/tutorialContext';
import { getVisualProgrammingTutorialSteps } from '../../data/visualProgrammingTutorialSteps';

interface VisualProgrammingTutorialContainerProps {
  children: ReactNode;
}

export const VisualProgrammingTutorialContainer: React.FC<
  VisualProgrammingTutorialContainerProps
> = ({ children }) => {
  const { t } = useTranslation();
  const { isTutorialOpen, skipTutorial, completeTutorial } = useTutorial();

  const tutorialSteps = useMemo(() => getVisualProgrammingTutorialSteps(), []);

  const tutorialLabels = useMemo(
    () => ({
      title: t('tutorial.visualProgramming.title'),
      skip: t('tutorial.skip'),
      previous: t('tutorial.previous'),
      next: t('tutorial.next'),
      finish: t('tutorial.finish'),
      step: t('tutorial.step'),
      of: t('tutorial.of'),
    }),
    [t]
  );

  // Translate tutorial steps
  const translatedSteps = useMemo(
    () =>
      tutorialSteps.map(step => ({
        ...step,
        title: t(step.title),
        content: t(step.content),
      })),
    [tutorialSteps, t]
  );

  return (
    <>
      {children}
      <Tutorial
        isOpen={isTutorialOpen}
        steps={translatedSteps}
        labels={tutorialLabels}
        onClose={skipTutorial}
        onComplete={completeTutorial}
      />
    </>
  );
};
