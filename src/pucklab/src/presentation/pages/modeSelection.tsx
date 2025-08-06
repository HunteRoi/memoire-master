import { FC } from 'react';
import { useNavigate } from 'react-router';
import { Grid, Box } from '@mui/material';
import { Explore, Navigation } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

import { useAppContext } from '../hooks/useAppContext';
import { Mode, ModeType } from '../types/Mode';
import { PageLayout } from '../components/layout/layout';
import { ModeCard } from '../components/modeCard';
import { useEnsureData } from '../hooks/useEnsureData';

const getModes = (t: any): Mode[] => [
  {
    title: ModeType.EXPLORATION,
    description: t('mode.descriptions.exploration'),
    icon: <Explore sx={{ fontSize: '4rem' }} />
  },
  {
    title: ModeType.NAVIGATION,
    description: t('mode.descriptions.navigation'),
    icon: <Navigation sx={{ fontSize: '4rem' }} />
  }
]

export const ModeSelection: FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { selectedMode, setSelectedMode } = useAppContext();

  useEnsureData();

  const handleBack = () => navigate('/robot-selection');
  const handleContinue = () => navigate('/programming');

  return (
    <PageLayout
      title={t('mode.title')}
      subtitle={t('mode.subtitle')}
      onBack={handleBack}
      onContinue={handleContinue}
      continueText={t('mode.startProgramming')}
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
          {getModes(t).map((mode) => (
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
