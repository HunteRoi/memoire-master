import { FC } from 'react';
import { useNavigate } from 'react-router';
import { Box, IconButton } from '@mui/material';
import { Settings } from '@mui/icons-material';

import { useAppContext } from '../hooks/useAppContext';
import { useEnsureData } from '../hooks/useEnsureData';

export const VisualProgramming: FC = () => {
  const navigate = useNavigate();
  const {} = useAppContext();

  useEnsureData();

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <IconButton
        onClick={() => navigate('/settings')}
        sx={{
          position: 'fixed',
          top: 16,
          left: 16,
          zIndex: 999,
          backgroundColor: 'background.paper',
          color: 'text.secondary',
          boxShadow: 2,
          '&:hover': {
            backgroundColor: 'action.hover',
            color: 'text.primary',
            boxShadow: 3,
          },
          transition: 'all 0.2s ease-in-out',
        }}
      >
        <Settings />
      </IconButton>

      <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}></Box>
    </Box>
  );
};
