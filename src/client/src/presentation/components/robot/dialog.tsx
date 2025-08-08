import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import type React from 'react';
import { useEffect, useState } from 'react';
import { DEFAULT_PORT, DEFAULT_ROBOT } from '../../../domain/constants';
import { Robot } from '../../../domain/robot';

export interface RobotDialogLabels {
  editRobot: string;
  addNewRobot: string;
  ipAddress: string;
  robotIdWillBe: string;
  port: string;
  portDescription: string;
  testingConnection: string;
  testConnection: string;
  connectionSuccessWithId: string;
  connectionFailedDetails: string;
  cancel: string;
  updateRobot: string;
  addRobot: string;
}

interface RobotDialogProps {
  open: boolean;
  robot: Robot | null;
  onClose: () => void;
  onSave: (robot: Robot) => void;
  onTest: (robot: Robot) => Promise<boolean>;
  labels: RobotDialogLabels;
}

export const RobotDialog: React.FC<RobotDialogProps> = ({
  open,
  robot,
  onClose,
  onSave,
  onTest,
  labels,
}) => {
  const [ip, setIp] = useState('');
  const [port, setPort] = useState(DEFAULT_PORT);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(
    null
  );
  const [currentRobot, setCurrentRobot] = useState<Robot>(DEFAULT_ROBOT);

  useEffect(() => {
    if (robot) {
      setIp(robot.ipAddress);
      setPort(robot.port);
    } else {
      setIp('');
      setPort(DEFAULT_PORT);
    }
    setTestResult(null);
  }, [robot]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const result = Robot.create().setIpAddress(ip).setPort(port).build();

      if (result.success) {
        setCurrentRobot(result.data);
      } else {
        console.error(`Failed to create robot: ${result.error}`);
        // Keep the current robot if creation fails
      }
    }, 300);

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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='sm'
      fullWidth
      aria-labelledby='robot-dialog-title'
      aria-describedby='robot-dialog-description'
    >
      <DialogTitle id='robot-dialog-title'>
        {robot ? labels.editRobot : labels.addNewRobot}
      </DialogTitle>
      <DialogContent>
        <Box
          component='fieldset'
          sx={{ border: 'none', padding: 0, margin: 0 }}
        >
          <legend style={{ display: 'none' }}>
            {robot ? labels.editRobot : labels.addNewRobot}
          </legend>
          <TextField
            autoFocus
            margin='dense'
            label={labels.ipAddress}
            fullWidth
            variant='outlined'
            value={ip}
            onChange={e => setIp(e.target.value)}
            placeholder='192.168.1.121'
            sx={{ mb: 2 }}
          />

          <Alert severity='info' sx={{ mb: 2 }}>
            {labels.robotIdWillBe.replace('{{id}}', currentRobot.id)}
          </Alert>

          <TextField
            margin='dense'
            label={labels.port}
            type='number'
            fullWidth
            variant='outlined'
            value={port}
            onChange={e => setPort(parseInt(e.target.value) || DEFAULT_PORT)}
            sx={{ mb: 2 }}
            inputProps={{
              'aria-describedby': 'robot-port-description',
            }}
          />
          <Box id='robot-port-description' sx={{ display: 'none' }}>
            {labels.portDescription}
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Button
            variant='outlined'
            onClick={handleTest}
            disabled={testing}
            startIcon={testing ? <CircularProgress size={16} /> : null}
            fullWidth
            aria-describedby={testing ? 'testing-status' : undefined}
          >
            {testing ? labels.testingConnection : labels.testConnection}
          </Button>
        </Box>

        {testResult === 'success' && (
          <Alert severity='success' sx={{ mb: 2 }}>
            {labels.connectionSuccessWithId.replace('{{id}}', currentRobot.id)}
          </Alert>
        )}

        {testResult === 'error' && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {labels.connectionFailedDetails}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{labels.cancel}</Button>
        <Button
          onClick={handleSave}
          disabled={testResult !== 'success'}
          variant='contained'
        >
          {robot ? labels.updateRobot : labels.addRobot}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
