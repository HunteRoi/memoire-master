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
      if (messageKey.startsWith('robot.mockMessages.')) {
        return t(messageKey, messageKey, messageParams);
      }
      return messageKey;
    },
    [t]
  );

  return {
    getRobotDisplayName,
    translateFeedbackMessage,
  };
};
