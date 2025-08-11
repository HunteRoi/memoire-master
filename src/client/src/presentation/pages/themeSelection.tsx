import type { FC } from 'react';
import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { PageLayout } from '../components/layout/layout';
import {
  ThemeSelectionContent,
  type ThemeSelectionContentRef,
} from '../containers/themeSelectionContent';

export const ThemeSelection: FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const themeContentRef = useRef<ThemeSelectionContentRef>(null);

  const defaultLabels = useMemo(
    () => ({
      back: t('common.back'),
      continue: t('common.continue'),
    }),
    [t]
  );

  const handleContinue = () => navigate('/age-selection');

  const handleNavigateLeft = () => {
    themeContentRef.current?.navigateLeft();
  };

  const handleNavigateRight = () => {
    themeContentRef.current?.navigateRight();
  };

  return (
    <PageLayout
      title={t('theme.title')}
      subtitle={t('theme.subtitle')}
      onContinue={handleContinue}
      onNavigateLeft={handleNavigateLeft}
      onNavigateRight={handleNavigateRight}
      maxWidth='lg'
      defaultLabels={defaultLabels}
    >
      <ThemeSelectionContent ref={themeContentRef} />
    </PageLayout>
  );
};
