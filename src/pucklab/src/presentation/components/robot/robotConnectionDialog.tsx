import React from 'react';
import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { Robot } from '../../../domain/robot';

interface RobotConnectionDialogProps {
  open: boolean;
  robot: Robot | null;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const RobotConnectionDialog: React.FC<RobotConnectionDialogProps> = ({
  open,
  robot,
  onConfirm,
  onCancel,
  loading = false
}) => {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>
        Connect to {robot?.name}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1">
          Are you sure you want to connect to <strong>{robot?.name}</strong>?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={onConfirm} 
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? 'Connecting...' : 'Connect'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};