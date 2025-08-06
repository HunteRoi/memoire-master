import { useEffect } from 'react';
import { useAppContext } from './useAppContext';

export const useEnsureData = () => {
  const { ensureRobotsLoaded, ensureThemeLoaded, ensureLanguageLoaded } = useAppContext();

  useEffect(() => {
    console.log('🔄 useEnsureData: Ensuring data is loaded...');
    ensureThemeLoaded();
    ensureLanguageLoaded();
    ensureRobotsLoaded();
  }, [ensureThemeLoaded, ensureLanguageLoaded, ensureRobotsLoaded]);
};
