import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import type React from 'react';
import { useTranslation } from 'react-i18next';

import type { Robot } from '../../../domain/robot';

interface RobotConnectionDialogProps {
  open: boolean;
  robot: Robot;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const RobotConnectionDialog: React.FC<RobotConnectionDialogProps> = ({
  open,
  robot,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={onCancel} maxWidth='sm' fullWidth>
      <DialogTitle>
        {t('robot.connectToRobotName', 'Connect to {{name}}', {
          name: robot.name,
        })}
      </DialogTitle>
      <DialogContent>
        <Typography variant='body1'>
          {t(
            'robot.connectConfirm',
            'Are you sure you want to connect to {{name}}?',
            { name: robot.name }
          )}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={loading}>
          {t('common.cancel')}
        </Button>
        <Button
          onClick={onConfirm}
          variant='contained'
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading
            ? t('robot.connecting', 'Connecting...')
            : t('common.connect')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
