import { FC } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';

import { PageLayout } from '../components/layout/layout';
import { ModeSelectionContent } from '../containers/modeSelectionContent';

export const ModeSelection: FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleBack = () => navigate('/robot-selection');
  const handleContinue = () => navigate('/programming');

  return (
    <PageLayout
      title={t('mode.title')}
      subtitle={t('mode.subtitle')}
      onBack={handleBack}
      onContinue={handleContinue}
      continueText={t('mode.startProgramming')}
      maxWidth='lg'
    >
      <ModeSelectionContent />
    </PageLayout>
  );
};
