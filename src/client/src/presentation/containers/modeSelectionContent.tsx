import { FC } from 'react';
import { Grid, Box } from '@mui/material';
import { Explore, Navigation } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

import { useAppContext } from '../hooks/useAppContext';
import { Mode, ModeType } from '../types/Mode';
import { ModeCard } from '../components/modeCard';

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

export const ModeSelectionContent: FC = () => {
  const { t } = useTranslation();
  const { selectedMode, setSelectedMode } = useAppContext();

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '300px',
        mt: 2
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
  );
};
