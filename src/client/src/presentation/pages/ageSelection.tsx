import type { FC } from 'react';
import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { PageLayout } from '../components/layout/layout';
import {
  AgeSelectionContent,
  type AgeSelectionContentRef,
} from '../containers/ageSelectionContent';
import { useAppContext } from '../hooks/useAppContext';

export const AgeSelection: FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { userAge } = useAppContext();
  const ageContentRef = useRef<AgeSelectionContentRef>(null);

  const defaultLabels = useMemo(
    () => ({
      back: t('common.back'),
      continue: t('common.continue'),
    }),
    [t]
  );

  const handleBack = () => navigate('/theme-selection');
  const handleContinue = () => {
    if (userAge) {
      navigate('/robot-selection');
    }
  };

  const handleNavigateUp = () => {
    ageContentRef.current?.navigateUp();
  };

  const handleNavigateDown = () => {
    ageContentRef.current?.navigateDown();
  };

  return (
    <PageLayout
      title={t('age.title')}
      subtitle={t('age.subtitle')}
      onBack={handleBack}
      onContinue={handleContinue}
      onNavigateUp={handleNavigateUp}
      onNavigateDown={handleNavigateDown}
      continueDisabled={!userAge}
      defaultLabels={defaultLabels}
    >
      <AgeSelectionContent ref={ageContentRef} />
    </PageLayout>
  );
};
