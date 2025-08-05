import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router';

import { AppProvider } from './providers/appProvider';
import { ThemeProvider } from './providers/themeProvider';
import { SplashScreen } from './pages/splashScreen';
import { ThemeSelection } from './pages/themeSelection';
import { AgeSelection } from './pages/ageSelection';
import { RobotSelection } from './pages/robotSelection';


const App: React.FC = () => {
  return (
    <AppProvider>
      <ThemeProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<SplashScreen />} />
            <Route path="/theme-selection" element={<ThemeSelection />} />
            <Route path="/age-selection" element={<AgeSelection />} />
            <Route path="/robot-selection" element={<RobotSelection />} />
            {/* <Route path="/mode-selection" element={<ModeSelection />} />
            <Route path="/programming" element={<VisualProgramming />} />
            <Route path="/settings" element={<Settings />} /> */}
          </Routes>
        </HashRouter>
      </ThemeProvider>
    </AppProvider>
  );
};

const root = createRoot(document.body);
root.render(<App />);
