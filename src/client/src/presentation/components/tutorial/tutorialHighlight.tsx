import { Box, useTheme } from '@mui/material';
import type { FC } from 'react';

export interface TutorialHighlightProps {
  targetElement: HTMLElement | null;
}

export const TutorialHighlight: FC<TutorialHighlightProps> = ({
  targetElement,
}) => {
  const theme = useTheme();

  if (!targetElement) return null;

  // Get element's position relative to viewport
  const rect = targetElement.getBoundingClientRect();

  return (
    <Box
      sx={{
        position: 'fixed',
        border: `3px solid ${theme.palette.primary.main}`,
        borderRadius: 1,
        boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.5)`,
        pointerEvents: 'none',
        zIndex: 9999,
        transition: 'all 0.3s ease-in-out',
      }}
      style={{
        top: rect.top - 4,
        left: rect.left - 4,
        width: rect.width + 8,
        height: rect.height + 8,
      }}
    />
  );
};
