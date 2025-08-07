import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Box, Button, IconButton, Paper, Typography } from '@mui/material';
import { type FC, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import type { Robot } from '../../../domain/robot';
import type { RobotFeedback } from '../../../domain/RobotFeedback';
import type { ConsoleMessage } from '../../models/Console';

interface ConsolePanelProps {
  isSimpleMode: boolean;
  isVisible: boolean;
  selectedRobotData?: Robot | null;
  hasConnectedRobot: boolean;
  consoleMessages: ConsoleMessage[];
  onToggle: () => void;
  onFeedback: (feedback: RobotFeedback) => void;
  onAddMessage: (type: string, message: string) => void;
}

export const ConsolePanel: FC<ConsolePanelProps> = ({
  isSimpleMode,
  isVisible,
  selectedRobotData,
  hasConnectedRobot,
  consoleMessages,
  onToggle,
  onFeedback,
  onAddMessage,
}) => {
  const { t } = useTranslation();
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  // Set up robot feedback subscription
  useEffect(() => {
    if (!hasConnectedRobot || !selectedRobotData) {
      onAddMessage(
        'info',
        t('visualProgramming.console.messages.robotInitialized')
      );
      return;
    }

    // Set up feedback listener
    window.electronAPI.robotConnection.onFeedback(onFeedback);

    // Subscribe to feedback for the selected robot
    window.electronAPI.robotConnection.subscribeToFeedback({
      ipAddress: selectedRobotData.ipAddress,
      port: selectedRobotData.port,
    });

    // Add initial connection message
    onAddMessage('info', t('visualProgramming.console.messages.connecting'));

    // Cleanup function
    return () => {
      if (selectedRobotData) {
        window.electronAPI.robotConnection.unsubscribeFromFeedback({
          ipAddress: selectedRobotData.ipAddress,
          port: selectedRobotData.port,
        });
      }
      window.electronAPI.robotConnection.removeFeedbackListener();
    };
  }, [hasConnectedRobot, selectedRobotData, onFeedback, onAddMessage, t]);

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

  // Don't render console in advanced mode if not visible
  if (!isSimpleMode && !isVisible) {
    return null;
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
        {consoleMessages.map(message => (
          <Box
            key={message.timestamp}
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
