import React from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
} from '@mui/material';
import {
  Settings,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export const VisualProgrammingPage: React.FC = () => {
  const navigate = useNavigate();

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
