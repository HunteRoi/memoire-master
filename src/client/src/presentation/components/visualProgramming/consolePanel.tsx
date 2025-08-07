import React, { FC, useState, useEffect, useRef } from 'react';
import { Box, Typography, Paper, Button, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../../hooks/useAppContext';

interface RobotFeedback {
  robotId: string;
  timestamp: number;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  data?: any;
}

interface ConsolePanelProps {
  isSimpleMode: boolean;
  isVisible: boolean;
  onToggle: () => void;
}

export const ConsolePanel: FC<ConsolePanelProps> = ({
  isSimpleMode,
  isVisible,
  onToggle,
}) => {
  const { t } = useTranslation();
  const { selectedRobot, isRobotConnected } = useAppContext();
  const [consoleMessages, setConsoleMessages] = useState<
    Array<{
      timestamp: number;
      type: string;
      message: string;
    }>
  >([]);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [consoleMessages]);

  // Set up robot feedback subscription
  useEffect(() => {
    if (!selectedRobot || !isRobotConnected(selectedRobot)) {
      setConsoleMessages([
        {
          timestamp: Date.now(),
          type: 'info',
          message: t('visualProgramming.console.messages.robotInitialized'),
        },
      ]);
      return;
    }

    // Subscribe to robot feedback
    const handleFeedback = (feedback: RobotFeedback) => {
      setConsoleMessages(prev => [
        ...prev,
        {
          timestamp: feedback.timestamp,
          type: feedback.type,
          message: feedback.message,
        },
      ]);
    };

    // Set up feedback listener
    window.electronAPI.robotConnection.onFeedback(handleFeedback);

    // Subscribe to feedback for the selected robot
    window.electronAPI.robotConnection.subscribeToFeedback({
      ipAddress: selectedRobot.ipAddress,
      port: selectedRobot.port,
    });

    // Add initial connection message
    setConsoleMessages([
      {
        timestamp: Date.now(),
        type: 'info',
        message: t('visualProgramming.console.messages.connecting'),
      },
    ]);

    // Cleanup function
    return () => {
      if (selectedRobot) {
        window.electronAPI.robotConnection.unsubscribeFromFeedback({
          ipAddress: selectedRobot.ipAddress,
          port: selectedRobot.port,
        });
      }
      window.electronAPI.robotConnection.removeFeedbackListener();
    };
  }, [selectedRobot, isRobotConnected, t]);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getMessageColor = (type: string) => {
    switch (type) {
      case 'error':
        return '#ff6b6b';
      case 'warning':
        return '#ffa726';
      case 'success':
        return '#66bb6a';
      default:
        return 'inherit';
    }
  };

  // In simple mode, show toggle button when console is hidden
  if (isSimpleMode && !isVisible) {
    return (
      <Button
        variant='contained'
        onClick={onToggle}
        startIcon={<Visibility />}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 998,
        }}
      >
        {t('visualProgramming.console.showConsole')}
      </Button>
    );
  }

  return (
    <Paper
      elevation={2}
      sx={{
        width: '100%',
        height: isSimpleMode ? '40%' : '33%',
        borderRadius: 0,
        borderTop: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          p: isSimpleMode ? 2 : 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography
          variant={isSimpleMode ? 'h5' : 'h6'}
          sx={{
            fontWeight: 600,
            fontSize: isSimpleMode ? '1.5rem' : '1.25rem',
          }}
        >
          🖥️ {t('visualProgramming.console.title')}
        </Typography>
        {isSimpleMode && (
          <IconButton onClick={onToggle}>
            <VisibilityOff />
          </IconButton>
        )}
      </Box>

      <Box
        sx={{
          flex: 1,
          p: 2,
          backgroundColor: 'grey.900',
          color: 'common.white',
          overflow: 'auto',
          fontFamily: 'monospace',
        }}
      >
        {consoleMessages.map((message, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              mb: 0.5,
              gap: 1,
            }}
          >
            <Typography
              variant='body2'
              component='span'
              sx={{
                fontSize: isSimpleMode ? '0.8rem' : '0.7rem',
                color: 'grey.400',
                minWidth: '60px',
                flexShrink: 0,
              }}
            >
              {formatTimestamp(message.timestamp)}
            </Typography>
            <Typography
              variant='body2'
              component='div'
              sx={{
                fontSize: isSimpleMode ? '1rem' : '0.875rem',
                color: getMessageColor(message.type),
                flex: 1,
              }}
            >
              {message.message}
            </Typography>
          </Box>
        ))}
        <div ref={consoleEndRef} />
      </Box>
    </Paper>
  );
};
