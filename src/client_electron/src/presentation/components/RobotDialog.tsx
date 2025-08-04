import React, { useState, useEffect } from 'react';
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

import { Robot, RobotStatus } from '../../domain/entities/Robot';

interface RobotDialogProps {
  open: boolean;
  robot: Robot | null;
  onClose: () => void;
  onSave: (robot: Robot) => void;
}

export const RobotDialog: React.FC<RobotDialogProps> = ({
  open,
  robot,
  onClose,
  onSave
}) => {
  const [ip, setIp] = useState('');
  const [port, setPort] = useState(443);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    if (robot) {
      setIp(robot.ip);
      setPort(robot.port);
    } else {
      setIp('');
      setPort(443);
    }
    setTestResult(null);
  }, [robot, open]);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      // Mock connection test - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock success/failure based on IP validation
      const isValidIp = /^192\.168\.1\.\d{1,3}$/.test(ip);
      if (isValidIp && port > 0 && port < 65536) {
        setTestResult('success');
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      setTestResult('error');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    const robot = new Robot(ip, port, RobotStatus.DISCONNECTED);
    onSave(robot);
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
          Robot ID will be: {robot.id}
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
            disabled={!robot.isValid() || testing}
            startIcon={testing ? <CircularProgress size={16} /> : null}
            fullWidth
          >
            {testing ? 'Testing Connection...' : 'Test Connection'}
          </Button>
        </Box>

        {testResult === 'success' && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Connection successful! Robot {robot.id} is reachable.
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
