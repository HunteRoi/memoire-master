import { ArrowBack } from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';
import type { FC } from 'react';

import { LanguageSelector } from '../languageSelector';

interface SettingsHeaderProps {
  title: string;
  onBack: () => void;
}

export const SettingsHeader: FC<SettingsHeaderProps> = ({ title, onBack }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        p: {
          xs: 1.5,
          sm: 2,
        },
        borderBottom: 1,
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        minHeight: {
          xs: 56,
          sm: 64,
        },
      }}
    >
      <IconButton 
        onClick={onBack} 
        sx={{ 
          mr: {
            xs: 1,
            sm: 2,
          },
          p: {
            xs: 1,
            sm: 1.5,
          },
        }}
      >
        <ArrowBack />
      </IconButton>
      <Typography 
        variant='h5' 
        component='h1' 
        sx={{ 
          flexGrow: 1,
          fontSize: {
            xs: '1.25rem',
            sm: '1.5rem',
          },
          fontWeight: 500,
        }}
      >
        {title}
      </Typography>
      <LanguageSelector />
    </Box>
  );
};
