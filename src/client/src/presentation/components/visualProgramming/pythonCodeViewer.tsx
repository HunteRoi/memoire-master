import React, { FC } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';

interface PythonCodeViewerProps {
  code: string;
  onClose: () => void;
}

export const PythonCodeViewer: FC<PythonCodeViewerProps> = ({
  code,
  onClose,
}) => {
  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        top: '10%',
        left: '10%',
        right: '10%',
        bottom: '10%',
        zIndex: 1000,
        overflow: 'auto',
        p: 3,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant='h6'>Generated Python Code</Typography>
        <Button variant='contained' onClick={onClose}>
          Close
        </Button>
      </Box>
      <Paper
        elevation={1}
        sx={{ p: 2, backgroundColor: 'grey.900', color: 'common.white' }}
      >
        <pre
          style={{
            margin: 0,
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            whiteSpace: 'pre-wrap',
          }}
        >
          {code}
        </pre>
      </Paper>
    </Paper>
  );
};
