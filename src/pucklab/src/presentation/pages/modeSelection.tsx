import { FC } from 'react';
import { useNavigate } from 'react-router';
import { Grid, Box } from '@mui/material';
import { Explore, Navigation } from '@mui/icons-material';

import { useAppContext } from '../hooks/useAppContext';
import { Mode, ModeType } from '../types/Mode';
import { PageLayout } from '../components/layout/layout';
import { ModeCard } from '../components/modeCard';
import { useEnsureData } from '../hooks/useEnsureData';

const modes: Mode[] = [
  {
    title: ModeType.EXPLORATION,
    description: 'Move the robot through an arena and scan floor tiles to find white tiles in a fully black environment.',
    icon: <Explore sx={{ fontSize: '4rem' }} />
  },
  {
    title: ModeType.NAVIGATION,
    description: 'Navigate the robot through a labyrinth and find the optimal path to reach destinations.',
    icon: <Navigation sx={{ fontSize: '4rem' }} />
  }
]

export const ModeSelection: FC = () => {
  const navigate = useNavigate();
  const { selectedMode, setSelectedMode } = useAppContext();

  useEnsureData();

  const handleBack = () => navigate('/robot-selection');
  const handleContinue = () => navigate('/programming');

  return (
    <PageLayout
      title='Choose Robot Mode'
      subtitle='Select the mode for your robot. This will determine the available blocks and default behaviours.'
      onBack={handleBack}
      onContinue={handleContinue}
      continueText='Start Programming'
      maxWidth='lg'
    >
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          minHeight: '60vh',
          mb: 4
        }}
      >
        <Grid container spacing={6} justifyContent="center" maxWidth="lg">
          {modes.map((mode) => (
            <Grid size={{ xs: 12, md: 6 }} key={mode.title}>
              <ModeCard
                mode={mode}
                onSelect={(mode) => {
                  setSelectedMode(mode.title);
                }}
                selected={selectedMode === mode.title}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    </PageLayout>
  );
};
