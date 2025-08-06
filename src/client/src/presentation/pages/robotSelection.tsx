import { FC, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';

import { useAppContext } from '../hooks/useAppContext';
import { useRobotManagement } from '../hooks/useRobotManagement';
import { Robot } from '../../domain/robot';
import { PageLayout } from '../components/layout/layout';
import { RobotSelectionContent } from '../containers/robotSelectionContent';

export const RobotSelection: FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setError, setSelectedRobot } = useAppContext();

  const {
    robots,
    selectedRobot,
    isRobotConnected,
  } = useRobotManagement();

  const selectedRobotData = useMemo<Robot | undefined>(() => robots.find(bot => bot.id === selectedRobot), [robots, selectedRobot]);

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
      setError('The selected robot is not connected. Please connect to it first.');
      setSelectedRobot(null);
    }
  };

  return (
    <PageLayout
      title={t('robot.title')}
      subtitle={t('robot.subtitle')}
      onBack={handleBack}
      onContinue={handleContinue}
      continueDisabled={!selectedRobotData || !isRobotConnected(selectedRobot || '')}
      maxWidth="lg"
    >
      <RobotSelectionContent />
    </PageLayout>
  );
};
