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
import { useCallback } from 'react';

interface RobotConnectionDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  labels: {
    title: string;
    confirmMessage: string;
    cancel: string;
    connect: string;
    connecting: string;
  };
}

export const RobotConnectionDialog: React.FC<RobotConnectionDialogProps> = ({
  open,
  onConfirm,
  onCancel,
  loading = false,
  labels,
}) => {
  const handleDialogKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!loading) {
      if (event.key === 'Enter' || event.key === 'NumpadEnter') {
        event.preventDefault();
        onConfirm();
      } else if (event.key === 'Backspace' || event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
    }
  }, [loading, onConfirm, onCancel]);
  return (
    <Dialog open={open} onClose={onCancel} onKeyDown={handleDialogKeyDown} maxWidth='sm' fullWidth>
      <DialogTitle>{labels.title}</DialogTitle>
      <DialogContent>
        <Typography variant='body1'>{labels.confirmMessage}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={loading}>
          {labels.cancel}
        </Button>
        <Button
          onClick={onConfirm}
          variant='contained'
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? labels.connecting : labels.connect}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
