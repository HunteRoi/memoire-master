import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { AppProvider } from './presentation/context/AppContext';
import { ThemeProvider } from './presentation/providers/ThemeProvider';
import {
  SplashScreen,
  ThemeSelectionPage,
  AgeSelectionPage,
  RobotSelectionPage,
  ModeSelectionPage,
  VisualProgrammingPage,
  SettingsPage
} from './presentation/pages';

const App: React.FC = () => {
  return (
    <AppProvider>
      <ThemeProvider>
        <Router>
          <Routes>
            <Route path="/" element={<SplashScreen />} />
            <Route path="/theme-selection" element={<ThemeSelectionPage />} />
            <Route path="/age-selection" element={<AgeSelectionPage />} />
            <Route path="/robot-selection" element={<RobotSelectionPage />} />
            <Route path="/mode-selection" element={<ModeSelectionPage />} />
            <Route path="/programming" element={<VisualProgrammingPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </AppProvider>
  );
};

const root = createRoot(document.body);
root.render(<App />);
