import { FC } from 'react';
import { useNavigate } from 'react-router';
import { AppBar, Box, IconButton, Toolbar } from '@mui/material';
import { Settings } from '@mui/icons-material';

import { useAppContext } from '../hooks/useAppContext';
import { useEnsureData } from '../hooks/useEnsureData';

export const VisualProgramming: FC = () => {
  const navigate = useNavigate();
  const { } = useAppContext();

  useEnsureData();

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton onClick={() => navigate('/settings')}>
            <Settings />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
      </Box>
    </Box>
  );
};
