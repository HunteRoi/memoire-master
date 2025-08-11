import { ClearAll } from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from '@mui/material';
import { type FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { clearAllCache } from '../utils/clearCache';

export const ClearCacheContent: FC = () => {
  const { t } = useTranslation();
  const [clearCacheDialogOpen, setClearCacheDialogOpen] = useState(false);

  const handleClearCache = () => {
    setClearCacheDialogOpen(true);
  };

  const handleConfirmClearCache = () => {
    try {
      clearAllCache();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    } finally {
      setClearCacheDialogOpen(false);
    }
  };

  const handleCancelClearCache = () => {
    setClearCacheDialogOpen(false);
  };

  return (
    <>
      <Typography variant='body2' color='text.secondary' paragraph>
        {t(
          'settings.sections.clearCache.description',
          'Clear all stored data including your workspace, console history, and preferences. This action cannot be undone.'
        )}
      </Typography>
      <Button
        variant='outlined'
        color='error'
        startIcon={<ClearAll />}
        onClick={handleClearCache}
        sx={{ mt: 1 }}
      >
        {t('settings.sections.clearCache.button', 'Clear All Data')}
      </Button>

      <Dialog
        open={clearCacheDialogOpen}
        onClose={handleCancelClearCache}
        aria-labelledby='clear-cache-dialog-title'
        aria-describedby='clear-cache-dialog-description'
      >
        <DialogTitle id='clear-cache-dialog-title'>
          {t('settings.sections.clearCache.dialog.title', 'Clear All Data?')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id='clear-cache-dialog-description'>
            {t(
              'settings.sections.clearCache.dialog.description',
              'This will permanently delete all your workspace data, console history, and preferences. The application will restart after clearing. This action cannot be undone.'
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelClearCache}>
            {t('settings.sections.clearCache.dialog.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={handleConfirmClearCache}
            color='error'
            variant='contained'
          >
            {t('settings.sections.clearCache.dialog.confirm', 'Clear All Data')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
