import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { PageLayout } from '../components/layout/layout';
import { AgeSelectionContent } from '../containers/ageSelectionContent';
import { useAppContext } from '../hooks/useAppContext';

export const AgeSelection: FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { userAge } = useAppContext();

  const handleBack = () => navigate('/theme-selection');
  const handleContinue = () => {
    if (userAge) {
      navigate('/robot-selection');
    }
  };

  return (
    <PageLayout
      title={t('age.title')}
      subtitle={t('age.subtitle')}
      onBack={handleBack}
      onContinue={handleContinue}
      continueDisabled={!userAge}
    >
      <AgeSelectionContent />
    </PageLayout>
  );
};
