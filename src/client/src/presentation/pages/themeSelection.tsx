import type { FC } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { PageLayout } from '../components/layout/layout';
import { ThemeSelectionContent } from '../containers/themeSelectionContent';

export const ThemeSelection: FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const defaultLabels = useMemo(
    () => ({
      back: t('common.back'),
      continue: t('common.continue'),
    }),
    [t]
  );

  const handleContinue = () => navigate('/age-selection');

  return (
    <PageLayout
      title={t('theme.title')}
      subtitle={t('theme.subtitle')}
      onContinue={handleContinue}
      maxWidth='lg'
      defaultLabels={defaultLabels}
    >
      <ThemeSelectionContent />
    </PageLayout>
  );
};
