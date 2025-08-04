import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Tooltip
} from '@mui/material';
import { Mode } from '../types/Mode';

interface ModeCardProps {
  mode: Mode;
  onSelect: (mode: Mode) => void;
  selected: boolean;
}

export const ModeCard: React.FC<ModeCardProps> = ({ mode, onSelect, selected }) => {
  return (
    <Tooltip title={mode.description} arrow>
      <Card
        sx={{
          cursor: 'pointer',
          border: selected ? 2 : 1,
          borderColor: selected ? 'primary.main' : 'divider',
          '&:hover': {
            borderColor: 'primary.main',
            elevation: 4
          }
        }}
        onClick={() => onSelect(mode)}
      >
        <CardContent sx={{ p: 2 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Box
              sx={{
                color: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                fontSize: '2rem'
              }}
            >
              {mode.icon}
            </Box>

            <Typography variant="h6">
              {mode.title}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Tooltip>
  );
};
