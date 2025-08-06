import { useState, useCallback } from 'react';
import { type AlertSnackbarProps } from '../components/layout/alertSnackbar';

export const useAlert = () => {
  const [alert, setAlert] = useState<AlertSnackbarProps>({
    open: false,
    message: '',
    severity: 'info',
    onClose: () => {}
  });

  const showAlert = useCallback((
    message: string, 
    severity: AlertSnackbarProps['severity'] = 'info'
  ) => {
    setAlert({
      open: true,
      message,
      severity,
      onClose: () => setAlert(prev => ({ ...prev, open: false }))
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlert(prev => ({ ...prev, open: false }));
  }, []);

  return {
    alert,
    showAlert,
    hideAlert
  };
};