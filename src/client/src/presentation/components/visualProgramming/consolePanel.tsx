import { VisibilityOff } from '@mui/icons-material';
import { Box, IconButton, Paper, Typography } from '@mui/material';
import { type FC, useCallback, useEffect, useRef } from 'react';

import type { Robot } from '../../../domain/robot';
import type { RobotFeedback } from '../../../domain/robot';
import type { ConsoleMessage } from '../../models/ConsoleMessage';

export interface ConsolePanelLabels {
  title: string;
  showConsole: string;
  messages: {
    robotInitialized: string;
    connecting: string;
  };
}

interface ConsolePanelProps {
  isSimpleMode: boolean;
  selectedRobotData?: Robot | null;
  hasConnectedRobot: boolean;
  consoleMessages: ConsoleMessage[];
  labels: ConsolePanelLabels;
  onToggle: () => void;
  onFeedback: (feedback: RobotFeedback) => void;
  onAddMessage: (type: string, message: string) => void;
}

export const ConsolePanel: FC<ConsolePanelProps> = ({
  isSimpleMode,
  selectedRobotData,
  hasConnectedRobot,
  consoleMessages,
  labels,
  onToggle,
  onFeedback,
  onAddMessage,
}) => {
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [consoleMessages, scrollToBottom]);

  // Set up robot feedback subscription
  useEffect(() => {
    if (!hasConnectedRobot || !selectedRobotData) {
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
    onAddMessage('info', labels.messages.connecting);

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
  }, [
    hasConnectedRobot,
    selectedRobotData,
    onFeedback,
    onAddMessage,
    labels.messages,
  ]);

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

  return (
    <Paper
      elevation={2}
      sx={{
        width: '100%',
        height: '100%',
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
          🖥️ {labels.title}
        </Typography>
        <IconButton onClick={onToggle} title="Close console">
          <VisibilityOff />
        </IconButton>
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
            key={`${message.timestamp}-${index}`}
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
