import type React from 'react';
import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useTranslation } from 'react-i18next';
import { HashRouter, Route, Routes } from 'react-router';

import './i18n';

import { AlertSnackbar } from './components/layout/alertSnackbar';
import { useAppContext } from './hooks/useAppContext';
import { useEnsureData } from './hooks/useEnsureData';
import { AgeSelection } from './pages/ageSelection';
import { ModeSelection } from './pages/modeSelection';
import { RobotSelection } from './pages/robotSelection';
import { Settings } from './pages/settings';
import { SplashScreen } from './pages/splashScreen';
import { ThemeSelection } from './pages/themeSelection';
import { VisualProgramming } from './pages/visualProgramming';
import { AppProvider } from './providers/appProvider';
import { ThemeProvider } from './providers/themeProvider';

const AppRoutes: React.FC = () => {
  const { alert, language, setLanguage } = useAppContext();
  const { i18n } = useTranslation();

  useEnsureData();

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language, i18n]);

  // Handle menu events from Electron
  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent) => {
      const newLanguage = event.detail;
      setLanguage(newLanguage);
      localStorage.setItem('pucklab-language', newLanguage);
    };

    window.addEventListener(
      'languageChange',
      handleLanguageChange as EventListener
    );

    return () => {
      window.removeEventListener(
        'languageChange',
        handleLanguageChange as EventListener
      );
    };
  }, [setLanguage]);

  return (
    <>
      <HashRouter>
        <Routes>
          <Route path='/' element={<SplashScreen />} />
          <Route path='/theme-selection' element={<ThemeSelection />} />
          <Route path='/age-selection' element={<AgeSelection />} />
          <Route path='/robot-selection' element={<RobotSelection />} />
          <Route path='/mode-selection' element={<ModeSelection />} />
          <Route path='/programming' element={<VisualProgramming />} />
          <Route path='/settings' element={<Settings />} />
        </Routes>
      </HashRouter>
      <AlertSnackbar {...alert} />
    </>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <ThemeProvider>
        <AppRoutes />
      </ThemeProvider>
    </AppProvider>
  );
};

const root = createRoot(document.body);
root.render(<App />);
