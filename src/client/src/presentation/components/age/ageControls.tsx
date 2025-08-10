import { Box, Button } from '@mui/material';
import type React from 'react';

interface AgeControlsProps {
  onIncrement: () => void;
  onDecrement: () => void;
  incrementLabel: string;
  decrementLabel: string;
}

export const AgeControls: React.FC<AgeControlsProps> = ({
  onIncrement,
  onDecrement,
  incrementLabel,
  decrementLabel,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
      }}
    >
      <Button
        size='small'
        onClick={onIncrement}
        sx={{
          minWidth: '30px',
          height: '30px',
          fontSize: '16px',
          padding: 0,
        }}
        aria-label={incrementLabel}
      >
        ▲
      </Button>
      <Button
        size='small'
        onClick={onDecrement}
        sx={{
          minWidth: '30px',
          height: '30px',
          fontSize: '16px',
          padding: 0,
        }}
        aria-label={decrementLabel}
      >
        ▼
      </Button>
    </Box>
  );
};