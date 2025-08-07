import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router';
import { useTranslation } from 'react-i18next';

import './i18n';
import { AppProvider } from './providers/appProvider';
import { ThemeProvider } from './providers/themeProvider';
import { useEnsureData } from './hooks/useEnsureData';
import { useAppContext } from './hooks/useAppContext';
import { AlertSnackbar } from './components/layout/alertSnackbar';
import { SplashScreen } from './pages/splashScreen';
import { ThemeSelection } from './pages/themeSelection';
import { AgeSelection } from './pages/ageSelection';
import { RobotSelection } from './pages/robotSelection';
import { ModeSelection } from './pages/modeSelection';
import { VisualProgramming } from './pages/visualProgramming';
import { Settings } from './pages/settings';

const AppRoutes: React.FC = () => {
  const { alert, language } = useAppContext();
  const { i18n } = useTranslation();

  useEnsureData();

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language, i18n]);

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
