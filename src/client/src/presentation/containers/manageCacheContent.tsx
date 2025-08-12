import { ClearAll, Refresh } from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
} from '@mui/material';
import { type FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { clearAllCache } from '../utils/clearCache';
import { useTutorial } from '../contexts/tutorialContext';

export const ManageCacheContent: FC = () => {
  const { t } = useTranslation();
  const { resetTutorialState, startTutorial } = useTutorial();
  const [clearCacheDialogOpen, setClearCacheDialogOpen] = useState(false);
  const [resetTutorialDialogOpen, setResetTutorialDialogOpen] = useState(false);

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

  const handleResetTutorial = () => {
    setResetTutorialDialogOpen(true);
  };

  const handleConfirmResetTutorial = () => {
    try {
      resetTutorialState();
      startTutorial();
    } catch (error) {
      console.error('Failed to reset tutorial:', error);
    } finally {
      setResetTutorialDialogOpen(false);
    }
  };

  const handleCancelResetTutorial = () => {
    setResetTutorialDialogOpen(false);
  };

  return (
    <>
      <Stack spacing={2} sx={{ mt: 1 }}>
        <Button
          variant='outlined'
          color='error'
          startIcon={<ClearAll />}
          onClick={handleClearCache}
        >
          {t('settings.sections.clearCache.button', 'Clear All Data')}
        </Button>

        <Button
          variant='outlined'
          color='primary'
          startIcon={<Refresh />}
          onClick={handleResetTutorial}
        >
          {t('settings.sections.resetTutorial.button', 'Reset Tutorial')}
        </Button>
      </Stack>

      <Dialog
        open={clearCacheDialogOpen}
        onClose={handleCancelClearCache}
        role='dialog'
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

      <Dialog
        open={resetTutorialDialogOpen}
        onClose={handleCancelResetTutorial}
        role='dialog'
        aria-labelledby='reset-tutorial-dialog-title'
        aria-describedby='reset-tutorial-dialog-description'
      >
        <DialogTitle id='reset-tutorial-dialog-title'>
          {t('settings.sections.resetTutorial.dialog.title', 'Reset Tutorial?')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id='reset-tutorial-dialog-description'>
            {t(
              'settings.sections.resetTutorial.dialog.description',
              'This will reset your tutorial progress and restart the tutorial from the beginning. You can follow the tutorial steps again.'
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelResetTutorial}>
            {t('settings.sections.resetTutorial.dialog.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={handleConfirmResetTutorial}
            color='primary'
            variant='contained'
          >
            {t('settings.sections.resetTutorial.dialog.confirm', 'Reset Tutorial')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
