import React, { FC, useState } from 'react';
import { Box, Typography, Paper, Button, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface ConsolePanelProps {
  isSimpleMode: boolean;
  isVisible: boolean;
  onToggle: () => void;
}

export const ConsolePanel: FC<ConsolePanelProps> = ({ 
  isSimpleMode, 
  isVisible, 
  onToggle 
}) => {
  const { t } = useTranslation();
  const [consoleOutput] = useState([
    'Robot initialized successfully',
    'Connecting to robot...',
    'Connection established',
    'Ready for commands',
  ]);

  // In simple mode, show toggle button when console is hidden
  if (isSimpleMode && !isVisible) {
    return (
      <Button
        variant="contained"
        onClick={onToggle}
        startIcon={<Visibility />}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 998,
        }}
      >
        Show Console
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
      <Box sx={{ 
        p: isSimpleMode ? 2 : 1.5, 
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography 
          variant={isSimpleMode ? 'h5' : 'h6'}
          sx={{ 
            fontWeight: 600,
            fontSize: isSimpleMode ? '1.5rem' : '1.25rem'
          }}
        >
          🖥️ Console
        </Typography>
        {isSimpleMode && (
          <IconButton onClick={onToggle}>
            <VisibilityOff />
          </IconButton>
        )}
      </Box>
      
      <Box sx={{ 
        flex: 1, 
        p: 2, 
        backgroundColor: 'grey.900', 
        color: 'common.white', 
        overflow: 'auto',
        fontFamily: 'monospace'
      }}>
        {consoleOutput.map((line, index) => (
          <Typography 
            key={index} 
            variant="body2" 
            component="div"
            sx={{ 
              fontSize: isSimpleMode ? '1rem' : '0.875rem',
              mb: 0.5
            }}
          >
            {line}
          </Typography>
        ))}
      </Box>
    </Paper>
  );
};