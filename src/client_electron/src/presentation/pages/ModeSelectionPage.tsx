import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid
} from '@mui/material';
import {
  Explore,
  Navigation
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { useAppContext } from '../context/AppContext';
import { ModeCard } from '../components/ModeCard';
import { Mode, ModeType } from '../types/Mode';

export const ModeSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { setSelectedMode } = useAppContext();
  const [localSelectedMode, setLocalSelectedMode] = useState<Mode | null>(null);

  const modes: Mode[] = [
    {
      title: ModeType.EXPLORATION,
      description: 'Move the robot through an arena and scan floor tiles to find white tiles in a fully black environment.',
      icon: <Explore />
    },
    {
      title: ModeType.NAVIGATION,
      description: 'Navigate the robot through a labyrinth and find the optimal path to reach destinations.',
      icon: <Navigation />
    }
  ];

  const handleContinue = () => {
    if (localSelectedMode) {
      navigate('/programming');
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Choose Robot Mode
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        Select the mode for your robot. This will determine the available blocks and default behaviors.
      </Typography>

      <Grid container spacing={2} mb={4}>
        {modes.map((mode) => (
          <Grid size={{ xs: 12, md: 6 }} key={mode.title}>
            <ModeCard
              mode={mode}
              onSelect={(mode) => {
                setLocalSelectedMode(mode);
                setSelectedMode(mode.title);
              }}
              selected={localSelectedMode?.title === mode.title}
            />
          </Grid>
        ))}
      </Grid>

      <Box display="flex" justifyContent="space-between">
        <Button
          variant="outlined"
          onClick={() => navigate('/robot-selection')}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleContinue}
          disabled={!localSelectedMode}
        >
          Start Programming
        </Button>
      </Box>
    </Box>
  );
};
