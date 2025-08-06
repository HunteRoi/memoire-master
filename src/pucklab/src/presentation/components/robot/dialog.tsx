import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';

import { Robot } from '../../../domain/robot';

interface RobotDialogProps {
  open: boolean;
  robot: Robot | null;
  onClose: () => void;
  onSave: (robot: Robot) => void;
  onTest: (robot: Robot) => Promise<boolean>;
}

export const RobotDialog: React.FC<RobotDialogProps> = ({
  open,
  robot,
  onClose,
  onSave,
  onTest
}) => {
  const [ip, setIp] = useState('');
  const [port, setPort] = useState(443);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [currentRobot, setCurrentRobot] = useState<Robot>(() => new Robot('', 443));

  useEffect(() => {
    if (robot) {
      setIp(robot.ipAddress);
      setPort(robot.port);
    } else {
      setIp('');
      setPort(443);
    }
    setTestResult(null);
  }, [robot, open]);

  useEffect(() => {
    const timeoutId = setTimeout(setCurrentRobot, 300, new Robot(ip, port));
    
    return () => clearTimeout(timeoutId);
  }, [ip, port]);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const result = await onTest(currentRobot);
      setTestResult(result ? 'success' : 'error');
    } catch (error) {
      console.error('Connection test error:', error);
      setTestResult('error');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    onSave(currentRobot);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {robot ? 'Edit Robot' : 'Add New Robot'}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="IP Address"
          fullWidth
          variant="outlined"
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          placeholder="192.168.1.121"
          sx={{ mb: 2 }}
        />

        <Alert severity="info" sx={{ mb: 2 }}>
          Robot ID will be: {currentRobot.id}
        </Alert>

        <TextField
          margin="dense"
          label="Port"
          type="number"
          fullWidth
          variant="outlined"
          value={port}
          onChange={(e) => setPort(parseInt(e.target.value) || 443)}
          sx={{ mb: 2 }}
        />


        <Box sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            onClick={handleTest}
            disabled={!currentRobot.isValid() || testing}
            startIcon={testing ? <CircularProgress size={16} /> : null}
            fullWidth
          >
            {testing ? 'Testing Connection...' : 'Test Connection'}
          </Button>
        </Box>

        {testResult === 'success' && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Connection successful! Robot {currentRobot.id} is reachable.
          </Alert>
        )}

        {testResult === 'error' && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Connection failed. Please check the IP address, port, and network connectivity.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          disabled={testResult !== 'success'}
          variant="contained"
        >
          {robot ? 'Update' : 'Add'} Robot
        </Button>
      </DialogActions>
    </Dialog>
  );
};
