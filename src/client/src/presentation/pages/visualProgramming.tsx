import { Box } from '@mui/material';
import { type FC, useEffect } from 'react';

import { VisualProgrammingContent } from '../containers/visualProgramming';
import { TutorialProvider, useTutorial } from '../contexts/tutorialContext';
import { useAppContext } from '../hooks/useAppContext';

const VisualProgrammingWithTutorial: FC<{ isSimpleMode: boolean }> = ({
  isSimpleMode,
}) => {
  const { startTutorial, hasSeenTutorial } = useTutorial();

  // Auto-start tutorial for first-time users - event-based, no delay
  useEffect(() => {
    const checkAndStartTutorial = () => {
      const shouldShowTutorial = !hasSeenTutorial('visual_programming');
      console.debug('Tutorial check - should show:', shouldShowTutorial);
      if (shouldShowTutorial) {
        // Use requestAnimationFrame to ensure DOM is ready without delay
        requestAnimationFrame(() => {
          startTutorial();
        });
      }
    };

    // Check immediately and also after a short delay to ensure localStorage is fully loaded
    checkAndStartTutorial();
  }, [startTutorial, hasSeenTutorial]);

  return (
    <Box
      data-tutorial='main-container'
      sx={{
        height: '100vh',
        display: 'flex',
        position: 'relative',
        bgcolor: 'background.default',
      }}
    >
      <Box sx={{ display: 'flex', width: '100%', height: '100%' }}>
        <VisualProgrammingContent isSimpleMode={isSimpleMode} />
      </Box>
    </Box>
  );
};

export const VisualProgramming: FC = () => {
  const { userAge } = useAppContext();
  const isSimpleMode = userAge?.isSimpleMode() ?? false;

  return (
    <TutorialProvider>
      <VisualProgrammingWithTutorial isSimpleMode={isSimpleMode} />
    </TutorialProvider>
  );
};
