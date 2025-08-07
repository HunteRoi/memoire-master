import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { PageLayout } from '../components/layout/layout';
import { ThemeSelectionContent } from '../containers/themeSelectionContent';

export const ThemeSelection: FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleContinue = () => navigate('/age-selection');

  return (
    <PageLayout
      title={t('theme.title')}
      subtitle={t('theme.subtitle')}
      onContinue={handleContinue}
      maxWidth='lg'
    >
      <ThemeSelectionContent />
    </PageLayout>
  );
};
