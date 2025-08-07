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
import { useTranslation } from 'react-i18next';

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
  onTest,
}) => {
  const { t } = useTranslation();
  const [ip, setIp] = useState('');
  const [port, setPort] = useState(443);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(
    null
  );
  const [currentRobot, setCurrentRobot] = useState<Robot>(
    () => new Robot('', 443)
  );

  useEffect(() => {
    if (robot) {
      setIp(robot.ipAddress);
      setPort(robot.port);
    } else {
      setIp('');
      setPort(443);
    }
    setTestResult(null);
  }, [robot]);

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
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle>
        {robot ? t('robot.editRobot') : t('robot.addNewRobot')}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin='dense'
          label={t('robot.ipAddress')}
          fullWidth
          variant='outlined'
          value={ip}
          onChange={e => setIp(e.target.value)}
          placeholder='192.168.1.121'
          sx={{ mb: 2 }}
        />

        <Alert severity='info' sx={{ mb: 2 }}>
          {t('robot.robotIdWillBe', 'Robot ID will be: {{id}}', {
            id: currentRobot.id,
          })}
        </Alert>

        <TextField
          margin='dense'
          label={t('robot.port')}
          type='number'
          fullWidth
          variant='outlined'
          value={port}
          onChange={e => setPort(parseInt(e.target.value) || 443)}
          sx={{ mb: 2 }}
        />

        <Box sx={{ mb: 2 }}>
          <Button
            variant='outlined'
            onClick={handleTest}
            disabled={!currentRobot.isValid() || testing}
            startIcon={testing ? <CircularProgress size={16} /> : null}
            fullWidth
          >
            {testing
              ? t('robot.testingConnection', 'Testing Connection...')
              : t('robot.testConnection')}
          </Button>
        </Box>

        {testResult === 'success' && (
          <Alert severity='success' sx={{ mb: 2 }}>
            {t(
              'robot.connectionSuccessWithId',
              'Connection successful! Robot {{id}} is reachable.',
              { id: currentRobot.id }
            )}
          </Alert>
        )}

        {testResult === 'error' && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {t(
              'robot.connectionFailedDetails',
              'Connection failed. Please check the IP address, port, and network connectivity.'
            )}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button
          onClick={handleSave}
          disabled={testResult !== 'success'}
          variant='contained'
        >
          {robot
            ? t('robot.updateRobot', 'Update Robot')
            : t('robot.addRobot', 'Add Robot')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
