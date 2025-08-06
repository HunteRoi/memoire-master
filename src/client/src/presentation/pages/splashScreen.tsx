import React, { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';

import { EPuck2Robot } from '../components/EPuck2Robot';
import { useAppContext } from '../hooks/useAppContext';
import { isSuccess } from '../../domain/result';
import { Robot } from '../../domain/robot';

export const SplashScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isLoading, error, setRobotsList, setLoading, setError } = useAppContext();

  useEffect(() => {
    const loadApplicationData = async () => {
      try {
        setLoading(true);
        const result = await window.electronAPI.manageRobots.loadRobots();
        if (isSuccess(result)) {
            const robots = result.data.map(robot => new Robot(robot.ipAddress, robot.port));
            setRobotsList(robots);
        } else {
            throw new Error(result.error);
        }
      } catch (error) {
        console.error('Failed to load application data:', error);
        setRobotsList([]);
        setError(t('splash.loadError', 'Failed to load robots configuration'));
      } finally {
        setLoading(false);
        setTimeout(navigate, 5000, '/theme-selection');
      }
    };

    loadApplicationData();
  }, [setRobotsList, setLoading, setError]);

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
        variant="h1"
        component="h1"
        sx={{
          mt: 4,
          mb: 2,
          fontWeight: 'bold',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
        }}
      >
        {t('splash.title')}
      </Typography>

      <Typography
        variant="h6"
        sx={{
          mb: 4,
          opacity: 0.9,
          maxWidth: '400px'
        }}
      >
        {t('splash.subtitle')}
      </Typography>

      {isLoading && <Typography
        variant="body2"
        sx={{
          mt: 2,
          opacity: 0.7
        }}
      >
        {t('common.loading')}
      </Typography>}

      {!isLoading && error && <Typography
        variant="body2"
        sx={{
            mt: 2,
            color: 'red'
        }}
      >
        {error}
      </Typography>}
    </Box>
  );
};
