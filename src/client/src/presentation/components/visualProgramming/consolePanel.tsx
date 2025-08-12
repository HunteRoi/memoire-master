import { Clear, VisibilityOff } from '@mui/icons-material';
import { Box, IconButton, Paper, Tooltip, Typography } from '@mui/material';
import { type FC, useCallback, useEffect, useRef } from 'react';

import type { Robot, RobotFeedback } from '../../../domain/robot';
import type { ConsoleMessage } from '../../models/ConsoleMessage';

export interface ConsolePanelLabels {
  title: string;
  showConsole: string;
  messages: {
    robotInitialized: string;
    connecting: string;
  };
  tooltips: {
    clear: string;
    close: string;
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
  onClearConsole: () => void;
  'data-tutorial'?: string;
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
  onClearConsole,
  'data-tutorial': dataTutorial,
}) => {
  const consoleEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: we want the scroll to happen on new messages too.
  useEffect(() => {
    scrollToBottom();
  }, [consoleMessages, scrollToBottom]);

  useEffect(() => {
    if (!hasConnectedRobot || !selectedRobotData) {
      return;
    }

    window.electronAPI.robotConnection.onFeedback(onFeedback);

    window.electronAPI.robotConnection.subscribeToFeedback({
      ipAddress: selectedRobotData.ipAddress,
      port: selectedRobotData.port,
    });

    onAddMessage('info', labels.messages.connecting);

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
      data-tutorial={dataTutorial}
    >
      <Box
        sx={{
          p: {
            xs: isSimpleMode ? 1.5 : 1,
            sm: isSimpleMode ? 2 : 1.5,
          },
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: {
            xs: 'wrap',
            sm: 'nowrap',
          },
          gap: {
            xs: 1,
            sm: 0,
          },
        }}
      >
        <Typography
          variant={isSimpleMode ? 'h5' : 'h6'}
          sx={{
            fontWeight: 600,
            fontSize: {
              xs: isSimpleMode ? '1.2rem' : '1rem',
              sm: isSimpleMode ? '1.5rem' : '1.25rem',
            },
          }}
        >
          🖥️ {labels.title}
        </Typography>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: {
              xs: 0.5,
              sm: 1,
            },
          }}
        >
          <Tooltip title={labels.tooltips.clear}>
            <IconButton 
              onClick={onClearConsole}
              size={isSimpleMode ? 'medium' : 'small'}
            >
              <Clear />
            </IconButton>
          </Tooltip>
          <Tooltip title={labels.tooltips.close}>
            <IconButton 
              onClick={onToggle}
              size={isSimpleMode ? 'medium' : 'small'}
            >
              <VisibilityOff />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          p: {
            xs: 1,
            sm: 2,
          },
          pb: {
            xs: 2,
            sm: 3,
          },
          backgroundColor: 'grey.900',
          color: 'common.white',
          overflow: 'auto',
          fontFamily: 'monospace',
          fontSize: {
            xs: '0.7rem',
            sm: '0.875rem',
          },
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
                fontSize: {
                  xs: isSimpleMode ? '0.7rem' : '0.65rem',
                  sm: isSimpleMode ? '0.8rem' : '0.7rem',
                },
                color: 'grey.400',
                minWidth: {
                  xs: '50px',
                  sm: '60px',
                },
                flexShrink: 0,
              }}
            >
              {formatTimestamp(message.timestamp)}
            </Typography>
            <Typography
              variant='body2'
              component='div'
              sx={{
                fontSize: {
                  xs: isSimpleMode ? '0.85rem' : '0.75rem',
                  sm: isSimpleMode ? '1rem' : '0.875rem',
                },
                color: getMessageColor(message.type),
                flex: 1,
                wordBreak: 'break-word',
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
