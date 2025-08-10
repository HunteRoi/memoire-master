import { Explore, Navigation } from '@mui/icons-material';
import { Box, Grid } from '@mui/material';
import { forwardRef, useImperativeHandle } from 'react';
import { useTranslation } from 'react-i18next';

import { ModeCard } from '../components/modeCard';
import { useAppContext } from '../hooks/useAppContext';
import { ModeType } from '../models/Mode';

export interface ModeSelectionContentRef {
  navigateLeft: () => void;
  navigateRight: () => void;
}

export const ModeSelectionContent = forwardRef<ModeSelectionContentRef>((_, ref) => {
  const { t } = useTranslation();
  const { selectedMode, setSelectedMode } = useAppContext();

  const modes = [
    {
      title: ModeType.EXPLORATION,
      description: t('mode.descriptions.exploration'),
      icon: <Explore sx={{ fontSize: '4rem' }} />,
    },
    {
      title: ModeType.NAVIGATION,
      description: t('mode.descriptions.navigation'),
      icon: <Navigation sx={{ fontSize: '4rem' }} />,
    },
  ];

  const navigateLeft = () => {
    const currentIndex = modes.findIndex(mode => mode.title === selectedMode);
    const previousIndex = (currentIndex - 1 + modes.length) % modes.length;
    setSelectedMode(modes[previousIndex].title);
  };

  const navigateRight = () => {
    const currentIndex = modes.findIndex(mode => mode.title === selectedMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setSelectedMode(modes[nextIndex].title);
  };

  useImperativeHandle(ref, () => ({
    navigateLeft,
    navigateRight,
  }));

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '300px',
        mt: 2,
      }}
    >
      <Grid container spacing={6} justifyContent='center' maxWidth='lg'>
        {modes.map(mode => (
          <Grid size={{ xs: 12, md: 6 }} key={mode.title}>
            <ModeCard
              mode={mode}
              onSelect={mode => {
                setSelectedMode(mode.title);
              }}
              selected={selectedMode === mode.title}
              labels={{
                exploration: t('mode.names.exploration'),
                navigation: t('mode.names.navigation'),
              }}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
});
