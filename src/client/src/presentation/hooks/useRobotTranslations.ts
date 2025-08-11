import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Robot } from '../../domain/robot';

export const useRobotTranslations = () => {
  const { t } = useTranslation();

  const getRobotDisplayName = useCallback(
    (robot: Robot): string => {
      return t('robot.robotNameDefault', 'Robot {{id}}', { id: robot.id });
    },
    [t]
  );

  const translateFeedbackMessage = useCallback(
    (messageKey: string, messageParams?: Record<string, any>): string => {
      // If the message is already a translation key, translate it
      if (messageKey.startsWith('robot.mockMessages.')) {
        return t(messageKey, messageKey, messageParams);
      }
      // Otherwise, return as is (for backwards compatibility)
      return messageKey;
    },
    [t]
  );

  return {
    getRobotDisplayName,
    translateFeedbackMessage,
  };
};
