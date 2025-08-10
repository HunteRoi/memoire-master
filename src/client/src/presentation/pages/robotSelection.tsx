import { type FC, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import type { Robot } from '../../domain/robot';
import { PageLayout } from '../components/layout/layout';
import { RobotSelectionContent, type RobotSelectionContentRef } from '../containers/robotSelectionContent';
import { useAppContext } from '../hooks/useAppContext';
import { useRobotManagement } from '../hooks/useRobotManagement';

export const RobotSelection: FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setError } = useAppContext();
  const robotSelectionContentRef = useRef<RobotSelectionContentRef>(null);

  const { robots, selectedRobot, isRobotConnected } = useRobotManagement();

  const selectedRobotData = useMemo<Robot | undefined>(
    () => robots.find(bot => bot.id === selectedRobot),
    [robots, selectedRobot]
  );

  const defaultLabels = useMemo(
    () => ({
      back: t('common.back'),
      continue: t('common.continue'),
    }),
    [t]
  );

  const handleBack = () => navigate('/age-selection');
  const handleContinue = async () => {
    if (!selectedRobot) {
      setError('You have to select a robot to connect to in order to continue');
      return;
    }

    const robotConnected = isRobotConnected(selectedRobot);
    if (robotConnected) {
      navigate('/mode-selection');
    } else {
      // Delegate to container to show connection dialog
      robotSelectionContentRef.current?.handleEnterKey();
    }
  };

  const handleNavigateLeft = () => {
    robotSelectionContentRef.current?.navigateLeft();
  };

  const handleNavigateRight = () => {
    robotSelectionContentRef.current?.navigateRight();
  };

  return (
    <PageLayout
      title={t('robot.title')}
      subtitle={t('robot.subtitle')}
      onBack={handleBack}
      onContinue={handleContinue}
      onNavigateLeft={handleNavigateLeft}
      onNavigateRight={handleNavigateRight}
      continueDisabled={!selectedRobotData}
      maxWidth='lg'
      defaultLabels={defaultLabels}
    >
      <RobotSelectionContent 
        ref={robotSelectionContentRef} 
        onConnectionSuccess={() => navigate('/mode-selection')}
      />
    </PageLayout>
  );
};
