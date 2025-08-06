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
          border: selected ? 3 : 2,
          borderColor: selected ? 'primary.main' : 'divider',
          backgroundColor: selected ? 'primary.light' : 'background.paper',
          boxShadow: selected ? 4 : 2,
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: 'primary.main',
            boxShadow: 6,
            transform: 'translateY(-4px)'
          }
        }}
        onClick={() => onSelect(mode)}
      >
        <CardContent sx={{ p: 6, minHeight: 200 }}>
          <Box display="flex" flexDirection="column" alignItems="center" gap={4} textAlign="center">
            <Box
              sx={{
                color: selected ? 'primary.contrastText' : 'primary.main',
                display: 'flex',
                alignItems: 'center',
                fontSize: '4rem'
              }}
            >
              {mode.icon}
            </Box>

            <Typography 
              variant="h4" 
              sx={{ 
                textTransform: 'uppercase', 
                fontWeight: 'bold',
                color: selected ? 'primary.contrastText' : 'text.primary'
              }}
            >
              {mode.title}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Tooltip>
  );
};
