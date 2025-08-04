import React, { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { EPuck2Robot } from '../components/EPuck2Robot';
import { useAppContext } from '../context/AppContext';
import { useUseCases } from '../hooks/useUseCases';

export const SplashScreen: React.FC = () => {
  const navigate = useNavigate();
  const { setRobotsList, setError } = useAppContext();
  const { manageRobotsUseCase } = useUseCases();

  useEffect(() => {
    const loadApplicationData = async () => {
      try {
        const robots = await manageRobotsUseCase.loadRobots();
        setRobotsList(robots);
      } catch (error) {
        console.error('Failed to load application data:', error);
        setRobotsList([]);
        setError('Failed to load robots configuration');
      } finally {
        setTimeout(navigate, 1000, '/theme-selection');
      }
    };

    loadApplicationData();
  }, [navigate, setRobotsList, setError]);

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        textAlign: 'center'
      }}
    >
      <Box
        sx={{
          animation: 'float 3s ease-in-out infinite',
          '@keyframes float': {
            '0%, 100%': {
              transform: 'translateY(0px)',
            },
            '50%': {
              transform: 'translateY(-10px)',
            }
          }
        }}
      >
        <EPuck2Robot />
      </Box>

      <Typography
        variant="h2"
        component="h1"
        sx={{
          mt: 4,
          mb: 2,
          fontWeight: 'bold',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
        }}
      >
        PuckLab
      </Typography>

      <Typography
        variant="h6"
        sx={{
          mb: 4,
          opacity: 0.9,
          maxWidth: '400px'
        }}
      >
        Visual Programming for e-puck2 Robots
      </Typography>

      <Typography
        variant="body2"
        sx={{
          mt: 2,
          opacity: 0.7
        }}
      >
        Loading...
      </Typography>
    </Box>
  );
};
