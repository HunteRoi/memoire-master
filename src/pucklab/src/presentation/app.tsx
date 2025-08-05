import React from 'react';
import { createRoot } from 'react-dom/client';

import { AppProvider } from './providers/appProvider';
import { ThemeProvider } from './providers/themeProvider';
import { SplashScreen } from './pages/splashScreen';


const App: React.FC = () => {
  return (
    <AppProvider>
      <ThemeProvider>
        <SplashScreen />
      </ThemeProvider>
    </AppProvider>
  );
};

const root = createRoot(document.body);
root.render(<App />);
