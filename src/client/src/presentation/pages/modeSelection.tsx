import type { FC } from 'react';
import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { PageLayout } from '../components/layout/layout';
import { ModeSelectionContent, type ModeSelectionContentRef } from '../containers/modeSelectionContent';
import { useAppContext } from '../hooks/useAppContext';

export const ModeSelection: FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { selectedMode } = useAppContext();
  const modeContentRef = useRef<ModeSelectionContentRef>(null);

  const defaultLabels = useMemo(
    () => ({
      back: t('common.back'),
      continue: t('common.continue'),
    }),
    [t]
  );

  const handleBack = () => navigate('/robot-selection');
  const handleContinue = () => navigate('/programming');

  const handleNavigateLeft = () => {
    modeContentRef.current?.navigateLeft();
  };

  const handleNavigateRight = () => {
    modeContentRef.current?.navigateRight();
  };

  return (
    <PageLayout
      title={t('mode.title')}
      subtitle={t('mode.subtitle')}
      onBack={handleBack}
      onContinue={handleContinue}
      onNavigateLeft={handleNavigateLeft}
      onNavigateRight={handleNavigateRight}
      continueText={t('mode.startProgramming')}
      continueDisabled={!selectedMode}
      maxWidth='lg'
      defaultLabels={defaultLabels}
    >
      <ModeSelectionContent ref={modeContentRef} />
    </PageLayout>
  );
};
