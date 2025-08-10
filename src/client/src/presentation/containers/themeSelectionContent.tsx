import { Grid } from '@mui/material';
import { forwardRef, useImperativeHandle } from 'react';
import { useTranslation } from 'react-i18next';

import { ThemePreviewCard } from '../components/themePreviewCard';
import { useAppContext } from '../hooks/useAppContext';
import { themeOptions } from '../models/Theme';

export interface ThemeSelectionContentRef {
  navigateLeft: () => void;
  navigateRight: () => void;
}

export const ThemeSelectionContent = forwardRef<ThemeSelectionContentRef>((_, ref) => {
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

  const navigateLeft = () => {
    const currentIndex = themeOptions.findIndex(option => option.type === theme);
    const previousIndex = (currentIndex - 1 + themeOptions.length) % themeOptions.length;
    handleThemeSelection(themeOptions[previousIndex].type);
  };

  const navigateRight = () => {
    const currentIndex = themeOptions.findIndex(option => option.type === theme);
    const nextIndex = (currentIndex + 1) % themeOptions.length;
    handleThemeSelection(themeOptions[nextIndex].type);
  };

  useImperativeHandle(ref, () => ({
    navigateLeft,
    navigateRight,
  }));

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
});
