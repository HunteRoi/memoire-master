import { ArrowBack } from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';
import { type FC } from 'react';

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
        p: 2,
        borderBottom: 1,
        borderColor: 'divider',
        backgroundColor: 'background.paper',
      }}
    >
      <IconButton onClick={onBack} sx={{ mr: 2 }}>
        <ArrowBack />
      </IconButton>
      <Typography variant='h5' component='h1' sx={{ flexGrow: 1 }}>
        {title}
      </Typography>
      <LanguageSelector />
    </Box>
  );
};