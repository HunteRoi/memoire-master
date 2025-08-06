import { FC } from 'react';
import { useNavigate } from 'react-router';
import { Grid } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { useAppContext } from '../hooks/useAppContext';
import { useEnsureData } from '../hooks/useEnsureData';
import { themeOptions } from '../types/Theme';
import { PageLayout } from '../components/layout/layout';
import { ThemePreviewCard } from '../components/themePreviewCard';

export const ThemeSelection: FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { theme, setTheme } = useAppContext();

  useEnsureData();

  const handleContinue = () => navigate('/age-selection');

  const handleThemeSelection = (selectedTheme: typeof theme) => {
    setTheme(selectedTheme);
    try {
      localStorage.setItem('pucklab-theme', selectedTheme);
    } catch (error) {
      console.error('Failed to save theme to localStorage:', error);
    }
  };

  return (
    <PageLayout
      title={t('theme.title')}
      subtitle={t('theme.subtitle')}
      onContinue={handleContinue}
      maxWidth="lg"
    >
      <Grid container spacing={3} sx={{ mt: 4, maxWidth: 1000 }}>
        {themeOptions.map((option) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={option.type}>
            <ThemePreviewCard
              themeOption={option}
              isSelected={theme === option.type}
              onSelect={handleThemeSelection}
            />
          </Grid>
        ))}
      </Grid>
    </PageLayout>
  );
};
