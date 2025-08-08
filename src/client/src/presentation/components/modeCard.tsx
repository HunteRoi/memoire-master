import { Box, Card, CardContent, Tooltip, Typography } from '@mui/material';
import type React from 'react';

import { type Mode, ModeType } from '../models/Mode';

export interface ModeCardLabels {
  exploration: string;
  navigation: string;
}

interface ModeCardProps {
  mode: Mode;
  onSelect: (mode: Mode) => void;
  selected: boolean;
  labels: ModeCardLabels;
}

export const ModeCard: React.FC<ModeCardProps> = ({
  mode,
  onSelect,
  selected,
  labels,
}) => {
  const getModeTitle = (modeTitle: ModeType) => {
    return modeTitle === ModeType.EXPLORATION
      ? labels.exploration
      : labels.navigation;
  };

  return (
    <Tooltip title={mode.description} arrow>
      <Card
        sx={theme => ({
          cursor: 'pointer',
          border: selected ? 3 : 2,
          borderColor: selected ? 'primary.main' : 'divider',
          backgroundColor: selected
            ? theme.palette.primary.main
            : theme.palette.background.paper,
          boxShadow: selected ? 6 : 3,
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: 'primary.main',
            boxShadow: 8,
            transform: 'translateY(-6px)',
            backgroundColor: selected
              ? theme.palette.primary.main
              : theme.palette.action.hover,
          },
        })}
        onClick={() => onSelect(mode)}
      >
        <CardContent sx={{ p: 4, minHeight: 180 }}>
          <Box
            display='flex'
            flexDirection='column'
            alignItems='center'
            gap={3}
            textAlign='center'
          >
            <Box
              sx={{
                color: selected ? 'primary.contrastText' : 'primary.main',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {mode.icon}
            </Box>

            <Typography
              variant='h5'
              sx={{
                textTransform: 'uppercase',
                fontWeight: 'bold',
                color: selected ? 'primary.contrastText' : 'text.primary',
                letterSpacing: '0.5px',
              }}
            >
              {getModeTitle(mode.title)}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Tooltip>
  );
};
