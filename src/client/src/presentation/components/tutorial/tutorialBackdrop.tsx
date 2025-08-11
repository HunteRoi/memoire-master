import { Box } from '@mui/material';
import type { FC } from 'react';

export interface TutorialBackdropProps {
  hasTarget: boolean;
  onSkip: () => void;
}

export const TutorialBackdrop: FC<TutorialBackdropProps> = ({
  hasTarget,
  onSkip,
}) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 9998,
        pointerEvents: hasTarget ? 'none' : 'auto',
      }}
      onClick={hasTarget ? undefined : onSkip}
    />
  );
};
