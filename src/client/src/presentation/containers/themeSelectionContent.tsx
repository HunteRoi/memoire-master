import { Grid } from '@mui/material';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

import { ThemePreviewCard } from '../components/themePreviewCard';
import { useAppContext } from '../hooks/useAppContext';
import { themeOptions } from '../models/Theme';

export const ThemeSelectionContent: FC = () => {
  const { t } = useTranslation();
  const { theme, setTheme } = useAppContext();

  const handleThemeSelection = (selectedTheme: typeof theme) => {
    setTheme(selectedTheme);
    try {
      localStorage.setItem('pucklab-theme', selectedTheme);
    } catch (error) {
      console.error('Failed to save theme to localStorage:', error);
    }
  };

  return (
    <Grid container spacing={3} sx={{ mt: 4, maxWidth: 1000 }}>
      {themeOptions.map(option => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={option.type}>
          <ThemePreviewCard
            themeOption={option}
            isSelected={theme === option.type}
            onSelect={handleThemeSelection}
            labels={{
              themeName: t(`theme.names.${option.type.toLowerCase()}`),
              themeDescription: t(`theme.descriptions.${option.type.toLowerCase()}`),
            }}
          />
        </Grid>
      ))}
    </Grid>
  );
};
